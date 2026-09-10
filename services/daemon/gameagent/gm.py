"""Engine-independent plan construction and deterministic replay admission."""

from gameagent.constitution import require
from gameagent.models.contracts import (
    AgentDefinition,
    InboxDecision,
    Permissions,
    PlanAssignment,
    PlanDraft,
    PlanQuestion,
    Policy,
    ProductionPlan,
    Requirements,
    TaskContract,
)


def match_agent(capabilities: list[str], roster: list[AgentDefinition]) -> PlanAssignment:
    required = set(capabilities)
    candidates = [agent for agent in roster if required <= set(agent.capabilities)]
    selected = (
        min(candidates, key=lambda agent: (len(agent.capabilities), agent.agent_id))
        if candidates
        else None
    )
    return PlanAssignment(
        task_id="pending", agent=selected, missing_capabilities=[] if selected else sorted(required)
    )


def make_plan(
    request_id: str, objective: str, draft: PlanDraft, policy: Policy, roster: list[AgentDefinition]
) -> ProductionPlan:
    plan_id = f"plan-{request_id}"
    keys = [step.key for step in draft.steps]
    require(len(keys) == len(set(keys)), "duplicate_plan_step", plan_id)
    tasks = []
    assignments = []
    for step in draft.steps:
        task = TaskContract(
            task_id=f"{plan_id}-{step.key}",
            project_id=policy.project_id,
            title=step.title,
            objective=step.objective,
            entities=[],
            references=[],
            required_capabilities=step.required_capabilities,
            requirements=Requirements(
                functional=[], visual=[], technical=[], accessibility=[], production=[]
            ),
            constraints=step.constraints,
            deliverables=step.deliverables,
            dependency_ids=[f"{plan_id}-{key}" for key in step.dependency_keys],
            permissions=Permissions(),
            required_evaluations=step.required_evaluations,
            escalation_criteria=["Human decisions must be resolved before execution"],
            state="QUEUED",
        )
        tasks.append(task)
        assignments.append(
            match_agent(step.required_capabilities, roster).model_copy(
                update={"task_id": task.task_id}
            )
        )
    questions = list(draft.questions)
    if policy.authority == "ask_first":
        questions.append(
            PlanQuestion(
                key="authority-approval",
                title="Approve production plan",
                reason="Project authority is Ask First",
                affected_step_keys=keys,
                category="scope",
                options=["Proceed", "Revise plan"],
                recommendation="Proceed",
                consequences=["Proceed permits only the stated task contracts"],
            )
        )
    plan = ProductionPlan(
        plan_id=plan_id,
        project_id=policy.project_id,
        objective=objective,
        summary=draft.summary,
        tasks=tasks,
        assignments=assignments,
        questions=questions,
        policy=policy,
    )
    validate_plan(plan)
    return plan


def validate_plan(plan: ProductionPlan) -> None:
    tasks = {task.task_id: task for task in plan.tasks}
    require(len(tasks) == len(plan.tasks), "duplicate_plan_step", plan.plan_id)
    require(plan.policy.project_id == plan.project_id, "project_scope_mismatch", plan.plan_id)
    for task in plan.tasks:
        require(
            task.project_id == plan.project_id
            and task.state == "QUEUED"
            and task.task_id.startswith(plan.plan_id + "-"),
            "invalid_plan_task",
            task.task_id,
        )
        require(set(task.dependency_ids) <= tasks.keys(), "missing_dependency", task.task_id)
        require(task.permissions == Permissions(), "permission_escalation", task.task_id)
    visited: set[str] = set()
    visiting: set[str] = set()

    def visit(task_id: str) -> None:
        require(task_id not in visiting, "dependency_cycle", task_id)
        if task_id in visited:
            return
        visiting.add(task_id)
        for dependency in tasks[task_id].dependency_ids:
            visit(dependency)
        visiting.remove(task_id)
        visited.add(task_id)

    for task_id in tasks:
        visit(task_id)
    require(
        len(plan.assignments) == len(tasks)
        and {a.task_id for a in plan.assignments} == tasks.keys(),
        "invalid_plan_assignments",
        plan.plan_id,
    )
    for assignment in plan.assignments:
        required = set(tasks[assignment.task_id].required_capabilities)
        require(
            (
                assignment.agent is not None
                and required <= set(assignment.agent.capabilities)
                and not assignment.missing_capabilities
            )
            or (assignment.agent is None and set(assignment.missing_capabilities) == required),
            "capability_gap",
            assignment.task_id,
        )
    require(
        len({q.key for q in plan.questions}) == len(plan.questions),
        "duplicate_decision",
        plan.plan_id,
    )
    for question in plan.questions:
        require(
            question.recommendation in question.options
            and len(set(question.options)) == len(question.options),
            "invalid_decision_option",
            question.key,
        )
        require(
            all(f"{plan.plan_id}-{key}" in tasks for key in question.affected_step_keys),
            "decision_scope_mismatch",
            question.key,
        )


def plan_decisions(plan: ProductionPlan) -> list[InboxDecision]:
    return [
        InboxDecision(
            decision_id=f"{plan.plan_id}-decision-{question.key}",
            plan_id=plan.plan_id,
            project_id=plan.project_id,
            title=question.title,
            reason=question.reason,
            task_ids=[f"{plan.plan_id}-{key}" for key in question.affected_step_keys],
            options=question.options,
            recommendation=question.recommendation,
            consequences=question.consequences,
        )
        for question in plan.questions
    ]


def task_readiness(
    task: TaskContract,
    plan: ProductionPlan,
    decisions: list[InboxDecision],
    tasks: dict[str, TaskContract],
) -> TaskContract:
    if task.state == "BLOCKED_KNOWLEDGE":
        return task
    relevant = [d for d in decisions if task.task_id in d.task_ids]
    assignment = next(a for a in plan.assignments if a.task_id == task.task_id)
    if any(
        d.selected_option is None
        or (
            d.decision_id == f"{plan.plan_id}-decision-authority-approval"
            and d.selected_option != "Proceed"
        )
        for d in relevant
    ):
        state = "NEEDS_HUMAN"
    elif assignment.agent is None:
        state = "BLOCKED"
    elif any(tasks[key].state != "COMPLETE" for key in task.dependency_ids):
        state = "QUEUED"
    else:
        state = "READY"
    return task.model_copy(update={"state": state})
