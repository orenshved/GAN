import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

from gameagent.codex_bridge import CodexBridge
from gameagent.gm import make_plan
from gameagent.models.api import ObjectiveCommand
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


def test_gm_automatically_auditions_instead_of_fabricating_capability(tmp_path):
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
        assert snapshot.plans[0].assignments[0].agent is not None
        assert snapshot.tasks[0].state == "READY"
        assert snapshot.recruitments[0].state == "probation"
        assert bridge.client.audition_starts == 2
        await bridge.close()

    asyncio.run(scenario())
