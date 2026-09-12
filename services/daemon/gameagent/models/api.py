"""Studio/daemon wire contracts, exported with the project protocol."""

from typing import Annotated, Literal

from pydantic import Field, SecretStr

from gameagent.models.contracts import (
    AgentRegistrySnapshot,
    BudgetReservation,
    ContextPackage,
    Count,
    EngineAdapter,
    Evaluation,
    Event,
    Evidence,
    ExperienceLesson,
    ExperienceObservation,
    ExpertisePack,
    ExpertisePackRef,
    FreshnessClass,
    GateWaiver,
    GlobalExperience,
    GMRecord,
    Identifier,
    InboxDecision,
    KnowledgeMethod,
    KnowledgePacket,
    LocalHardwareInventory,
    LocalModelInventory,
    LocalModelRecommendation,
    ModelBenchmark,
    ModelRoutingRecord,
    PackAudition,
    PackIdentifier,
    PackLifecycleRecord,
    PackReview,
    PaidInvocationRecord,
    PlanDraft,
    Policy,
    ProductionDomainDefinition,
    ProductionDomainInspection,
    ProductionPlan,
    Project,
    ProjectIntelligence,
    ProjectOnboarding,
    Provider,
    QAGateDefinition,
    QAReport,
    ReconciliationRecord,
    RecruitmentRecord,
    SourceRef,
    SpendApproval,
    TaskContract,
    Text,
    Timestamp,
    ToolDefinition,
    Value,
    Version,
    WorkerRecord,
    WorkspaceFingerprint,
    WorldResearch,
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
    waivers: list[GateWaiver] = Field(default_factory=list)
    recruitments: list[RecruitmentRecord] = Field(default_factory=list)
    model_benchmarks: list[ModelBenchmark] = Field(default_factory=list)
    model_routing_records: list[ModelRoutingRecord] = Field(default_factory=list)
    providers: list[Provider] = Field(default_factory=list)
    spend_approvals: list[SpendApproval] = Field(default_factory=list)
    budget_reservations: list[BudgetReservation] = Field(default_factory=list)
    paid_invocations: list[PaidInvocationRecord] = Field(default_factory=list)
    production_domain_inspections: list[ProductionDomainInspection] = Field(default_factory=list)
    onboarding: ProjectOnboarding | None = None
    experience_observations: list[ExperienceObservation] = Field(default_factory=list)
    experience_lessons: list[ExperienceLesson] = Field(default_factory=list)
    research_records: list[WorldResearch] = Field(default_factory=list)


class ResearchCommand(Value):
    task_id: Identifier
    requirement: Text
    url: Text
    freshness_class: FreshnessClass = "version_sensitive"


class LessonReviewCommand(Value):
    lesson_id: Identifier
    decision: Literal["validated", "rejected", "expired", "superseded"]
    detail: Text


class LessonPromotionCommand(Value):
    lesson_id: Identifier
    statement: Text
    applicability: Text
    limitations: Annotated[list[Text], Field(min_length=1)]
    scope: Literal["global", "domain", "engine"]
    scope_constraint: Identifier | None = None
    privacy_checked: Literal[True]
    generalization_reviewed: Literal[True]


class ExpertiseBaselineStatus(Value):
    pack_id: PackIdentifier
    state: Literal["missing", "draft", "trusted", "unavailable"]
    version: Version | None = None


class KnowledgeCatalog(Value):
    packs: list[ExpertisePack]
    baseline: list[ExpertiseBaselineStatus] = Field(default_factory=list)
    candidates: list[ExpertisePack] = Field(default_factory=list)
    auditions: list[PackAudition] = Field(default_factory=list)
    reviews: list[PackReview] = Field(default_factory=list)
    maintenance_flags: list[Text] = Field(default_factory=list)
    global_experience: list[GlobalExperience] = Field(default_factory=list)
    lifecycle: list[PackLifecycleRecord] = Field(default_factory=list)


class PackLifecycleCommand(Value):
    pack: ExpertisePackRef
    state: Literal["active", "deprecated", "disputed", "expired"]
    reason: Text


class PackCandidateCommand(Value):
    pack: ExpertisePack


class PackBuildCommand(Value):
    task_id: Identifier
    pack_id: Annotated[str, Field(pattern=r"^[a-z0-9][a-z0-9-]*$")]
    version: Annotated[str, Field(pattern=r"^\d+\.\d+\.\d+$")]


class PackAutomatedAuditionCommand(Value):
    pack: ExpertisePackRef
    benchmark_id: Identifier


class PackAuditionCommand(Value):
    pack: ExpertisePackRef
    benchmark_id: Identifier
    baseline_score: Annotated[float, Field(ge=0, le=1)]
    candidate_score: Annotated[float, Field(ge=0, le=1)]
    evidence_text: Annotated[str, Field(min_length=10, max_length=100_000)]
    detail: Text


class PackReviewCommand(Value):
    pack: ExpertisePackRef
    decision: Literal["approved", "rejected"]
    provenance_checked: bool
    privacy_checked: bool
    licensing_checked: bool
    contradictions_checked: bool
    detail: Text


class KnowledgePerformanceSummary(Value):
    subject: Text
    task_count: Count
    passed_count: Count
    failed_count: Count
    inconclusive_count: Count
    interpretation: Literal["observed_correlation_not_causation"] = (
        "observed_correlation_not_causation"
    )


class AgentKnowledgeProfile(Value):
    agent_id: Identifier
    qualification_state: Literal["expertise_available", "missing_required_expertise"]
    required_pack_ids: list[Identifier]
    resolved_packs: list[ExpertisePackRef]
    methods: list[KnowledgeMethod]
    packet: KnowledgePacket
    recorded_packets: list[KnowledgePacket] = Field(default_factory=list)
    method_performance: list[KnowledgePerformanceSummary] = Field(default_factory=list)
    pack_performance: list[KnowledgePerformanceSummary] = Field(default_factory=list)


class AgentKnowledgeCatalog(Value):
    profiles: list[AgentKnowledgeProfile]


class KnowledgeMaintenanceReport(Value):
    run_id: Identifier
    state: Literal["passed", "attention"]
    rebuilt_full_text_index: bool
    stale_sources: list[Text] = Field(default_factory=list)
    broken_sources: list[Text] = Field(default_factory=list)
    benchmark_regressions: list[Text] = Field(default_factory=list)
    contradiction_candidates: list[Text] = Field(default_factory=list)
    deprecated_versions: list[Text] = Field(default_factory=list)
    ran_at: Timestamp


class LearningMaintenanceStatus(Value):
    enabled: bool
    state: Literal["disabled", "idle", "waiting_for_idle", "running", "failed"]
    last_started_at: Timestamp | None = None
    last_completed_at: Timestamp | None = None
    detail: Text | None = None
    knowledge_report: KnowledgeMaintenanceReport | None = None


class ProductionDomainCatalog(Value):
    domains: list[ProductionDomainDefinition]
    tools: list[ToolDefinition]
    inspections: list[ProductionDomainInspection]


class ProductionDomainRunCommand(Value):
    request_id: Identifier
    task_id: Identifier
    domain_id: Identifier


class ProviderConfigureCommand(Value):
    request_id: Identifier
    provider: Provider


class ProviderDisableCommand(Value):
    request_id: Identifier
    provider_id: Identifier
    reason: Text


class ProviderCredentialCommand(Value):
    provider_id: Identifier
    secret: SecretStr


class ProviderCredentialStatus(Value):
    provider_id: Identifier
    configured: bool


class SpendApprovalCommand(Value):
    request_id: Identifier
    provider_id: Identifier
    invocation_request_id: Identifier
    amount_cents: Annotated[int, Field(ge=0, strict=True)]
    expires_at: Timestamp


class ProviderInvokeCommand(Value):
    request_id: Identifier
    provider_id: Identifier
    prompt: Text
    task_id: Identifier | None = None
    max_output_tokens: Annotated[int, Field(gt=0, le=131072, strict=True)] = 4096


class ProviderInvocationResult(Value):
    record: PaidInvocationRecord
    output: Text | None = None


class ProviderStatus(Value):
    provider: Provider
    credential_configured: bool
    adapter_available: bool


class BudgetLedger(Value):
    month: Annotated[str, Field(pattern=r"^\d{4}-\d{2}$")]
    budget_cents: Annotated[int, Field(ge=0, strict=True)]
    settled_cents: Annotated[int, Field(ge=0, strict=True)]
    reserved_cents: Annotated[int, Field(ge=0, strict=True)]
    available_cents: Annotated[int, Field(ge=0, strict=True)]


class ProviderRegistry(Value):
    providers: list[ProviderStatus]
    ledger: BudgetLedger
    approvals: list[SpendApproval]
    reservations: list[BudgetReservation]
    invocations: list[PaidInvocationRecord]


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
    onboarding: ProjectOnboarding | None = None


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


class RecruitmentCommand(Value):
    request_id: Identifier
    task_id: Identifier


class QARunCommand(Value):
    request_id: Identifier
    task_id: Identifier


class HumanReviewCommand(Value):
    request_id: Identifier
    task_id: Identifier
    gate_id: Identifier
    verdict: Literal["approved", "rejected", "observation"]
    summary: Text
    supporting_evidence_ids: list[Identifier] = Field(default_factory=list)


class GateWaiverCommand(Value):
    request_id: Identifier
    task_id: Identifier
    gate_id: Identifier
    reason: Text


class ModelEnvironment(Value):
    hardware: LocalHardwareInventory
    models: LocalModelInventory


class ModelBenchmarkCommand(Value):
    request_id: Identifier
    task_id: Identifier
    model_name: Text | None = None


class ModelRecommendationCommand(Value):
    request_id: Identifier
    task_id: Identifier


class ModelRouteCommand(Value):
    request_id: Identifier
    task_id: Identifier
    urgency: Literal["low", "normal", "high"] = "normal"


class EventPage(Value):
    events: list[Event]
    cursor: Annotated[int, Field(ge=0)]
    has_more: bool


class StreamMessage(EventPage):
    type: Literal["events"] = "events"


class ApiCatalog(Value):
    pack_automated_audition_command: PackAutomatedAuditionCommand
    pack_lifecycle_command: PackLifecycleCommand
    pack_build_command: PackBuildCommand
    lesson_promotion_command: LessonPromotionCommand
    research_command: ResearchCommand
    pack_candidate_command: PackCandidateCommand
    pack_audition_command: PackAuditionCommand
    pack_review_command: PackReviewCommand
    lesson_review_command: LessonReviewCommand
    agent_registry: AgentRegistrySnapshot
    knowledge_catalog: KnowledgeCatalog
    agent_knowledge_catalog: AgentKnowledgeCatalog
    knowledge_maintenance_report: KnowledgeMaintenanceReport
    learning_maintenance_status: LearningMaintenanceStatus
    recruitment_command: RecruitmentCommand
    qa_gates: list[QAGateDefinition]
    qa_report: QAReport
    qa_run_command: QARunCommand
    human_review_command: HumanReviewCommand
    gate_waiver_command: GateWaiverCommand
    model_environment: ModelEnvironment
    model_benchmark_command: ModelBenchmarkCommand
    model_benchmark: ModelBenchmark
    model_recommendation_command: ModelRecommendationCommand
    local_model_recommendation: LocalModelRecommendation
    model_route_command: ModelRouteCommand
    model_routing: ModelRoutingRecord
    provider_registry: ProviderRegistry
    provider_configure_command: ProviderConfigureCommand
    provider_disable_command: ProviderDisableCommand
    provider_credential_command: ProviderCredentialCommand
    provider_credential_status: ProviderCredentialStatus
    spend_approval_command: SpendApprovalCommand
    provider_invoke_command: ProviderInvokeCommand
    provider_invocation_result: ProviderInvocationResult
    production_domain_catalog: ProductionDomainCatalog
    production_domain_run_command: ProductionDomainRunCommand
    production_domain_inspection: ProductionDomainInspection
    project_onboarding: ProjectOnboarding
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
