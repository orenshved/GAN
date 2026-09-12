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
PackIdentifier = Annotated[str, StringConstraints(pattern=r"^[a-z0-9][a-z0-9-]*$")]
Version = Annotated[str, StringConstraints(pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")]
Timestamp = Annotated[
    str,
    StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$"),
    Field(json_schema_extra={"format": "date-time"}),
    AfterValidator(valid_calendar_timestamp),
]
BudgetMonth = Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{2}$")]
Cents = Annotated[int, Field(ge=0, le=9007199254740991, strict=True)]
Count = Annotated[int, Field(ge=0, strict=True)]
Actor = Literal["human", "gm", "agent", "system", "external"]
EvidenceClass = Literal["deterministic", "measured", "comparative", "heuristic", "human"]
EvaluationAuthority = Literal["advisory", "eligible", "human"]
QADiscipline = Literal[
    "ui",
    "engineering",
    "gameplay",
    "level_design",
    "art",
    "audio",
    "narrative",
    "production",
    "compliance",
    "data",
    "support",
    "security",
]
ModelRoute = Literal[
    "deterministic_tool",
    "local_ollama",
    "codex_authenticated",
    "paid_provider",
    "wait_for_codex",
]
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
    "BLOCKED_KNOWLEDGE",
]
KnowledgePlane = Literal["project", "discipline", "world", "experience"]
FreshnessClass = Literal[
    "stable",
    "slow_changing",
    "version_sensitive",
    "policy_sensitive",
    "live",
]
SourceAuthority = Literal[
    "primary_standard",
    "official_documentation",
    "peer_reviewed",
    "industry_reference",
    "curated_practice",
    "project_source",
    "measured_result",
    "human_judgment",
]
RetrievedKnowledgeKind = Literal[
    "professional_knowledge",
    "project_fact",
    "project_inference",
    "external_fact",
    "observed_result",
    "heuristic",
    "hypothesis",
    "human_judgment",
    "measured_evidence",
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
    related_capability_ids: list[Identifier] = Field(default_factory=list)


class ModelPreferences(Value):
    preferred: Annotated[list[Text], Field(min_length=1)]
    alternatives: list[Text]


class Instructions(Value):
    base: Text
    constraints: list[Text]


class ResourcePolicy(Value):
    local_preferred: bool = True
    max_external_cost_cents: Cents = 0


class ExpertisePackRef(Value):
    pack_id: PackIdentifier
    version: Version


class KnowledgeSource(Contract):
    source_id: Identifier
    title: Text
    author: Text | None = None
    publisher: Text | None = None
    uri: Text
    source_type: Literal[
        "standard",
        "official_documentation",
        "book",
        "paper",
        "article",
        "project_document",
        "measurement",
        "human_review",
    ]
    retrieved_at: Timestamp
    published_at: Timestamp | None = None
    authority: SourceAuthority
    freshness_class: FreshnessClass
    fresh_until: Timestamp | None = None
    license: Text | None = None
    applicable_capability_ids: list[Identifier] = Field(default_factory=list)


class KnowledgeMethod(Contract):
    method_id: Identifier
    title: Text
    purpose: Text
    applicable_capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    steps: Annotated[list[Text], Field(min_length=1)]
    evidence_requirements: Annotated[list[Text], Field(min_length=1)]
    source_ids: Annotated[list[Identifier], Field(min_length=1)]


class ExpertiseKnowledgeItem(Contract):
    item_id: Identifier
    title: Text
    kind: Literal[
        "professional_knowledge",
        "standard",
        "heuristic",
        "anti_pattern",
        "example",
        "benchmark",
    ]
    statement: Text
    domain_ids: Annotated[list[Identifier], Field(min_length=1)]
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    source_ids: Annotated[list[Identifier], Field(min_length=1)]
    method_ids: list[Identifier] = Field(default_factory=list)
    freshness_class: FreshnessClass
    confidence: Annotated[float, Field(ge=0, le=1)]


class ExpertisePack(Contract):
    pack_id: PackIdentifier
    name: Text
    version: Version
    description: Text
    state: Literal["draft", "reviewed", "active", "deprecated"]
    domain_ids: Annotated[list[Identifier], Field(min_length=1)]
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    sources: Annotated[list[KnowledgeSource], Field(min_length=1)]
    methods: Annotated[list[KnowledgeMethod], Field(min_length=1)]
    items: Annotated[list[ExpertiseKnowledgeItem], Field(min_length=1)]
    evaluation_ids: Annotated[list[Identifier], Field(min_length=1)]
    required_tool_ids: list[Identifier] = Field(default_factory=list)
    created_at: Timestamp
    reviewed_at: Timestamp | None = None
    supersedes_version: Version | None = None


class ExpertiseBenchmarkScenario(Contract):
    benchmark_id: Identifier
    pack_id: PackIdentifier
    applies_to_versions: Annotated[list[Version], Field(min_length=1)]
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    scenario: Annotated[str, Field(min_length=10, max_length=8000)]
    discriminates: Text
    expected_specialist_findings: Annotated[list[Text], Field(min_length=1, max_length=20)]
    expected_uncertainty: list[Text] = Field(default_factory=list)
    acceptable_source_ids: list[Identifier] = Field(default_factory=list)
    scoring_notes: Text


class ExperienceObservation(Contract):
    observation_id: Identifier
    project_id: Identifier
    task_id: Identifier
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    conclusion: Text
    state: Literal["observed", "proposed", "reviewed", "promoted", "rejected"]
    scope: Literal["project_private", "global_candidate"] = "project_private"
    evidence_ids: Annotated[list[Identifier], Field(min_length=1)]
    source: SourceRef
    confidence: Annotated[float, Field(ge=0, le=1)]
    created_at: Timestamp
    agent_id: Identifier | None = None
    method_ids: list[Identifier] = Field(default_factory=list)
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    outcome: Literal["passed", "failed", "inconclusive"] = "inconclusive"
    evaluation_id: Identifier | None = None
    context_tags: list[Text] = Field(default_factory=list)


class PackAudition(Contract):
    audition_id: Identifier
    pack: ExpertisePackRef
    candidate_sha256: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
    benchmark_id: Identifier
    baseline_score: Annotated[float, Field(ge=0, le=1)]
    candidate_score: Annotated[float, Field(ge=0, le=1)]
    evidence: SourceRef
    detail: Text
    reviewer_id: Literal["human", "expertise-curator"] = "human"
    recorded_at: Timestamp
    evidence_class: Literal["human", "heuristic"] = "human"


class PackBenchmarkResponse(Value):
    findings: Annotated[list[Text], Field(min_length=1)]
    uncertainty: list[Text]
    source_ids: list[Identifier]


class PackBenchmarkJudgment(Value):
    baseline_score: Annotated[float, Field(ge=0, le=1)]
    candidate_score: Annotated[float, Field(ge=0, le=1)]
    rationale: Text
    critical_issues: list[Text]


class PackReview(Contract):
    pack: ExpertisePackRef
    candidate_sha256: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
    decision: Literal["approved", "rejected"]
    provenance_checked: bool
    privacy_checked: bool
    licensing_checked: bool
    contradictions_checked: bool
    detail: Text
    reviewer_id: Literal["human"] = "human"
    reviewed_at: Timestamp


class PackLifecycleRecord(Contract):
    record_id: Identifier
    pack: ExpertisePackRef
    state: Literal["active", "deprecated", "disputed", "expired"]
    reason: Text
    reviewer_id: Literal["human"] = "human"
    recorded_at: Timestamp


class WorldResearch(Contract):
    research_id: Identifier
    project_id: Identifier
    task_id: Identifier
    requirement: Text
    url: Text
    state: Literal["available", "blocked", "failed"]
    detail: Text
    source: KnowledgeSource | None = None
    artifact: SourceRef | None = None
    excerpt: Text | None = None
    researched_at: Timestamp


class ExperienceLesson(Contract):
    lesson_id: Identifier
    project_id: Identifier
    observation_ids: Annotated[list[Identifier], Field(min_length=1)]
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    statement: Text
    applicability: Text
    limitations: Annotated[list[Text], Field(min_length=1)]
    state: Literal["candidate", "repeated", "validated", "rejected", "expired", "superseded"]
    scope: Literal["project", "user_taste", "domain", "engine", "global"] = "project"
    proposer_id: Identifier
    reviewer_id: Identifier | None = None
    review_detail: Text | None = None
    created_at: Timestamp
    reviewed_at: Timestamp | None = None
    confidence: Annotated[float, Field(ge=0, le=1)]


class GlobalExperience(Contract):
    lesson_id: Identifier
    statement: Text
    applicability: Text
    limitations: Annotated[list[Text], Field(min_length=1)]
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    scope: Literal["global", "domain", "engine"]
    scope_constraint: Identifier | None = None
    evidence_digests: Annotated[
        list[Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]], Field(min_length=1)
    ]
    confidence: Annotated[float, Field(ge=0, le=1)]
    reviewer_id: Literal["human"] = "human"
    reviewed_at: Timestamp


class RetrievedKnowledge(Value):
    retrieval_id: Identifier
    plane: KnowledgePlane
    kind: RetrievedKnowledgeKind
    statement: Text
    source_ids: list[Identifier] = Field(default_factory=list)
    project_knowledge_id: Identifier | None = None
    pack: ExpertisePackRef | None = None
    method_ids: list[Identifier] = Field(default_factory=list)
    authority: SourceAuthority
    freshness_class: FreshnessClass
    confidence: Annotated[float, Field(ge=0, le=1)]
    relevance: Annotated[float, Field(ge=0, le=1)]
    selection_reason: Text


class KnowledgePacket(Contract):
    packet_id: Identifier
    project_id: Identifier
    task_id: Identifier
    agent_id: Identifier
    assembled_at: Timestamp
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    selected_method_ids: list[Identifier] = Field(default_factory=list)
    methods: list[KnowledgeMethod] = Field(default_factory=list)
    items: list[RetrievedKnowledge] = Field(default_factory=list)
    sources: list[KnowledgeSource] = Field(default_factory=list)
    project_sources: list[SourceRef] = Field(default_factory=list)
    missing_knowledge_flags: list[Text] = Field(default_factory=list)
    stale_knowledge_flags: list[Text] = Field(default_factory=list)
    project_intelligence_digest: Annotated[str | None, Field(pattern=r"^[a-f0-9]{64}$")] = None
    context_package_id: Identifier | None = None


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
    required_expertise_pack_ids: list[PackIdentifier] = Field(default_factory=list)
    optional_expertise_pack_ids: list[PackIdentifier] = Field(default_factory=list)
    allowed_method_ids: list[Identifier] = Field(default_factory=list)
    probationary: bool = True
    # Project context and conversation memory are intentionally not fields here.


class CapabilityPerformance(Value):
    capability_id: Identifier
    task_count: Count = 0
    passed_count: Count = 0
    failed_count: Count = 0
    human_rejection_count: Count = 0
    revision_count: Count = 0
    total_cost_cents: Cents = 0
    total_latency_ms: Count = 0


class AgentRegistryEntry(Contract):
    agent: AgentDefinition
    lifecycle: Literal["builtin", "probation", "active", "demoted", "retired"]
    qa_decision_role: Literal["advisory", "eligible"]
    audition_ids: list[Identifier] = Field(default_factory=list)
    recruited_at: Timestamp | None = None
    performance: list[CapabilityPerformance] = Field(default_factory=list)


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
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    knowledge_packet_id: Identifier | None = None


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


class CapabilityGap(Contract):
    gap_id: Identifier
    project_id: Identifier
    task_id: Identifier
    missing_capabilities: Annotated[list[Identifier], Field(min_length=1)]
    reason: Text
    detected_at: Timestamp


class RecruitmentDiagnosis(Value):
    problem: Literal[
        "no_agent",
        "missing_expertise_pack",
        "missing_tool",
        "stale_knowledge",
        "performance_failure",
        "model_insufficient",
        "none",
    ]
    action: Literal[
        "create_agent",
        "attach_or_build_pack",
        "install_or_authorize_tool",
        "refresh_knowledge",
        "requalify_agent",
        "change_model",
        "reuse_agent",
    ]
    agent_id: Identifier | None = None
    required_pack_ids: list[PackIdentifier] = Field(default_factory=list)
    missing_pack_ids: list[PackIdentifier] = Field(default_factory=list)
    stale_pack_ids: list[PackIdentifier] = Field(default_factory=list)
    missing_tool_ids: list[Identifier] = Field(default_factory=list)
    detail: Text


class ToolDiscovery(Value):
    tool_id: Identifier
    capability_ids: list[Identifier]
    decision: Literal["trusted", "needs_approval", "forbidden", "unavailable"]
    detail: Text


class AuditionTestCase(Value):
    capability_id: Identifier
    procedure: Text
    expected_result: Text
    evidence_class: EvidenceClass


class AuditionSubmission(Value):
    summary: Text
    test_cases: Annotated[list[AuditionTestCase], Field(min_length=3)]
    requested_tool_ids: list[Identifier] = Field(default_factory=list)
    risks: Annotated[list[Text], Field(min_length=1)]


class AuditionDimension(Value):
    dimension: Literal[
        "technical_correctness",
        "output_compliance",
        "quality",
        "reliability",
        "style_adherence",
        "cost_latency",
        "security_tool_behavior",
    ]
    result: Literal["passed", "failed"]
    detail: Text


class AuditionReview(Value):
    dimensions: Annotated[list[AuditionDimension], Field(min_length=7, max_length=7)]
    recommendation: Literal["probation", "reject"]
    rationale: Text


class AgentAudition(Contract):
    audition_id: Identifier
    candidate_id: Identifier
    sandbox: Literal["read_only"] = "read_only"
    representative_objective: Text
    submission: AuditionSubmission
    review: AuditionReview
    result: Literal["passed", "failed"]
    evaluated_at: Timestamp


class RecruitmentRecord(Contract):
    recruitment_id: Identifier
    project_id: Identifier
    task_id: Identifier
    gap: CapabilityGap
    candidate: AgentDefinition
    adjacent_agent_ids: list[Identifier]
    tool_discoveries: list[ToolDiscovery]
    state: Literal[
        "candidate_composed", "remediation_required", "auditioning", "probation", "rejected"
    ]
    diagnosis: RecruitmentDiagnosis
    audition: AgentAudition | None = None
    created_at: Timestamp
    updated_at: Timestamp
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    expertise_snapshot: list[ExpertisePack] = Field(default_factory=list)
    missing_expertise_capabilities: list[Identifier] = Field(default_factory=list)


class AgentRegistrySnapshot(Value):
    entries: list[AgentRegistryEntry]


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


OnboardingReadiness = Literal[
    "READY",
    "READY_WITH_ASSUMPTIONS",
    "NEEDS_INPUT_LATER",
    "NEEDS_INPUT_NOW",
    "BLOCKED_KNOWLEDGE",
]


class DomainReadiness(Value):
    status: OnboardingReadiness
    confidence: Annotated[float, Field(ge=0, le=1)]


class DomainAssumption(Value):
    statement: Text
    confidence: Annotated[float, Field(ge=0, le=1)]
    impact: Text
    expires_when: Text


class DomainUnknown(Value):
    question: Text
    impact: Text
    blocks_current_work: bool


class LeadDomainAssessment(Contract):
    assessment_id: Identifier
    project_id: Identifier
    domain: Identifier
    agent_id: Identifier
    assessed_at: Timestamp
    readiness: DomainReadiness
    summary: Text
    known_facts: list[Text]
    inferred_facts: list[Text]
    evidence: list[SourceRef]
    assumptions: list[DomainAssumption]
    unknowns: list[DomainUnknown]
    recommendations: list[Text]
    risks: list[Text]
    contradictions: list[Text]
    requested_human_inputs: list[Text]
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    knowledge_packet: KnowledgePacket | None = None


class ProjectOnboarding(Contract):
    onboarding_id: Identifier
    project_id: Identifier
    state: Literal["READY", "NEEDS_HUMAN_INPUT", "BLOCKED_KNOWLEDGE", "ACTIVE"]
    started_at: Timestamp
    completed_at: Timestamp
    reconnaissance_summary: Text
    relevant_domains: Annotated[list[Identifier], Field(min_length=1)]
    assessments: Annotated[list[LeadDomainAssessment], Field(min_length=1)]
    reconciliation_summary: Text
    blocking_questions: list[Text]
    deferred_questions: list[Text]


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
    authority: EvaluationAuthority = "eligible"
    rationale: Text
    evaluated_at: Timestamp


class QAGateDefinition(Contract):
    gate_id: Identifier
    version: Version
    discipline: QADiscipline
    title: Text
    description: Text
    claim: Literal["technical", "visual", "subjective", "fun"]
    required_evidence_classes: Annotated[list[EvidenceClass], Field(min_length=1)]
    allowed_producer_types: Annotated[list[Literal["tool", "model", "human"]], Field(min_length=1)]
    requires_runtime_capture: bool = False
    requires_independent_verification: bool = False


class GateWaiver(Contract):
    waiver_id: Identifier
    project_id: Identifier
    task_id: Identifier
    gate_id: Identifier
    reason: Text
    waived_by: Literal["human"]
    waived_at: Timestamp


class QAGateStatus(Value):
    gate: QAGateDefinition
    required: bool
    state: Literal["missing", "passed", "failed", "inconclusive", "advisory", "waived"]
    latest_evaluation_id: Identifier | None = None
    evidence_ids: list[Identifier] = Field(default_factory=list)
    waiver_id: Identifier | None = None
    explanation: Text


class QAReport(Contract):
    report_id: Identifier
    project_id: Identifier
    task_id: Identifier
    generated_at: Timestamp
    completion_state: Literal["passed", "blocked", "human_rejected"]
    required_gate_count: Count
    passed_gate_count: Count
    waived_gate_count: Count
    gates: Annotated[list[QAGateStatus], Field(min_length=1)]
    explanation: Text


class ProductionDomainDefinition(Contract):
    domain_id: Identifier
    version: Version
    title: Text
    description: Text
    capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    tool_ids: Annotated[list[Identifier], Field(min_length=1)]
    gate_ids: Annotated[list[Identifier], Field(min_length=1)]
    accepted_extensions: Annotated[list[Text], Field(min_length=1)]


class ProductionDomainFinding(Value):
    finding_id: Identifier
    severity: Literal["info", "warning", "error"]
    title: Text
    detail: Text
    paths: list[Text] = Field(default_factory=list)


class ProductionDomainInspection(Contract):
    inspection_id: Identifier
    project_id: Identifier
    task_id: Identifier
    domain_id: Identifier
    tool_id: Identifier
    status: Literal["passed", "needs_attention", "not_applicable"]
    inspected_at: Timestamp
    inspected_file_count: Count
    evidence_id: Identifier
    evaluation_id: Identifier
    findings: Annotated[list[ProductionDomainFinding], Field(min_length=1)]


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


class IndexedResource(Value):
    path: Text
    kind: Literal["document", "source", "asset", "configuration"]
    media_type: Text
    size: Count
    sha256: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    excerpt: Text | None = None


class ProjectIntelligence(Contract):
    project_id: Identifier
    indexed_at: Timestamp
    workspace_digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    resources: list[IndexedResource]
    knowledge: list[KnowledgeEntry]


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
    display_name: Text = "External provider"
    purpose: Text = "External model execution"
    billing: Literal["local", "codex_subscription", "paid"]
    state: Literal["ACTIVE", "DISABLED", "DISABLED_UNCAPPED"]
    currency: Literal["USD"] = "USD"
    cap: UnverifiedCap | VerifiedCap
    adapter_id: Identifier | None = None
    credential_id: Identifier | None = None
    # Secrets are resolved through an OS credential service, not these records.


class SpendApproval(Contract):
    approval_id: Identifier
    project_id: Identifier
    provider_id: Identifier
    request_id: Identifier
    amount_cents: Cents
    approved_by: Literal["human"] = "human"
    approved_at: Timestamp
    expires_at: Timestamp


class BudgetReservation(Contract):
    reservation_id: Identifier
    project_id: Identifier
    provider_id: Identifier
    request_id: Identifier
    task_id: Identifier | None = None
    month: BudgetMonth
    predicted_cents: Cents
    actual_cents: Cents | None = None
    state: Literal["reserved", "in_flight", "settled", "released", "uncertain"]
    created_at: Timestamp
    updated_at: Timestamp


class PaidInvocationRecord(Contract):
    invocation_id: Identifier
    project_id: Identifier
    provider_id: Identifier
    reservation_id: Identifier
    request_id: Identifier
    task_id: Identifier | None = None
    state: Literal["succeeded", "failed", "uncertain"]
    predicted_cents: Cents
    actual_cents: Cents | None = None
    detail: Text
    recorded_at: Timestamp


class GraphicsDevice(Value):
    name: Text
    vendor: Text
    memory_bytes: Count | None = None
    driver_version: Text | None = None


class LocalHardwareInventory(Contract):
    machine_id: Identifier
    captured_at: Timestamp
    operating_system: Text
    cpu: Text
    physical_core_count: Count | None = None
    logical_core_count: Count
    ram_bytes: Count | None = None
    graphics: list[GraphicsDevice] = Field(default_factory=list)


class LocalModel(Value):
    name: Text
    digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    size_bytes: Count
    modified_at: Timestamp
    parameter_size: Text | None = None
    quantization_level: Text | None = None
    context_limit: Count | None = None
    modalities: Annotated[list[Literal["text", "image", "audio"]], Field(min_length=1)]
    tool_support: bool = False
    fits_memory: bool


class LocalModelInventory(Contract):
    runtime_id: Literal["ollama"] = "ollama"
    state: Literal["available", "unavailable"]
    version: Text | None = None
    endpoint: Text
    inspected_at: Timestamp
    models: list[LocalModel] = Field(default_factory=list)
    detail: Text


class ModelCatalogCandidate(Value):
    name: Text
    family: Text
    parameter_size: Text
    estimated_size_bytes: Count
    modalities: Annotated[list[Literal["text", "image", "audio"]], Field(min_length=1)]
    tool_support: bool
    thinking_support: bool
    memory_tier: Literal["full_gpu", "hybrid", "system", "unfit"]
    installed: bool
    suitability_score: Annotated[float, Field(ge=0, le=1)]
    source_url: Text
    description: Text
    reason: Text


class LocalModelRecommendation(Contract):
    recommendation_id: Identifier
    project_id: Identifier
    task_id: Identifier
    required_capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    action: Literal["install", "keep_installed", "no_recommendation"]
    recommended_model_name: Text | None = None
    installed: bool = False
    install_command: Text | None = None
    candidate: ModelCatalogCandidate | None = None
    alternatives: list[ModelCatalogCandidate] = Field(default_factory=list)
    catalog_state: Literal["live", "unavailable"]
    catalog_url: Text
    catalog_checked_at: Timestamp
    catalog_sha256: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")] | None = None
    reason: Text


class ModelBenchmark(Contract):
    benchmark_id: Identifier
    project_id: Identifier
    task_id: Identifier
    model_name: Text
    model_digest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    required_capability_ids: Annotated[list[Identifier], Field(min_length=1)]
    prompt_sha256: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
    response: SourceRef | None = None
    output_channel: Literal["response", "thinking"] = "response"
    result: Literal["passed", "failed", "unavailable"]
    contract_score: Annotated[float, Field(ge=0, le=1)]
    latency_ms: Count
    prompt_tokens: Count
    completion_tokens: Count
    summary: Text
    benchmarked_at: Timestamp


class ModelRouteCandidate(Value):
    route: ModelRoute
    provider_id: Identifier | None = None
    model_name: Text | None = None
    viable: bool
    expected_quality: Literal["unknown", "low", "medium", "high"]
    confidence: Annotated[float, Field(ge=0, le=1)]
    expected_runtime_ms: Count | None = None
    expected_external_cost_cents: Cents | None = None
    expected_external_cost_avoided_cents: Cents
    reason: Text


class ModelRoutingRecord(Contract):
    routing_id: Identifier
    project_id: Identifier
    task_id: Identifier
    selected_route: ModelRoute
    selected_provider_id: Identifier | None = None
    selected_model_name: Text | None = None
    candidates: Annotated[list[ModelRouteCandidate], Field(min_length=3)]
    reason: Text
    created_at: Timestamp


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


class ProviderConfiguredPayload(Value):
    request_id: Identifier
    provider: Provider


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
    event_type: Literal[
        "task.created",
        "task.started",
        "task.blocked",
        "task.blocked_knowledge",
        "task.knowledge_resolved",
        "task.completed",
    ]
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


class ProviderConfiguredEvent(EventBase):
    event_type: Literal["provider.configured"]
    payload: ProviderConfiguredPayload


class SpendApprovedEvent(EventBase):
    event_type: Literal["provider.spend_approved"]
    payload: SpendApproval


class BudgetReservationEvent(EventBase):
    event_type: Literal["provider.reservation_updated"]
    payload: BudgetReservation


class PaidInvocationEvent(EventBase):
    event_type: Literal["provider.invocation_recorded"]
    payload: PaidInvocationRecord


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
    professional_reasoning: list[Text] = Field(default_factory=list)
    project_evidence: list[Text] = Field(default_factory=list)
    uncertainty: list[Text] = Field(default_factory=list)
    missing_evidence: list[Text] = Field(default_factory=list)
    qa_plan: list[Text] = Field(default_factory=list)
    source_ids: list[Identifier] = Field(default_factory=list)


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
    expertise_packs: list[ExpertisePackRef] = Field(default_factory=list)
    knowledge_packet_id: Identifier | None = None
    knowledge_packet: KnowledgePacket | None = None
    specialist: AgentDefinition | None = None
    context_package: "ContextPackage | None" = None


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


class ContextSnippet(Value):
    statement: Text
    source: SourceRef
    relevance: Annotated[float, Field(ge=0, le=1)]


class ContextPackage(Contract):
    context_id: Identifier
    project_id: Identifier
    task_id: Identifier
    assembled_at: Timestamp
    task: TaskContract
    knowledge: list[KnowledgeEntry]
    decisions: list[InboxDecision]
    references: list[SourceRef]
    snippets: list[ContextSnippet]
    indexed_resource_count: Count
    selected_resource_count: Count
    history_events_included: Literal[0] = 0


class GMEvent(EventBase):
    event_type: Literal["gm.updated"]
    payload: GMRecord


class PlanEvent(EventBase):
    event_type: Literal["gm.plan_created"]
    payload: ProductionPlan


class InboxEvent(EventBase):
    event_type: Literal["gm.decision_resolved"]
    payload: InboxDecision


class InboxDecisionRequestedEvent(EventBase):
    event_type: Literal["gm.decision_requested"]
    payload: InboxDecision


class IntelligenceEvent(EventBase):
    event_type: Literal["project.intelligence_indexed"]
    payload: ProjectIntelligence


class EvidenceRecordedEvent(EventBase):
    event_type: Literal["evidence.recorded"]
    payload: Evidence


class EvaluationRecordedEvent(EventBase):
    event_type: Literal["evaluation.recorded"]
    payload: Evaluation


class RecruitmentEvent(EventBase):
    event_type: Literal["recruitment.updated"]
    payload: RecruitmentRecord


class GateWaivedEvent(EventBase):
    event_type: Literal["qa.gate_waived"]
    payload: GateWaiver


class ModelBenchmarkEvent(EventBase):
    event_type: Literal["model.benchmark_recorded"]
    payload: ModelBenchmark


class ModelRoutingEvent(EventBase):
    event_type: Literal["model.routing_recorded"]
    payload: ModelRoutingRecord


class ProductionDomainInspectionEvent(EventBase):
    event_type: Literal["production_domain.inspected"]
    payload: ProductionDomainInspection


class OnboardingEventPayload(Value):
    domain: Identifier | None = None
    detail: Text
    assessment: LeadDomainAssessment | None = None
    onboarding: ProjectOnboarding | None = None


class OnboardingEvent(EventBase):
    event_type: Literal[
        "project.reconnaissance_started",
        "project.reconnaissance_completed",
        "domain.assessment_started",
        "domain.assessment_completed",
        "domain.assumption_recorded",
        "domain.input_needed_later",
        "domain.input_needed_now",
        "project.reconciliation_started",
        "project.reconciliation_completed",
        "project.onboarding_completed",
    ]
    payload: OnboardingEventPayload


class ExperienceObservedEvent(EventBase):
    event_type: Literal["experience.observed"]
    payload: ExperienceObservation


class ExperienceLessonEvent(EventBase):
    event_type: Literal["experience.lesson_recorded"]
    payload: ExperienceLesson


class WorldResearchEvent(EventBase):
    event_type: Literal["knowledge.research_recorded"]
    payload: WorldResearch


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
    | ProviderConfiguredEvent
    | SpendApprovedEvent
    | BudgetReservationEvent
    | PaidInvocationEvent
    | CommitEvent
    | ProjectInitializedEvent
    | TaskProposedEvent
    | PolicyUpdatedEvent
    | WorkerEvent
    | GMEvent
    | PlanEvent
    | InboxEvent
    | InboxDecisionRequestedEvent
    | IntelligenceEvent
    | EvidenceRecordedEvent
    | EvaluationRecordedEvent
    | RecruitmentEvent
    | GateWaivedEvent
    | ModelBenchmarkEvent
    | ModelRoutingEvent
    | ProductionDomainInspectionEvent
    | OnboardingEvent
    | ExperienceObservedEvent
    | ExperienceLessonEvent
    | WorldResearchEvent,
    # World research remains project-scoped and cannot promote expertise.
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
    qa_gate: QAGateDefinition | None = None
    qa_report: QAReport | None = None
    production_domain: ProductionDomainDefinition | None = None
    production_domain_inspection: ProductionDomainInspection | None = None
    lead_domain_assessment: LeadDomainAssessment | None = None
    project_onboarding: ProjectOnboarding | None = None
    gate_waiver: GateWaiver | None = None
    decision: Decision | None = None
    knowledge: KnowledgeEntry | None = None
    knowledge_source: KnowledgeSource | None = None
    knowledge_method: KnowledgeMethod | None = None
    expertise_pack: ExpertisePack | None = None
    expertise_benchmark_scenario: ExpertiseBenchmarkScenario | None = None
    experience_observation: ExperienceObservation | None = None
    knowledge_packet: KnowledgePacket | None = None
    project_intelligence: ProjectIntelligence | None = None
    context_package: ContextPackage | None = None
    provider: Provider | None = None
    spend_approval: SpendApproval | None = None
    budget_reservation: BudgetReservation | None = None
    paid_invocation: PaidInvocationRecord | None = None
    hardware_inventory: LocalHardwareInventory | None = None
    local_model_inventory: LocalModelInventory | None = None
    local_model_recommendation: LocalModelRecommendation | None = None
    model_benchmark: ModelBenchmark | None = None
    model_routing: ModelRoutingRecord | None = None
    capability_gap: CapabilityGap | None = None
    agent_registry_entry: AgentRegistryEntry | None = None
    recruitment: RecruitmentRecord | None = None
    event: Event | None = None
