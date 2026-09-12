"""Global capability recruitment with permission-aware, sandboxed auditions."""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

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
    ExpertisePackRef,
    Instructions,
    ModelPreferences,
    Permissions,
    RecruitmentDiagnosis,
    RecruitmentRecord,
    ResourcePolicy,
    TaskContract,
    ToolDefinition,
    ToolDiscovery,
)
from gameagent.production_domains import tool_catalog as production_domain_tools

if TYPE_CHECKING:
    from gameagent.knowledge import ExpertisePackRegistry

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
        require(
            len(self.capabilities) == len(capabilities),
            "duplicate_capability",
            "Capability ids must be unique",
        )
        for capability in capabilities:
            unknown_related = sorted(
                set(capability.related_capability_ids) - self.capabilities.keys()
            )
            require(
                capability.capability_id not in capability.related_capability_ids,
                "capability_self_relation",
                capability.capability_id,
            )
            require(
                not unknown_related,
                "unknown_related_capability",
                ", ".join(unknown_related),
            )
        self.tools = tools
        self.knowledge_registry: ExpertisePackRegistry | None = None

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
        tools_by_id = {item.tool_id: item for item in [*tools, *production_domain_tools()]}
        return cls(
            GlobalAgentRegistry(builtin_path, global_path),
            [
                Capability.model_validate(item)
                for item in json.loads(ontology_path.read_text(encoding="utf-8"))
            ],
            list(tools_by_id.values()),
        )

    def prepare(
        self,
        request_id: str,
        task: TaskContract,
        now: str,
        *,
        performance_failures: int = 0,
        model_insufficient: bool = False,
    ) -> RecruitmentRecord:
        roster = self.registry.roster()
        required = set(task.required_capabilities)
        unknown = sorted(required - self.capabilities.keys())
        require(not unknown, "unknown_capability", ", ".join(unknown))
        capable = [agent for agent in roster if required <= set(agent.capabilities)]
        existing = (
            min(capable, key=lambda agent: (len(agent.capabilities), agent.agent_id))
            if capable
            else None
        )
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
        candidate = existing or AgentDefinition(
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
            reason=(
                "No registered agent satisfies the complete task capability contract"
                if existing is None
                else "An existing agent satisfies the capability contract; Recruiter is diagnosing specialist composition"
            ),
            detected_at=now,
        )
        packs = []
        missing_pack_ids: list[str] = []
        stale_pack_ids: list[str] = []
        if self.knowledge_registry is not None:
            pack_ids = (
                candidate.required_expertise_pack_ids
                if existing is not None
                else sorted({pack.pack_id for pack in self.knowledge_registry.packs()})
            )
            for pack_id in pack_ids:
                versions = [
                    pack for pack in self.knowledge_registry.packs() if pack.pack_id == pack_id
                ]
                pack = self.knowledge_registry.latest(pack_id)
                if pack is None:
                    if versions:
                        stale_pack_ids.append(pack_id)
                    else:
                        missing_pack_ids.append(pack_id)
                    continue
                expired = any(
                    source.fresh_until is not None
                    and datetime.fromisoformat(source.fresh_until.replace("Z", "+00:00"))
                    < datetime.fromisoformat(now.replace("Z", "+00:00"))
                    for source in pack.sources
                )
                if expired:
                    stale_pack_ids.append(pack_id)
                    continue
                if existing is not None or required & set(pack.capability_ids):
                    packs.append(pack)
            if existing is None:
                candidate = candidate.model_copy(
                    update={
                        "required_expertise_pack_ids": [pack.pack_id for pack in packs],
                        "allowed_method_ids": sorted(
                            {method.method_id for pack in packs for method in pack.methods}
                        ),
                    }
                )
        required_tool_ids = sorted(
            {
                *candidate.allowed_tool_ids,
                *(tool_id for pack in packs for tool_id in pack.required_tool_ids),
            }
        )
        tool_by_id = {item.tool_id: item for item in self.tools}
        missing_tool_ids = [
            tool_id
            for tool_id in required_tool_ids
            if tool_id not in tool_by_id
            or _permission_decision(tool_by_id[tool_id], task).decision != "trusted"
        ]
        covered_expertise = {cap for pack in packs for cap in pack.capability_ids}
        uncovered_required = (
            sorted(required - covered_expertise) if candidate.required_expertise_pack_ids else []
        )
        if existing is None:
            diagnosis = RecruitmentDiagnosis(
                problem="no_agent",
                action="create_agent",
                required_pack_ids=candidate.required_expertise_pack_ids,
                missing_pack_ids=missing_pack_ids,
                stale_pack_ids=stale_pack_ids,
                missing_tool_ids=missing_tool_ids,
                detail="No registered agent covers the full capability contract; compose and audition a new specialist only after its expertise and tools are ready.",
            )
        elif missing_pack_ids:
            diagnosis = RecruitmentDiagnosis(
                problem="missing_expertise_pack",
                action="attach_or_build_pack",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                missing_pack_ids=missing_pack_ids,
                detail="Reuse the existing capable agent and build or attach its missing reviewed expertise; do not hire a duplicate.",
            )
        elif stale_pack_ids:
            diagnosis = RecruitmentDiagnosis(
                problem="stale_knowledge",
                action="refresh_knowledge",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                stale_pack_ids=stale_pack_ids,
                detail="Reuse the existing agent after its version-sensitive expertise has been refreshed and re-reviewed.",
            )
        elif uncovered_required:
            diagnosis = RecruitmentDiagnosis(
                problem="missing_expertise_pack",
                action="attach_or_build_pack",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                detail=(
                    "The assigned pack does not cover every required capability. Build or attach reviewed expertise for: "
                    + ", ".join(uncovered_required)
                    + "."
                ),
            )
        elif missing_tool_ids:
            diagnosis = RecruitmentDiagnosis(
                problem="missing_tool",
                action="install_or_authorize_tool",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                missing_tool_ids=missing_tool_ids,
                detail="Reuse the existing agent after the required tool is installed, healthy, and permitted for this task.",
            )
        elif model_insufficient:
            diagnosis = RecruitmentDiagnosis(
                problem="model_insufficient",
                action="change_model",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                detail="The capability and expertise exist, but recorded benchmarks show the current model is insufficient; benchmark a stronger route before creating an agent.",
            )
        elif performance_failures >= 3:
            diagnosis = RecruitmentDiagnosis(
                problem="performance_failure",
                action="requalify_agent",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                detail="Repeated recorded failures require requalification of the existing specialist composition before any new hire.",
            )
        else:
            diagnosis = RecruitmentDiagnosis(
                problem="none",
                action="reuse_agent",
                agent_id=existing.agent_id,
                required_pack_ids=existing.required_expertise_pack_ids,
                detail="The existing agent, reviewed expertise, tools, and model evidence are sufficient; no new agent should be created.",
            )
        return RecruitmentRecord(
            recruitment_id=f"recruitment-{request_id}-{task.task_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            gap=gap,
            candidate=candidate,
            adjacent_agent_ids=adjacent,
            tool_discoveries=discoveries,
            state="candidate_composed" if existing is None else "remediation_required",
            diagnosis=diagnosis,
            created_at=now,
            updated_at=now,
            expertise_packs=[
                ExpertisePackRef(pack_id=pack.pack_id, version=pack.version) for pack in packs
            ],
            expertise_snapshot=packs,
            missing_expertise_capabilities=(
                sorted(required - covered_expertise)
                if self.knowledge_registry is not None and existing is None
                else uncovered_required
                if self.knowledge_registry is not None and existing is not None
                else sorted(required)
                if missing_pack_ids or stale_pack_ids
                else []
            ),
        )

    def begin_audition(self, record: RecruitmentRecord, now: str) -> RecruitmentRecord:
        require(record.state == "candidate_composed", "invalid_recruitment_state", record.state)
        require(
            not record.missing_expertise_capabilities,
            "blocked_knowledge",
            "Build and independently approve expertise for: "
            + ", ".join(record.missing_expertise_capabilities),
        )
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
