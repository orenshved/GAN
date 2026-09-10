import asyncio
import hashlib
import json
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from gameagent.adapters.godot import GodotAdapter
from gameagent.api import create_app
from gameagent.cli import main as cli_main
from gameagent.codex_bridge import CodexBridge
from gameagent.constitution import ConstitutionError
from gameagent.gm import make_plan
from gameagent.intake import assess_project_domains, inspect
from gameagent.intelligence import index_repository
from gameagent.knowledge import KnowledgeFabric, fetch_primary_source, research_source
from gameagent.models.api import (
    ContextCommand,
    DecisionCommand,
    IntelligenceRefreshCommand,
    ObjectiveCommand,
    PackAuditionCommand,
    PackBuildCommand,
    PackLifecycleCommand,
    PackReviewCommand,
    PolicyCommand,
    ProjectRemoval,
    ReconcileCommand,
    ResearchCommand,
    TaskProgressCommand,
    TaskProposal,
    TaskStartCommand,
    WorkerCommand,
)
from gameagent.models.contracts import (
    AgentDefinition,
    Evaluation,
    Evidence,
    ExpertisePackRef,
    GMRecord,
    PlanDraft,
    Project,
    SourceRef,
    WorkerRecord,
)
from gameagent.persistence import projection as projection_module
from gameagent.persistence.projection import Projection
from gameagent.projects import ProjectRegistry, ProjectStore, initialize, timestamp

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]
TOKEN = "test-token-" + "a" * 32
ORIGIN = "http://studio.test"


@pytest.fixture
def store(tmp_path):
    initialize(tmp_path, Project.model_validate(PROFILE))
    return ProjectStore(tmp_path, max_segment_bytes=1)


def proposal(request_id="request-a", **patch):
    return TaskProposal(
        request_id=request_id,
        title="Inspect turn instructions",
        objective="Players understand their next action",
        required_capabilities=["usability_analysis"],
        deliverables=["Findings with evidence"],
        **patch,
    )


def production_draft():
    return PlanDraft.model_validate(
        {
            "summary": "Investigate usability, then specify the UI implementation",
            "steps": [
                {
                    "key": "ux",
                    "title": "Understand player confusion",
                    "objective": "Identify why players cannot find the next action",
                    "required_capabilities": ["usability_analysis"],
                    "deliverables": ["Evidence-backed interaction specification"],
                    "dependency_keys": [],
                    "constraints": [],
                    "required_evaluations": ["contract_compliance"],
                },
                {
                    "key": "implementation",
                    "title": "Implement clearer guidance",
                    "objective": "The next action is discoverable",
                    "required_capabilities": ["ui_engineering"],
                    "deliverables": ["Implemented guidance"],
                    "dependency_keys": ["ux"],
                    "constraints": [],
                    "required_evaluations": ["functional_testing"],
                },
            ],
            "questions": [
                {
                    "key": "guidance",
                    "title": "Guidance style",
                    "reason": "Player-facing direction is not established",
                    "affected_step_keys": ["ux"],
                    "category": "player_behavior",
                    "options": ["Contextual hints", "Explicit tutorial"],
                    "recommendation": "Contextual hints",
                    "consequences": ["Hints preserve exploration"],
                }
            ],
        }
    )


def save_plan(store, draft=None):
    snapshot = store.snapshot()
    store.record_gm(
        GMRecord(
            project_id=snapshot.project.project.id,
            thread_id="gm-thread",
            request_id="objective-one",
            objective="Players understand their next action",
            state="planning",
            detail="Planning",
        )
    )
    bridge = CodexBridge(store)
    plan = make_plan(
        "objective-one",
        "Players understand their next action",
        draft or production_draft(),
        snapshot.policy,
        bridge.roster(),
    )
    return store.record_plan(plan)


def test_gm_plan_decisions_dependency_replay_and_idempotency(store):
    plan = save_plan(store)
    snapshot = store.snapshot()
    assert [t.state for t in snapshot.tasks] == ["NEEDS_HUMAN", "QUEUED"]
    assert [a.agent.agent_id for a in plan.assignments] == ["ux-specialist", "implementation"]
    assert store.record_plan(plan) == plan
    assert store.snapshot() == snapshot
    command = DecisionCommand(
        request_id="choice-one",
        decision_id=snapshot.decisions[0].decision_id,
        selected_option="Contextual hints",
        rationale="Preserve exploration",
    )
    chosen = store.resolve_decision(command)
    assert store.resolve_decision(command) == chosen
    after = store.snapshot()
    assert [t.state for t in after.tasks] == ["READY", "QUEUED"]
    assert ProjectStore(store.root).snapshot() == after
    assert store.rebuild() == after
    with pytest.raises(ConstitutionError):
        store.resolve_decision(command.model_copy(update={"selected_option": "Explicit tutorial"}))
    with pytest.raises(ConstitutionError, match="GM"):
        store.start_task(TaskStartCommand(request_id="bypass", task_id=plan.tasks[0].task_id))


def test_project_intelligence_indexes_retrieves_and_replays_targeted_context(store):
    draft = production_draft()
    draft = draft.model_copy(
        update={
            "steps": [
                draft.steps[0].model_copy(
                    update={
                        "title": "Analyze the HUD hint asset",
                        "objective": "The contextual hint icon makes the next action clear",
                    }
                ),
                draft.steps[1],
            ]
        }
    )
    plan = save_plan(store, draft)
    snapshot = store.snapshot()
    store.resolve_decision(
        DecisionCommand(
            request_id="context-choice",
            decision_id=snapshot.decisions[0].decision_id,
            selected_option="Contextual hints",
            rationale="Use the established lightweight guidance style",
        )
    )
    docs = store.root / "docs"
    assets = store.root / "assets" / "ui"
    source = store.root / "src"
    docs.mkdir()
    assets.mkdir(parents=True)
    source.mkdir()
    (docs / "UX.md").write_text(
        "# Contextual HUD hints\nUse compact icons beside the next available action.\n",
        encoding="utf-8",
    )
    (assets / "hint.png").write_bytes(b"ui-asset")
    for index in range(20):
        (source / f"unrelated_{index}.py").write_text(f"VALUE = {index}\n", encoding="utf-8")

    command = IntelligenceRefreshCommand(request_id="index-one")
    intelligence = store.refresh_intelligence(command)
    assert store.refresh_intelligence(command) == intelligence
    assert {resource.path for resource in intelligence.resources} >= {
        "docs/UX.md",
        "assets/ui/hint.png",
    }
    assert {entry.kind for entry in intelligence.knowledge} >= {
        "source_fact",
        "deterministic_consequence",
        "user_decision",
    }
    context = store.task_context(ContextCommand(task_id=plan.tasks[0].task_id))
    assert context.history_events_included == 0
    assert context.selected_resource_count < context.indexed_resource_count
    assert any(reference.uri.endswith("assets/ui/hint.png") for reference in context.references)
    assert any("Contextual HUD hints" in snippet.statement for snippet in context.snippets)
    assert context.decisions[0].selected_option == "Contextual hints"
    assert ProjectStore(store.root).snapshot().intelligence == intelligence
    assert store.rebuild().intelligence == intelligence

    headers = {"Authorization": f"Bearer {TOKEN}"}
    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        response = client.get("/project-intelligence", headers=headers)
        assert response.status_code == 200
        assert response.json()["workspace_digest"] == intelligence.workspace_digest
        response = client.post(
            "/task-context", headers=headers, json={"task_id": plan.tasks[0].task_id}
        )
        assert response.status_code == 200
        assert response.json()["history_events_included"] == 0


def test_plan_rejects_cycles_bad_questions_and_missing_capability_is_visible(store):
    draft = production_draft()
    cyclic = draft.model_copy(
        update={
            "steps": [
                draft.steps[0].model_copy(update={"dependency_keys": ["implementation"]}),
                draft.steps[1],
            ]
        }
    )
    with pytest.raises(ConstitutionError) as caught:
        save_plan(store, cyclic)
    assert caught.value.error == "dependency_cycle"
    assert store.snapshot().plans == []
    bad = draft.model_copy(
        update={
            "questions": [draft.questions[0].model_copy(update={"affected_step_keys": ["foreign"]})]
        }
    )
    with pytest.raises(ConstitutionError):
        save_plan(store, bad)
    missing = draft.model_copy(
        update={
            "steps": [
                draft.steps[0].model_copy(update={"required_capabilities": ["future_discipline"]})
            ],
            "questions": [],
        }
    )
    plan = save_plan(store, missing)
    assert plan.assignments[0].agent is None
    assert plan.assignments[0].missing_capabilities == ["future_discipline"]
    assert store.snapshot().tasks[0].state == "BLOCKED"


def test_ask_first_and_mandatory_decision_survive_authority_levels(store):
    snapshot = store.snapshot()
    store.update_policy(
        PolicyCommand(
            request_id="ask-first",
            expected_cursor=snapshot.cursor,
            policy=snapshot.policy.model_copy(update={"authority": "ask_first"}),
        )
    )
    plan = save_plan(store)
    assert len(store.snapshot().decisions) == 2
    assert all(t.state == "NEEDS_HUMAN" for t in store.snapshot().tasks)
    decision = next(d for d in store.snapshot().decisions if d.title == "Approve production plan")
    store.resolve_decision(
        DecisionCommand(
            request_id="reject-plan",
            decision_id=decision.decision_id,
            selected_option="Revise plan",
            rationale="Reduce scope",
        )
    )
    assert all(t.state == "NEEDS_HUMAN" for t in store.snapshot().tasks)
    with pytest.raises(ConstitutionError):
        store.record_plan(plan.model_copy(update={"summary": "changed"}))


def test_gm_codex_plan_is_async_persistent_and_deduplicated(store):
    class FakeTurn:
        async def run(self):
            await asyncio.sleep(0)
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                final_response=production_draft().model_dump_json(),
                error=None,
            )

        async def interrupt(self):
            pass

    class FakeThread:
        id = "gm-thread"

        async def turn(self, prompt, **kwargs):
            assert "PlanDraft" in prompt and "roster" in prompt
            assert kwargs["sandbox"].value == "read-only"
            return FakeTurn()

    class FakeClient:
        starts = 0
        resumes = 0

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            self.starts += 1
            return FakeThread()

        async def thread_resume(self, thread_id, **kwargs):
            assert thread_id == "gm-thread"
            self.resumes += 1
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store)
        bridge.client = FakeClient()
        command = ObjectiveCommand(
            request_id="objective-one", objective="Players understand their next action"
        )
        record = await bridge.plan(command)
        assert record.state == "planning"
        await bridge.gm_job
        assert store.snapshot().gm.state == "completed"
        count = store.snapshot().cursor
        assert (await bridge.plan(command)).state == "completed"
        assert store.snapshot().cursor == count
        await bridge.plan(command.model_copy(update={"request_id": "objective-two"}))
        await bridge.gm_job
        assert bridge.client.starts == 1
        assert len(store.rebuild().plans) == 2
        assert bridge.client.resumes >= 2
        await bridge.close()

    asyncio.run(scenario())


def test_gm_restart_recovers_committed_plan_and_worker_cannot_use_gm_thread(store):
    plan = save_plan(store)

    async def scenario():
        bridge = CodexBridge(store)
        await bridge.recover()
        assert store.snapshot().gm.state == "completed"
        await bridge.close()

    asyncio.run(scenario())
    with pytest.raises(ConstitutionError):
        store.record_worker(
            WorkerRecord(
                worker_id="worker-bad",
                project_id=plan.project_id,
                task_id=plan.tasks[0].task_id,
                thread_id="gm-thread",
                cwd=str(store.root),
                state="ready",
                detail="Bad binding",
            )
        )
    assert store.rebuild().workers == []


def test_intake_detects_repository_without_questionnaire(tmp_path):
    (tmp_path / "project.godot").write_text(
        '[application]\nconfig/features=PackedStringArray("4.6")\n', encoding="utf-8"
    )
    (tmp_path / "main.tscn").write_text('[node name="Main" type="Node2D"]\n', encoding="utf-8")
    (tmp_path / "README.md").write_text("# Existing game\n", encoding="utf-8")
    (tmp_path / "hero.png").write_bytes(b"asset")
    project, report = inspect(tmp_path)
    assert project.engine and project.engine.type == "godot"
    assert project.rendering == "2d"
    assert report.inspected_documents == ["README.md"]
    assert report.inspected_assets == ["hero.png"]
    assert "godot_development" in report.required_capabilities
    assert {finding.field for finding in report.findings if finding.kind == "missing"} >= {
        "platforms",
        "input_methods",
    }
    onboarding = assess_project_domains(tmp_path, project, report, "2026-09-09T00:00:00Z")
    domains = {assessment.domain for assessment in onboarding.assessments}
    assert {"engineering", "game_design", "art", "qa", "production"} <= domains
    assert "narrative" not in domains
    assert onboarding.state == "ACTIVE"
    assert onboarding.deferred_questions


def test_intake_detects_nested_godot_project(tmp_path):
    game = tmp_path / "game"
    game.mkdir()
    (game / "project.godot").write_text(
        '[application]\nconfig/name="Nested Game"\nconfig/features=PackedStringArray("4.7")\n',
        encoding="utf-8",
    )
    (game / "Main.tscn").write_text('[node name="Main" type="Node2D"]\n', encoding="utf-8")
    project, report = inspect(tmp_path)
    assert project.project.name == "Nested Game"
    assert project.engine and project.engine.version == "4.7"
    assert next(finding for finding in report.findings if finding.field == "engine").source == (
        "game/project.godot"
    )


def test_domain_onboarding_escalates_only_a_real_engine_conflict(tmp_path):
    (tmp_path / "project.godot").write_text("[application]\n", encoding="utf-8")
    (tmp_path / "alternate.uproject").write_text("{}\n", encoding="utf-8")
    project, report = inspect(tmp_path)
    onboarding = assess_project_domains(tmp_path, project, report, "2026-09-09T00:00:00Z")
    assert onboarding.state == "NEEDS_HUMAN_INPUT"
    assert onboarding.blocking_questions == [
        "Which engine project is the active production target?"
    ]


def test_knowledge_fabric_routes_distinct_lead_expertise_without_global_project_leak(
    tmp_path,
):
    project_root = tmp_path / "game"
    project_root.mkdir()
    (project_root / "project.godot").write_text(
        '[application]\nconfig/features=PackedStringArray("4.6")\n',
        encoding="utf-8",
    )
    (project_root / "menu.tscn").write_text(
        '[node name="Menu" type="Control"]\n[node name="Play" type="Button" parent="."]\n',
        encoding="utf-8",
    )
    (project_root / "menu.gd").write_text("extends Control\n", encoding="utf-8")
    project, report = inspect(project_root)
    initialize(project_root, project, report)
    intelligence = index_repository(
        project_root,
        project,
        report,
        [],
        "2026-09-09T00:00:00Z",
    )
    knowledge_root = tmp_path / "global-knowledge"
    fabric = KnowledgeFabric.from_environment(knowledge_root)
    agents = [
        AgentDefinition.model_validate(item)
        for item in json.loads((ROOT / "agents/builtin/roster.json").read_text(encoding="utf-8"))
    ]
    canonical_before = {
        path.relative_to(knowledge_root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in knowledge_root.rglob("*")
        if path.is_file()
    }

    onboarding = assess_project_domains(
        project_root,
        project,
        report,
        "2026-09-09T00:00:00Z",
        fabric.router,
        agents,
        intelligence,
    )
    assert {item.agent_id for item in onboarding.assessments} <= {
        agent.agent_id for agent in agents
    }
    engineering = next(item for item in onboarding.assessments if item.domain == "engineering")
    ux = next(item for item in onboarding.assessments if item.domain == "ux")
    assert engineering.knowledge_packet is not None
    assert ux.knowledge_packet is not None
    assert {item.pack_id for item in engineering.expertise_packs} == {
        "game-engineering-core",
        "godot-ui-engineering",
    }
    assert {item.pack_id for item in ux.expertise_packs} == {
        "game-ux-core",
        "godot-ui-engineering",
    }
    assert {
        item.statement for item in engineering.knowledge_packet.items if item.plane == "discipline"
    } != {item.statement for item in ux.knowledge_packet.items if item.plane == "discipline"}
    assert any(item.plane == "project" for item in engineering.knowledge_packet.items)
    unqualified_agents = [
        agent.model_copy(update={"required_expertise_pack_ids": ["unavailable-pack"]})
        if agent.agent_id == "ux-specialist"
        else agent
        for agent in agents
    ]
    blocked_onboarding = assess_project_domains(
        project_root,
        project,
        report,
        "2026-09-09T00:00:00Z",
        fabric.router,
        unqualified_agents,
        intelligence,
    )
    blocked_ux = next(item for item in blocked_onboarding.assessments if item.domain == "ux")
    assert blocked_onboarding.state == "BLOCKED_KNOWLEDGE"
    assert blocked_ux.readiness.status == "BLOCKED_KNOWLEDGE"
    assert not blocked_ux.recommendations
    engineering_agent = next(agent for agent in agents if agent.agent_id == "implementation")
    stale_packet = fabric.router.assemble(
        project_id=project.project.id,
        task_id="freshness-check",
        task_text="Godot UI engineering and controller navigation",
        capability_ids=["ui_engineering", "controller_navigation"],
        agent=engineering_agent,
        intelligence=intelligence,
        project_engine="godot",
        assembled_at="2028-09-09T00:00:00Z",
    )
    assert stale_packet.stale_knowledge_flags
    assert "game-ux-core-1.0.0-wcag-2-2" not in {
        source.source_id for source in stale_packet.sources
    }
    non_godot = fabric.router.assemble(
        project_id=project.project.id,
        task_id="web-ui",
        task_text="UI engineering",
        capability_ids=["ui_engineering"],
        agent=engineering_agent,
        intelligence=intelligence,
        project_engine=None,
    )
    assert {pack.pack_id for pack in non_godot.expertise_packs} == {"game-engineering-core"}
    base_entry = intelligence.knowledge[0]
    oversized_intelligence = intelligence.model_copy(
        update={
            "knowledge": [
                base_entry.model_copy(
                    update={
                        "knowledge_id": f"oversized-{index}",
                        "statement": ("focus guidance " * 1800) + str(index),
                    }
                )
                for index in range(8)
            ]
        }
    )
    bounded = fabric.router.assemble(
        project_id=project.project.id,
        task_id="bounded-packet",
        task_text="focus guidance",
        capability_ids=["ui_engineering"],
        agent=engineering_agent,
        intelligence=oversized_intelligence,
        project_engine="godot",
    )
    assert any("packet below" in flag for flag in bounded.missing_knowledge_flags)
    assert len(bounded.model_dump_json().encode("utf-8")) < 60_000
    with pytest.raises(ConstitutionError, match="other-project"):
        fabric.router.assemble(
            project_id="other-project",
            task_id="foreign-context",
            task_text="Inspect UI",
            capability_ids=["ui_engineering"],
            agent=engineering_agent,
            intelligence=intelligence,
            project_engine="godot",
        )
    assert fabric.registry.search("game-ui engineering")

    canonical_after = {
        path.relative_to(knowledge_root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in knowledge_root.rglob("*")
        if path.is_file()
    }
    assert canonical_after == canonical_before
    assert fabric.registry.search("ui accessibility")


def test_knowledge_maintenance_rebuilds_derived_index_and_records_report(tmp_path):
    fabric = KnowledgeFabric.from_environment(tmp_path / "knowledge")
    fabric.directory.index_path.unlink()
    report = fabric.maintain()
    assert report.rebuilt_full_text_index
    assert report.state == "passed"
    assert fabric.directory.index_path.is_file()
    saved = json.loads(
        (fabric.directory.root / "maintenance" / "latest.json").read_text(encoding="utf-8")
    )
    assert saved["run_id"] == report.run_id


def test_agent_knowledge_api_exposes_pack_versions_and_retrieved_context(store, tmp_path):
    store.refresh_intelligence(IntelligenceRefreshCommand(request_id="knowledge-index"))
    app = create_app(
        store,
        TOKEN,
        ORIGIN,
        registry_path=tmp_path / "registry" / "projects.json",
        knowledge_root=tmp_path / "knowledge",
    )
    fabric = KnowledgeFabric.from_environment(tmp_path / "knowledge")
    agents = [
        AgentDefinition.model_validate(item)
        for item in json.loads((ROOT / "agents/builtin/roster.json").read_text(encoding="utf-8"))
    ]
    onboarding = store.ensure_onboarding(fabric.router, agents)
    with TestClient(app) as client:
        response = client.get(
            "/agent-knowledge",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
    assert response.status_code == 200
    profiles = {item["agent_id"]: item for item in response.json()["profiles"]}
    assert profiles["ux-specialist"]["qualification_state"] == "expertise_available"
    assert profiles["ux-specialist"]["resolved_packs"]
    assert profiles["ux-specialist"]["packet"]["items"]
    for assessment in onboarding.assessments:
        if assessment.knowledge_packet is not None:
            packet = assessment.knowledge_packet
            assert profiles[packet.agent_id]["recorded_packets"] == [packet.model_dump(mode="json")]
    assert (
        profiles["implementation"]["resolved_packs"] != profiles["ux-specialist"]["resolved_packs"]
    )


def test_pack_promotion_requires_audit_and_nonregressing_benchmark(tmp_path):
    fabric = KnowledgeFabric.from_environment(tmp_path / "global")
    baseline = {item.pack_id: item.state for item in fabric.catalog().baseline}
    assert len(baseline) == 14
    assert baseline["game-ux-core"] == "trusted"
    assert baseline["game-production-core"] == "missing"
    original = fabric.registry.latest("game-ux-core")
    assert original is not None
    candidate = original.model_copy(
        update={
            "version": "1.1.0",
            "state": "draft",
            "reviewed_at": None,
            "sources": [
                source.model_copy(update={"license": "Test fixture license"})
                for source in original.sources
            ],
        }
    )
    fabric.propose_pack(candidate)
    assert fabric.registry.latest(candidate.pack_id).version == "1.0.0"
    ref = ExpertisePackRef(pack_id=candidate.pack_id, version=candidate.version)
    review = PackReviewCommand(
        pack=ref,
        decision="approved",
        provenance_checked=True,
        privacy_checked=True,
        licensing_checked=True,
        contradictions_checked=True,
        detail="Independent synthetic fixture audit",
    )
    with pytest.raises(ConstitutionError):
        fabric.review_pack(review)
    for benchmark in candidate.evaluation_ids:
        fabric.record_audition(
            PackAuditionCommand(
                pack=ref,
                benchmark_id=benchmark,
                baseline_score=0.6,
                candidate_score=0.9,
                evidence_text="Synthetic benchmark fixture result: 9 of 10 versus 6 of 10.",
                detail="Fixture only",
            )
        )
    receipt = fabric.review_pack(review)
    assert fabric.review_pack(review) == receipt
    assert fabric.registry.latest(candidate.pack_id).version == "1.1.0"
    assert (
        KnowledgeFabric.from_environment(tmp_path / "global")
        .registry.latest(candidate.pack_id)
        .version
        == "1.1.0"
    )
    with pytest.raises(ConstitutionError):
        fabric.propose_pack(candidate)
    regressing = candidate.model_copy(update={"version": "1.2.0"})
    fabric.propose_pack(regressing)
    bad_ref = ExpertisePackRef(pack_id=candidate.pack_id, version="1.2.0")
    for benchmark in candidate.evaluation_ids:
        fabric.record_audition(
            PackAuditionCommand(
                pack=bad_ref,
                benchmark_id=benchmark,
                baseline_score=0.95,
                candidate_score=0.9,
                evidence_text="Synthetic regression fixture; score decreased.",
                detail="Fixture only",
            )
        )
    with pytest.raises(ConstitutionError):
        fabric.review_pack(review.model_copy(update={"pack": bad_ref}))
    assert fabric.registry.latest(candidate.pack_id).version == "1.1.0"


@pytest.mark.parametrize("invented_source", [False, True])
def test_automated_pack_audition_is_isolated_and_does_not_promote(store, tmp_path, invented_source):
    from gameagent.models.api import PackAutomatedAuditionCommand

    fabric = KnowledgeFabric.from_environment(tmp_path / "global")
    original = fabric.registry.latest("game-ux-core")
    candidate = original.model_copy(
        update={"version": "1.1.0", "state": "draft", "reviewed_at": None}
    )
    fabric.propose_pack(candidate)
    workspaces = []

    class FakeTurn:
        def __init__(self, response):
            self.response = response

        async def run(self):
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                error=None,
                final_response=json.dumps(self.response),
            )

    class FakeThread:
        async def turn(self, prompt, **kwargs):
            assert kwargs["sandbox"].value == "read-only"
            if "Independently evaluate" in prompt:
                return FakeTurn(
                    {
                        "baseline_score": 0.5,
                        "candidate_score": 0.9,
                        "rationale": "Synthetic fixture comparison",
                        "critical_issues": [],
                    }
                )
            return FakeTurn(
                {
                    "findings": ["Check keyboard navigation"],
                    "uncertainty": [],
                    "source_ids": ["invented"] if invented_source else [],
                }
            )

    class FakeClient:
        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            assert kwargs["ephemeral"] is True
            assert kwargs["cwd"] != str(store.root)
            workspaces.append(kwargs["cwd"])
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store)
        bridge.client = FakeClient()
        receipt = await bridge.audition_expertise(
            PackAutomatedAuditionCommand(
                pack=ExpertisePackRef(pack_id=candidate.pack_id, version=candidate.version),
                benchmark_id=candidate.evaluation_ids[0],
                scenario="A synthetic menu cannot be navigated using a keyboard.",
                expected_findings=["Keyboard navigation is missing"],
            ),
            fabric,
        )
        assert receipt.evidence_class == "heuristic"
        assert receipt.reviewer_id == "expertise-curator"
        assert receipt.candidate_score == (0 if invented_source else 0.9)
        assert len(set(workspaces)) == 3
        assert fabric.registry.latest(candidate.pack_id).version == "1.0.0"
        await bridge.close()

    asyncio.run(scenario())


def test_pack_builder_uses_public_sources_and_cannot_self_promote(store, tmp_path):
    fabric = KnowledgeFabric.from_environment(tmp_path / "knowledge")
    original = fabric.registry.latest("game-ux-core")
    task = store.propose(
        proposal().model_copy(update={"required_capabilities": original.capability_ids})
    )
    candidate = original.model_copy(
        update={"pack_id": "fixture-ux", "version": "0.1.0", "state": "draft", "reviewed_at": None}
    )

    class FakeTurn:
        def __init__(self, response):
            self.response = response

        async def run(self):
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                error=None,
                final_response=self.response,
            )

    class FakeThread:
        async def turn(self, prompt, **kwargs):
            assert store.snapshot().project.project.id not in prompt
            assert task.objective not in prompt
            assert "not its curator" in prompt
            payload = json.loads(prompt.rsplit("\n", 1)[1])
            supplied_sources = payload["sources"]
            supplied_ids = [source["source_id"] for source in supplied_sources]
            assert len(supplied_ids) == len(set(supplied_ids))
            assert all(
                source_id.startswith(("game-ux-core-1.0.0-", "godot-ui-engineering-1.0.0-"))
                for source_id in supplied_ids
            )
            response = type(candidate).model_validate(
                candidate.model_dump()
                | {
                    "sources": supplied_sources,
                    "methods": [
                        method.model_copy(update={"source_ids": supplied_ids[:1]})
                        for method in candidate.methods
                    ],
                    "items": [
                        item.model_copy(update={"source_ids": supplied_ids[:1]})
                        for item in candidate.items
                    ],
                }
            )
            return FakeTurn(response.model_dump_json())

    class FakeClient:
        async def thread_start(self, **kwargs):
            assert Path(kwargs["cwd"]) != store.root
            assert kwargs["sandbox"].value == "read-only"
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store, knowledge_router=fabric.router)

        async def account():
            return {"state": "ready"}

        bridge.account = account
        bridge.client = FakeClient()
        draft = await bridge.build_expertise(
            PackBuildCommand(task_id=task.task_id, pack_id="fixture-ux", version="0.1.0"), fabric
        )
        assert draft.state == "draft"
        assert fabric.registry.latest("fixture-ux") is None
        assert fabric.catalog().candidates == [draft]
        await bridge.close()

    asyncio.run(scenario())


def test_research_denies_network_and_private_hosts(store, monkeypatch):
    task = store.propose(proposal())
    command = ResearchCommand(
        task_id=task.task_id,
        requirement="Current platform guidance",
        url="https://docs.example.test/current",
    )

    def forbidden_fetch(url):
        raise AssertionError("Network must not run")

    monkeypatch.setattr("gameagent.knowledge.fetch_primary_source", forbidden_fetch)
    record = research_source(command, task, store.root)
    assert record.state == "blocked"
    assert store.record_research(record) == record
    assert store.rebuild().research_records == [record]
    monkeypatch.setenv("GAMEAGENT_RESEARCH_HOSTS", "docs.example.test")
    monkeypatch.setattr(
        "gameagent.knowledge.socket.getaddrinfo",
        lambda *args, **kwargs: [(2, 1, 6, "", ("127.0.0.1", 443))],
    )
    with pytest.raises(ConstitutionError):
        fetch_primary_source(command.url)


def test_pack_lifecycle_changes_selection_without_rewriting_canonical_pack(tmp_path):
    fabric = KnowledgeFabric.from_environment(tmp_path / "global")
    pack = fabric.registry.latest("game-ux-core")
    ref = ExpertisePackRef(pack_id=pack.pack_id, version=pack.version)
    path = fabric.directory.packs_root / pack.pack_id / pack.version / "pack.yaml"
    original = path.read_bytes()
    fabric.set_lifecycle(
        PackLifecycleCommand(
            pack=ref, state="disputed", reason="Conflicting evidence requires review"
        )
    )
    assert fabric.registry.latest(pack.pack_id) is None
    assert path.read_bytes() == original
    assert (
        KnowledgeFabric.from_environment(tmp_path / "global").registry.latest(pack.pack_id) is None
    )
    fabric.set_lifecycle(
        PackLifecycleCommand(
            pack=ref, state="active", reason="Independent review resolved the conflict"
        )
    )
    assert fabric.registry.latest(pack.pack_id) == pack
    assert path.read_bytes() == original


def test_research_is_project_local_and_expired_results_are_not_retrieved(
    store, tmp_path, monkeypatch
):
    task = store.propose(proposal())
    permitted = task.model_copy(
        update={"permissions": task.permissions.model_copy(update={"network": True})}
    )
    monkeypatch.setattr(
        "gameagent.knowledge.fetch_primary_source",
        lambda url: b"<html><p>Visible focus is required.</p></html>",
    )
    record = research_source(
        ResearchCommand(
            task_id=task.task_id,
            requirement="Focus guidance",
            url="https://docs.example.test/focus",
            freshness_class="live",
        ),
        permitted,
        store.root,
    )
    assert record.state == "available"
    assert record.artifact is not None and (store.root / record.artifact.uri).is_file()
    fabric = KnowledgeFabric.from_environment(tmp_path / "global")
    agents = [
        AgentDefinition.model_validate(item)
        for item in json.loads((ROOT / "agents/builtin/roster.json").read_text())
    ]
    agent = next(item for item in agents if item.agent_id == "ux-specialist")
    packet = fabric.router.assemble(
        project_id=task.project_id,
        task_id=task.task_id,
        task_text="focus",
        capability_ids=task.required_capabilities,
        agent=agent,
        intelligence=None,
        project_engine=None,
        research=[record],
        assembled_at=record.researched_at,
    )
    assert any(item.plane == "world" for item in packet.items)
    expired = fabric.router.assemble(
        project_id=task.project_id,
        task_id=task.task_id,
        task_text="focus",
        capability_ids=task.required_capabilities,
        agent=agent,
        intelligence=None,
        project_engine=None,
        research=[record],
        assembled_at="2099-01-01T00:00:00Z",
    )
    assert not any(item.plane == "world" for item in expired.items)
    assert any("expired" in flag for flag in expired.stale_knowledge_flags)


def test_init_preserves_existing_agents_instructions_and_records_workspace(tmp_path):
    instructions = tmp_path / "AGENTS.md"
    instructions.write_text("# Existing project rules\n", encoding="utf-8")
    initialize(tmp_path, Project.model_validate(PROFILE))
    text = instructions.read_text(encoding="utf-8")
    assert text.startswith("# Existing project rules")
    assert text.count("BEGIN GAME AGENT NETWORK") == 1
    assert "<!-- BEGIN GAME AGENT NETWORK -->\n\n## Game Agent Network registration" in text
    assert "gameagent task start" in text
    snapshot = ProjectStore(tmp_path).snapshot()
    assert snapshot.workspace is not None
    assert any(entry.path == "AGENTS.md" for entry in snapshot.workspace.entries)


def test_init_restart_rotate_delete_database_rebuild(store):
    initial = store.snapshot()
    assert initial.cursor == 1 and initial.tasks == []
    task = store.propose(proposal())
    command = PolicyCommand(
        request_id="policy-a",
        expected_cursor=2,
        policy=initial.policy.model_copy(update={"authority": "ask_first"}),
    )
    store.update_policy(command)
    before = store.snapshot()
    assert len(list((store.directory / "events").glob("*.jsonl"))) == 3
    assert before.tasks[0] == task
    assert ProjectStore(store.root).snapshot() == before
    (store.directory / "projection.sqlite3").unlink()
    assert ProjectStore(store.root).snapshot() == before
    assert store.rebuild() == before
    assert store.snapshot() == before


def test_retry_is_idempotent_and_conflicting_request_rejected(store):
    first = store.propose(proposal())
    assert store.propose(proposal()) == first
    assert store.snapshot().cursor == 2
    with pytest.raises(ConstitutionError):
        store.propose(proposal().model_copy(update={"title": "Different intent"}))


def test_registered_work_is_not_external_and_completion_advances_baseline(store):
    started = store.start_task(
        TaskStartCommand(
            request_id="registered-a",
            title="Adjust the game",
            objective="Make a registered project change",
            required_capabilities=["project_analysis"],
            deliverables=["Changed game file"],
        )
    )
    assert started.state == "RUNNING"
    (store.root / "game.txt").write_text("registered work\n", encoding="utf-8")
    during = store.detect_external_changes()
    assert not during.requires_reconciliation
    completed = store.complete_task(
        TaskProgressCommand(
            request_id="registered-complete-a",
            task_id=started.task_id,
            detail="Added the registered game file",
        )
    )
    assert completed.state == "REVIEW"
    after = store.detect_external_changes()
    assert not after.requires_reconciliation
    assert after.workspace is not None
    assert any(entry.path == "game.txt" for entry in after.workspace.entries)


def test_external_change_requires_reconciliation_and_replays(store):
    (store.root / "unregistered.txt").write_text("outside GAN\n", encoding="utf-8")
    detected = store.detect_external_changes()
    assert detected.requires_reconciliation
    assert len(detected.reconciliations) == 1
    change = detected.reconciliations[0]
    assert change.state == "unresolved"
    assert change.paths == ["unregistered.txt"]
    cursor = detected.cursor
    assert store.detect_external_changes().cursor == cursor
    with pytest.raises(ConstitutionError) as blocked:
        store.start_task(
            TaskStartCommand(
                request_id="blocked-by-reconciliation",
                title="Work that must wait",
                objective="Do not conceal unresolved external changes",
                required_capabilities=["project_analysis"],
                deliverables=["Registered result"],
            )
        )
    assert blocked.value.error == "reconciliation_required"

    reconciled = store.reconcile(
        ReconcileCommand(
            request_id="reconcile-a",
            change_id=change.change_id,
            detail="Attributed a direct external edit",
        )
    )
    assert (
        store.reconcile(
            ReconcileCommand(
                request_id="reconcile-a",
                change_id=change.change_id,
                detail="Attributed a direct external edit",
            )
        )
        == reconciled
    )
    assert reconciled.state == "reconciled"
    assert reconciled.task_id is not None
    assert [artifact.locator for artifact in reconciled.artifacts] == ["unregistered.txt"]
    snapshot = store.snapshot()
    assert not snapshot.requires_reconciliation
    reconstructed = next(task for task in snapshot.tasks if task.task_id == reconciled.task_id)
    assert reconstructed.state == "REVIEW"
    assert reconstructed.references == reconciled.artifacts
    assert store.rebuild() == snapshot

    (store.root / "unregistered.txt").write_text("another outside edit\n", encoding="utf-8")
    assert store.detect_external_changes().requires_reconciliation


def test_git_commit_is_detected_and_associated(store):
    def git(*arguments):
        return subprocess.run(
            ["git", *arguments],
            cwd=store.root,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    git("init")
    git("config", "user.email", "gan-test@example.invalid")
    git("config", "user.name", "GAN Test")
    task = store.start_task(
        TaskStartCommand(
            request_id="git-baseline-a",
            title="Establish Git baseline",
            objective="Track the repository before external work",
            required_capabilities=["version_control_analysis"],
            deliverables=["Committed baseline"],
        )
    )
    (store.root / "tracked.txt").write_text("baseline\n", encoding="utf-8")
    git("add", "AGENTS.md", "tracked.txt")
    git("commit", "-m", "test: establish baseline")
    store.complete_task(
        TaskProgressCommand(
            request_id="git-baseline-complete-a",
            task_id=task.task_id,
            detail="Committed the registered baseline",
        )
    )

    (store.root / "tracked.txt").write_text("external change\n", encoding="utf-8")
    git("add", "tracked.txt")
    git("commit", "-m", "test: external change")
    head = git("rev-parse", "HEAD")
    detected = store.detect_external_changes()
    record = next(item for item in detected.reconciliations if item.state == "unresolved")
    assert record.paths == [".git/HEAD", "tracked.txt"]
    assert record.git_commits == [head]
    assert record.git_diff_summary and "tracked.txt" in record.git_diff_summary


def test_cli_registers_reports_and_reconciles(store, monkeypatch, capsys):
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "gameagent",
            "task",
            "start",
            str(store.root),
            "--title",
            "CLI registered work",
            "--objective",
            "Exercise the external agent contract",
        ],
    )
    cli_main()
    started = json.loads(capsys.readouterr().out)
    assert started["state"] == "RUNNING"

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "gameagent",
            "task",
            "complete",
            str(store.root),
            "--task-id",
            started["task_id"],
            "--detail",
            "Registered CLI work complete",
        ],
    )
    cli_main()
    assert json.loads(capsys.readouterr().out)["state"] == "REVIEW"

    (store.root / "cli-external.txt").write_text("unregistered\n", encoding="utf-8")
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "gameagent",
            "reconcile",
            str(store.root),
            "--detail",
            "Reconstructed a CLI-visible external edit",
        ],
    )
    cli_main()
    assert json.loads(capsys.readouterr().out)["state"] == "reconciled"

    monkeypatch.setattr(sys, "argv", ["gameagent", "task", "status", str(store.root)])
    cli_main()
    status = json.loads(capsys.readouterr().out)
    assert status["requires_reconciliation"] is False
    assert len(status["tasks"]) == 2


def test_concurrent_writers_get_distinct_contiguous_sequences(store):
    def write(index):
        return ProjectStore(store.root).propose(proposal(f"request-{index}"))

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(write, range(8)))
    assert store.snapshot().cursor == 9
    assert [e.sequence for e in store.events().events] == list(range(1, 10))


def test_projection_migrations_are_serialized_across_projects(tmp_path, monkeypatch):
    original = projection_module.command.upgrade
    guard = threading.Lock()
    active = 0
    peak = 0

    def observed_upgrade(*args, **kwargs):
        nonlocal active, peak
        with guard:
            active += 1
            peak = max(peak, active)
        time.sleep(0.02)
        try:
            return original(*args, **kwargs)
        finally:
            with guard:
                active -= 1

    monkeypatch.setattr(projection_module.command, "upgrade", observed_upgrade)
    with ThreadPoolExecutor(max_workers=4) as pool:
        projections = list(
            pool.map(lambda index: Projection(tmp_path / f"projection-{index}.sqlite3"), range(4))
        )
    for projection in projections:
        projection.close()
    assert peak == 1


def test_append_survives_projection_failure_and_retry_recovers(store, monkeypatch):
    original = Projection.replace

    def fail(*args):
        raise RuntimeError("simulated crash after durable append")

    monkeypatch.setattr(Projection, "replace", fail)
    with pytest.raises(RuntimeError):
        store.propose(proposal())
    monkeypatch.setattr(Projection, "replace", original)
    assert store.propose(proposal()).task_id == "task-request-a"
    assert store.snapshot().cursor == 2


@pytest.mark.parametrize("damage", ["tail", "json", "version", "sequence", "scope", "duplicate"])
def test_corruption_is_explicit_and_canonical_bytes_remain_untouched(store, damage):
    store.propose(proposal())
    file = sorted((store.directory / "events").glob("*.jsonl"))[-1]
    data = file.read_bytes()
    value = json.loads(data)
    if damage == "tail":
        data = data[:-1]
    elif damage == "json":
        data = b"not-json\n"
    elif damage == "duplicate":
        data += data
    else:
        value[
            {"version": "schema_version", "sequence": "sequence", "scope": "project_id"}[damage]
        ] = {"version": 2, "sequence": 7, "scope": "project-b"}[damage]
        data = json.dumps(value).encode() + b"\n"
    file.write_bytes(data)
    with pytest.raises(ConstitutionError):
        store.rebuild()
    assert file.read_bytes() == data


def test_initialization_never_overwrites_and_replay_uses_event_snapshot(store):
    with pytest.raises(ConstitutionError):
        initialize(store.root, Project.model_validate(PROFILE))
    task = store.propose(proposal())
    # Exported contract files are convenient references; event payload is authoritative.
    for file in (store.directory / "contracts").glob("*.json"):
        file.write_text("changed outside the daemon")
    assert store.rebuild().tasks == [task]


def test_missing_dependency_foreign_policy_and_stale_update_rejected(store):
    with pytest.raises(ConstitutionError):
        store.propose(proposal(dependency_ids=["missing"]))
    snapshot = store.snapshot()
    for patch in ({"project_id": "project-b"}, {}):
        with pytest.raises(ConstitutionError):
            store.update_policy(
                PolicyCommand(
                    request_id="policy-a",
                    expected_cursor=0,
                    policy=snapshot.policy.model_copy(update=patch),
                )
            )
    assert store.snapshot().cursor == 1


def test_event_cursor_paging_and_ahead_cursor(store):
    store.propose(proposal())
    assert store.events(0, 1).has_more
    assert store.events(1, 1).cursor == 2
    assert store.events(2).events == []
    with pytest.raises(ConstitutionError):
        store.events(3)


def test_project_registry_import_switch_and_restart(store):
    registry_path = store.root.parent / "projects.json"
    registry = ProjectRegistry(store, registry_path)
    second = store.root.parent / "second-game"
    second.mkdir()
    (second / "project.godot").write_text(
        '[application]\nconfig/name="Second Game"\nconfig/features=PackedStringArray("4.6")\n',
        encoding="utf-8",
    )
    imported = registry.import_local(second)
    assert len(imported.projects) == 2
    assert imported.active_project_id != store.snapshot().project.project.id
    assert (second / ".gameagent" / "project.yaml").is_file()
    assert registry.current.root == second
    assert registry.current.snapshot().onboarding is not None
    event_types = {event.event_type for event in registry.current.events().events}
    assert {
        "project.reconnaissance_started",
        "domain.assessment_completed",
        "project.reconciliation_completed",
        "project.onboarding_completed",
    } <= event_types
    imported_summary = next(
        item for item in imported.projects if item.project_id == imported.active_project_id
    )
    assert imported_summary.onboarding is not None

    restarted = ProjectRegistry(store, registry_path)
    assert restarted.active_project_id == imported.active_project_id
    selected = restarted.select(store.snapshot().project.project.id)
    assert selected.active_project_id == store.snapshot().project.project.id
    assert restarted.current.root == store.root
    restarted.select(imported.active_project_id)
    removed = restarted.remove(ProjectRemoval(project_id=imported.active_project_id))
    assert len(removed.projects) == 1
    assert removed.active_project_id == store.snapshot().project.project.id
    assert second.is_dir()
    assert (second / ".gameagent" / "project.yaml").is_file()
    with pytest.raises(ConstitutionError) as caught:
        restarted.remove(ProjectRemoval(project_id=removed.active_project_id))
    assert caught.value.error == "last_project_removal_forbidden"
    with pytest.raises(ConstitutionError, match="missing-game"):
        restarted.import_local(store.root.parent / "missing-game")


def test_rest_auth_task_policy_and_websocket_replay(store):
    app = create_app(store, TOKEN, ORIGIN)
    with TestClient(app) as client:
        assert client.get("/project").status_code == 401
        headers = {"Authorization": f"Bearer {TOKEN}"}
        snapshot = client.get("/project", headers=headers).json()
        assert snapshot["cursor"] == 1
        response = client.post("/tasks", headers=headers, json=proposal().model_dump())
        assert response.status_code == 201
        assert client.post("/tasks", headers=headers, json={}).status_code == 422
        with client.websocket_connect("/events/ws?after=1", headers={"origin": ORIGIN}) as ws:
            ticket = client.post("/stream-ticket", headers=headers).json()["ticket"]
            ws.send_json({"ticket": ticket})
            message = ws.receive_json()
            assert message["cursor"] == 2 and message["events"][0]["event_type"] == "task.proposed"
            store.propose(proposal("request-b"))
            while True:
                message = ws.receive_json()
                if message["events"]:
                    assert message["cursor"] == 3
                    break


def test_rest_imports_and_switches_local_projects(store):
    second = store.root.parent / "api-second-game"
    second.mkdir()
    (second / "project.godot").write_text(
        '[application]\nconfig/name="API Second Game"\n', encoding="utf-8"
    )
    app = create_app(store, TOKEN, ORIGIN, store.root.parent / "api-projects.json")
    headers = {"Authorization": f"Bearer {TOKEN}"}
    with TestClient(app) as client:
        initial = client.get("/projects", headers=headers).json()
        assert len(initial["projects"]) == 1
        imported = client.post(
            "/project-import", headers=headers, json={"path": str(second)}
        ).json()
        assert len(imported["projects"]) == 2
        assert client.get("/project", headers=headers).json()["project"]["project"]["name"] == (
            "API Second Game"
        )
        selected = client.post(
            "/project-select",
            headers=headers,
            json={"project_id": store.snapshot().project.project.id},
        ).json()
        assert selected["active_project_id"] == store.snapshot().project.project.id
        client.post(
            "/project-select",
            headers=headers,
            json={"project_id": imported["active_project_id"]},
        ).raise_for_status()
        removed = client.post(
            "/project-remove",
            headers=headers,
            json={"project_id": imported["active_project_id"]},
        )
        assert removed.status_code == 200
        assert len(removed.json()["projects"]) == 1
        assert second.is_dir()
        last_removal = client.post(
            "/project-remove",
            headers=headers,
            json={"project_id": store.snapshot().project.project.id},
        )
        assert last_removal.status_code == 409
        assert last_removal.json()["error"] == "last_project_removal_forbidden"
        assert (
            client.post(
                "/project-select", headers=headers, json={"project_id": "project-missing"}
            ).status_code
            == 409
        )


def test_rest_registration_detection_and_reconciliation(store):
    app = create_app(store, TOKEN, ORIGIN)
    headers = {"Authorization": f"Bearer {TOKEN}"}
    with TestClient(app) as client:
        started = client.post(
            "/task-start",
            headers=headers,
            json={
                "request_id": "api-register-a",
                "title": "Registered API work",
                "objective": "Track a direct edit",
                "required_capabilities": ["project_analysis"],
                "deliverables": ["A tracked change"],
            },
        )
        assert started.status_code == 200
        task_id = started.json()["task_id"]
        blocked = client.post(
            "/task-block",
            headers=headers,
            json={
                "request_id": "api-block-a",
                "task_id": task_id,
                "detail": "Waiting for direction",
            },
        )
        assert blocked.json()["state"] == "BLOCKED"
        assert (
            client.post(
                "/task-start",
                headers=headers,
                json={"request_id": "api-resume-a", "task_id": task_id},
            ).json()["state"]
            == "RUNNING"
        )
        client.post(
            "/task-complete",
            headers=headers,
            json={
                "request_id": "api-complete-a",
                "task_id": task_id,
                "detail": "Registered work reported",
            },
        )

        (store.root / "outside.txt").write_text("unregistered\n", encoding="utf-8")
        scanned = client.post("/workspace-scan", headers=headers).json()
        assert scanned["requires_reconciliation"] is True
        change_id = scanned["reconciliations"][0]["change_id"]
        response = client.post(
            "/reconcile",
            headers=headers,
            json={
                "request_id": "api-reconcile-a",
                "change_id": change_id,
                "detail": "External edit reconstructed",
            },
        )
        assert response.status_code == 200
        assert response.json()["state"] == "reconciled"
        assert client.get("/project", headers=headers).json()["requires_reconciliation"] is False


def test_websocket_rejects_foreign_origin_and_invalid_token(store):
    from starlette.websockets import WebSocketDisconnect

    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": "https://evil.test"}):
                pass
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
                ws.send_json({"ticket": "wrong"})
                ws.receive_json()


def test_websocket_ticket_is_single_use(store):
    from starlette.websockets import WebSocketDisconnect

    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        ticket = client.post("/stream-ticket", headers=headers).json()["ticket"]
        with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
            ws.send_json({"ticket": ticket})
            assert ws.receive_json()["cursor"] == 1
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
                ws.send_json({"ticket": ticket})
                ws.receive_json()


def test_worker_bridge_persists_resumes_and_rejects_foreign_worker(store):
    task = store.propose(proposal())

    class FakeTurn:
        id = "turn-1"

        async def run(self):
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                error=None,
                final_response=json.dumps(
                    {
                        "summary": "Inspected",
                        "findings": ["No engine"],
                        "next_steps": ["Choose engine"],
                    }
                ),
            )

    class FakeThread:
        id = "thread-1"

        async def turn(self, prompt, **kwargs):
            assert '"history_events_included":0' in prompt
            assert '"indexed_resource_count"' in prompt
            assert "targeted context package" in prompt
            assert "untrusted project data" in prompt
            assert kwargs["sandbox"].value == "read-only"
            assert kwargs["approval_mode"].value == "deny_all"
            return FakeTurn()

    class FakeClient:
        resumed = False

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            assert kwargs["cwd"] == str(store.root)
            return FakeThread()

        async def thread_resume(self, thread_id, **kwargs):
            assert thread_id == "thread-1"
            self.resumed = True
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        fabric = KnowledgeFabric.from_environment(store.root / "test-global-knowledge")
        bridge = CodexBridge(store, knowledge_router=fabric.router)
        fake = FakeClient()
        bridge.client = fake
        record = await bridge.start(WorkerCommand(task_id=task.task_id))
        await bridge.jobs[record.worker_id]
        assert store.rebuild().workers[0].state == "completed"
        assert record.knowledge_packet is not None
        original_packet = record.knowledge_packet
        original_specialist = record.specialist
        original_context = record.context_package

        def fail_retrieval(**kwargs):
            raise AssertionError("A resumed worker must not reroute knowledge")

        fabric.router.assemble = fail_retrieval
        with pytest.raises(ConstitutionError):
            await bridge.start(WorkerCommand(task_id=task.task_id, worker_id="worker-foreign"))
        resumed = await bridge.start(
            WorkerCommand(task_id=task.task_id, worker_id=record.worker_id)
        )
        assert resumed.knowledge_packet == original_packet
        assert resumed.specialist == original_specialist
        assert resumed.context_package == original_context
        await bridge.jobs[record.worker_id]
        assert fake.resumed
        assert store.snapshot().tasks[0].state == "PROPOSED"
        await bridge.close()

    asyncio.run(scenario())


def test_worker_bridge_records_and_resolves_knowledge_block(store):
    plan = save_plan(store, production_draft().model_copy(update={"questions": []}))
    task = plan.tasks[0]
    fabric = KnowledgeFabric.from_environment(store.root / "test-global-knowledge")
    original_assemble = fabric.router.assemble
    blocked = True

    def conditional_assemble(**kwargs):
        packet = original_assemble(**kwargs)
        return packet.model_copy(
            update={
                "missing_knowledge_flags": ["Required expertise pack fixture is unavailable."]
                if blocked
                else []
            }
        )

    fabric.router.assemble = conditional_assemble

    class FakeTurn:
        id = "turn-knowledge"

        async def run(self):
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                error=None,
                final_response=json.dumps(
                    {"summary": "Inspected", "findings": [], "next_steps": []}
                ),
            )

        async def interrupt(self):
            pass

    class FakeThread:
        id = "thread-knowledge"

        async def turn(self, _prompt, **_kwargs):
            return FakeTurn()

    class FakeClient:
        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **_kwargs):
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        nonlocal blocked
        bridge = CodexBridge(store, knowledge_router=fabric.router)
        bridge.client = FakeClient()
        with pytest.raises(ConstitutionError) as error:
            await bridge.start(WorkerCommand(task_id=task.task_id))
        assert error.value.error == "blocked_knowledge", error.value.detail
        assert (
            next(item for item in store.snapshot().tasks if item.task_id == task.task_id).state
            == "BLOCKED_KNOWLEDGE"
        )
        blocked = False
        record = await bridge.start(WorkerCommand(task_id=task.task_id))
        assert (
            next(item for item in store.snapshot().tasks if item.task_id == task.task_id).state
            == "READY"
        )
        await bridge.jobs[record.worker_id]
        await bridge.close()

    asyncio.run(scenario())


def test_worker_bridge_rejects_api_key_account(store):
    async def scenario():
        bridge = CodexBridge(store)

        async def account():
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="apiKey")))

        bridge.client.account = account
        with pytest.raises(ConstitutionError, match="Sign in with ChatGPT"):
            await bridge.start(WorkerCommand(task_id="task-a"))
        await bridge.close()

    asyncio.run(scenario())


def test_worker_bridge_recovers_running_state_and_interrupts_active_turn(store):
    task = store.propose(proposal())
    record = WorkerRecord(
        worker_id="worker-recovery",
        project_id=store.snapshot().project.project.id,
        task_id=task.task_id,
        thread_id="thread-recovery",
        cwd=str(store.root),
        state="running",
        turn_id="turn-recovery",
        detail="Running before restart",
    )
    store.record_worker(record)

    class FakeTurn:
        interrupted = False

        async def interrupt(self):
            self.interrupted = True

    class FakeClient:
        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store)
        bridge.client = FakeClient()
        await bridge.recover()
        recovered = store.snapshot().workers[0]
        assert recovered.state == "interrupted"
        assert recovered.thread_id == record.thread_id
        turn = FakeTurn()
        bridge.turns[record.worker_id] = turn
        assert await bridge.interrupt(record.worker_id) == {"state": "interrupt_requested"}
        assert turn.interrupted
        await bridge.close()

    asyncio.run(scenario())


def test_godot_adapter_inspects_nested_project_and_option_buttons(tmp_path):
    game = tmp_path / "game"
    asset = game / "assets" / "ui" / "selector.png"
    asset.parent.mkdir(parents=True)
    asset.write_bytes(b"png")
    asset.with_suffix(".png.import").write_text("[remap]\n", encoding="utf-8")
    (game / "project.godot").write_text(
        '[application]\nrun/main_scene="res://Main.tscn"\n'
        'config/features=PackedStringArray("4.7")\n',
        encoding="utf-8",
    )
    (game / "Main.tscn").write_text(
        '[node name="Main" type="Node"]\n[node name="Players" type="OptionButton" parent="Menu"]\n',
        encoding="utf-8",
    )
    inspection = GodotAdapter(tmp_path).inspect("project-a", "task-a")
    assert inspection.project_path == "game"
    assert inspection.engine_version == "4.7"
    assert inspection.ui_nodes[0].path == "Menu/Players"
    assert inspection.approved_assets[0].uri == "game/assets/ui/selector.png"


def test_runtime_evidence_is_replayed_and_served(store):
    task = store.propose(proposal())
    evidence_dir = store.root / ".gameagent" / "evidence"
    evidence_dir.mkdir()
    capture = evidence_dir / "capture.png"
    capture.write_bytes(b"runtime-capture")
    captured_at = timestamp()
    source = SourceRef(
        uri=".gameagent/evidence/capture.png",
        media_type="image/png",
        locator="1280x720",
        sha256=hashlib.sha256(capture.read_bytes()).hexdigest(),
    )
    evidence = Evidence(
        evidence_id="evidence-runtime",
        project_id=task.project_id,
        task_id=task.task_id,
        evidence_class="measured",
        producer_type="tool",
        producer_id="godot-adapter",
        captured_at=captured_at,
        source=source,
        capture_origin="runtime",
        summary="Popup visible in the running scene",
    )
    evaluation = Evaluation(
        evaluation_id="evaluation-runtime",
        project_id=task.project_id,
        task_id=task.task_id,
        gate_id="runtime_ui_capture",
        claim="visual",
        result="passed",
        evidence_ids=[evidence.evidence_id],
        evaluator_id="godot-adapter",
        rationale="Runtime capture exists and is inspectable",
        evaluated_at=captured_at,
    )
    store.record_runtime_evaluation("runtime-one", evidence, evaluation)
    snapshot = store.rebuild()
    assert snapshot.evidence == [evidence]
    assert snapshot.evaluations == [evaluation]
    headers = {"Authorization": f"Bearer {TOKEN}"}
    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        response = client.get("/evidence-file?evidence_id=evidence-runtime", headers=headers)
        assert response.status_code == 200
        assert response.content == b"runtime-capture"
