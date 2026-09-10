import hashlib
import json
from pathlib import Path

import pytest

from gameagent.constitution import ConstitutionError, completion_allowed
from gameagent.knowledge import KnowledgeFabric
from gameagent.models.api import (
    GateWaiverCommand,
    HumanReviewCommand,
    LessonPromotionCommand,
    LessonReviewCommand,
    QARunCommand,
    TaskProposal,
)
from gameagent.models.contracts import Evaluation, Project
from gameagent.projects import ProjectStore, initialize
from gameagent.qa import GATES, build_report, gate_catalog

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]


@pytest.fixture
def store(tmp_path: Path) -> ProjectStore:
    initialize(tmp_path, Project.model_validate(PROFILE))
    project = ProjectStore(tmp_path, max_segment_bytes=1)
    project.propose(
        TaskProposal(
            request_id="qa-task",
            title="Verify the interface",
            objective="The interface satisfies its recorded contract",
            required_capabilities=["usability_analysis"],
            deliverables=["Inspectable QA evidence"],
        )
    )
    return project


def test_gate_catalog_covers_all_evidence_classes() -> None:
    assert {item.discipline for item in gate_catalog()} == {
        "ui",
        "engineering",
        "gameplay",
        "level_design",
        "art",
        "audio",
        "narrative",
    }
    assert {
        evidence_class for gate in GATES for evidence_class in gate.required_evidence_classes
    } == {"deterministic", "measured", "comparative", "heuristic", "human"}


def test_learning_is_durable_local_idempotent_and_requires_independent_review(store):
    for index in range(2):
        task = store.propose(
            TaskProposal(
                request_id=f"learning-{index}",
                title="Review focus",
                objective="Focus is visible",
                required_capabilities=["usability_analysis"],
                deliverables=["Review"],
            )
        )
        store.record_human_review(
            HumanReviewCommand(
                request_id=f"rejected-{index}",
                task_id=task.task_id,
                gate_id="human_judgment",
                verdict="rejected",
                summary="Controller focus was not visible.",
            )
        )
    snapshot = store.distill_experience()
    assert len(snapshot.experience_observations) == 2
    assert len(snapshot.experience_lessons) == 1
    lesson = snapshot.experience_lessons[0]
    assert lesson.state == "repeated" and lesson.scope == "project"
    assert store.distill_experience().cursor == snapshot.cursor
    validated = store.review_lesson(
        LessonReviewCommand(
            lesson_id=lesson.lesson_id,
            decision="validated",
            detail="Reviewed both recordings; use only for this project.",
        )
    )
    assert validated.reviewer_id != validated.proposer_id
    assert store.rebuild().experience_lessons == [validated]
    fabric = KnowledgeFabric.from_environment(store.root / "test-global-library")
    assert not fabric.catalog().global_experience
    command = LessonPromotionCommand(
        lesson_id=lesson.lesson_id,
        statement="Check controller focus before similar interface reviews.",
        applicability="Controller modal reviews",
        limitations=["Limited observational evidence; no causal claim."],
        scope="domain",
        scope_constraint="interface-design",
        privacy_checked=True,
        generalization_reviewed=True,
    )
    with pytest.raises(ConstitutionError):
        fabric.promote_lesson(
            command.model_copy(
                update={"statement": "Private Game Title should use blue controls."}
            ),
            validated,
            snapshot.experience_observations,
            "Private Game Title",
        )
    promoted = fabric.promote_lesson(
        command, validated, snapshot.experience_observations, "Private Game Title"
    )
    assert "project_id" not in promoted.model_dump()
    assert "Private Game Title" not in promoted.model_dump_json()
    assert (
        fabric.promote_lesson(
            command, validated, snapshot.experience_observations, "Private Game Title"
        )
        == promoted
    )
    store.review_lesson(
        LessonReviewCommand(
            lesson_id=lesson.lesson_id, decision="expired", detail="Input design changed."
        )
    )
    with pytest.raises(ConstitutionError, match="lesson-"):
        store.review_lesson(
            LessonReviewCommand(
                lesson_id=lesson.lesson_id,
                decision="validated",
                detail="Cannot revive expired history.",
            )
        )


def test_repeated_rejections_on_one_task_do_not_create_generalized_lesson(store):
    for index in range(3):
        store.record_human_review(
            HumanReviewCommand(
                request_id=f"same-task-{index}",
                task_id="task-qa-task",
                gate_id="human_judgment",
                verdict="rejected",
                summary="One task is not independent repetition.",
            )
        )
    assert store.distill_experience().experience_lessons == []


def test_qa_run_records_deterministic_evidence_and_explains_pass(
    store: ProjectStore,
) -> None:
    before = store.qa_report("task-qa-task")
    assert before.completion_state == "blocked"
    assert (
        next(item for item in before.gates if item.gate.gate_id == "contract_compliance").state
        == "missing"
    )

    report = store.run_qa(QARunCommand(request_id="qa-run", task_id="task-qa-task"))
    assert report.completion_state == "passed"
    assert report.passed_gate_count == 1
    gate = next(item for item in report.gates if item.gate.gate_id == "contract_compliance")
    assert gate.state == "passed"
    assert "All contract" in gate.explanation

    snapshot = store.snapshot()
    evidence = next(item for item in snapshot.evidence if item.evidence_id in gate.evidence_ids)
    artifact = store.root / evidence.source.uri
    assert artifact.is_file()
    assert hashlib.sha256(artifact.read_bytes()).hexdigest() == evidence.source.sha256
    assert (
        store.run_qa(QARunCommand(request_id="qa-run", task_id="task-qa-task")).completion_state
        == "passed"
    )


def test_probationary_advisory_pass_cannot_satisfy_required_gate(store: ProjectStore) -> None:
    store.run_qa(QARunCommand(request_id="advisory-base", task_id="task-qa-task"))
    snapshot = store.snapshot()
    original = snapshot.evaluations[-1]
    advisory = Evaluation(
        **(
            original.model_dump()
            | {
                "evaluation_id": "evaluation-advisory",
                "authority": "advisory",
                "evaluator_id": "probationary-specialist",
                "evaluated_at": "2026-09-08T12:00:00Z",
            }
        )
    )
    report = build_report(
        snapshot.tasks[-1],
        snapshot.evidence,
        [advisory],
        [],
        unresolved_change_ids=[],
        generated_at="2026-09-08T12:01:00Z",
    )
    assert report.completion_state == "blocked"
    assert next(item for item in report.gates if item.required).state == "advisory"
    with pytest.raises(ConstitutionError, match="contract_compliance"):
        completion_allowed(
            snapshot.tasks[-1],
            [advisory],
            snapshot.evidence,
            human_rejected=False,
            unresolved_change_ids=[],
        )


def test_human_rejection_wins_and_gate_waiver_is_canonical(store: ProjectStore) -> None:
    store.run_qa(QARunCommand(request_id="human-base", task_id="task-qa-task"))
    rejected = store.record_human_review(
        HumanReviewCommand(
            request_id="human-reject",
            task_id="task-qa-task",
            gate_id="human_judgment",
            verdict="rejected",
            summary="The Director rejects the current interaction feel.",
        )
    )
    assert rejected.completion_state == "human_rejected"
    human_gate = next(item for item in rejected.gates if item.gate.gate_id == "human_judgment")
    assert human_gate.state == "failed"

    other_root = store.root.parent / "waiver-project"
    other_root.mkdir()
    initialize(other_root, Project.model_validate(PROFILE))
    other = ProjectStore(other_root, max_segment_bytes=1)
    other.propose(
        TaskProposal(
            request_id="waiver-task",
            title="Waive a gate",
            objective="Exercise the explicit human waiver path",
            required_capabilities=["usability_analysis"],
            deliverables=["Audited waiver"],
        )
    )
    waived = other.waive_gate(
        GateWaiverCommand(
            request_id="waive-contract",
            task_id="task-waiver-task",
            gate_id="contract_compliance",
            reason="Director accepts this prototype without the automated check.",
        )
    )
    assert waived.completion_state == "passed"
    assert waived.waived_gate_count == 1
    replayed = ProjectStore(other_root, max_segment_bytes=1).snapshot()
    assert replayed.waivers[0].gate_id == "contract_compliance"
