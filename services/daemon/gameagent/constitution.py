"""Pure admission rules, not a scheduler, persistence layer or provider executor.

Future command handlers must call these with trusted, project-scoped records.
Wire validation alone does not grant authority or verify provider evidence.
"""

from datetime import UTC, datetime
from typing import Literal

from gameagent.models.contracts import (
    Actor,
    AgentAssignment,
    AgentDefinition,
    Decision,
    DecisionEvent,
    Evaluation,
    EventBase,
    Evidence,
    GateWaiver,
    ModelRoutingRecord,
    Policy,
    Provider,
    TaskContract,
    TaskEvent,
    TaskState,
    VerifiedCap,
)


class ConstitutionError(ValueError):
    def __init__(self, error: str, detail: str) -> None:
        super().__init__(detail)
        self.error = error
        self.detail = detail

    def response(self) -> dict[str, str]:
        return {"error": self.error, "detail": self.detail}


def require(condition: bool, error: str, detail: str) -> None:
    if not condition:
        raise ConstitutionError(error, detail)


def authorize(actor: Actor, action: str) -> None:
    production = {"assign", "hire", "reprioritize", "change_scope", "integrate", "complete"}
    if action in production:
        require(actor == "gm", "gm_authority_required", action)
    elif action in {"override", "resolve_decision"}:
        require(actor == "human", "human_authority_required", action)
    else:
        require(
            action in {"finding", "blocker", "result", "capability_gap"}, "unknown_action", action
        )


def validate_event_authority(event: EventBase) -> None:
    event_type = getattr(event, "event_type", "")
    actions = {
        "agent.assigned": "assign",
        "agent.hired": "hire",
        "recruitment.updated": "hire",
        "task.completed": "complete",
        "decision.resolved": "resolve_decision",
        "qa.gate_waived": "override",
    }
    if event_type in actions:
        authorize(event.actor_type, actions[event_type])
    if isinstance(event, TaskEvent):
        require(event.task_id == event.payload.task_id, "task_scope_mismatch", event.event_id)
    if event_type.startswith(
        (
            "task.",
            "agent.",
            "recruitment.",
            "evaluation.",
            "evidence.",
            "qa.",
            "artifact.",
            "git.",
            "model.",
        )
    ):
        require(event.task_id is not None, "task_registration_required", event.event_id)


def validate_model_routing(record: ModelRoutingRecord) -> None:
    routes = [candidate.route for candidate in record.candidates]
    require(len(routes) == len(set(routes)), "duplicate_model_route", record.routing_id)
    matching = [
        candidate
        for candidate in record.candidates
        if candidate.route == record.selected_route
        and candidate.provider_id == record.selected_provider_id
        and candidate.model_name == record.selected_model_name
    ]
    require(
        len(matching) == 1 and matching[0].viable,
        "model_route_not_viable",
        record.routing_id,
    )
    if record.selected_route == "paid_provider":
        require(
            matching[0].expected_external_cost_cents is not None,
            "unknown_cost",
            "A paid route needs an upper-bound external cost",
        )


def validate_assignment(
    assignment: AgentAssignment,
    agent: AgentDefinition,
    task: TaskContract,
    existing: list[AgentAssignment],
) -> None:
    require(
        assignment.project_id == task.project_id and assignment.task_id == task.task_id,
        "project_scope_mismatch",
        "Assignment and task must share project and task",
    )
    require(
        assignment.agent_id == agent.agent_id and assignment.agent_version == agent.version,
        "agent_version_mismatch",
        "Assignments pin a global definition version",
    )
    require(
        set(task.required_capabilities) <= set(agent.capabilities),
        "capability_gap",
        "Agent does not advertise every required capability",
    )
    require(
        all(entity.project_id == task.project_id for entity in task.entities),
        "project_scope_mismatch",
        "Task context cannot import another project's entities",
    )
    for previous in existing:
        if assignment.thread_id is not None and previous.thread_id == assignment.thread_id:
            require(
                previous.project_id == assignment.project_id,
                "thread_project_leak",
                "A Codex thread belongs to exactly one project",
            )
    granted = assignment.granted_permissions.model_dump()
    for name, value in granted.items():
        for limits in (agent.permissions.model_dump(), task.permissions.model_dump()):
            if isinstance(value, bool):
                require(not value or limits[name] is True, "permission_escalation", name)
            else:
                rank = {"never": 0, "ask": 1, "allow": 2}
                require(rank[value] <= rank[limits[name]], "permission_escalation", name)


def validate_evaluation(evaluation: Evaluation, evidence: list[Evidence]) -> None:
    by_id = {item.evidence_id: item for item in evidence}
    require(len(by_id) == len(evidence), "duplicate_evidence", "Evidence IDs must be unique")
    selected: list[Evidence] = []
    for evidence_id in evaluation.evidence_ids:
        require(evidence_id in by_id, "missing_evidence", evidence_id)
        item = by_id[evidence_id]
        require(
            item.project_id == evaluation.project_id and item.task_id == evaluation.task_id,
            "evidence_scope_mismatch",
            evidence_id,
        )
        require(
            (item.evidence_class == "human") == (item.producer_type == "human"),
            "misclassified_evidence",
            "Human evidence must originate from a human",
        )
        require(
            item.producer_type != "model" or item.evidence_class == "heuristic",
            "misclassified_evidence",
            "Model output is heuristic evidence",
        )
        selected.append(item)
    if evaluation.result == "passed":
        if evaluation.claim in {"visual", "subjective", "fun"}:
            require(
                any(item.producer_type != "model" for item in selected),
                "independent_evidence_required",
                "LLM judgment alone cannot pass this claim",
            )
        if evaluation.claim == "visual":
            require(
                any(
                    item.capture_origin == "runtime" and item.producer_type == "tool"
                    for item in selected
                ),
                "runtime_evidence_required",
                evaluation.gate_id,
            )
        if evaluation.claim == "fun":
            require(
                any(item.evidence_class == "human" for item in selected),
                "human_evidence_required",
                "Fun requires human evidence",
            )


def completion_allowed(
    task: TaskContract,
    evaluations: list[Evaluation],
    evidence: list[Evidence],
    *,
    human_rejected: bool,
    unresolved_change_ids: list[str],
    waivers: list[DecisionEvent | GateWaiver] | None = None,
) -> bool:
    require(not human_rejected, "human_rejection", "User judgment overrides automated passes")
    require(not unresolved_change_ids, "reconciliation_required", "External changes are unresolved")
    latest: dict[str, Evaluation] = {}
    for evaluation in sorted(evaluations, key=lambda item: item.evaluated_at):
        require(
            evaluation.project_id == task.project_id and evaluation.task_id == task.task_id,
            "evaluation_scope_mismatch",
            evaluation.evaluation_id,
        )
        validate_evaluation(evaluation, evidence)
        latest[evaluation.gate_id] = evaluation
    waived: set[str] = set()
    for waiver in waivers or []:
        if isinstance(waiver, GateWaiver):
            require(
                waiver.waived_by == "human"
                and waiver.project_id == task.project_id
                and waiver.task_id == task.task_id,
                "invalid_waiver",
                "Waivers require a scoped human audit record",
            )
            waived.add(waiver.gate_id)
        else:
            require(
                waiver.event_type == "gate.waived"
                and waiver.actor_type == "human"
                and waiver.project_id == task.project_id
                and waiver.task_id == task.task_id,
                "invalid_waiver",
                "Waivers require a scoped human audit event",
            )
            # Legacy foundation event: correlation_id identifies the gate.
            waived.add(waiver.correlation_id)
    for gate in task.required_evaluations:
        require(
            gate in waived
            or (
                gate in latest
                and latest[gate].result == "passed"
                and latest[gate].authority != "advisory"
            ),
            "quality_gate_failed",
            gate,
        )
    return True


def provider_admission(
    provider: Provider,
    policy: Policy,
    *,
    predicted_cents: int | None,
    spent_cents: int,
    reserved_cents: int,
    now: datetime,
    human_approved: bool = False,
) -> Literal["allowed", "needs_human"]:
    require(provider.state == "ACTIVE", "provider_disabled", provider.provider_id)
    for amount in (spent_cents, reserved_cents):
        require(type(amount) is int and amount >= 0, "invalid_cost", "Ledger costs must be cents")
    require(
        predicted_cents is not None and type(predicted_cents) is int and predicted_cents >= 0,
        "unknown_cost",
        "An upper-bound cost estimate is required",
    )
    assert predicted_cents is not None
    if provider.billing != "paid":
        require(predicted_cents == 0, "invalid_cost", "Non-paid paths cannot bill externally")
        return "allowed"
    require(isinstance(provider.cap, VerifiedCap), "disabled_uncapped", provider.provider_id)
    assert isinstance(provider.cap, VerifiedCap)
    require(now.tzinfo is not None, "invalid_time", "Use a timezone-aware clock")
    verified = datetime.fromisoformat(provider.cap.verified_at.replace("Z", "+00:00"))
    expires = datetime.fromisoformat(provider.cap.expires_at.replace("Z", "+00:00"))
    require(
        verified <= now.astimezone(UTC) < expires, "cap_verification_expired", provider.provider_id
    )
    require(
        spent_cents + reserved_cents + predicted_cents <= policy.monthly_external_budget_cents,
        "monthly_budget_exceeded",
        "Approval cannot bypass the configured budget",
    )
    require(
        predicted_cents <= provider.cap.amount_cents, "provider_cap_exceeded", provider.provider_id
    )
    if predicted_cents >= policy.approval_threshold_cents and not human_approved:
        return "needs_human"
    return "allowed"


def recovery_action(
    *, progress: bool, specialist_intervened: bool, further_nonprogress_failures: int
) -> str:
    require(further_nonprogress_failures >= 0, "invalid_failure_count", "Count cannot be negative")
    if progress:
        return "continue"
    if not specialist_intervened:
        return "change_strategy_or_find_specialist"
    if further_nonprogress_failures >= 3:
        return "escalate_to_oren"
    return "change_strategy"


TRANSITIONS: dict[TaskState, set[TaskState]] = {
    "PROPOSED": {"QUEUED"},
    "QUEUED": {"READY"},
    "READY": {"RUNNING"},
    "RUNNING": {"BLOCKED", "REVIEW", "NEEDS_HUMAN"},
    "BLOCKED": {"RETRY", "NEEDS_HUMAN"},
    "REVIEW": {"FAILED", "PASSED", "NEEDS_HUMAN"},
    "FAILED": {"RETRY", "NEEDS_HUMAN"},
    "RETRY": {"READY"},
    "PASSED": {"INTEGRATE"},
    "INTEGRATE": {"COMPLETE", "FAILED"},
    "NEEDS_HUMAN": {"QUEUED", "RETRY"},
    "COMPLETE": set(),
    "CANCELLED": set(),
    "SUPERSEDED": set(),
}


def validate_transition(before: TaskState, after: TaskState, actor: Actor) -> None:
    authorize(actor, "complete" if after == "COMPLETE" else "reprioritize")
    terminal = {"COMPLETE", "CANCELLED", "SUPERSEDED"}
    allowed = TRANSITIONS[before] | (
        {"CANCELLED", "SUPERSEDED"} if before not in terminal else set()
    )
    require(after in allowed, "invalid_task_transition", f"{before} -> {after}")


def validate_decision(decision: Decision) -> None:
    require(
        decision.selected_option in decision.options,
        "invalid_decision_option",
        decision.selected_option,
    )
