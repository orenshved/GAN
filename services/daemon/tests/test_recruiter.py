import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from gameagent.codex_bridge import CodexBridge
from gameagent.constitution import ConstitutionError
from gameagent.gm import make_plan
from gameagent.knowledge import KnowledgeDirectory, KnowledgeFabric
from gameagent.models.api import DecisionCommand, ObjectiveCommand, RecruitmentCommand
from gameagent.models.contracts import (
    AuditionReview,
    AuditionSubmission,
    Capability,
    GMRecord,
    PlanDraft,
    Project,
    ToolDefinition,
)
from gameagent.projects import ProjectStore, initialize
from gameagent.recruiter import AUDITION_DIMENSIONS, GlobalAgentRegistry, Recruiter

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]


def test_global_knowledge_paths_allow_containment_and_reject_symlink_escape(tmp_path: Path):
    knowledge_root = tmp_path / "knowledge"
    contained = knowledge_root / "packs" / "pack.yaml"
    contained.parent.mkdir(parents=True)
    contained.write_text("pack", encoding="utf-8")
    directory = KnowledgeDirectory(knowledge_root)
    directory.assert_global_path(contained)

    outside = tmp_path / "outside"
    outside.mkdir()
    escaped = knowledge_root / "escaped"
    try:
        escaped.symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip("Directory symlinks are unavailable on this host")
    with pytest.raises(ConstitutionError) as error:
        directory.assert_global_path(escaped / "pack.yaml")
    assert error.value.error == "project_knowledge_leak"


def recruiter(tmp_path: Path) -> Recruiter:
    capabilities = [
        Capability.model_validate(item)
        for item in json.loads(
            (ROOT / "capabilities/ontology/initial.json").read_text(encoding="utf-8")
        )
    ]
    tools = [
        ToolDefinition.model_validate(item)
        for item in json.loads((ROOT / "tools/builtin/registry.json").read_text(encoding="utf-8"))
    ]
    return Recruiter(
        GlobalAgentRegistry(ROOT / "agents/builtin/roster.json", tmp_path / "agents.json"),
        capabilities,
        tools,
    )


def test_builtin_registry_exposes_canonical_godot_capture_tool(tmp_path):
    service = recruiter(tmp_path)
    tool = next(item for item in service.tools if item.tool_id == "godot.cli")
    assert tool.invocation == "http"
    assert tool.input_contract == "RuntimeCaptureCommand"
    assert tool.output_contract == "RuntimeCaptureResult"
    assert {"ui_engineering", "controller_navigation", "visual_regression"} <= set(
        tool.capabilities
    )
    assert tool.permissions.execute_commands is True
    assert tool.permissions.execute_discovered_code == "ask"


def missing_test_draft() -> PlanDraft:
    return PlanDraft.model_validate(
        {
            "summary": "Verify platform compatibility",
            "steps": [
                {
                    "key": "compatibility",
                    "title": "Test platform compatibility",
                    "objective": "Verify the build behaves consistently on supported platforms",
                    "required_capabilities": ["compatibility_testing"],
                    "deliverables": ["Compatibility test matrix"],
                    "dependency_keys": [],
                    "constraints": [],
                    "required_evaluations": ["contract_compliance"],
                }
            ],
            "questions": [],
        }
    )


def ux_draft() -> PlanDraft:
    return PlanDraft.model_validate(
        {
            "summary": "Review the player flow",
            "steps": [
                {
                    "key": "ux",
                    "title": "Review player flow",
                    "objective": "Find evidence-backed usability risks",
                    "required_capabilities": ["usability_analysis"],
                    "deliverables": ["UX findings"],
                    "dependency_keys": [],
                    "constraints": [],
                    "required_evaluations": ["contract_compliance"],
                }
            ],
            "questions": [],
        }
    )


def passing_submission() -> AuditionSubmission:
    return AuditionSubmission.model_validate(
        {
            "summary": "Run a repeatable compatibility matrix with inspectable outputs",
            "test_cases": [
                {
                    "capability_id": "compatibility_testing",
                    "procedure": "Build the representative fixture on the baseline platform",
                    "expected_result": "Build exits successfully and records its environment",
                    "evidence_class": "deterministic",
                },
                {
                    "capability_id": "compatibility_testing",
                    "procedure": "Repeat the fixture on the comparison platform",
                    "expected_result": "The same assertions pass with matching behavior",
                    "evidence_class": "comparative",
                },
                {
                    "capability_id": "compatibility_testing",
                    "procedure": "Compare runtime logs and artifact digests",
                    "expected_result": "Differences are classified and reproducible",
                    "evidence_class": "measured",
                },
            ],
            "requested_tool_ids": ["codex-readonly-analysis"],
            "risks": ["A platform unavailable in the sandbox remains explicitly unverified"],
        }
    )


def passing_review() -> AuditionReview:
    return AuditionReview.model_validate(
        {
            "dimensions": [
                {
                    "dimension": dimension,
                    "result": "passed",
                    "detail": f"{dimension.replace('_', ' ')} meets the probation threshold",
                }
                for dimension in sorted(AUDITION_DIMENSIONS)
            ],
            "recommendation": "probation",
            "rationale": "The scoped audition is sufficient for probation, not independent QA authority",
        }
    )


def test_recruiter_detects_gap_auditions_and_persists_probationary_agent(tmp_path):
    service = recruiter(tmp_path)
    task = make_plan(
        "request-gap",
        "Verify platform compatibility",
        missing_test_draft(),
        _policy(),
        service.registry.roster(),
    ).tasks[0]
    record = service.prepare("request-gap", task, "2026-09-08T10:00:00Z")
    assert record.gap.missing_capabilities == ["compatibility_testing"]
    assert "qa-specialist" in record.adjacent_agent_ids
    assert record.tool_discoveries[0].decision == "trusted"
    record = service.begin_audition(record, "2026-09-08T10:01:00Z")
    record = service.evaluate(
        record, passing_submission(), passing_review(), "2026-09-08T10:02:00Z"
    )
    assert record.state == "probation"
    entry = next(
        item
        for item in service.registry.snapshot().entries
        if item.agent.agent_id == record.candidate.agent_id
    )
    assert entry.lifecycle == "probation"
    assert entry.qa_decision_role == "advisory"
    assert not {"project_id", "task_id", "memory"} & entry.agent.model_dump().keys()


def _policy():
    from gameagent.models.contracts import Policy

    return Policy(project_id="project-a")


def test_recruiter_blocks_unqualified_expertise_before_audition(tmp_path):
    service = recruiter(tmp_path)
    service.knowledge_registry = KnowledgeFabric.from_environment(tmp_path / "knowledge").registry
    task = make_plan(
        "knowledge-gap",
        "Check compatibility",
        missing_test_draft(),
        _policy(),
        service.registry.roster(),
    ).tasks[0]
    record = service.prepare("knowledge-gap", task, "2026-09-09T12:00:00Z")
    assert record.missing_expertise_capabilities == ["compatibility_testing"]
    with pytest.raises(ConstitutionError):
        service.begin_audition(record, "2026-09-09T12:01:00Z")

    pack = service.knowledge_registry.latest("game-ux-core").model_copy(
        update={"capability_ids": ["compatibility_testing"]}
    )

    class FixtureRegistry:
        def packs(self):
            return [pack]

        def latest(self, pack_id):
            return pack if pack_id == pack.pack_id else None

    service.knowledge_registry = FixtureRegistry()
    covered = service.prepare("covered", task, "2026-09-09T12:02:00Z")
    assert not covered.missing_expertise_capabilities
    assert covered.expertise_snapshot
    assert {(item.pack_id, item.version) for item in covered.expertise_snapshot} == {
        (item.pack_id, item.version) for item in covered.expertise_packs
    }
    assert (
        service.begin_audition(covered, "2026-09-09T12:03:00Z").expertise_snapshot
        == covered.expertise_snapshot
    )


def test_recruiter_reuses_existing_agent_and_diagnoses_composition(tmp_path):
    service = recruiter(tmp_path)
    fabric = KnowledgeFabric.from_environment(tmp_path / "knowledge")
    service.knowledge_registry = fabric.registry
    task = make_plan(
        "existing-ux", "Review player flow", ux_draft(), _policy(), service.registry.roster()
    ).tasks[0]

    ready = service.prepare("reuse", task, "2026-09-10T08:00:00Z")
    assert ready.state == "remediation_required"
    assert ready.candidate.agent_id == "ux-specialist"
    assert ready.diagnosis.problem == "none"
    assert ready.diagnosis.action == "reuse_agent"

    ux_pack = fabric.registry.latest("game-ux-core")
    assert ux_pack is not None

    class MissingPackRegistry:
        def packs(self):
            return []

        def latest(self, _pack_id):
            return None

    service.knowledge_registry = MissingPackRegistry()
    missing = service.prepare("missing-pack", task, "2026-09-10T08:01:00Z")
    assert missing.diagnosis.problem == "missing_expertise_pack"
    assert missing.diagnosis.action == "attach_or_build_pack"
    assert missing.diagnosis.missing_pack_ids == ["game-ux-core"]

    class OnePackRegistry:
        def __init__(self, pack):
            self.pack = pack

        def packs(self):
            return [self.pack]

        def latest(self, pack_id):
            return self.pack if pack_id == self.pack.pack_id else None

    stale_pack = ux_pack.model_copy(
        update={
            "sources": [
                source.model_copy(update={"fresh_until": "2026-01-01T00:00:00Z"})
                for source in ux_pack.sources
            ]
        }
    )
    service.knowledge_registry = OnePackRegistry(stale_pack)
    stale = service.prepare("stale-pack", task, "2026-09-10T08:02:00Z")
    assert stale.diagnosis.problem == "stale_knowledge"
    assert stale.diagnosis.action == "refresh_knowledge"

    tool_pack = ux_pack.model_copy(update={"required_tool_ids": ["missing-ux-probe"]})
    service.knowledge_registry = OnePackRegistry(tool_pack)
    tool = service.prepare("missing-tool", task, "2026-09-10T08:03:00Z")
    assert tool.diagnosis.problem == "missing_tool"
    assert tool.diagnosis.missing_tool_ids == ["missing-ux-probe"]

    service.knowledge_registry = OnePackRegistry(ux_pack)
    model = service.prepare("model-gap", task, "2026-09-10T08:04:00Z", model_insufficient=True)
    assert model.diagnosis.problem == "model_insufficient"
    repeated = service.prepare(
        "performance-gap", task, "2026-09-10T08:05:00Z", performance_failures=3
    )
    assert repeated.diagnosis.problem == "performance_failure"


def test_recruited_agent_fills_plan_gap_and_replays(tmp_path):
    initialize(tmp_path, Project.model_validate(PROFILE))
    store = ProjectStore(tmp_path, max_segment_bytes=1)
    service = recruiter(tmp_path)
    snapshot = store.snapshot()
    store.record_gm(
        GMRecord(
            project_id=snapshot.project.project.id,
            thread_id="gm-recruiter-thread",
            request_id="request-gap",
            objective="Verify platform compatibility",
            state="planning",
            detail="Planning",
        )
    )
    plan = make_plan(
        "request-gap",
        "Verify platform compatibility",
        missing_test_draft(),
        snapshot.policy,
        service.registry.roster(),
    )
    store.record_plan(plan)
    assert store.snapshot().tasks[0].state == "BLOCKED"
    record = service.prepare("request-gap", plan.tasks[0], "2026-09-08T10:00:00Z")
    store.record_recruitment(record)
    record = service.begin_audition(record, "2026-09-08T10:01:00Z")
    store.record_recruitment(record)
    record = service.evaluate(
        record, passing_submission(), passing_review(), "2026-09-08T10:02:00Z"
    )
    store.record_recruitment(record)
    replayed = ProjectStore(tmp_path).snapshot()
    assert replayed.tasks[0].state == "READY"
    assert replayed.plans[0].assignments[0].agent == record.candidate
    assert replayed.recruitments[0].audition.result == "passed"
    assert store.rebuild() == replayed


def test_untrusted_tool_request_rejects_audition(tmp_path):
    service = recruiter(tmp_path)
    task = make_plan(
        "request-gap",
        "Verify platform compatibility",
        missing_test_draft(),
        _policy(),
        service.registry.roster(),
    ).tasks[0]
    record = service.begin_audition(
        service.prepare("request-gap", task, "2026-09-08T10:00:00Z"),
        "2026-09-08T10:01:00Z",
    )
    submission = passing_submission().model_copy(
        update={"requested_tool_ids": ["unknown-downloader"]}
    )
    rejected = service.evaluate(record, submission, passing_review(), "2026-09-08T10:02:00Z")
    assert rejected.state == "rejected"
    assert all(
        item.agent.agent_id != record.candidate.agent_id
        for item in service.registry.snapshot().entries
    )


def test_gm_blocks_for_director_before_teaching_or_creating_specialist(tmp_path):
    initialize(tmp_path, Project.model_validate(PROFILE))
    store = ProjectStore(tmp_path, max_segment_bytes=1)
    service = recruiter(tmp_path)

    class FakeTurn:
        def __init__(self, response):
            self.response = response

        async def run(self):
            await asyncio.sleep(0)
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                final_response=self.response,
                error=None,
            )

        async def interrupt(self):
            pass

    class FakeThread:
        def __init__(self, thread_id, response):
            self.id = thread_id
            self.response = response

        async def turn(self, _prompt, **_kwargs):
            return FakeTurn(self.response)

    class FakeClient:
        audition_starts = 0

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            if not kwargs.get("ephemeral"):
                return FakeThread("gm-recruiter-thread", missing_test_draft().model_dump_json())
            self.audition_starts += 1
            response = (
                passing_submission().model_dump_json()
                if self.audition_starts == 1
                else passing_review().model_dump_json()
            )
            return FakeThread(f"audition-{self.audition_starts}", response)

        async def thread_resume(self, thread_id, **_kwargs):
            assert thread_id == "gm-recruiter-thread"
            return FakeThread(thread_id, missing_test_draft().model_dump_json())

        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store, service)
        bridge.client = FakeClient()
        started = await bridge.plan(
            ObjectiveCommand(
                request_id="request-gap",
                objective="Verify platform compatibility",
            )
        )
        assert started.state == "planning"
        assert bridge.gm_job is not None
        await bridge.gm_job
        snapshot = store.snapshot()
        assert snapshot.gm.state == "completed"
        assert snapshot.plans[0].assignments[0].agent is None
        assert snapshot.tasks[0].state == "BLOCKED_KNOWLEDGE"
        assert snapshot.recruitments[0].state == "remediation_required"
        decision = snapshot.decisions[0]
        assert decision.options == [
            "Teach the current agent",
            "Create and teach a new specialist",
        ]
        assert decision.recommendation == "Create and teach a new specialist"
        assert bridge.client.audition_starts == 0
        store.resolve_decision(
            DecisionCommand(
                request_id="choose-learning-path",
                decision_id=decision.decision_id,
                selected_option="Create and teach a new specialist",
                rationale="The missing capability should remain independently owned.",
            )
        )
        recruited = await bridge.recruit(
            RecruitmentCommand(request_id="resume-recruitment", task_id=snapshot.tasks[0].task_id)
        )
        assert recruited.state == "probation"
        snapshot = store.snapshot()
        assert snapshot.plans[0].assignments[0].agent is not None
        assert snapshot.tasks[0].state == "READY"
        assert bridge.client.audition_starts == 2
        await bridge.close()

    asyncio.run(scenario())
