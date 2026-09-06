import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from gameagent.constitution import (
    ConstitutionError,
    authorize,
    completion_allowed,
    provider_admission,
    recovery_action,
    validate_assignment,
    validate_decision,
    validate_evaluation,
    validate_event_authority,
    validate_transition,
)
from gameagent.models import contracts as c

ROOT = Path(__file__).resolve().parents[3]
DATA = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())


def make(name, **patch):
    return getattr(c, name).model_validate(DATA[name] | patch)


@pytest.mark.parametrize("actor", ["agent", "system", "external", "human"])
@pytest.mark.parametrize("action", ["assign", "hire", "reprioritize", "integrate", "complete"])
def test_only_gm_has_production_authority(actor, action):
    with pytest.raises(ConstitutionError, match=action):
        authorize(actor, action)
    authorize("gm", action)


def test_unknown_action_and_agent_completion_event_rejected():
    with pytest.raises(ConstitutionError):
        authorize("gm", "invented")
    with pytest.raises(ConstitutionError):
        validate_event_authority(make("TaskEvent", event_type="task.completed", actor_type="agent"))
    with pytest.raises(ConstitutionError):
        validate_event_authority(make("TaskEvent", task_id=None))


def test_assignment_scope_capability_version_and_permissions():
    agent, task = make("AgentDefinition"), make("TaskContract")
    assignment = make("AgentAssignment")
    validate_assignment(assignment, agent, task, [])
    for patch in [
        {"project_id": "project-b"},
        {"agent_version": "2.0.0"},
        {"granted_permissions": {"network": True}},
        {"granted_permissions": {"install_dependencies": "allow"}},
    ]:
        with pytest.raises(ConstitutionError):
            validate_assignment(make("AgentAssignment", **patch), agent, task, [])
    with pytest.raises(ConstitutionError):
        validate_assignment(assignment, make("AgentDefinition", capabilities=["other"]), task, [])
    with pytest.raises(ConstitutionError):
        validate_assignment(
            assignment, agent, task, [make("AgentAssignment", project_id="project-b")]
        )
    validate_assignment(
        make("AgentAssignment", thread_id="thread-new"),
        agent,
        task,
        [make("AgentAssignment", project_id="project-b")],
    )


def test_human_rejection_and_external_changes_block_completion():
    args = (make("TaskContract"), [make("Evaluation")], [make("Evidence")])
    assert completion_allowed(*args, human_rejected=False, unresolved_change_ids=[])
    for rejected, changes in [(True, []), (False, ["change-a"])]:
        with pytest.raises(ConstitutionError):
            completion_allowed(*args, human_rejected=rejected, unresolved_change_ids=changes)


def test_llm_cannot_self_certify_visual_quality_or_impersonate_human():
    for patch in [
        {"evidence_class": "heuristic", "producer_type": "model"},
        {"evidence_class": "human", "producer_type": "model"},
    ]:
        with pytest.raises(ConstitutionError):
            validate_evaluation(make("Evaluation"), [make("Evidence", **patch)])
    with pytest.raises(ConstitutionError):
        validate_evaluation(make("Evaluation"), [make("Evidence", capture_origin="source")])
    with pytest.raises(ConstitutionError):
        validate_evaluation(make("Evaluation", claim="fun"), [make("Evidence")])
    validate_evaluation(
        make("Evaluation", claim="fun"),
        [
            make(
                "Evidence",
                evidence_class="human",
                producer_type="human",
                capture_origin="human_observation",
            )
        ],
    )


def test_missing_foreign_or_duplicate_evidence_rejected():
    for evidence in [
        [],
        [make("Evidence", project_id="project-b")],
        [make("Evidence"), make("Evidence")],
    ]:
        with pytest.raises(ConstitutionError):
            validate_evaluation(make("Evaluation"), evidence)


def test_latest_failure_missing_gate_and_audited_waiver():
    task, evidence = make("TaskContract"), [make("Evidence")]
    for evaluations in [
        [],
        [
            make("Evaluation"),
            make("Evaluation", result="failed", evaluated_at="2026-09-06T13:00:00Z"),
        ],
    ]:
        with pytest.raises(ConstitutionError):
            completion_allowed(
                task, evaluations, evidence, human_rejected=False, unresolved_change_ids=[]
            )
    waiver = c.DecisionEvent.model_validate(
        DATA["TaskEvent"]
        | {
            "event_type": "gate.waived",
            "actor_type": "human",
            "correlation_id": "evidence_review",
            "payload": {"decision_id": "decision-a", "reason": "Explicit acceptance"},
        }
    )
    assert completion_allowed(
        task, [], evidence, human_rejected=False, unresolved_change_ids=[], waivers=[waiver]
    )


def admission(**patch):
    values = {
        "provider": make("Provider"),
        "policy": make("Policy"),
        "predicted_cents": 99,
        "spent_cents": 0,
        "reserved_cents": 0,
        "now": datetime(2026, 9, 6, tzinfo=UTC),
    }
    return provider_admission(**(values | patch))


@pytest.mark.parametrize(
    "patch",
    [
        {"provider": make("Provider", cap={"verified": False})},
        {"provider": make("Provider", state="DISABLED_UNCAPPED")},
        {"predicted_cents": None},
        {"predicted_cents": -1},
        {"predicted_cents": 1.5},
        {"predicted_cents": True},
        {"reserved_cents": -1},
        {"spent_cents": 2402},
        {"spent_cents": 2300, "reserved_cents": 102},
        {"now": datetime(2026, 10, 1, tzinfo=UTC)},
        {"now": datetime(2026, 8, 1, tzinfo=UTC)},
    ],
)
def test_paid_provider_admission_fails_closed(patch):
    with pytest.raises(ConstitutionError):
        admission(**patch, human_approved=True)


def test_budget_boundaries_and_subscription_path():
    assert admission() == "allowed"
    assert admission(predicted_cents=100) == "needs_human"
    assert admission(predicted_cents=100, human_approved=True) == "allowed"
    assert admission(spent_cents=2401) == "allowed"
    assert (
        admission(
            provider=make("Provider", billing="codex_subscription", cap={"verified": False}),
            predicted_cents=0,
        )
        == "allowed"
    )


def test_failure_ladder():
    assert (
        recovery_action(progress=True, specialist_intervened=True, further_nonprogress_failures=3)
        == "continue"
    )
    assert (
        recovery_action(progress=False, specialist_intervened=False, further_nonprogress_failures=0)
        == "change_strategy_or_find_specialist"
    )
    assert (
        recovery_action(progress=False, specialist_intervened=True, further_nonprogress_failures=2)
        == "change_strategy"
    )
    assert (
        recovery_action(progress=False, specialist_intervened=True, further_nonprogress_failures=3)
        == "escalate_to_oren"
    )


def test_task_cannot_skip_review_or_reopen_terminal_state():
    validate_transition("RUNNING", "REVIEW", "gm")
    for before, after in [("RUNNING", "COMPLETE"), ("COMPLETE", "RETRY")]:
        with pytest.raises(ConstitutionError):
            validate_transition(before, after, "gm")


def test_decision_option_and_structured_error():
    with pytest.raises(ConstitutionError) as caught:
        validate_decision(make("Decision", selected_option="invented"))
    assert caught.value.response() == {"error": "invalid_decision_option", "detail": "invented"}
