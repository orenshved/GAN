"""Version-one contracts. State-dependent admission lives in constitution.py.

Wire objects forbid unknown fields. Dates use canonical UTC JSON strings so
Python and JSON Schema validators share precisely the same wire shape.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints


def valid_calendar_timestamp(value: str) -> str:
    datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


Text = Annotated[str, StringConstraints(min_length=1, pattern=r"\S")]
Identifier = Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9_.-]*$")]
Version = Annotated[str, StringConstraints(pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")]
Timestamp = Annotated[
    str,
    StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$"),
    Field(json_schema_extra={"format": "date-time"}),
    AfterValidator(valid_calendar_timestamp),
]
Cents = Annotated[int, Field(ge=0, le=9007199254740991, strict=True)]
Count = Annotated[int, Field(ge=0, strict=True)]
Actor = Literal["human", "gm", "agent", "system", "external"]
EvidenceClass = Literal["deterministic", "measured", "comparative", "heuristic", "human"]
TaskState = Literal[
    "PROPOSED",
    "QUEUED",
    "READY",
    "RUNNING",
    "BLOCKED",
    "REVIEW",
    "FAILED",
    "PASSED",
    "RETRY",
    "INTEGRATE",
    "COMPLETE",
    "CANCELLED",
    "SUPERSEDED",
    "NEEDS_HUMAN",
]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)
    schema_version: Literal[1] = 1


class Value(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class EntityRef(Value):
    project_id: Identifier
    kind: Identifier
    entity_id: Identifier


class SourceRef(Value):
    uri: Text
    media_type: Text
    locator: Text | None = None
    sha256: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]


class Permissions(Value):
    read_project: bool = True
    write_task_workspace: bool = False
    execute_commands: bool = False
    network: bool = False
    modify_global_files: bool = False
    install_dependencies: Literal["allow", "ask", "never"] = "ask"
    access_secrets: bool = False
    modify_code: bool = False
    modify_assets: bool = False
    modify_project_settings: bool = False
    git_commit: bool = False
    git_merge: bool = False
    execute_discovered_code: Literal["allow", "ask", "never"] = "ask"


class Capability(Contract):
    capability_id: Identifier
    version: Version
    family: Identifier
    description: Text
    required_inputs: list[Text]
    expected_outputs: Annotated[list[Text], Field(min_length=1)]
    evaluation_requirements: Annotated[list[Identifier], Field(min_length=1)]


class ModelPreferences(Value):
    preferred: Annotated[list[Text], Field(min_length=1)]
    alternatives: list[Text]


class Instructions(Value):
    base: Text
    constraints: list[Text]


class ResourcePolicy(Value):
    local_preferred: bool = True
    max_external_cost_cents: Cents = 0


class AgentDefinition(Contract):
    agent_id: Identifier
    name: Text
    version: Version
    description: Text
    capabilities: Annotated[list[Identifier], Field(min_length=1)]
    instructions: Instructions
    models: ModelPreferences
    allowed_tool_ids: list[Identifier]
    permissions: Permissions
    required_inputs: list[Text]
    output_contract: Text
    required_gates: Annotated[list[Identifier], Field(min_length=1)]
    resource_policy: ResourcePolicy
    probationary: bool = True
    # Project context and conversation memory are intentionally not fields here.


class AgentAssignment(Contract):
    assignment_id: Identifier
    project_id: Identifier
    task_id: Identifier
    agent_id: Identifier
    agent_version: Version
    thread_id: Text | None = None
    working_directory: Text
    sandbox: Literal["read_only", "workspace_write"] = "read_only"
    granted_permissions: Permissions
    assigned_by: Literal["gm"]


class ToolDefinition(Contract):
    tool_id: Identifier
    version: Version
    capabilities: Annotated[list[Identifier], Field(min_length=1)]
    install_state: Literal["missing", "installed", "unhealthy"]
    invocation: Literal["cli", "http", "sdk", "mcp"]
    input_contract: Text
    output_contract: Text
    permissions: Permissions
    health_check: Text
    location: Literal["local", "cloud"]
    cost_policy: ResourcePolicy


class EngineAdapter(Contract):
    adapter_id: Identifier
    version: Version
    engine_type: Identifier
    supported_versions: Text
    capabilities: Annotated[list[Identifier], Field(min_length=1)]
    tool_ids: Annotated[list[Identifier], Field(min_length=1)]


class ProjectIdentity(Value):
    id: Identifier
    name: Text
    description: Text


class Engine(Value):
    type: Identifier
    version: Text


class Direction(Value):
    direction: Text
    references: list[SourceRef]


class Multiplayer(Value):
    type: Identifier
    max_players: Annotated[int, Field(ge=1)]


class Production(Value):
    stage: Identifier
    team_size: Annotated[int, Field(ge=1)]
    current_milestone: Text | None


class Project(Contract):
    project: ProjectIdentity
    medium: Identifier
    engine: Engine | None = None
    rendering: Literal["2d", "2.5d", "3d", "non_applicable"]
    platforms: list[Text]
    input_methods: list[Text]
    multiplayer: Multiplayer
    visual: Direction
    audio: Direction
    production: Production
    constraints: list[Text]
    locked_decision_ids: list[Identifier]


class InitializationFinding(Value):
    kind: Literal["known", "inferred", "missing"]
    field: Identifier
    value: Text | None
    source: Text


class InitializationReport(Contract):
    repository_root: Text
    git_head: Text | None
    git_recent_commits: list[Text]
    inspected_documents: list[Text]
    inspected_assets: list[Text]
    findings: list[InitializationFinding]
    required_capabilities: Annotated[list[Identifier], Field(min_length=1)]


class WorkspaceEntry(Value):
    path: Text
    size: Count
    modified_ns: Count


class WorkspaceFingerprint(Contract):
    captured_at: Timestamp
    git_head: Text | None
    git_status: list[Text] = Field(default_factory=list)
    entries: list[WorkspaceEntry]
    digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]


class ReconciliationRecord(Contract):
    change_id: Identifier
    project_id: Identifier
    detected_at: Timestamp
    paths: Annotated[list[Text], Field(min_length=1)]
    baseline_digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    observed: WorkspaceFingerprint
    git_commits: list[Text] = Field(default_factory=list)
    git_diff_summary: Text | None = None
    artifacts: list[SourceRef] = Field(default_factory=list)
    state: Literal["unresolved", "reconciled"] = "unresolved"
    task_id: Identifier | None = None
    detail: Text | None = None
    reconciled_at: Timestamp | None = None


class Requirements(Value):
    functional: list[Text]
    visual: list[Text]
    technical: list[Text]
    accessibility: list[Text]
    production: list[Text]


class TaskContract(Contract):
    task_id: Identifier
    project_id: Identifier
    title: Text
    objective: Text
    parent_task_id: Identifier | None = None
    priority: Literal["low", "normal", "high", "urgent"] = "normal"
    state: TaskState = "PROPOSED"
    entities: list[EntityRef]
    references: list[SourceRef]
    required_capabilities: Annotated[list[Identifier], Field(min_length=1)]
    requirements: Requirements
    constraints: list[Text]
    deliverables: Annotated[list[Text], Field(min_length=1)]
    dependency_ids: list[Identifier]
    permissions: Permissions
    required_evaluations: Annotated[list[Identifier], Field(min_length=1)]
    escalation_criteria: list[Text]


class Policy(Contract):
    project_id: Identifier
    authority: Literal["ask_first", "recommend_and_proceed", "autonomous_within_policy"] = (
        "recommend_and_proceed"
    )
    proactivity: Literal["reactive", "balanced", "active"] = "balanced"
    currency: Literal["USD"] = "USD"
    monthly_external_budget_cents: Cents = 2500
    approval_threshold_cents: Annotated[int, Field(gt=0, strict=True)] = 100
    require_provider_hard_cap: Literal[True] = True
    require_registration_or_reconciliation: Literal[True] = True
    post_specialist_nonprogress_limit: Literal[3] = 3
    worker_permissions: Permissions = Field(default_factory=Permissions)


class Evidence(Contract):
    evidence_id: Identifier
    project_id: Identifier
    task_id: Identifier
    evidence_class: EvidenceClass
    producer_type: Literal["tool", "model", "human"]
    producer_id: Identifier
    captured_at: Timestamp
    source: SourceRef
    capture_origin: Literal["runtime", "source", "simulation", "human_observation", "model_output"]
    summary: Text


class Evaluation(Contract):
    evaluation_id: Identifier
    project_id: Identifier
    task_id: Identifier
    gate_id: Identifier
    claim: Literal["technical", "visual", "subjective", "fun"]
    result: Literal["passed", "failed", "inconclusive"]
    evidence_ids: Annotated[list[Identifier], Field(min_length=1)]
    evaluator_id: Identifier
    rationale: Text
    evaluated_at: Timestamp


class Decision(Contract):
    decision_id: Identifier
    project_id: Identifier
    task_id: Identifier | None
    title: Text
    reason: Text
    options: Annotated[list[Text], Field(min_length=1)]
    recommendation: Text
    consequences: list[Text]
    urgency: Literal["low", "normal", "urgent"]
    evidence_ids: list[Identifier]
    decided_by: Literal["human"]
    selected_option: Text
    decided_at: Timestamp


class KnowledgeEntry(Contract):
    knowledge_id: Identifier
    project_id: Identifier
    kind: Literal[
        "source_fact",
        "deterministic_consequence",
        "inferred_fact",
        "production_decision",
        "user_decision",
        "technical_constraint",
        "hypothesis",
        "agent_recommendation",
        "evaluation",
    ]
    statement: Text
    source: SourceRef
    confidence: Annotated[float, Field(ge=0, le=1)]
    created_at: Timestamp
    entities: list[EntityRef]
    evidence_ids: list[Identifier]
    supersedes_id: Identifier | None = None


class UnverifiedCap(Value):
    verified: Literal[False]


class VerifiedCap(Value):
    verified: Literal[True]
    amount_cents: Annotated[int, Field(gt=0, strict=True)]
    verification_method: Literal["provider_api", "manual_provider_console", "prepaid_wallet"]
    verified_at: Timestamp
    expires_at: Timestamp
    proof: SourceRef
    provider_side: Literal[True]


class Provider(Contract):
    provider_id: Identifier
    billing: Literal["local", "codex_subscription", "paid"]
    state: Literal["ACTIVE", "DISABLED", "DISABLED_UNCAPPED"]
    currency: Literal["USD"] = "USD"
    cap: UnverifiedCap | VerifiedCap
    # Secrets are resolved through an OS credential service, not these records.


class TaskEventPayload(Value):
    task_id: Identifier
    detail: Text


class AssignmentPayload(Value):
    assignment_id: Identifier
    agent_id: Identifier


class EvaluationPayload(Value):
    evaluation_id: Identifier
    evidence_ids: Annotated[list[Identifier], Field(min_length=1)]


class DecisionPayload(Value):
    decision_id: Identifier
    reason: Text


class ArtifactPayload(Value):
    artifact: SourceRef


class ExternalChangePayload(Value):
    change_id: Identifier
    paths: Annotated[list[Text], Field(min_length=1)]
    baseline_digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    observed: WorkspaceFingerprint
    git_commits: list[Text] = Field(default_factory=list)
    git_diff_summary: Text | None = None


class ReconciliationPayload(Value):
    change_id: Identifier
    paths: Annotated[list[Text], Field(min_length=1)]
    task_id: Identifier
    detail: Text
    fingerprint: WorkspaceFingerprint
    artifacts: list[SourceRef] = Field(default_factory=list)


class SpendPayload(Value):
    provider_id: Identifier
    amount_cents: Cents
    reservation_id: Identifier


class ProviderPayload(Value):
    provider_id: Identifier
    reason: Text


class CommitPayload(Value):
    commit_id: Text
    workspace: Text


class EventBase(Contract):
    event_id: Identifier
    project_id: Identifier
    timestamp: Timestamp
    actor_type: Actor
    actor_id: Identifier
    correlation_id: Identifier
    task_id: Identifier | None
    sequence: Annotated[int, Field(ge=1)]


class TaskEvent(EventBase):
    event_type: Literal["task.created", "task.started", "task.blocked", "task.completed"]
    payload: TaskEventPayload


class AgentEvent(EventBase):
    event_type: Literal["agent.assigned", "agent.failed", "agent.hired"]
    payload: AssignmentPayload


class EvaluationEvent(EventBase):
    event_type: Literal["evaluation.started", "evaluation.failed", "evaluation.passed"]
    payload: EvaluationPayload


class DecisionEvent(EventBase):
    event_type: Literal[
        "decision.requested", "decision.resolved", "gm.challenge_raised", "gate.waived"
    ]
    payload: DecisionPayload


class ArtifactEvent(EventBase):
    event_type: Literal["artifact.created", "artifact.modified"]
    payload: ArtifactPayload


class WorkspaceBaselineEvent(EventBase):
    event_type: Literal["project.baseline_recorded"]
    payload: WorkspaceFingerprint


class ExternalChangeEvent(EventBase):
    event_type: Literal["project.external_change_detected"]
    payload: ExternalChangePayload


class ProjectReconciledEvent(EventBase):
    event_type: Literal["project.reconciled"]
    payload: ReconciliationPayload


class SpendEvent(EventBase):
    event_type: Literal["provider.spend_recorded"]
    payload: SpendPayload


class ProviderEvent(EventBase):
    event_type: Literal["provider.disabled"]
    payload: ProviderPayload


class CommitEvent(EventBase):
    event_type: Literal["git.commit.created"]
    payload: CommitPayload


class ProjectInitializedPayload(Value):
    project: Project
    policy: Policy
    intake: InitializationReport
    workspace: WorkspaceFingerprint | None = None


class ProjectInitializedEvent(EventBase):
    event_type: Literal["project.initialized"]
    payload: ProjectInitializedPayload


class TaskProposedEvent(EventBase):
    event_type: Literal["task.proposed"]
    payload: TaskContract


class PolicyUpdatedEvent(EventBase):
    event_type: Literal["policy.updated"]
    payload: Policy


class WorkerResult(Value):
    summary: Text
    findings: list[Text]
    next_steps: list[Text]


class WorkerRecord(Contract):
    worker_id: Identifier
    project_id: Identifier
    task_id: Identifier
    thread_id: Text
    cwd: Text
    state: Literal["ready", "running", "completed", "failed", "interrupted"]
    turn_id: Text | None = None
    result: WorkerResult | None = None
    detail: Text


class WorkerEvent(EventBase):
    event_type: Literal["worker.updated"]
    payload: WorkerRecord


class PlanStep(Value):
    key: Identifier
    title: Text
    objective: Text
    required_capabilities: Annotated[list[Identifier], Field(min_length=1)]
    deliverables: Annotated[list[Text], Field(min_length=1)]
    dependency_keys: list[Identifier]
    constraints: list[Text]
    required_evaluations: Annotated[list[Identifier], Field(min_length=1)]


class PlanQuestion(Value):
    key: Identifier
    title: Text
    reason: Text
    affected_step_keys: Annotated[list[Identifier], Field(min_length=1)]
    category: Literal[
        "creative_intent",
        "scope",
        "money",
        "irreversible_structure",
        "public_exposure",
        "player_behavior",
        "ambiguity",
    ]
    options: Annotated[list[Text], Field(min_length=2)]
    recommendation: Text
    consequences: list[Text]


class PlanDraft(Value):
    summary: Text
    steps: Annotated[list[PlanStep], Field(min_length=1, max_length=30)]
    questions: list[PlanQuestion]


class GMRecord(Contract):
    project_id: Identifier
    thread_id: Text
    request_id: Identifier
    objective: Text
    state: Literal["ready", "planning", "completed", "failed", "interrupted"]
    detail: Text


class PlanAssignment(Value):
    task_id: Identifier
    agent: AgentDefinition | None
    missing_capabilities: list[Identifier]


class ProductionPlan(Contract):
    plan_id: Identifier
    project_id: Identifier
    objective: Text
    summary: Text
    tasks: Annotated[list[TaskContract], Field(min_length=1)]
    assignments: list[PlanAssignment]
    questions: list[PlanQuestion]
    policy: Policy


class InboxDecision(Contract):
    decision_id: Identifier
    plan_id: Identifier
    project_id: Identifier
    title: Text
    reason: Text
    task_ids: list[Identifier]
    options: Annotated[list[Text], Field(min_length=2)]
    recommendation: Text
    consequences: list[Text]
    selected_option: Text | None = None
    rationale: Text | None = None


class GMEvent(EventBase):
    event_type: Literal["gm.updated"]
    payload: GMRecord


class PlanEvent(EventBase):
    event_type: Literal["gm.plan_created"]
    payload: ProductionPlan


class InboxEvent(EventBase):
    event_type: Literal["gm.decision_resolved"]
    payload: InboxDecision


Event = Annotated[
    TaskEvent
    | AgentEvent
    | EvaluationEvent
    | DecisionEvent
    | ArtifactEvent
    | WorkspaceBaselineEvent
    | ExternalChangeEvent
    | ProjectReconciledEvent
    | SpendEvent
    | ProviderEvent
    | CommitEvent
    | ProjectInitializedEvent
    | TaskProposedEvent
    | PolicyUpdatedEvent
    | WorkerEvent
    | GMEvent
    | PlanEvent
    | InboxEvent,
    Field(discriminator="event_type"),
]


class ProtocolDocument(Value):
    """Discriminated export root; each document remains independently addressable."""

    capability: Capability | None = None
    agent: AgentDefinition | None = None
    assignment: AgentAssignment | None = None
    tool: ToolDefinition | None = None
    engine_adapter: EngineAdapter | None = None
    project: Project | None = None
    task: TaskContract | None = None
    policy: Policy | None = None
    evidence: Evidence | None = None
    evaluation: Evaluation | None = None
    decision: Decision | None = None
    knowledge: KnowledgeEntry | None = None
    provider: Provider | None = None
    event: Event | None = None
