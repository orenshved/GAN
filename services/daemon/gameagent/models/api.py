"""Studio/daemon wire contracts, exported with the project protocol."""

from typing import Annotated, Literal

from pydantic import Field

from gameagent.models.contracts import (
    ContextPackage,
    EngineAdapter,
    Evaluation,
    Event,
    Evidence,
    GMRecord,
    Identifier,
    InboxDecision,
    PlanDraft,
    Policy,
    ProductionPlan,
    Project,
    ProjectIntelligence,
    ReconciliationRecord,
    SourceRef,
    TaskContract,
    Text,
    Timestamp,
    Value,
    WorkerRecord,
    WorkspaceFingerprint,
)


class TaskProposal(Value):
    request_id: Identifier
    title: Text
    objective: Text
    required_capabilities: Annotated[list[Identifier], Field(min_length=1)]
    deliverables: Annotated[list[Text], Field(min_length=1)]
    dependency_ids: list[Identifier] = Field(default_factory=list)


class PolicyCommand(Value):
    request_id: Identifier
    expected_cursor: Annotated[int, Field(ge=0)]
    policy: Policy


class TaskStartCommand(Value):
    request_id: Identifier
    task_id: Identifier | None = None
    title: Text | None = None
    objective: Text | None = None
    required_capabilities: list[Identifier] = Field(default_factory=list)
    deliverables: list[Text] = Field(default_factory=list)


class TaskProgressCommand(Value):
    request_id: Identifier
    task_id: Identifier
    detail: Text


class ReconcileCommand(Value):
    request_id: Identifier
    change_id: Identifier
    task_id: Identifier | None = None
    detail: Text


class ProjectSnapshot(Value):
    project: Project
    policy: Policy
    tasks: list[TaskContract]
    cursor: Annotated[int, Field(ge=0)]
    history_digest: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
    workers: list[WorkerRecord] = Field(default_factory=list)
    workspace: WorkspaceFingerprint | None = None
    reconciliations: list[ReconciliationRecord] = Field(default_factory=list)
    requires_reconciliation: bool = False
    gm: GMRecord | None = None
    plans: list[ProductionPlan] = Field(default_factory=list)
    decisions: list[InboxDecision] = Field(default_factory=list)
    intelligence: ProjectIntelligence | None = None
    evidence: list[Evidence] = Field(default_factory=list)
    evaluations: list[Evaluation] = Field(default_factory=list)


class IntelligenceRefreshCommand(Value):
    request_id: Identifier


class ContextCommand(Value):
    task_id: Identifier


class ObjectiveCommand(Value):
    request_id: Identifier
    objective: Text


class DecisionCommand(Value):
    request_id: Identifier
    decision_id: Identifier
    selected_option: Text
    rationale: Text


class ProjectSummary(Value):
    project_id: Identifier
    name: Text
    root: Text
    engine: Text | None = None
    stage: Text


class ProjectCatalog(Value):
    projects: list[ProjectSummary]
    active_project_id: Identifier


class ProjectImport(Value):
    path: Text


class ProjectSelection(Value):
    project_id: Identifier


class ProjectRemoval(Value):
    project_id: Identifier


class EngineNodeInspection(Value):
    scene: Text
    path: Text
    node_type: Identifier


class EngineProjectInspection(Value):
    project_id: Identifier
    task_id: Identifier
    adapter: EngineAdapter
    project_path: Text
    engine_version: Text
    main_scene: Text
    ui_nodes: list[EngineNodeInspection]
    approved_assets: list[SourceRef]
    inspected_at: Timestamp


class RuntimeCaptureCommand(Value):
    request_id: Identifier
    task_id: Identifier
    node_path: Text


class RuntimeCaptureResult(Value):
    inspection: EngineProjectInspection
    evidence: Evidence
    evaluation: Evaluation
    log: SourceRef


class WorkerCommand(Value):
    task_id: Identifier
    worker_id: Identifier | None = None


class EventPage(Value):
    events: list[Event]
    cursor: Annotated[int, Field(ge=0)]
    has_more: bool


class StreamMessage(EventPage):
    type: Literal["events"] = "events"


class ApiCatalog(Value):
    plan_draft: PlanDraft
    objective_command: ObjectiveCommand
    decision_command: DecisionCommand
    intelligence_refresh_command: IntelligenceRefreshCommand
    context_command: ContextCommand
    context_package: ContextPackage
    project_catalog: ProjectCatalog
    project_import: ProjectImport
    project_removal: ProjectRemoval
    project_selection: ProjectSelection
    engine_project_inspection: EngineProjectInspection
    runtime_capture_command: RuntimeCaptureCommand
    runtime_capture_result: RuntimeCaptureResult
    worker_command: WorkerCommand
    snapshot: ProjectSnapshot
    proposal: TaskProposal
    policy_command: PolicyCommand
    task_start: TaskStartCommand
    task_progress: TaskProgressCommand
    reconcile: ReconcileCommand
    event_page: EventPage
    stream_message: StreamMessage
