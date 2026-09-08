"""Global capability recruitment with permission-aware, sandboxed auditions."""

import hashlib
import json
import os
from pathlib import Path

from filelock import FileLock

from gameagent.constitution import require
from gameagent.models.contracts import (
    AgentAudition,
    AgentDefinition,
    AgentRegistryEntry,
    AgentRegistrySnapshot,
    AuditionReview,
    AuditionSubmission,
    Capability,
    CapabilityGap,
    Instructions,
    ModelPreferences,
    Permissions,
    RecruitmentRecord,
    ResourcePolicy,
    TaskContract,
    ToolDefinition,
    ToolDiscovery,
)

AUDITION_DIMENSIONS = {
    "technical_correctness",
    "output_compliance",
    "quality",
    "reliability",
    "style_adherence",
    "cost_latency",
    "security_tool_behavior",
}


def _permission_decision(tool: ToolDefinition, task: TaskContract) -> ToolDiscovery:
    if tool.install_state != "installed":
        return ToolDiscovery(
            tool_id=tool.tool_id,
            capability_ids=tool.capabilities,
            decision="unavailable",
            detail=f"Tool is {tool.install_state}",
        )
    requested = tool.permissions.model_dump()
    allowed = task.permissions.model_dump()
    rank = {"never": 0, "ask": 1, "allow": 2}
    needs_approval = False
    for name, value in requested.items():
        limit = allowed[name]
        if isinstance(value, bool):
            if value and limit is not True:
                return ToolDiscovery(
                    tool_id=tool.tool_id,
                    capability_ids=tool.capabilities,
                    decision="forbidden",
                    detail=f"Task does not grant {name}",
                )
        elif rank[value] > rank[limit]:
            if limit == "ask":
                needs_approval = True
            else:
                return ToolDiscovery(
                    tool_id=tool.tool_id,
                    capability_ids=tool.capabilities,
                    decision="forbidden",
                    detail=f"Task policy forbids {name}",
                )
    return ToolDiscovery(
        tool_id=tool.tool_id,
        capability_ids=tool.capabilities,
        decision="needs_approval" if needs_approval else "trusted",
        detail="Explicit approval required"
        if needs_approval
        else "Installed and within task permissions",
    )


class GlobalAgentRegistry:
    def __init__(self, builtin_path: Path, path: Path) -> None:
        self.builtin_path = builtin_path
        self.path = path
        self.lock = FileLock(str(path.with_suffix(path.suffix + ".lock")), timeout=10)

    def snapshot(self) -> AgentRegistrySnapshot:
        builtin = [
            AgentRegistryEntry(
                agent=AgentDefinition.model_validate(item),
                lifecycle="builtin",
                qa_decision_role="eligible",
            )
            for item in json.loads(self.builtin_path.read_text(encoding="utf-8"))
        ]
        recruited: list[AgentRegistryEntry] = []
        if self.path.is_file():
            recruited = [
                AgentRegistryEntry.model_validate(item)
                for item in json.loads(self.path.read_text(encoding="utf-8"))
            ]
        entries = {entry.agent.agent_id: entry for entry in [*builtin, *recruited]}
        return AgentRegistrySnapshot(
            entries=sorted(entries.values(), key=lambda item: item.agent.agent_id)
        )

    def roster(self) -> list[AgentDefinition]:
        return [entry.agent for entry in self.snapshot().entries if entry.lifecycle != "retired"]

    def hire(self, entry: AgentRegistryEntry) -> AgentRegistryEntry:
        require(entry.lifecycle == "probation", "invalid_recruitment_state", entry.agent.agent_id)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.lock:
            existing = [
                item
                for item in self.snapshot().entries
                if item.lifecycle != "builtin" and item.agent.agent_id != entry.agent.agent_id
            ]
            temporary = self.path.with_suffix(self.path.suffix + ".tmp")
            temporary.write_text(
                json.dumps(
                    [item.model_dump(mode="json") for item in [*existing, entry]],
                    indent=2,
                    sort_keys=True,
                )
                + "\n",
                encoding="utf-8",
            )
            temporary.replace(self.path)
        return entry


class Recruiter:
    def __init__(
        self,
        registry: GlobalAgentRegistry,
        capabilities: list[Capability],
        tools: list[ToolDefinition],
    ) -> None:
        self.registry = registry
        self.capabilities = {item.capability_id: item for item in capabilities}
        self.tools = tools

    @classmethod
    def from_environment(
        cls, registry_path: Path | None = None, tool_path: Path | None = None
    ) -> "Recruiter":
        root = Path(__file__).resolve().parents[3]
        builtin_path = Path(
            os.getenv("GAMEAGENT_ROSTER_PATH", str(root / "agents/builtin/roster.json"))
        )
        global_path = registry_path or Path(
            os.getenv(
                "GAMEAGENT_AGENT_REGISTRY_PATH",
                str(Path.home() / ".gameagent" / "agents.json"),
            )
        )
        ontology_path = Path(
            os.getenv(
                "GAMEAGENT_CAPABILITY_PATH",
                str(root / "capabilities/ontology/initial.json"),
            )
        )
        tools_path = tool_path or Path(
            os.getenv(
                "GAMEAGENT_TOOL_REGISTRY_PATH",
                str(root / "tools/builtin/registry.json"),
            )
        )
        tools = (
            [
                ToolDefinition.model_validate(item)
                for item in json.loads(tools_path.read_text(encoding="utf-8"))
            ]
            if tools_path.is_file()
            else []
        )
        return cls(
            GlobalAgentRegistry(builtin_path, global_path),
            [
                Capability.model_validate(item)
                for item in json.loads(ontology_path.read_text(encoding="utf-8"))
            ],
            tools,
        )

    def prepare(self, request_id: str, task: TaskContract, now: str) -> RecruitmentRecord:
        roster = self.registry.roster()
        required = set(task.required_capabilities)
        require(
            not any(required <= set(agent.capabilities) for agent in roster),
            "capability_already_available",
            task.task_id,
        )
        unknown = sorted(required - self.capabilities.keys())
        require(not unknown, "unknown_capability", ", ".join(unknown))
        families = {self.capabilities[item].family for item in required}
        adjacent = sorted(
            agent.agent_id
            for agent in roster
            if any(
                self.capabilities.get(capability)
                and self.capabilities[capability].family in families
                for capability in agent.capabilities
            )
        )
        discoveries = [
            _permission_decision(tool, task)
            for tool in self.tools
            if required & set(tool.capabilities)
        ]
        trusted_tools = [item.tool_id for item in discoveries if item.decision == "trusted"]
        digest = hashlib.sha256("\0".join(sorted(required)).encode()).hexdigest()[:10]
        labels = [item.replace("_", " ") for item in sorted(required)]
        gates = sorted(
            {
                gate
                for capability_id in required
                for gate in self.capabilities[capability_id].evaluation_requirements
            }
        )
        candidate = AgentDefinition(
            agent_id=f"recruited-{digest}",
            name=f"{' + '.join(label.title() for label in labels)} Specialist",
            version="1.0.0",
            description=f"Auditioned specialist for {', '.join(labels)}.",
            capabilities=sorted(required),
            instructions=Instructions(
                base="Execute only the supplied task contract and report evidence, uncertainty, and blockers.",
                constraints=[
                    "Production authority remains with the GM.",
                    "Never represent model judgment as deterministic or human evidence.",
                    "While probationary, QA recommendations are advisory and require independent verification.",
                ],
            ),
            models=ModelPreferences(preferred=["codex_authenticated"], alternatives=[]),
            allowed_tool_ids=trusted_tools,
            permissions=Permissions(read_project=True),
            required_inputs=["task_contract", "targeted_project_context"],
            output_contract="WorkerResult",
            required_gates=gates or ["contract_compliance"],
            resource_policy=ResourcePolicy(local_preferred=True, max_external_cost_cents=0),
            probationary=True,
        )
        gap = CapabilityGap(
            gap_id=f"gap-{request_id}-{task.task_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            missing_capabilities=sorted(required),
            reason="No registered agent satisfies the complete task capability contract",
            detected_at=now,
        )
        return RecruitmentRecord(
            recruitment_id=f"recruitment-{request_id}-{task.task_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            gap=gap,
            candidate=candidate,
            adjacent_agent_ids=adjacent,
            tool_discoveries=discoveries,
            state="candidate_composed",
            created_at=now,
            updated_at=now,
        )

    def begin_audition(self, record: RecruitmentRecord, now: str) -> RecruitmentRecord:
        require(record.state == "candidate_composed", "invalid_recruitment_state", record.state)
        return record.model_copy(update={"state": "auditioning", "updated_at": now})

    def evaluate(
        self,
        record: RecruitmentRecord,
        submission: AuditionSubmission,
        review: AuditionReview,
        now: str,
    ) -> RecruitmentRecord:
        require(record.state == "auditioning", "invalid_recruitment_state", record.state)
        dimensions = {item.dimension for item in review.dimensions}
        requested = set(submission.requested_tool_ids)
        trusted = {item.tool_id for item in record.tool_discoveries if item.decision == "trusted"}
        covered = {item.capability_id for item in submission.test_cases}
        passed = (
            dimensions == AUDITION_DIMENSIONS
            and all(item.result == "passed" for item in review.dimensions)
            and review.recommendation == "probation"
            and requested <= trusted
            and set(record.gap.missing_capabilities) <= covered
        )
        audition = AgentAudition(
            audition_id=f"audition-{record.recruitment_id}",
            candidate_id=record.candidate.agent_id,
            representative_objective=(
                "Demonstrate a verification approach for: " + record.gap.reason
            ),
            submission=submission,
            review=review,
            result="passed" if passed else "failed",
            evaluated_at=now,
        )
        updated = record.model_copy(
            update={
                "state": "probation" if passed else "rejected",
                "audition": audition,
                "updated_at": now,
            }
        )
        if passed:
            self.registry.hire(
                AgentRegistryEntry(
                    agent=record.candidate,
                    lifecycle="probation",
                    qa_decision_role="advisory",
                    audition_ids=[audition.audition_id],
                    recruited_at=now,
                    performance=[],
                )
            )
        return updated
