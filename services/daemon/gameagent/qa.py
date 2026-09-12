"""Reusable evidence gates and derived task QA reports."""

import hashlib
import json
from pathlib import Path
from typing import Literal

from gameagent.constitution import require, validate_evaluation
from gameagent.models.contracts import (
    Evaluation,
    Evidence,
    GateWaiver,
    QAGateDefinition,
    QAGateStatus,
    QAReport,
    SourceRef,
    TaskContract,
)

GATES = (
    QAGateDefinition(
        gate_id="contract_compliance",
        version="1.0.0",
        discipline="engineering",
        title="Contract compliance",
        description="Validates the task contract, dependencies, project scope, and known QA gates.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="engineering_smoke",
        version="1.0.0",
        discipline="engineering",
        title="Engineering smoke",
        description="Records build, test, static-analysis, or runtime-smoke output from a tool.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="runtime_ui_capture",
        version="1.0.0",
        discipline="ui",
        title="Runtime UI capture",
        description="Requires an actual tool-produced runtime capture before visual claims can pass.",
        claim="visual",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool", "human"],
        requires_runtime_capture=True,
    ),
    QAGateDefinition(
        gate_id="resolution_matrix",
        version="1.0.0",
        discipline="ui",
        title="Resolution matrix",
        description="Measures clipping, overflow, scale, and layout at the task's required viewports.",
        claim="technical",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="visual_reference_review",
        version="1.0.0",
        discipline="ui",
        title="Visual reference review",
        description="Compares a runtime result with approved project references without treating similarity as truth.",
        claim="visual",
        required_evidence_classes=["comparative"],
        allowed_producer_types=["tool", "model", "human"],
        requires_runtime_capture=True,
        requires_independent_verification=True,
    ),
    QAGateDefinition(
        gate_id="ux_heuristic_review",
        version="1.0.0",
        discipline="ui",
        title="UX heuristic review",
        description="Records an explicitly heuristic usability assessment and its supporting evidence.",
        claim="subjective",
        required_evidence_classes=["heuristic"],
        allowed_producer_types=["model", "human"],
        requires_independent_verification=True,
    ),
    QAGateDefinition(
        gate_id="human_judgment",
        version="1.0.0",
        discipline="ui",
        title="Human judgment",
        description="Preserves the Director's approval or rejection as human evidence.",
        claim="subjective",
        required_evidence_classes=["human"],
        allowed_producer_types=["human"],
    ),
    QAGateDefinition(
        gate_id="gameplay_source_integrity",
        version="1.0.0",
        discipline="gameplay",
        title="Gameplay source integrity",
        description="Inventories readable gameplay implementation files without claiming behavioral correctness or fun.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="level_scene_integrity",
        version="1.0.0",
        discipline="level_design",
        title="Level scene integrity",
        description="Validates discoverable scene and level files without claiming navigation quality.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="art_asset_integrity",
        version="1.0.0",
        discipline="art",
        title="Art asset integrity",
        description="Checks image signatures and measurable metadata without claiming aesthetic quality.",
        claim="technical",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="audio_asset_integrity",
        version="1.0.0",
        discipline="audio",
        title="Audio asset integrity",
        description="Checks common audio containers and measurable WAV properties without claiming mix quality.",
        claim="technical",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="narrative_source_integrity",
        version="1.0.0",
        discipline="narrative",
        title="Narrative source integrity",
        description="Checks readable narrative and localization source structure without claiming continuity or tone quality.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="production_evidence",
        version="1.0.0",
        discipline="production",
        title="Production evidence",
        description="Requires inspectable schedule, scope, dependency, or risk records before production claims can pass.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool", "human"],
    ),
    QAGateDefinition(
        gate_id="support_evidence",
        version="1.0.0",
        discipline="support",
        title="Player support evidence",
        description="Requires attributable support or community records without treating sentiment as a deterministic product verdict.",
        claim="subjective",
        required_evidence_classes=["human"],
        allowed_producer_types=["human"],
        requires_independent_verification=True,
    ),
    QAGateDefinition(
        gate_id="compliance_review",
        version="1.0.0",
        discipline="compliance",
        title="Compliance review",
        description="Requires an attributable human review for legal, ratings, policy, or platform-compliance claims.",
        claim="subjective",
        required_evidence_classes=["human"],
        allowed_producer_types=["human"],
        requires_independent_verification=True,
    ),
    QAGateDefinition(
        gate_id="accessibility_measurement",
        version="1.0.0",
        discipline="ui",
        title="Accessibility measurement",
        description="Requires measured accessibility evidence such as contrast, focus traversal, or assistive-technology behavior.",
        claim="technical",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool", "human"],
        requires_independent_verification=True,
    ),
    QAGateDefinition(
        gate_id="data_pipeline_integrity",
        version="1.0.0",
        discipline="data",
        title="Data pipeline integrity",
        description="Validates telemetry provenance, assignment, segmentation, and transformation before product-data conclusions can pass.",
        claim="technical",
        required_evidence_classes=["deterministic"],
        allowed_producer_types=["tool"],
    ),
    QAGateDefinition(
        gate_id="security_assurance",
        version="1.0.0",
        discipline="security",
        title="Security assurance",
        description="Requires measured security evidence and independent human review without claiming certification.",
        claim="technical",
        required_evidence_classes=["measured"],
        allowed_producer_types=["tool", "human"],
        requires_independent_verification=True,
    ),
)
GATES_BY_ID = {gate.gate_id: gate for gate in GATES}


def gate_catalog() -> list[QAGateDefinition]:
    return list(GATES)


def validate_gate_evaluation(evaluation: Evaluation, evidence: list[Evidence]) -> None:
    validate_evaluation(evaluation, evidence)
    require(
        evaluation.gate_id in GATES_BY_ID,
        "unknown_quality_gate",
        evaluation.gate_id,
    )
    gate = GATES_BY_ID[evaluation.gate_id]
    require(evaluation.claim == gate.claim, "gate_claim_mismatch", evaluation.gate_id)
    selected = [item for item in evidence if item.evidence_id in evaluation.evidence_ids]
    if evaluation.result == "passed":
        classes = {item.evidence_class for item in selected}
        require(
            set(gate.required_evidence_classes) <= classes,
            "gate_evidence_class_missing",
            evaluation.gate_id,
        )
        require(
            all(
                any(
                    item.evidence_class == evidence_class
                    and item.producer_type in gate.allowed_producer_types
                    for item in selected
                )
                for evidence_class in gate.required_evidence_classes
            ),
            "gate_producer_forbidden",
            evaluation.gate_id,
        )
        if gate.requires_runtime_capture:
            require(
                any(
                    item.capture_origin == "runtime" and item.producer_type == "tool"
                    for item in selected
                ),
                "runtime_evidence_required",
                evaluation.gate_id,
            )


def build_report(
    task: TaskContract,
    evidence: list[Evidence],
    evaluations: list[Evaluation],
    waivers: list[GateWaiver],
    *,
    unresolved_change_ids: list[str],
    generated_at: str,
) -> QAReport:
    for gate_id in task.required_evaluations:
        require(gate_id in GATES_BY_ID, "unknown_quality_gate", gate_id)
    task_evidence = [item for item in evidence if item.task_id == task.task_id]
    task_evaluations = [item for item in evaluations if item.task_id == task.task_id]
    task_waivers = [item for item in waivers if item.task_id == task.task_id]
    latest: dict[str, Evaluation] = {}
    for evaluation_record in sorted(task_evaluations, key=lambda item: item.evaluated_at):
        validate_gate_evaluation(evaluation_record, task_evidence)
        latest[evaluation_record.gate_id] = evaluation_record
    latest_waiver: dict[str, GateWaiver] = {}
    for waiver in sorted(task_waivers, key=lambda item: item.waived_at):
        require(waiver.gate_id in GATES_BY_ID, "unknown_quality_gate", waiver.gate_id)
        latest_waiver[waiver.gate_id] = waiver

    statuses: list[QAGateStatus] = []
    for gate in GATES:
        required = gate.gate_id in task.required_evaluations
        current_evaluation = latest.get(gate.gate_id)
        current_waiver = latest_waiver.get(gate.gate_id)
        state: Literal["missing", "passed", "failed", "inconclusive", "advisory", "waived"]
        if current_waiver is not None:
            state = "waived"
            explanation = f"Director waived this gate: {current_waiver.reason}"
        elif current_evaluation is None:
            state = "missing"
            explanation = (
                "Required evidence has not been recorded."
                if required
                else "This optional gate has not been evaluated."
            )
        elif current_evaluation.result == "passed" and current_evaluation.authority == "advisory":
            state = "advisory"
            explanation = (
                "A probationary evaluator recommends pass; independent verification is required."
            )
        else:
            state = current_evaluation.result
            explanation = current_evaluation.rationale
        statuses.append(
            QAGateStatus(
                gate=gate,
                required=required,
                state=state,
                latest_evaluation_id=(
                    current_evaluation.evaluation_id if current_evaluation else None
                ),
                evidence_ids=current_evaluation.evidence_ids if current_evaluation else [],
                waiver_id=current_waiver.waiver_id if current_waiver else None,
                explanation=explanation,
            )
        )

    required_statuses = [item for item in statuses if item.required]
    human_rejected = any(
        evaluation.authority == "human" and evaluation.result == "failed"
        for evaluation in latest.values()
    )
    passed = sum(item.state == "passed" for item in required_statuses)
    waived = sum(item.state == "waived" for item in required_statuses)
    completion_state: Literal["passed", "blocked", "human_rejected"]
    if human_rejected:
        completion_state = "human_rejected"
        explanation = "Human rejection blocks completion regardless of automated results."
    elif unresolved_change_ids:
        completion_state = "blocked"
        explanation = "Unregistered project changes must be reconciled before completion."
    elif all(item.state in {"passed", "waived"} for item in required_statuses):
        completion_state = "passed"
        explanation = "Every required gate passed or has an explicit Director waiver."
    else:
        completion_state = "blocked"
        explanation = "One or more required gates are missing, failed, inconclusive, or advisory."
    return QAReport(
        report_id=f"qa-report-{task.task_id}",
        project_id=task.project_id,
        task_id=task.task_id,
        generated_at=generated_at,
        completion_state=completion_state,
        required_gate_count=len(required_statuses),
        passed_gate_count=passed,
        waived_gate_count=waived,
        gates=statuses,
        explanation=explanation,
    )


def _write_evidence(root: Path, evidence_id: str, payload: dict[str, object]) -> SourceRef:
    body = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    path = root / ".gameagent" / "evidence" / "qa" / f"{evidence_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return SourceRef(
        uri=path.relative_to(root).as_posix(),
        media_type="application/json",
        locator="canonical QA record",
        sha256=hashlib.sha256(body).hexdigest(),
    )


def contract_compliance_result(
    root: Path,
    task: TaskContract,
    all_tasks: list[TaskContract],
    *,
    request_id: str,
    captured_at: str,
) -> tuple[Evidence, Evaluation]:
    known_tasks = {item.task_id for item in all_tasks}
    checks = {
        "contract_valid": True,
        "dependencies_resolve": set(task.dependency_ids) <= known_tasks,
        "entity_scope_valid": all(item.project_id == task.project_id for item in task.entities),
        "required_gates_known": all(item in GATES_BY_ID for item in task.required_evaluations),
        "deliverables_present": bool(task.deliverables),
    }
    passed = all(checks.values())
    evidence_id = f"evidence-{request_id}-contract"
    source = _write_evidence(
        root,
        evidence_id,
        {
            "schema_version": 1,
            "project_id": task.project_id,
            "task_id": task.task_id,
            "captured_at": captured_at,
            "checks": checks,
        },
    )
    evidence = Evidence(
        evidence_id=evidence_id,
        project_id=task.project_id,
        task_id=task.task_id,
        evidence_class="deterministic",
        producer_type="tool",
        producer_id="qa-fabric",
        captured_at=captured_at,
        source=source,
        capture_origin="source",
        summary="Task contract and project-scope validation",
    )
    evaluation = Evaluation(
        evaluation_id=f"evaluation-{request_id}-contract",
        project_id=task.project_id,
        task_id=task.task_id,
        gate_id="contract_compliance",
        claim="technical",
        result="passed" if passed else "failed",
        evidence_ids=[evidence_id],
        evaluator_id="qa-fabric",
        authority="eligible",
        rationale=(
            "All contract, dependency, scope, gate-registry, and deliverable checks passed."
            if passed
            else "One or more deterministic contract checks failed."
        ),
        evaluated_at=captured_at,
    )
    validate_gate_evaluation(evaluation, [evidence])
    return evidence, evaluation


def human_review_result(
    root: Path,
    task: TaskContract,
    supporting_evidence: list[Evidence],
    *,
    request_id: str,
    gate_id: str,
    verdict: str,
    summary: str,
    captured_at: str,
) -> tuple[Evidence, Evaluation]:
    require(gate_id in GATES_BY_ID, "unknown_quality_gate", gate_id)
    gate = GATES_BY_ID[gate_id]
    evidence_id = f"evidence-{request_id}-human"
    source = _write_evidence(
        root,
        evidence_id,
        {
            "schema_version": 1,
            "project_id": task.project_id,
            "task_id": task.task_id,
            "gate_id": gate_id,
            "verdict": verdict,
            "summary": summary,
            "supporting_evidence_ids": [item.evidence_id for item in supporting_evidence],
            "captured_at": captured_at,
        },
    )
    human_evidence = Evidence(
        evidence_id=evidence_id,
        project_id=task.project_id,
        task_id=task.task_id,
        evidence_class="human",
        producer_type="human",
        producer_id="local-director",
        captured_at=captured_at,
        source=source,
        capture_origin="human_observation",
        summary=summary,
    )
    result: Literal["passed", "failed", "inconclusive"]
    if verdict == "approved":
        result = "passed"
    elif verdict == "rejected":
        result = "failed"
    else:
        result = "inconclusive"
    evaluation = Evaluation(
        evaluation_id=f"evaluation-{request_id}-human",
        project_id=task.project_id,
        task_id=task.task_id,
        gate_id=gate_id,
        claim=gate.claim,
        result=result,
        evidence_ids=[evidence_id, *[item.evidence_id for item in supporting_evidence]],
        evaluator_id="local-director",
        authority="human",
        rationale=summary,
        evaluated_at=captured_at,
    )
    validate_gate_evaluation(evaluation, [human_evidence, *supporting_evidence])
    return human_evidence, evaluation
