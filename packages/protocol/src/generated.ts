/* Generated from Pydantic. Run pnpm protocol:generate; do not edit. */

export type AgentId = string;
export type AllowedMethodIds = string[];
export type AllowedToolIds = string[];
/**
 * @minItems 1
 */
export type Capabilities = [string, ...string[]];
export type Description = string;
export type Base = string;
export type Constraints = string[];
export type Alternatives = string[];
/**
 * @minItems 1
 */
export type Preferred = [string, ...string[]];
export type Name = string;
export type OptionalExpertisePackIds = string[];
export type OutputContract = string;
export type AccessSecrets = boolean;
export type ExecuteCommands = boolean;
export type ExecuteDiscoveredCode = "allow" | "ask" | "never";
export type GitCommit = boolean;
export type GitMerge = boolean;
export type InstallDependencies = "allow" | "ask" | "never";
export type ModifyAssets = boolean;
export type ModifyCode = boolean;
export type ModifyGlobalFiles = boolean;
export type ModifyProjectSettings = boolean;
export type Network = boolean;
export type ReadProject = boolean;
export type WriteTaskWorkspace = boolean;
export type Probationary = boolean;
export type RequiredExpertisePackIds = string[];
/**
 * @minItems 1
 */
export type RequiredGates = [string, ...string[]];
export type RequiredInputs = string[];
export type LocalPreferred = boolean;
export type MaxExternalCostCents = number;
export type SchemaVersion = 1;
export type Version = string;
export type AuditionIds = string[];
export type Lifecycle = "builtin" | "probation" | "active" | "demoted" | "retired";
export type CapabilityId = string;
export type FailedCount = number;
export type HumanRejectionCount = number;
export type PassedCount = number;
export type RevisionCount = number;
export type TaskCount = number;
export type TotalCostCents = number;
export type TotalLatencyMs = number;
export type Performance = CapabilityPerformance[];
export type QaDecisionRole = "advisory" | "eligible";
export type RecruitedAt = string | null;
export type SchemaVersion1 = 1;
export type AgentId1 = string;
export type AgentVersion = string;
export type AssignedBy = "gm";
export type AssignmentId = string;
export type PackId = string;
export type Version1 = string;
export type ExpertisePacks = ExpertisePackRef[];
export type KnowledgePacketId = string | null;
export type ProjectId = string;
export type Sandbox = "read_only" | "workspace_write";
export type SchemaVersion2 = 1;
export type TaskId = string;
export type ThreadId = string | null;
export type WorkingDirectory = string;
export type ActualCents = number | null;
export type CreatedAt = string;
export type Month = string;
export type PredictedCents = number;
export type ProjectId1 = string;
export type ProviderId = string;
export type RequestId = string;
export type ReservationId = string;
export type SchemaVersion3 = 1;
export type State = "reserved" | "in_flight" | "settled" | "released" | "uncertain";
export type TaskId1 = string | null;
export type UpdatedAt = string;
export type CapabilityId1 = string;
export type Description1 = string;
/**
 * @minItems 1
 */
export type EvaluationRequirements = [string, ...string[]];
/**
 * @minItems 1
 */
export type ExpectedOutputs = [string, ...string[]];
export type Family = string;
export type RequiredInputs1 = string[];
export type SchemaVersion4 = 1;
export type Version2 = string;
export type DetectedAt = string;
export type GapId = string;
/**
 * @minItems 1
 */
export type MissingCapabilities = [string, ...string[]];
export type ProjectId2 = string;
export type Reason = string;
export type SchemaVersion5 = 1;
export type TaskId2 = string;
export type AssembledAt = string;
export type ContextId = string;
export type Consequences = string[];
export type DecisionId = string;
/**
 * @minItems 2
 */
export type Options = [string, string, ...string[]];
export type PlanId = string;
export type ProjectId3 = string;
export type Rationale = string | null;
export type Reason1 = string;
export type Recommendation = string;
export type SchemaVersion6 = 1;
export type SelectedOption = string | null;
export type TaskIds = string[];
export type Title = string;
export type Decisions = InboxDecision[];
export type HistoryEventsIncluded = 0;
export type IndexedResourceCount = number;
export type Confidence = number;
export type CreatedAt1 = string;
export type EntityId = string;
export type Kind = string;
export type ProjectId4 = string;
export type Entities = EntityRef[];
export type EvidenceIds = string[];
export type Kind1 =
  | "source_fact"
  | "deterministic_consequence"
  | "inferred_fact"
  | "production_decision"
  | "user_decision"
  | "technical_constraint"
  | "hypothesis"
  | "agent_recommendation"
  | "evaluation";
export type KnowledgeId = string;
export type ProjectId5 = string;
export type SchemaVersion7 = 1;
export type Locator = string | null;
export type MediaType = string;
export type Sha256 = string;
export type Uri = string;
export type Statement = string;
export type SupersedesId = string | null;
export type Knowledge = KnowledgeEntry[];
export type ProjectId6 = string;
export type References = SourceRef[];
export type SchemaVersion8 = 1;
export type SelectedResourceCount = number;
export type Relevance = number;
export type Statement1 = string;
export type Snippets = ContextSnippet[];
export type Constraints1 = string[];
/**
 * @minItems 1
 */
export type Deliverables = [string, ...string[]];
export type DependencyIds = string[];
export type Entities1 = EntityRef[];
export type EscalationCriteria = string[];
export type Objective = string;
export type ParentTaskId = string | null;
export type Priority = "low" | "normal" | "high" | "urgent";
export type ProjectId7 = string;
export type References1 = SourceRef[];
/**
 * @minItems 1
 */
export type RequiredCapabilities = [string, ...string[]];
/**
 * @minItems 1
 */
export type RequiredEvaluations = [string, ...string[]];
export type Accessibility = string[];
export type Functional = string[];
export type Production = string[];
export type Technical = string[];
export type Visual = string[];
export type SchemaVersion9 = 1;
export type State1 =
  | "PROPOSED"
  | "QUEUED"
  | "READY"
  | "RUNNING"
  | "BLOCKED"
  | "REVIEW"
  | "FAILED"
  | "PASSED"
  | "RETRY"
  | "INTEGRATE"
  | "COMPLETE"
  | "CANCELLED"
  | "SUPERSEDED"
  | "NEEDS_HUMAN"
  | "BLOCKED_KNOWLEDGE";
export type TaskId3 = string;
export type Title1 = string;
export type TaskId4 = string;
export type Consequences1 = string[];
export type DecidedAt = string;
export type DecidedBy = "human";
export type DecisionId1 = string;
export type EvidenceIds1 = string[];
/**
 * @minItems 1
 */
export type Options1 = [string, ...string[]];
export type ProjectId8 = string;
export type Reason2 = string;
export type Recommendation1 = string;
export type SchemaVersion10 = 1;
export type SelectedOption1 = string;
export type TaskId5 = string | null;
export type Title2 = string;
export type Urgency = "low" | "normal" | "urgent";
export type AdapterId = string;
/**
 * @minItems 1
 */
export type Capabilities1 = [string, ...string[]];
export type EngineType = string;
export type SchemaVersion11 = 1;
export type SupportedVersions = string;
/**
 * @minItems 1
 */
export type ToolIds = [string, ...string[]];
export type Version3 = string;
export type Authority = "advisory" | "eligible" | "human";
export type Claim = "technical" | "visual" | "subjective" | "fun";
export type EvaluatedAt = string;
export type EvaluationId = string;
export type EvaluatorId = string;
/**
 * @minItems 1
 */
export type EvidenceIds2 = [string, ...string[]];
export type GateId = string;
export type ProjectId9 = string;
export type Rationale1 = string;
export type Result = "passed" | "failed" | "inconclusive";
export type SchemaVersion12 = 1;
export type TaskId6 = string;
export type Event =
  | (
      | TaskEvent
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
      | WorldResearchEvent
    )
  | null;
export type ActorId = string;
export type ActorType = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId = string;
export type EventId = string;
export type EventType =
  | "task.created"
  | "task.started"
  | "task.blocked"
  | "task.blocked_knowledge"
  | "task.knowledge_resolved"
  | "task.completed";
export type Detail = string;
export type TaskId7 = string;
export type ProjectId10 = string;
export type SchemaVersion13 = 1;
export type Sequence = number;
export type TaskId8 = string | null;
export type Timestamp = string;
export type ActorId1 = string;
export type ActorType1 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId1 = string;
export type EventId1 = string;
export type EventType1 = "agent.assigned" | "agent.failed" | "agent.hired";
export type AgentId2 = string;
export type AssignmentId1 = string;
export type ProjectId11 = string;
export type SchemaVersion14 = 1;
export type Sequence1 = number;
export type TaskId9 = string | null;
export type Timestamp1 = string;
export type ActorId2 = string;
export type ActorType2 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId2 = string;
export type EventId2 = string;
export type EventType2 = "evaluation.started" | "evaluation.failed" | "evaluation.passed";
export type EvaluationId1 = string;
/**
 * @minItems 1
 */
export type EvidenceIds3 = [string, ...string[]];
export type ProjectId12 = string;
export type SchemaVersion15 = 1;
export type Sequence2 = number;
export type TaskId10 = string | null;
export type Timestamp2 = string;
export type ActorId3 = string;
export type ActorType3 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId3 = string;
export type EventId3 = string;
export type EventType3 = "decision.requested" | "decision.resolved" | "gm.challenge_raised" | "gate.waived";
export type DecisionId2 = string;
export type Reason3 = string;
export type ProjectId13 = string;
export type SchemaVersion16 = 1;
export type Sequence3 = number;
export type TaskId11 = string | null;
export type Timestamp3 = string;
export type ActorId4 = string;
export type ActorType4 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId4 = string;
export type EventId4 = string;
export type EventType4 = "artifact.created" | "artifact.modified";
export type ProjectId14 = string;
export type SchemaVersion17 = 1;
export type Sequence4 = number;
export type TaskId12 = string | null;
export type Timestamp4 = string;
export type ActorId5 = string;
export type ActorType5 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId5 = string;
export type EventId5 = string;
export type EventType5 = "project.baseline_recorded";
export type CapturedAt = string;
export type Digest = string;
export type ModifiedNs = number;
export type Path = string;
export type Size = number;
export type Entries = WorkspaceEntry[];
export type GitHead = string | null;
export type GitStatus = string[];
export type SchemaVersion18 = 1;
export type ProjectId15 = string;
export type SchemaVersion19 = 1;
export type Sequence5 = number;
export type TaskId13 = string | null;
export type Timestamp5 = string;
export type ActorId6 = string;
export type ActorType6 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId6 = string;
export type EventId6 = string;
export type EventType6 = "project.external_change_detected";
export type BaselineDigest = string;
export type ChangeId = string;
export type GitCommits = string[];
export type GitDiffSummary = string | null;
/**
 * @minItems 1
 */
export type Paths = [string, ...string[]];
export type ProjectId16 = string;
export type SchemaVersion20 = 1;
export type Sequence6 = number;
export type TaskId14 = string | null;
export type Timestamp6 = string;
export type ActorId7 = string;
export type ActorType7 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId7 = string;
export type EventId7 = string;
export type EventType7 = "project.reconciled";
export type Artifacts = SourceRef[];
export type ChangeId1 = string;
export type Detail1 = string;
/**
 * @minItems 1
 */
export type Paths1 = [string, ...string[]];
export type TaskId15 = string;
export type ProjectId17 = string;
export type SchemaVersion21 = 1;
export type Sequence7 = number;
export type TaskId16 = string | null;
export type Timestamp7 = string;
export type ActorId8 = string;
export type ActorType8 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId8 = string;
export type EventId8 = string;
export type EventType8 = "provider.spend_recorded";
export type AmountCents = number;
export type ProviderId1 = string;
export type ReservationId1 = string;
export type ProjectId18 = string;
export type SchemaVersion22 = 1;
export type Sequence8 = number;
export type TaskId17 = string | null;
export type Timestamp8 = string;
export type ActorId9 = string;
export type ActorType9 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId9 = string;
export type EventId9 = string;
export type EventType9 = "provider.disabled";
export type ProviderId2 = string;
export type Reason4 = string;
export type ProjectId19 = string;
export type SchemaVersion23 = 1;
export type Sequence9 = number;
export type TaskId18 = string | null;
export type Timestamp9 = string;
export type ActorId10 = string;
export type ActorType10 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId10 = string;
export type EventId10 = string;
export type EventType10 = "provider.configured";
export type AdapterId1 = string | null;
export type Billing = "local" | "codex_subscription" | "paid";
export type Cap = UnverifiedCap | VerifiedCap;
export type Verified = false;
export type AmountCents1 = number;
export type ExpiresAt = string;
export type ProviderSide = true;
export type VerificationMethod = "provider_api" | "manual_provider_console" | "prepaid_wallet";
export type Verified1 = true;
export type VerifiedAt = string;
export type CredentialId = string | null;
export type Currency = "USD";
export type DisplayName = string;
export type ProviderId3 = string;
export type Purpose = string;
export type SchemaVersion24 = 1;
export type State2 = "ACTIVE" | "DISABLED" | "DISABLED_UNCAPPED";
export type RequestId1 = string;
export type ProjectId20 = string;
export type SchemaVersion25 = 1;
export type Sequence10 = number;
export type TaskId19 = string | null;
export type Timestamp10 = string;
export type ActorId11 = string;
export type ActorType11 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId11 = string;
export type EventId11 = string;
export type EventType11 = "provider.spend_approved";
export type AmountCents2 = number;
export type ApprovalId = string;
export type ApprovedAt = string;
export type ApprovedBy = "human";
export type ExpiresAt1 = string;
export type ProjectId21 = string;
export type ProviderId4 = string;
export type RequestId2 = string;
export type SchemaVersion26 = 1;
export type ProjectId22 = string;
export type SchemaVersion27 = 1;
export type Sequence11 = number;
export type TaskId20 = string | null;
export type Timestamp11 = string;
export type ActorId12 = string;
export type ActorType12 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId12 = string;
export type EventId12 = string;
export type EventType12 = "provider.reservation_updated";
export type ProjectId23 = string;
export type SchemaVersion28 = 1;
export type Sequence12 = number;
export type TaskId21 = string | null;
export type Timestamp12 = string;
export type ActorId13 = string;
export type ActorType13 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId13 = string;
export type EventId13 = string;
export type EventType13 = "provider.invocation_recorded";
export type ActualCents1 = number | null;
export type Detail2 = string;
export type InvocationId = string;
export type PredictedCents1 = number;
export type ProjectId24 = string;
export type ProviderId5 = string;
export type RecordedAt = string;
export type RequestId3 = string;
export type ReservationId2 = string;
export type SchemaVersion29 = 1;
export type State3 = "succeeded" | "failed" | "uncertain";
export type TaskId22 = string | null;
export type ProjectId25 = string;
export type SchemaVersion30 = 1;
export type Sequence13 = number;
export type TaskId23 = string | null;
export type Timestamp13 = string;
export type ActorId14 = string;
export type ActorType14 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId14 = string;
export type EventId14 = string;
export type EventType14 = "git.commit.created";
export type CommitId = string;
export type Workspace = string;
export type ProjectId26 = string;
export type SchemaVersion31 = 1;
export type Sequence14 = number;
export type TaskId24 = string | null;
export type Timestamp14 = string;
export type ActorId15 = string;
export type ActorType15 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId15 = string;
export type EventId15 = string;
export type EventType15 = "project.initialized";
export type Field = string;
export type Kind2 = "known" | "inferred" | "missing";
export type Source = string;
export type Value = string | null;
export type Findings = InitializationFinding[];
export type GitHead1 = string | null;
export type GitRecentCommits = string[];
export type InspectedAssets = string[];
export type InspectedDocuments = string[];
export type RepositoryRoot = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities1 = [string, ...string[]];
export type SchemaVersion32 = 1;
export type ApprovalThresholdCents = number;
export type Authority1 = "ask_first" | "recommend_and_proceed" | "autonomous_within_policy";
export type Currency1 = "USD";
export type MonthlyExternalBudgetCents = number;
export type PostSpecialistNonprogressLimit = 3;
export type Proactivity = "reactive" | "balanced" | "active";
export type ProjectId27 = string;
export type RequireProviderHardCap = true;
export type RequireRegistrationOrReconciliation = true;
export type SchemaVersion33 = 1;
export type Direction1 = string;
export type References2 = SourceRef[];
export type Constraints2 = string[];
export type Type = string;
export type Version4 = string;
export type InputMethods = string[];
export type LockedDecisionIds = string[];
export type Medium = string;
export type MaxPlayers = number;
export type Type1 = string;
export type Platforms = string[];
export type CurrentMilestone = string | null;
export type Stage = string;
export type TeamSize = number;
export type Description2 = string;
export type Id = string;
export type Name1 = string;
export type Rendering = "2d" | "2.5d" | "3d" | "non_applicable";
export type SchemaVersion34 = 1;
export type ProjectId28 = string;
export type SchemaVersion35 = 1;
export type Sequence15 = number;
export type TaskId25 = string | null;
export type Timestamp15 = string;
export type ActorId16 = string;
export type ActorType16 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId16 = string;
export type EventId16 = string;
export type EventType16 = "task.proposed";
export type ProjectId29 = string;
export type SchemaVersion36 = 1;
export type Sequence16 = number;
export type TaskId26 = string | null;
export type Timestamp16 = string;
export type ActorId17 = string;
export type ActorType17 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId17 = string;
export type EventId17 = string;
export type EventType17 = "policy.updated";
export type ProjectId30 = string;
export type SchemaVersion37 = 1;
export type Sequence17 = number;
export type TaskId27 = string | null;
export type Timestamp17 = string;
export type ActorId18 = string;
export type ActorType18 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId18 = string;
export type EventId18 = string;
export type EventType18 = "worker.updated";
export type Cwd = string;
export type Detail3 = string;
export type ExpertisePacks1 = ExpertisePackRef[];
export type AgentId3 = string;
export type AssembledAt1 = string;
/**
 * @minItems 1
 */
export type CapabilityIds = [string, ...string[]];
export type ContextPackageId = string | null;
export type ExpertisePacks2 = ExpertisePackRef[];
export type Authority2 =
  | "primary_standard"
  | "official_documentation"
  | "peer_reviewed"
  | "industry_reference"
  | "curated_practice"
  | "project_source"
  | "measured_result"
  | "human_judgment";
export type Confidence1 = number;
export type FreshnessClass = "stable" | "slow_changing" | "version_sensitive" | "policy_sensitive" | "live";
export type Kind3 =
  | "professional_knowledge"
  | "project_fact"
  | "project_inference"
  | "external_fact"
  | "observed_result"
  | "heuristic"
  | "hypothesis"
  | "human_judgment"
  | "measured_evidence";
export type MethodIds = string[];
export type Plane = "project" | "discipline" | "world" | "experience";
export type ProjectKnowledgeId = string | null;
export type Relevance1 = number;
export type RetrievalId = string;
export type SelectionReason = string;
export type SourceIds = string[];
export type Statement2 = string;
export type Items = RetrievedKnowledge[];
/**
 * @minItems 1
 */
export type ApplicableCapabilityIds = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvidenceRequirements = [string, ...string[]];
export type MethodId = string;
export type Purpose1 = string;
export type SchemaVersion38 = 1;
/**
 * @minItems 1
 */
export type SourceIds1 = [string, ...string[]];
/**
 * @minItems 1
 */
export type Steps = [string, ...string[]];
export type Title3 = string;
export type Methods = KnowledgeMethod[];
export type MissingKnowledgeFlags = string[];
export type PacketId = string;
export type ProjectId31 = string;
export type ProjectIntelligenceDigest = string | null;
export type ProjectSources = SourceRef[];
export type SchemaVersion39 = 1;
export type SelectedMethodIds = string[];
export type ApplicableCapabilityIds1 = string[];
export type Author = string | null;
export type Authority3 =
  | "primary_standard"
  | "official_documentation"
  | "peer_reviewed"
  | "industry_reference"
  | "curated_practice"
  | "project_source"
  | "measured_result"
  | "human_judgment";
export type FreshUntil = string | null;
export type FreshnessClass1 = "stable" | "slow_changing" | "version_sensitive" | "policy_sensitive" | "live";
export type License = string | null;
export type PublishedAt = string | null;
export type Publisher = string | null;
export type RetrievedAt = string;
export type SchemaVersion40 = 1;
export type SourceId = string;
export type SourceType =
  | "standard"
  | "official_documentation"
  | "book"
  | "paper"
  | "article"
  | "project_document"
  | "measurement"
  | "human_review";
export type Title4 = string;
export type Uri1 = string;
export type Sources = KnowledgeSource[];
export type StaleKnowledgeFlags = string[];
export type TaskId28 = string;
export type KnowledgePacketId1 = string | null;
export type ProjectId32 = string;
export type Findings1 = string[];
export type MissingEvidence = string[];
export type NextSteps = string[];
export type ProfessionalReasoning = string[];
export type ProjectEvidence = string[];
export type QaPlan = string[];
export type SourceIds2 = string[];
export type Summary = string;
export type Uncertainty = string[];
export type SchemaVersion41 = 1;
export type State4 = "ready" | "running" | "completed" | "failed" | "interrupted";
export type TaskId29 = string;
export type ThreadId1 = string;
export type TurnId = string | null;
export type WorkerId = string;
export type ProjectId33 = string;
export type SchemaVersion42 = 1;
export type Sequence18 = number;
export type TaskId30 = string | null;
export type Timestamp18 = string;
export type ActorId19 = string;
export type ActorType19 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId19 = string;
export type EventId19 = string;
export type EventType19 = "gm.updated";
export type Detail4 = string;
export type Objective1 = string;
export type ProjectId34 = string;
export type RequestId4 = string;
export type SchemaVersion43 = 1;
export type State5 = "ready" | "planning" | "completed" | "failed" | "interrupted";
export type ThreadId2 = string;
export type ProjectId35 = string;
export type SchemaVersion44 = 1;
export type Sequence19 = number;
export type TaskId31 = string | null;
export type Timestamp19 = string;
export type ActorId20 = string;
export type ActorType20 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId20 = string;
export type EventId20 = string;
export type EventType20 = "gm.plan_created";
export type MissingCapabilities1 = string[];
export type TaskId32 = string;
export type Assignments = PlanAssignment[];
export type Objective2 = string;
export type PlanId1 = string;
export type ProjectId36 = string;
/**
 * @minItems 1
 */
export type AffectedStepKeys = [string, ...string[]];
export type Category =
  | "creative_intent"
  | "scope"
  | "money"
  | "irreversible_structure"
  | "public_exposure"
  | "player_behavior"
  | "ambiguity";
export type Consequences2 = string[];
export type Key = string;
/**
 * @minItems 2
 */
export type Options2 = [string, string, ...string[]];
export type Reason5 = string;
export type Recommendation2 = string;
export type Title5 = string;
export type Questions = PlanQuestion[];
export type SchemaVersion45 = 1;
export type Summary1 = string;
/**
 * @minItems 1
 */
export type Tasks = [TaskContract, ...TaskContract[]];
export type ProjectId37 = string;
export type SchemaVersion46 = 1;
export type Sequence20 = number;
export type TaskId33 = string | null;
export type Timestamp20 = string;
export type ActorId21 = string;
export type ActorType21 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId21 = string;
export type EventId21 = string;
export type EventType21 = "gm.decision_resolved";
export type ProjectId38 = string;
export type SchemaVersion47 = 1;
export type Sequence21 = number;
export type TaskId34 = string | null;
export type Timestamp21 = string;
export type ActorId22 = string;
export type ActorType22 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId22 = string;
export type EventId22 = string;
export type EventType22 = "project.intelligence_indexed";
export type IndexedAt = string;
export type Knowledge1 = KnowledgeEntry[];
export type ProjectId39 = string;
export type Excerpt = string | null;
export type Kind4 = "document" | "source" | "asset" | "configuration";
export type MediaType1 = string;
export type Path1 = string;
export type Sha2561 = string;
export type Size1 = number;
export type Resources = IndexedResource[];
export type SchemaVersion48 = 1;
export type WorkspaceDigest = string;
export type ProjectId40 = string;
export type SchemaVersion49 = 1;
export type Sequence22 = number;
export type TaskId35 = string | null;
export type Timestamp22 = string;
export type ActorId23 = string;
export type ActorType23 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId23 = string;
export type EventId23 = string;
export type EventType23 = "evidence.recorded";
export type CaptureOrigin = "runtime" | "source" | "simulation" | "human_observation" | "model_output";
export type CapturedAt1 = string;
export type EvidenceClass = "deterministic" | "measured" | "comparative" | "heuristic" | "human";
export type EvidenceId = string;
export type ProducerId = string;
export type ProducerType = "tool" | "model" | "human";
export type ProjectId41 = string;
export type SchemaVersion50 = 1;
export type Summary2 = string;
export type TaskId36 = string;
export type ProjectId42 = string;
export type SchemaVersion51 = 1;
export type Sequence23 = number;
export type TaskId37 = string | null;
export type Timestamp23 = string;
export type ActorId24 = string;
export type ActorType24 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId24 = string;
export type EventId24 = string;
export type EventType24 = "evaluation.recorded";
export type ProjectId43 = string;
export type SchemaVersion52 = 1;
export type Sequence24 = number;
export type TaskId38 = string | null;
export type Timestamp24 = string;
export type ActorId25 = string;
export type ActorType25 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId25 = string;
export type EventId25 = string;
export type EventType25 = "recruitment.updated";
export type AdjacentAgentIds = string[];
export type AuditionId = string;
export type CandidateId = string;
export type EvaluatedAt1 = string;
export type RepresentativeObjective = string;
export type Result1 = "passed" | "failed";
/**
 * @minItems 7
 * @maxItems 7
 */
export type Dimensions = [
  AuditionDimension,
  AuditionDimension,
  AuditionDimension,
  AuditionDimension,
  AuditionDimension,
  AuditionDimension,
  AuditionDimension
];
export type Detail5 = string;
export type Dimension =
  | "technical_correctness"
  | "output_compliance"
  | "quality"
  | "reliability"
  | "style_adherence"
  | "cost_latency"
  | "security_tool_behavior";
export type Result2 = "passed" | "failed";
export type Rationale2 = string;
export type Recommendation3 = "probation" | "reject";
export type Sandbox1 = "read_only";
export type SchemaVersion53 = 1;
export type RequestedToolIds = string[];
/**
 * @minItems 1
 */
export type Risks = [string, ...string[]];
export type Summary3 = string;
/**
 * @minItems 3
 */
export type TestCases = [AuditionTestCase, AuditionTestCase, AuditionTestCase, ...AuditionTestCase[]];
export type CapabilityId2 = string;
export type EvidenceClass1 = "deterministic" | "measured" | "comparative" | "heuristic" | "human";
export type ExpectedResult = string;
export type Procedure = string;
export type CreatedAt2 = string;
export type Action =
  | "create_agent"
  | "attach_or_build_pack"
  | "install_or_authorize_tool"
  | "refresh_knowledge"
  | "requalify_agent"
  | "change_model"
  | "reuse_agent";
export type AgentId4 = string | null;
export type Detail6 = string;
export type MissingPackIds = string[];
export type MissingToolIds = string[];
export type Problem =
  | "no_agent"
  | "missing_expertise_pack"
  | "missing_tool"
  | "stale_knowledge"
  | "performance_failure"
  | "model_insufficient"
  | "none";
export type RequiredPackIds = string[];
export type StalePackIds = string[];
export type ExpertisePacks3 = ExpertisePackRef[];
/**
 * @minItems 1
 */
export type CapabilityIds1 = [string, ...string[]];
export type CreatedAt3 = string;
export type Description3 = string;
/**
 * @minItems 1
 */
export type DomainIds = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvaluationIds = [string, ...string[]];
/**
 * @minItems 1
 */
export type Items1 = [ExpertiseKnowledgeItem, ...ExpertiseKnowledgeItem[]];
/**
 * @minItems 1
 */
export type CapabilityIds2 = [string, ...string[]];
export type Confidence2 = number;
/**
 * @minItems 1
 */
export type DomainIds1 = [string, ...string[]];
export type FreshnessClass2 = "stable" | "slow_changing" | "version_sensitive" | "policy_sensitive" | "live";
export type ItemId = string;
export type Kind5 = "professional_knowledge" | "standard" | "heuristic" | "anti_pattern" | "example" | "benchmark";
export type MethodIds1 = string[];
export type SchemaVersion54 = 1;
/**
 * @minItems 1
 */
export type SourceIds3 = [string, ...string[]];
export type Statement3 = string;
export type Title6 = string;
/**
 * @minItems 1
 */
export type Methods1 = [KnowledgeMethod, ...KnowledgeMethod[]];
export type Name2 = string;
export type PackId1 = string;
export type RequiredToolIds = string[];
export type ReviewedAt = string | null;
export type SchemaVersion55 = 1;
/**
 * @minItems 1
 */
export type Sources1 = [KnowledgeSource, ...KnowledgeSource[]];
export type State6 = "draft" | "reviewed" | "active" | "deprecated";
export type SupersedesVersion = string | null;
export type Version5 = string;
export type ExpertiseSnapshot = ExpertisePack[];
export type MissingExpertiseCapabilities = string[];
export type ProjectId44 = string;
export type RecruitmentId = string;
export type SchemaVersion56 = 1;
export type State7 = "candidate_composed" | "remediation_required" | "auditioning" | "probation" | "rejected";
export type TaskId39 = string;
export type CapabilityIds3 = string[];
export type Decision1 = "trusted" | "needs_approval" | "forbidden" | "unavailable";
export type Detail7 = string;
export type ToolId = string;
export type ToolDiscoveries = ToolDiscovery[];
export type UpdatedAt1 = string;
export type ProjectId45 = string;
export type SchemaVersion57 = 1;
export type Sequence25 = number;
export type TaskId40 = string | null;
export type Timestamp25 = string;
export type ActorId26 = string;
export type ActorType26 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId26 = string;
export type EventId26 = string;
export type EventType26 = "qa.gate_waived";
export type GateId1 = string;
export type ProjectId46 = string;
export type Reason6 = string;
export type SchemaVersion58 = 1;
export type TaskId41 = string;
export type WaivedAt = string;
export type WaivedBy = "human";
export type WaiverId = string;
export type ProjectId47 = string;
export type SchemaVersion59 = 1;
export type Sequence26 = number;
export type TaskId42 = string | null;
export type Timestamp26 = string;
export type ActorId27 = string;
export type ActorType27 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId27 = string;
export type EventId27 = string;
export type EventType27 = "model.benchmark_recorded";
export type BenchmarkId = string;
export type BenchmarkedAt = string;
export type CompletionTokens = number;
export type ContractScore = number;
export type LatencyMs = number;
export type ModelDigest = string;
export type ModelName = string;
export type OutputChannel = "response" | "thinking";
export type ProjectId48 = string;
export type PromptSha256 = string;
export type PromptTokens = number;
/**
 * @minItems 1
 */
export type RequiredCapabilityIds = [string, ...string[]];
export type Result3 = "passed" | "failed" | "unavailable";
export type SchemaVersion60 = 1;
export type Summary4 = string;
export type TaskId43 = string;
export type ProjectId49 = string;
export type SchemaVersion61 = 1;
export type Sequence27 = number;
export type TaskId44 = string | null;
export type Timestamp27 = string;
export type ActorId28 = string;
export type ActorType28 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId28 = string;
export type EventId28 = string;
export type EventType28 = "model.routing_recorded";
/**
 * @minItems 3
 */
export type Candidates = [ModelRouteCandidate, ModelRouteCandidate, ModelRouteCandidate, ...ModelRouteCandidate[]];
export type Confidence3 = number;
export type ExpectedExternalCostAvoidedCents = number;
export type ExpectedExternalCostCents = number | null;
export type ExpectedQuality = "unknown" | "low" | "medium" | "high";
export type ExpectedRuntimeMs = number | null;
export type ModelName1 = string | null;
export type ProviderId6 = string | null;
export type Reason7 = string;
export type Route = "deterministic_tool" | "local_ollama" | "codex_authenticated" | "paid_provider" | "wait_for_codex";
export type Viable = boolean;
export type CreatedAt4 = string;
export type ProjectId50 = string;
export type Reason8 = string;
export type RoutingId = string;
export type SchemaVersion62 = 1;
export type SelectedModelName = string | null;
export type SelectedProviderId = string | null;
export type SelectedRoute =
  "deterministic_tool" | "local_ollama" | "codex_authenticated" | "paid_provider" | "wait_for_codex";
export type TaskId45 = string;
export type ProjectId51 = string;
export type SchemaVersion63 = 1;
export type Sequence28 = number;
export type TaskId46 = string | null;
export type Timestamp28 = string;
export type ActorId29 = string;
export type ActorType29 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId29 = string;
export type EventId29 = string;
export type EventType29 = "production_domain.inspected";
export type DomainId = string;
export type EvaluationId2 = string;
export type EvidenceId1 = string;
/**
 * @minItems 1
 */
export type Findings2 = [ProductionDomainFinding, ...ProductionDomainFinding[]];
export type Detail8 = string;
export type FindingId = string;
export type Paths2 = string[];
export type Severity = "info" | "warning" | "error";
export type Title7 = string;
export type InspectedAt = string;
export type InspectedFileCount = number;
export type InspectionId = string;
export type ProjectId52 = string;
export type SchemaVersion64 = 1;
export type Status = "passed" | "needs_attention" | "not_applicable";
export type TaskId47 = string;
export type ToolId1 = string;
export type ProjectId53 = string;
export type SchemaVersion65 = 1;
export type Sequence29 = number;
export type TaskId48 = string | null;
export type Timestamp29 = string;
export type ActorId30 = string;
export type ActorType30 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId30 = string;
export type EventId30 = string;
export type EventType30 =
  | "project.reconnaissance_started"
  | "project.reconnaissance_completed"
  | "domain.assessment_started"
  | "domain.assessment_completed"
  | "domain.assumption_recorded"
  | "domain.input_needed_later"
  | "domain.input_needed_now"
  | "project.reconciliation_started"
  | "project.reconciliation_completed"
  | "project.onboarding_completed";
export type AgentId5 = string;
export type AssessedAt = string;
export type AssessmentId = string;
export type Confidence4 = number;
export type ExpiresWhen = string;
export type Impact = string;
export type Statement4 = string;
export type Assumptions = DomainAssumption[];
export type Contradictions = string[];
export type Domain = string;
export type Evidence1 = SourceRef[];
export type ExpertisePacks4 = ExpertisePackRef[];
export type InferredFacts = string[];
export type KnownFacts = string[];
export type ProjectId54 = string;
export type Confidence5 = number;
export type Status1 =
  "READY" | "READY_WITH_ASSUMPTIONS" | "NEEDS_INPUT_LATER" | "NEEDS_INPUT_NOW" | "BLOCKED_KNOWLEDGE";
export type Recommendations = string[];
export type RequestedHumanInputs = string[];
export type Risks1 = string[];
export type SchemaVersion66 = 1;
export type Summary5 = string;
export type BlocksCurrentWork = boolean;
export type Impact1 = string;
export type Question = string;
export type Unknowns = DomainUnknown[];
export type Detail9 = string;
export type Domain1 = string | null;
/**
 * @minItems 1
 */
export type Assessments = [LeadDomainAssessment, ...LeadDomainAssessment[]];
export type BlockingQuestions = string[];
export type CompletedAt = string;
export type DeferredQuestions = string[];
export type OnboardingId = string;
export type ProjectId55 = string;
export type ReconciliationSummary = string;
export type ReconnaissanceSummary = string;
/**
 * @minItems 1
 */
export type RelevantDomains = [string, ...string[]];
export type SchemaVersion67 = 1;
export type StartedAt = string;
export type State8 = "READY" | "NEEDS_HUMAN_INPUT" | "BLOCKED_KNOWLEDGE" | "ACTIVE";
export type ProjectId56 = string;
export type SchemaVersion68 = 1;
export type Sequence30 = number;
export type TaskId49 = string | null;
export type Timestamp30 = string;
export type ActorId31 = string;
export type ActorType31 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId31 = string;
export type EventId31 = string;
export type EventType31 = "experience.observed";
export type AgentId6 = string | null;
/**
 * @minItems 1
 */
export type CapabilityIds4 = [string, ...string[]];
export type Conclusion = string;
export type Confidence6 = number;
export type ContextTags = string[];
export type CreatedAt5 = string;
export type EvaluationId3 = string | null;
/**
 * @minItems 1
 */
export type EvidenceIds4 = [string, ...string[]];
export type ExpertisePacks5 = ExpertisePackRef[];
export type MethodIds2 = string[];
export type ObservationId = string;
export type Outcome = "passed" | "failed" | "inconclusive";
export type ProjectId57 = string;
export type SchemaVersion69 = 1;
export type Scope = "project_private" | "global_candidate";
export type State9 = "observed" | "proposed" | "reviewed" | "promoted" | "rejected";
export type TaskId50 = string;
export type ProjectId58 = string;
export type SchemaVersion70 = 1;
export type Sequence31 = number;
export type TaskId51 = string | null;
export type Timestamp31 = string;
export type ActorId32 = string;
export type ActorType32 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId32 = string;
export type EventId32 = string;
export type EventType32 = "experience.lesson_recorded";
export type Applicability = string;
/**
 * @minItems 1
 */
export type CapabilityIds5 = [string, ...string[]];
export type Confidence7 = number;
export type CreatedAt6 = string;
export type LessonId = string;
/**
 * @minItems 1
 */
export type Limitations = [string, ...string[]];
/**
 * @minItems 1
 */
export type ObservationIds = [string, ...string[]];
export type ProjectId59 = string;
export type ProposerId = string;
export type ReviewDetail = string | null;
export type ReviewedAt1 = string | null;
export type ReviewerId = string | null;
export type SchemaVersion71 = 1;
export type Scope1 = "project" | "user_taste" | "domain" | "engine" | "global";
export type State10 = "candidate" | "repeated" | "validated" | "rejected" | "expired" | "superseded";
export type Statement5 = string;
export type ProjectId60 = string;
export type SchemaVersion72 = 1;
export type Sequence32 = number;
export type TaskId52 = string | null;
export type Timestamp32 = string;
export type ActorId33 = string;
export type ActorType33 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId33 = string;
export type EventId33 = string;
export type EventType33 = "knowledge.research_recorded";
export type Detail10 = string;
export type Excerpt1 = string | null;
export type ProjectId61 = string;
export type Requirement = string;
export type ResearchId = string;
export type ResearchedAt = string;
export type SchemaVersion73 = 1;
export type State11 = "available" | "blocked" | "failed";
export type TaskId53 = string;
export type Url = string;
export type ProjectId62 = string;
export type SchemaVersion74 = 1;
export type Sequence33 = number;
export type TaskId54 = string | null;
export type Timestamp33 = string;
export type AcceptableSourceIds = string[];
/**
 * @minItems 1
 */
export type AppliesToVersions = [string, ...string[]];
export type BenchmarkId1 = string;
/**
 * @minItems 1
 */
export type CapabilityIds6 = [string, ...string[]];
export type Discriminates = string;
/**
 * @minItems 1
 * @maxItems 20
 */
export type ExpectedSpecialistFindings =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string]
  | [string, string, string, string, string]
  | [string, string, string, string, string, string]
  | [string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string, string, string, string, string]
  | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ]
  | [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ];
export type ExpectedUncertainty = string[];
export type PackId2 = string;
export type Scenario = string;
export type SchemaVersion75 = 1;
export type ScoringNotes = string;
export type CapturedAt2 = string;
export type Cpu = string;
export type DriverVersion = string | null;
export type MemoryBytes = number | null;
export type Name3 = string;
export type Vendor = string;
export type Graphics = GraphicsDevice[];
export type LogicalCoreCount = number;
export type MachineId = string;
export type OperatingSystem = string;
export type PhysicalCoreCount = number | null;
export type RamBytes = number | null;
export type SchemaVersion76 = 1;
export type Detail11 = string;
export type Endpoint = string;
export type InspectedAt1 = string;
export type ContextLimit = number | null;
export type Digest1 = string;
export type FitsMemory = boolean;
/**
 * @minItems 1
 */
export type Modalities = ["text" | "image" | "audio", ...("text" | "image" | "audio")[]];
export type ModifiedAt = string;
export type Name4 = string;
export type ParameterSize = string | null;
export type QuantizationLevel = string | null;
export type SizeBytes = number;
export type ToolSupport = boolean;
export type Models = LocalModel[];
export type RuntimeId = "ollama";
export type SchemaVersion77 = 1;
export type State12 = "available" | "unavailable";
export type Version6 = string | null;
export type Action1 = "install" | "keep_installed" | "no_recommendation";
export type Description4 = string;
export type EstimatedSizeBytes = number;
export type Family1 = string;
export type Installed = boolean;
export type MemoryTier = "full_gpu" | "hybrid" | "system" | "unfit";
/**
 * @minItems 1
 */
export type Modalities1 = ["text" | "image" | "audio", ...("text" | "image" | "audio")[]];
export type Name5 = string;
export type ParameterSize1 = string;
export type Reason9 = string;
export type SourceUrl = string;
export type SuitabilityScore = number;
export type ThinkingSupport = boolean;
export type ToolSupport1 = boolean;
export type Alternatives1 = ModelCatalogCandidate[];
export type CatalogCheckedAt = string;
export type CatalogSha256 = string | null;
export type CatalogState = "live" | "unavailable";
export type CatalogUrl = string;
export type InstallCommand = string | null;
export type Installed1 = boolean;
export type ProjectId63 = string;
export type Reason10 = string;
export type RecommendationId = string;
export type RecommendedModelName = string | null;
/**
 * @minItems 1
 */
export type RequiredCapabilityIds1 = [string, ...string[]];
export type SchemaVersion78 = 1;
export type TaskId55 = string;
/**
 * @minItems 1
 */
export type AcceptedExtensions = [string, ...string[]];
/**
 * @minItems 1
 */
export type CapabilityIds7 = [string, ...string[]];
export type Description5 = string;
export type DomainId1 = string;
/**
 * @minItems 1
 */
export type GateIds = [string, ...string[]];
export type SchemaVersion79 = 1;
export type Title8 = string;
/**
 * @minItems 1
 */
export type ToolIds1 = [string, ...string[]];
export type Version7 = string;
/**
 * @minItems 1
 */
export type AllowedProducerTypes = ["tool" | "model" | "human", ...("tool" | "model" | "human")[]];
export type Claim1 = "technical" | "visual" | "subjective" | "fun";
export type Description6 = string;
export type Discipline = "ui" | "engineering" | "gameplay" | "level_design" | "art" | "audio" | "narrative";
export type GateId2 = string;
/**
 * @minItems 1
 */
export type RequiredEvidenceClasses = [
  "deterministic" | "measured" | "comparative" | "heuristic" | "human",
  ...("deterministic" | "measured" | "comparative" | "heuristic" | "human")[]
];
export type RequiresIndependentVerification = boolean;
export type RequiresRuntimeCapture = boolean;
export type SchemaVersion80 = 1;
export type Title9 = string;
export type Version8 = string;
export type CompletionState = "passed" | "blocked" | "human_rejected";
export type Explanation = string;
/**
 * @minItems 1
 */
export type Gates = [QAGateStatus, ...QAGateStatus[]];
export type EvidenceIds5 = string[];
export type Explanation1 = string;
export type LatestEvaluationId = string | null;
export type Required = boolean;
export type State13 = "missing" | "passed" | "failed" | "inconclusive" | "advisory" | "waived";
export type WaiverId1 = string | null;
export type GeneratedAt = string;
export type PassedGateCount = number;
export type ProjectId64 = string;
export type ReportId = string;
export type RequiredGateCount = number;
export type SchemaVersion81 = 1;
export type TaskId56 = string;
export type WaivedGateCount = number;
/**
 * @minItems 1
 */
export type Capabilities2 = [string, ...string[]];
export type HealthCheck = string;
export type InputContract = string;
export type InstallState = "missing" | "installed" | "unhealthy";
export type Invocation = "cli" | "http" | "sdk" | "mcp";
export type Location = "local" | "cloud";
export type OutputContract1 = string;
export type SchemaVersion82 = 1;
export type ToolId2 = string;
export type Version9 = string;
export type AgentId7 = string;
export type FailedCount1 = number;
export type InconclusiveCount = number;
export type Interpretation = "observed_correlation_not_causation";
export type PassedCount1 = number;
export type Subject = string;
export type TaskCount1 = number;
export type MethodPerformance = KnowledgePerformanceSummary[];
export type Methods2 = KnowledgeMethod[];
export type PackPerformance = KnowledgePerformanceSummary[];
export type QualificationState = "expertise_available" | "missing_required_expertise";
export type RecordedPackets = KnowledgePacket[];
export type RequiredPackIds1 = string[];
export type ResolvedPacks = ExpertisePackRef[];
export type Profiles = AgentKnowledgeProfile[];
export type Entries1 = AgentRegistryEntry[];
export type AvailableCents = number;
export type BudgetCents = number;
export type Month1 = string;
export type ReservedCents = number;
export type SettledCents = number;
export type TaskId57 = string;
export type DecisionId3 = string;
export type Rationale3 = string;
export type RequestId5 = string;
export type SelectedOption2 = string;
export type NodeType = string;
export type Path2 = string;
export type Scene = string;
export type ApprovedAssets = SourceRef[];
export type EngineVersion = string;
export type InspectedAt2 = string;
export type MainScene = string;
export type ProjectId65 = string;
export type ProjectPath = string;
export type TaskId58 = string;
export type UiNodes = EngineNodeInspection[];
export type Cursor = number;
export type Events = (
  | TaskEvent
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
  | WorldResearchEvent
)[];
export type HasMore = boolean;
export type PackId3 = string;
export type State14 = "missing" | "draft" | "trusted" | "unavailable";
export type Version10 = string | null;
export type GateId3 = string;
export type Reason11 = string;
export type RequestId6 = string;
export type TaskId59 = string;
export type Applicability1 = string;
/**
 * @minItems 1
 */
export type CapabilityIds8 = [string, ...string[]];
export type Confidence8 = number;
/**
 * @minItems 1
 */
export type EvidenceDigests = [string, ...string[]];
export type LessonId1 = string;
/**
 * @minItems 1
 */
export type Limitations1 = [string, ...string[]];
export type ReviewedAt2 = string;
export type ReviewerId1 = "human";
export type SchemaVersion83 = 1;
export type Scope2 = "global" | "domain" | "engine";
export type ScopeConstraint = string | null;
export type Statement6 = string;
export type GateId4 = string;
export type RequestId7 = string;
export type Summary6 = string;
export type SupportingEvidenceIds = string[];
export type TaskId60 = string;
export type Verdict = "approved" | "rejected" | "observation";
export type RequestId8 = string;
export type AuditionId1 = string;
export type BaselineScore = number;
export type BenchmarkId2 = string;
export type CandidateScore = number;
export type CandidateSha256 = string;
export type Detail12 = string;
export type EvidenceClass2 = "human" | "heuristic";
export type RecordedAt1 = string;
export type ReviewerId2 = "human" | "expertise-curator";
export type SchemaVersion84 = 1;
export type Auditions = PackAudition[];
export type Baseline = ExpertiseBaselineStatus[];
export type Candidates1 = ExpertisePack[];
export type GlobalExperience1 = GlobalExperience[];
export type Reason12 = string;
export type RecordId = string;
export type RecordedAt2 = string;
export type ReviewerId3 = "human";
export type SchemaVersion85 = 1;
export type State15 = "active" | "deprecated" | "disputed" | "expired";
export type Lifecycle1 = PackLifecycleRecord[];
export type MaintenanceFlags = string[];
export type Packs = ExpertisePack[];
export type CandidateSha2561 = string;
export type ContradictionsChecked = boolean;
export type Decision2 = "approved" | "rejected";
export type Detail13 = string;
export type LicensingChecked = boolean;
export type PrivacyChecked = boolean;
export type ProvenanceChecked = boolean;
export type ReviewedAt3 = string;
export type ReviewerId4 = "human";
export type SchemaVersion86 = 1;
export type Reviews = PackReview[];
export type BenchmarkRegressions = string[];
export type BrokenSources = string[];
export type ContradictionCandidates = string[];
export type DeprecatedVersions = string[];
export type RanAt = string;
export type RebuiltFullTextIndex = boolean;
export type RunId = string;
export type StaleSources = string[];
export type State16 = "passed" | "attention";
export type Detail14 = string | null;
export type Enabled = boolean;
export type LastCompletedAt = string | null;
export type LastStartedAt = string | null;
export type State17 = "disabled" | "idle" | "waiting_for_idle" | "running" | "failed";
export type Applicability2 = string;
export type GeneralizationReviewed = true;
export type LessonId2 = string;
/**
 * @minItems 1
 */
export type Limitations2 = [string, ...string[]];
export type PrivacyChecked1 = true;
export type Scope3 = "global" | "domain" | "engine";
export type ScopeConstraint1 = string | null;
export type Statement7 = string;
export type Decision3 = "validated" | "rejected" | "expired" | "superseded";
export type Detail15 = string;
export type LessonId3 = string;
export type ModelName2 = string | null;
export type RequestId9 = string;
export type TaskId61 = string;
export type RequestId10 = string;
export type TaskId62 = string;
export type RequestId11 = string;
export type TaskId63 = string;
export type Urgency1 = "low" | "normal" | "high";
export type Objective3 = string;
export type RequestId12 = string;
export type BaselineScore1 = number;
export type BenchmarkId3 = string;
export type CandidateScore1 = number;
export type Detail16 = string;
export type EvidenceText = string;
export type BenchmarkId4 = string;
export type PackId4 = string;
export type TaskId64 = string;
export type Version11 = string;
export type Reason13 = string;
export type State18 = "active" | "deprecated" | "disputed" | "expired";
export type ContradictionsChecked1 = boolean;
export type Decision4 = "approved" | "rejected";
export type Detail17 = string;
export type LicensingChecked1 = boolean;
export type PrivacyChecked2 = boolean;
export type ProvenanceChecked1 = boolean;
export type Questions1 = PlanQuestion[];
/**
 * @minItems 1
 * @maxItems 30
 */
export type Steps1 = [PlanStep, ...PlanStep[]];
export type Constraints3 = string[];
/**
 * @minItems 1
 */
export type Deliverables1 = [string, ...string[]];
export type DependencyKeys = string[];
export type Key1 = string;
export type Objective4 = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities2 = [string, ...string[]];
/**
 * @minItems 1
 */
export type RequiredEvaluations1 = [string, ...string[]];
export type Title10 = string;
export type Summary7 = string;
export type ExpectedCursor = number;
export type RequestId13 = string;
export type Domains = ProductionDomainDefinition[];
export type Inspections = ProductionDomainInspection[];
export type Tools = ToolDefinition[];
export type DomainId2 = string;
export type RequestId14 = string;
export type TaskId65 = string;
export type ActiveProjectId = string;
export type Engine1 = string | null;
export type Name6 = string;
export type ProjectId66 = string;
export type Root = string;
export type Stage1 = string;
export type Projects = ProjectSummary[];
export type Path3 = string;
export type ProjectId67 = string;
export type ProjectId68 = string;
export type BudgetReservations = BudgetReservation[];
export type Cursor1 = number;
export type Decisions1 = InboxDecision[];
export type Evaluations = Evaluation[];
export type Evidence2 = Evidence[];
export type ExperienceLessons = ExperienceLesson[];
export type ExperienceObservations = ExperienceObservation[];
export type HistoryDigest = string;
export type ModelBenchmarks = ModelBenchmark[];
export type ModelRoutingRecords = ModelRoutingRecord[];
export type PaidInvocations = PaidInvocationRecord[];
export type Plans = ProductionPlan[];
export type ProductionDomainInspections = ProductionDomainInspection[];
export type Providers = Provider[];
export type Artifacts1 = SourceRef[];
export type BaselineDigest1 = string;
export type ChangeId2 = string;
export type Detail18 = string | null;
export type DetectedAt1 = string;
export type GitCommits1 = string[];
export type GitDiffSummary1 = string | null;
/**
 * @minItems 1
 */
export type Paths3 = [string, ...string[]];
export type ProjectId69 = string;
export type ReconciledAt = string | null;
export type SchemaVersion87 = 1;
export type State19 = "unresolved" | "reconciled";
export type TaskId66 = string | null;
export type Reconciliations = ReconciliationRecord[];
export type Recruitments = RecruitmentRecord[];
export type RequiresReconciliation = boolean;
export type ResearchRecords = WorldResearch[];
export type SpendApprovals = SpendApproval[];
export type Tasks1 = TaskContract[];
export type Waivers = GateWaiver[];
export type Workers = WorkerRecord[];
export type RequestId15 = string;
export type ProviderId7 = string;
export type Secret = string;
export type Configured = boolean;
export type ProviderId8 = string;
export type ProviderId9 = string;
export type Reason14 = string;
export type RequestId16 = string;
export type Output = string | null;
export type MaxOutputTokens = number;
export type Prompt = string;
export type ProviderId10 = string;
export type RequestId17 = string;
export type TaskId67 = string | null;
export type Approvals = SpendApproval[];
export type Invocations = PaidInvocationRecord[];
export type AdapterAvailable = boolean;
export type CredentialConfigured = boolean;
export type Providers1 = ProviderStatus[];
export type Reservations = BudgetReservation[];
export type RequestId18 = string;
export type TaskId68 = string;
export type ChangeId3 = string;
export type Detail19 = string;
export type RequestId19 = string;
export type TaskId69 = string | null;
export type RequestId20 = string;
export type TaskId70 = string;
export type FreshnessClass3 = "stable" | "slow_changing" | "version_sensitive" | "policy_sensitive" | "live";
export type Requirement1 = string;
export type TaskId71 = string;
export type Url1 = string;
export type NodePath = string;
export type RequestId21 = string;
export type TaskId72 = string;
export type AmountCents3 = number;
export type ExpiresAt2 = string;
export type InvocationRequestId = string;
export type ProviderId11 = string;
export type RequestId22 = string;
export type Cursor2 = number;
export type Events1 = (
  | TaskEvent
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
  | WorldResearchEvent
)[];
export type HasMore1 = boolean;
export type Type2 = "events";
export type Detail20 = string;
export type RequestId23 = string;
export type TaskId73 = string;
/**
 * @minItems 1
 */
export type Deliverables2 = [string, ...string[]];
export type DependencyIds1 = string[];
export type Objective5 = string;
export type RequestId24 = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities3 = [string, ...string[]];
export type Title11 = string;
export type Deliverables3 = string[];
export type Objective6 = string | null;
export type RequestId25 = string;
export type RequiredCapabilities4 = string[];
export type TaskId74 = string | null;
export type Title12 = string | null;
export type TaskId75 = string;
export type WorkerId1 = string | null;

/**
 * Discriminated export root; each document remains independently addressable.
 */
export interface ProtocolDocument {
  agent?: AgentDefinition | null;
  agent_registry_entry?: AgentRegistryEntry | null;
  assignment?: AgentAssignment | null;
  budget_reservation?: BudgetReservation | null;
  capability?: Capability | null;
  capability_gap?: CapabilityGap | null;
  context_package?: ContextPackage | null;
  decision?: Decision | null;
  engine_adapter?: EngineAdapter | null;
  evaluation?: Evaluation | null;
  event?: Event;
  evidence?: Evidence | null;
  experience_observation?: ExperienceObservation | null;
  expertise_benchmark_scenario?: ExpertiseBenchmarkScenario | null;
  expertise_pack?: ExpertisePack | null;
  gate_waiver?: GateWaiver | null;
  hardware_inventory?: LocalHardwareInventory | null;
  knowledge?: KnowledgeEntry | null;
  knowledge_method?: KnowledgeMethod | null;
  knowledge_packet?: KnowledgePacket | null;
  knowledge_source?: KnowledgeSource | null;
  lead_domain_assessment?: LeadDomainAssessment | null;
  local_model_inventory?: LocalModelInventory | null;
  local_model_recommendation?: LocalModelRecommendation | null;
  model_benchmark?: ModelBenchmark | null;
  model_routing?: ModelRoutingRecord | null;
  paid_invocation?: PaidInvocationRecord | null;
  policy?: Policy | null;
  production_domain?: ProductionDomainDefinition | null;
  production_domain_inspection?: ProductionDomainInspection | null;
  project?: Project | null;
  project_intelligence?: ProjectIntelligence | null;
  project_onboarding?: ProjectOnboarding | null;
  provider?: Provider | null;
  qa_gate?: QAGateDefinition | null;
  qa_report?: QAReport | null;
  recruitment?: RecruitmentRecord | null;
  spend_approval?: SpendApproval | null;
  task?: TaskContract | null;
  tool?: ToolDefinition | null;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentDefinition".
 */
export interface AgentDefinition {
  agent_id: AgentId;
  allowed_method_ids?: AllowedMethodIds;
  allowed_tool_ids: AllowedToolIds;
  capabilities: Capabilities;
  description: Description;
  instructions: Instructions;
  models: ModelPreferences;
  name: Name;
  optional_expertise_pack_ids?: OptionalExpertisePackIds;
  output_contract: OutputContract;
  permissions: Permissions;
  probationary?: Probationary;
  required_expertise_pack_ids?: RequiredExpertisePackIds;
  required_gates: RequiredGates;
  required_inputs: RequiredInputs;
  resource_policy: ResourcePolicy;
  schema_version?: SchemaVersion;
  version: Version;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Instructions".
 */
export interface Instructions {
  base: Base;
  constraints: Constraints;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelPreferences".
 */
export interface ModelPreferences {
  alternatives: Alternatives;
  preferred: Preferred;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Permissions".
 */
export interface Permissions {
  access_secrets?: AccessSecrets;
  execute_commands?: ExecuteCommands;
  execute_discovered_code?: ExecuteDiscoveredCode;
  git_commit?: GitCommit;
  git_merge?: GitMerge;
  install_dependencies?: InstallDependencies;
  modify_assets?: ModifyAssets;
  modify_code?: ModifyCode;
  modify_global_files?: ModifyGlobalFiles;
  modify_project_settings?: ModifyProjectSettings;
  network?: Network;
  read_project?: ReadProject;
  write_task_workspace?: WriteTaskWorkspace;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ResourcePolicy".
 */
export interface ResourcePolicy {
  local_preferred?: LocalPreferred;
  max_external_cost_cents?: MaxExternalCostCents;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentRegistryEntry".
 */
export interface AgentRegistryEntry {
  agent: AgentDefinition;
  audition_ids?: AuditionIds;
  lifecycle: Lifecycle;
  performance?: Performance;
  qa_decision_role: QaDecisionRole;
  recruited_at?: RecruitedAt;
  schema_version?: SchemaVersion1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CapabilityPerformance".
 */
export interface CapabilityPerformance {
  capability_id: CapabilityId;
  failed_count?: FailedCount;
  human_rejection_count?: HumanRejectionCount;
  passed_count?: PassedCount;
  revision_count?: RevisionCount;
  task_count?: TaskCount;
  total_cost_cents?: TotalCostCents;
  total_latency_ms?: TotalLatencyMs;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentAssignment".
 */
export interface AgentAssignment {
  agent_id: AgentId1;
  agent_version: AgentVersion;
  assigned_by: AssignedBy;
  assignment_id: AssignmentId;
  expertise_packs?: ExpertisePacks;
  granted_permissions: Permissions;
  knowledge_packet_id?: KnowledgePacketId;
  project_id: ProjectId;
  sandbox?: Sandbox;
  schema_version?: SchemaVersion2;
  task_id: TaskId;
  thread_id?: ThreadId;
  working_directory: WorkingDirectory;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExpertisePackRef".
 */
export interface ExpertisePackRef {
  pack_id: PackId;
  version: Version1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "BudgetReservation".
 */
export interface BudgetReservation {
  actual_cents?: ActualCents;
  created_at: CreatedAt;
  month: Month;
  predicted_cents: PredictedCents;
  project_id: ProjectId1;
  provider_id: ProviderId;
  request_id: RequestId;
  reservation_id: ReservationId;
  schema_version?: SchemaVersion3;
  state: State;
  task_id?: TaskId1;
  updated_at: UpdatedAt;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Capability".
 */
export interface Capability {
  capability_id: CapabilityId1;
  description: Description1;
  evaluation_requirements: EvaluationRequirements;
  expected_outputs: ExpectedOutputs;
  family: Family;
  required_inputs: RequiredInputs1;
  schema_version?: SchemaVersion4;
  version: Version2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CapabilityGap".
 */
export interface CapabilityGap {
  detected_at: DetectedAt;
  gap_id: GapId;
  missing_capabilities: MissingCapabilities;
  project_id: ProjectId2;
  reason: Reason;
  schema_version?: SchemaVersion5;
  task_id: TaskId2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ContextPackage".
 */
export interface ContextPackage {
  assembled_at: AssembledAt;
  context_id: ContextId;
  decisions: Decisions;
  history_events_included?: HistoryEventsIncluded;
  indexed_resource_count: IndexedResourceCount;
  knowledge: Knowledge;
  project_id: ProjectId6;
  references: References;
  schema_version?: SchemaVersion8;
  selected_resource_count: SelectedResourceCount;
  snippets: Snippets;
  task: TaskContract;
  task_id: TaskId4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InboxDecision".
 */
export interface InboxDecision {
  consequences: Consequences;
  decision_id: DecisionId;
  options: Options;
  plan_id: PlanId;
  project_id: ProjectId3;
  rationale?: Rationale;
  reason: Reason1;
  recommendation: Recommendation;
  schema_version?: SchemaVersion6;
  selected_option?: SelectedOption;
  task_ids: TaskIds;
  title: Title;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeEntry".
 */
export interface KnowledgeEntry {
  confidence: Confidence;
  created_at: CreatedAt1;
  entities: Entities;
  evidence_ids: EvidenceIds;
  kind: Kind1;
  knowledge_id: KnowledgeId;
  project_id: ProjectId5;
  schema_version?: SchemaVersion7;
  source: SourceRef;
  statement: Statement;
  supersedes_id?: SupersedesId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EntityRef".
 */
export interface EntityRef {
  entity_id: EntityId;
  kind: Kind;
  project_id: ProjectId4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SourceRef".
 */
export interface SourceRef {
  locator?: Locator;
  media_type: MediaType;
  sha256: Sha256;
  uri: Uri;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ContextSnippet".
 */
export interface ContextSnippet {
  relevance: Relevance;
  source: SourceRef;
  statement: Statement1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskContract".
 */
export interface TaskContract {
  constraints: Constraints1;
  deliverables: Deliverables;
  dependency_ids: DependencyIds;
  entities: Entities1;
  escalation_criteria: EscalationCriteria;
  objective: Objective;
  parent_task_id?: ParentTaskId;
  permissions: Permissions;
  priority?: Priority;
  project_id: ProjectId7;
  references: References1;
  required_capabilities: RequiredCapabilities;
  required_evaluations: RequiredEvaluations;
  requirements: Requirements;
  schema_version?: SchemaVersion9;
  state?: State1;
  task_id: TaskId3;
  title: Title1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Requirements".
 */
export interface Requirements {
  accessibility: Accessibility;
  functional: Functional;
  production: Production;
  technical: Technical;
  visual: Visual;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Decision".
 */
export interface Decision {
  consequences: Consequences1;
  decided_at: DecidedAt;
  decided_by: DecidedBy;
  decision_id: DecisionId1;
  evidence_ids: EvidenceIds1;
  options: Options1;
  project_id: ProjectId8;
  reason: Reason2;
  recommendation: Recommendation1;
  schema_version?: SchemaVersion10;
  selected_option: SelectedOption1;
  task_id: TaskId5;
  title: Title2;
  urgency: Urgency;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EngineAdapter".
 */
export interface EngineAdapter {
  adapter_id: AdapterId;
  capabilities: Capabilities1;
  engine_type: EngineType;
  schema_version?: SchemaVersion11;
  supported_versions: SupportedVersions;
  tool_ids: ToolIds;
  version: Version3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Evaluation".
 */
export interface Evaluation {
  authority?: Authority;
  claim: Claim;
  evaluated_at: EvaluatedAt;
  evaluation_id: EvaluationId;
  evaluator_id: EvaluatorId;
  evidence_ids: EvidenceIds2;
  gate_id: GateId;
  project_id: ProjectId9;
  rationale: Rationale1;
  result: Result;
  schema_version?: SchemaVersion12;
  task_id: TaskId6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskEvent".
 */
export interface TaskEvent {
  actor_id: ActorId;
  actor_type: ActorType;
  correlation_id: CorrelationId;
  event_id: EventId;
  event_type: EventType;
  payload: TaskEventPayload;
  project_id: ProjectId10;
  schema_version?: SchemaVersion13;
  sequence: Sequence;
  task_id: TaskId8;
  timestamp: Timestamp;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskEventPayload".
 */
export interface TaskEventPayload {
  detail: Detail;
  task_id: TaskId7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentEvent".
 */
export interface AgentEvent {
  actor_id: ActorId1;
  actor_type: ActorType1;
  correlation_id: CorrelationId1;
  event_id: EventId1;
  event_type: EventType1;
  payload: AssignmentPayload;
  project_id: ProjectId11;
  schema_version?: SchemaVersion14;
  sequence: Sequence1;
  task_id: TaskId9;
  timestamp: Timestamp1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AssignmentPayload".
 */
export interface AssignmentPayload {
  agent_id: AgentId2;
  assignment_id: AssignmentId1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvaluationEvent".
 */
export interface EvaluationEvent {
  actor_id: ActorId2;
  actor_type: ActorType2;
  correlation_id: CorrelationId2;
  event_id: EventId2;
  event_type: EventType2;
  payload: EvaluationPayload;
  project_id: ProjectId12;
  schema_version?: SchemaVersion15;
  sequence: Sequence2;
  task_id: TaskId10;
  timestamp: Timestamp2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvaluationPayload".
 */
export interface EvaluationPayload {
  evaluation_id: EvaluationId1;
  evidence_ids: EvidenceIds3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DecisionEvent".
 */
export interface DecisionEvent {
  actor_id: ActorId3;
  actor_type: ActorType3;
  correlation_id: CorrelationId3;
  event_id: EventId3;
  event_type: EventType3;
  payload: DecisionPayload;
  project_id: ProjectId13;
  schema_version?: SchemaVersion16;
  sequence: Sequence3;
  task_id: TaskId11;
  timestamp: Timestamp3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DecisionPayload".
 */
export interface DecisionPayload {
  decision_id: DecisionId2;
  reason: Reason3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ArtifactEvent".
 */
export interface ArtifactEvent {
  actor_id: ActorId4;
  actor_type: ActorType4;
  correlation_id: CorrelationId4;
  event_id: EventId4;
  event_type: EventType4;
  payload: ArtifactPayload;
  project_id: ProjectId14;
  schema_version?: SchemaVersion17;
  sequence: Sequence4;
  task_id: TaskId12;
  timestamp: Timestamp4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ArtifactPayload".
 */
export interface ArtifactPayload {
  artifact: SourceRef;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkspaceBaselineEvent".
 */
export interface WorkspaceBaselineEvent {
  actor_id: ActorId5;
  actor_type: ActorType5;
  correlation_id: CorrelationId5;
  event_id: EventId5;
  event_type: EventType5;
  payload: WorkspaceFingerprint;
  project_id: ProjectId15;
  schema_version?: SchemaVersion19;
  sequence: Sequence5;
  task_id: TaskId13;
  timestamp: Timestamp5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkspaceFingerprint".
 */
export interface WorkspaceFingerprint {
  captured_at: CapturedAt;
  digest: Digest;
  entries: Entries;
  git_head: GitHead;
  git_status?: GitStatus;
  schema_version?: SchemaVersion18;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkspaceEntry".
 */
export interface WorkspaceEntry {
  modified_ns: ModifiedNs;
  path: Path;
  size: Size;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExternalChangeEvent".
 */
export interface ExternalChangeEvent {
  actor_id: ActorId6;
  actor_type: ActorType6;
  correlation_id: CorrelationId6;
  event_id: EventId6;
  event_type: EventType6;
  payload: ExternalChangePayload;
  project_id: ProjectId16;
  schema_version?: SchemaVersion20;
  sequence: Sequence6;
  task_id: TaskId14;
  timestamp: Timestamp6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExternalChangePayload".
 */
export interface ExternalChangePayload {
  baseline_digest: BaselineDigest;
  change_id: ChangeId;
  git_commits?: GitCommits;
  git_diff_summary?: GitDiffSummary;
  observed: WorkspaceFingerprint;
  paths: Paths;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectReconciledEvent".
 */
export interface ProjectReconciledEvent {
  actor_id: ActorId7;
  actor_type: ActorType7;
  correlation_id: CorrelationId7;
  event_id: EventId7;
  event_type: EventType7;
  payload: ReconciliationPayload;
  project_id: ProjectId17;
  schema_version?: SchemaVersion21;
  sequence: Sequence7;
  task_id: TaskId16;
  timestamp: Timestamp7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ReconciliationPayload".
 */
export interface ReconciliationPayload {
  artifacts?: Artifacts;
  change_id: ChangeId1;
  detail: Detail1;
  fingerprint: WorkspaceFingerprint;
  paths: Paths1;
  task_id: TaskId15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendEvent".
 */
export interface SpendEvent {
  actor_id: ActorId8;
  actor_type: ActorType8;
  correlation_id: CorrelationId8;
  event_id: EventId8;
  event_type: EventType8;
  payload: SpendPayload;
  project_id: ProjectId18;
  schema_version?: SchemaVersion22;
  sequence: Sequence8;
  task_id: TaskId17;
  timestamp: Timestamp8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendPayload".
 */
export interface SpendPayload {
  amount_cents: AmountCents;
  provider_id: ProviderId1;
  reservation_id: ReservationId1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderEvent".
 */
export interface ProviderEvent {
  actor_id: ActorId9;
  actor_type: ActorType9;
  correlation_id: CorrelationId9;
  event_id: EventId9;
  event_type: EventType9;
  payload: ProviderPayload;
  project_id: ProjectId19;
  schema_version?: SchemaVersion23;
  sequence: Sequence9;
  task_id: TaskId18;
  timestamp: Timestamp9;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderPayload".
 */
export interface ProviderPayload {
  provider_id: ProviderId2;
  reason: Reason4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderConfiguredEvent".
 */
export interface ProviderConfiguredEvent {
  actor_id: ActorId10;
  actor_type: ActorType10;
  correlation_id: CorrelationId10;
  event_id: EventId10;
  event_type: EventType10;
  payload: ProviderConfiguredPayload;
  project_id: ProjectId20;
  schema_version?: SchemaVersion25;
  sequence: Sequence10;
  task_id: TaskId19;
  timestamp: Timestamp10;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderConfiguredPayload".
 */
export interface ProviderConfiguredPayload {
  provider: Provider;
  request_id: RequestId1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Provider".
 */
export interface Provider {
  adapter_id?: AdapterId1;
  billing: Billing;
  cap: Cap;
  credential_id?: CredentialId;
  currency?: Currency;
  display_name?: DisplayName;
  provider_id: ProviderId3;
  purpose?: Purpose;
  schema_version?: SchemaVersion24;
  state: State2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "UnverifiedCap".
 */
export interface UnverifiedCap {
  verified: Verified;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "VerifiedCap".
 */
export interface VerifiedCap {
  amount_cents: AmountCents1;
  expires_at: ExpiresAt;
  proof: SourceRef;
  provider_side: ProviderSide;
  verification_method: VerificationMethod;
  verified: Verified1;
  verified_at: VerifiedAt;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendApprovedEvent".
 */
export interface SpendApprovedEvent {
  actor_id: ActorId11;
  actor_type: ActorType11;
  correlation_id: CorrelationId11;
  event_id: EventId11;
  event_type: EventType11;
  payload: SpendApproval;
  project_id: ProjectId22;
  schema_version?: SchemaVersion27;
  sequence: Sequence11;
  task_id: TaskId20;
  timestamp: Timestamp11;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendApproval".
 */
export interface SpendApproval {
  amount_cents: AmountCents2;
  approval_id: ApprovalId;
  approved_at: ApprovedAt;
  approved_by?: ApprovedBy;
  expires_at: ExpiresAt1;
  project_id: ProjectId21;
  provider_id: ProviderId4;
  request_id: RequestId2;
  schema_version?: SchemaVersion26;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "BudgetReservationEvent".
 */
export interface BudgetReservationEvent {
  actor_id: ActorId12;
  actor_type: ActorType12;
  correlation_id: CorrelationId12;
  event_id: EventId12;
  event_type: EventType12;
  payload: BudgetReservation;
  project_id: ProjectId23;
  schema_version?: SchemaVersion28;
  sequence: Sequence12;
  task_id: TaskId21;
  timestamp: Timestamp12;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PaidInvocationEvent".
 */
export interface PaidInvocationEvent {
  actor_id: ActorId13;
  actor_type: ActorType13;
  correlation_id: CorrelationId13;
  event_id: EventId13;
  event_type: EventType13;
  payload: PaidInvocationRecord;
  project_id: ProjectId25;
  schema_version?: SchemaVersion30;
  sequence: Sequence13;
  task_id: TaskId23;
  timestamp: Timestamp13;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PaidInvocationRecord".
 */
export interface PaidInvocationRecord {
  actual_cents?: ActualCents1;
  detail: Detail2;
  invocation_id: InvocationId;
  predicted_cents: PredictedCents1;
  project_id: ProjectId24;
  provider_id: ProviderId5;
  recorded_at: RecordedAt;
  request_id: RequestId3;
  reservation_id: ReservationId2;
  schema_version?: SchemaVersion29;
  state: State3;
  task_id?: TaskId22;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CommitEvent".
 */
export interface CommitEvent {
  actor_id: ActorId14;
  actor_type: ActorType14;
  correlation_id: CorrelationId14;
  event_id: EventId14;
  event_type: EventType14;
  payload: CommitPayload;
  project_id: ProjectId26;
  schema_version?: SchemaVersion31;
  sequence: Sequence14;
  task_id: TaskId24;
  timestamp: Timestamp14;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CommitPayload".
 */
export interface CommitPayload {
  commit_id: CommitId;
  workspace: Workspace;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectInitializedEvent".
 */
export interface ProjectInitializedEvent {
  actor_id: ActorId15;
  actor_type: ActorType15;
  correlation_id: CorrelationId15;
  event_id: EventId15;
  event_type: EventType15;
  payload: ProjectInitializedPayload;
  project_id: ProjectId28;
  schema_version?: SchemaVersion35;
  sequence: Sequence15;
  task_id: TaskId25;
  timestamp: Timestamp15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectInitializedPayload".
 */
export interface ProjectInitializedPayload {
  intake: InitializationReport;
  policy: Policy;
  project: Project;
  workspace?: WorkspaceFingerprint | null;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InitializationReport".
 */
export interface InitializationReport {
  findings: Findings;
  git_head: GitHead1;
  git_recent_commits: GitRecentCommits;
  inspected_assets: InspectedAssets;
  inspected_documents: InspectedDocuments;
  repository_root: RepositoryRoot;
  required_capabilities: RequiredCapabilities1;
  schema_version?: SchemaVersion32;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InitializationFinding".
 */
export interface InitializationFinding {
  field: Field;
  kind: Kind2;
  source: Source;
  value: Value;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Policy".
 */
export interface Policy {
  approval_threshold_cents?: ApprovalThresholdCents;
  authority?: Authority1;
  currency?: Currency1;
  monthly_external_budget_cents?: MonthlyExternalBudgetCents;
  post_specialist_nonprogress_limit?: PostSpecialistNonprogressLimit;
  proactivity?: Proactivity;
  project_id: ProjectId27;
  require_provider_hard_cap?: RequireProviderHardCap;
  require_registration_or_reconciliation?: RequireRegistrationOrReconciliation;
  schema_version?: SchemaVersion33;
  worker_permissions?: Permissions;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Project".
 */
export interface Project {
  audio: Direction;
  constraints: Constraints2;
  engine?: Engine | null;
  input_methods: InputMethods;
  locked_decision_ids: LockedDecisionIds;
  medium: Medium;
  multiplayer: Multiplayer;
  platforms: Platforms;
  production: Production1;
  project: ProjectIdentity;
  rendering: Rendering;
  schema_version?: SchemaVersion34;
  visual: Direction;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Direction".
 */
export interface Direction {
  direction: Direction1;
  references: References2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Engine".
 */
export interface Engine {
  type: Type;
  version: Version4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Multiplayer".
 */
export interface Multiplayer {
  max_players: MaxPlayers;
  type: Type1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Production".
 */
export interface Production1 {
  current_milestone: CurrentMilestone;
  stage: Stage;
  team_size: TeamSize;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectIdentity".
 */
export interface ProjectIdentity {
  description: Description2;
  id: Id;
  name: Name1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskProposedEvent".
 */
export interface TaskProposedEvent {
  actor_id: ActorId16;
  actor_type: ActorType16;
  correlation_id: CorrelationId16;
  event_id: EventId16;
  event_type: EventType16;
  payload: TaskContract;
  project_id: ProjectId29;
  schema_version?: SchemaVersion36;
  sequence: Sequence16;
  task_id: TaskId26;
  timestamp: Timestamp16;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PolicyUpdatedEvent".
 */
export interface PolicyUpdatedEvent {
  actor_id: ActorId17;
  actor_type: ActorType17;
  correlation_id: CorrelationId17;
  event_id: EventId17;
  event_type: EventType17;
  payload: Policy;
  project_id: ProjectId30;
  schema_version?: SchemaVersion37;
  sequence: Sequence17;
  task_id: TaskId27;
  timestamp: Timestamp17;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerEvent".
 */
export interface WorkerEvent {
  actor_id: ActorId18;
  actor_type: ActorType18;
  correlation_id: CorrelationId18;
  event_id: EventId18;
  event_type: EventType18;
  payload: WorkerRecord;
  project_id: ProjectId33;
  schema_version?: SchemaVersion42;
  sequence: Sequence18;
  task_id: TaskId30;
  timestamp: Timestamp18;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerRecord".
 */
export interface WorkerRecord {
  context_package?: ContextPackage | null;
  cwd: Cwd;
  detail: Detail3;
  expertise_packs?: ExpertisePacks1;
  knowledge_packet?: KnowledgePacket | null;
  knowledge_packet_id?: KnowledgePacketId1;
  project_id: ProjectId32;
  result?: WorkerResult | null;
  schema_version?: SchemaVersion41;
  specialist?: AgentDefinition | null;
  state: State4;
  task_id: TaskId29;
  thread_id: ThreadId1;
  turn_id?: TurnId;
  worker_id: WorkerId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgePacket".
 */
export interface KnowledgePacket {
  agent_id: AgentId3;
  assembled_at: AssembledAt1;
  capability_ids: CapabilityIds;
  context_package_id?: ContextPackageId;
  expertise_packs?: ExpertisePacks2;
  items?: Items;
  methods?: Methods;
  missing_knowledge_flags?: MissingKnowledgeFlags;
  packet_id: PacketId;
  project_id: ProjectId31;
  project_intelligence_digest?: ProjectIntelligenceDigest;
  project_sources?: ProjectSources;
  schema_version?: SchemaVersion39;
  selected_method_ids?: SelectedMethodIds;
  sources?: Sources;
  stale_knowledge_flags?: StaleKnowledgeFlags;
  task_id: TaskId28;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RetrievedKnowledge".
 */
export interface RetrievedKnowledge {
  authority: Authority2;
  confidence: Confidence1;
  freshness_class: FreshnessClass;
  kind: Kind3;
  method_ids?: MethodIds;
  pack?: ExpertisePackRef | null;
  plane: Plane;
  project_knowledge_id?: ProjectKnowledgeId;
  relevance: Relevance1;
  retrieval_id: RetrievalId;
  selection_reason: SelectionReason;
  source_ids?: SourceIds;
  statement: Statement2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeMethod".
 */
export interface KnowledgeMethod {
  applicable_capability_ids: ApplicableCapabilityIds;
  evidence_requirements: EvidenceRequirements;
  method_id: MethodId;
  purpose: Purpose1;
  schema_version?: SchemaVersion38;
  source_ids: SourceIds1;
  steps: Steps;
  title: Title3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeSource".
 */
export interface KnowledgeSource {
  applicable_capability_ids?: ApplicableCapabilityIds1;
  author?: Author;
  authority: Authority3;
  fresh_until?: FreshUntil;
  freshness_class: FreshnessClass1;
  license?: License;
  published_at?: PublishedAt;
  publisher?: Publisher;
  retrieved_at: RetrievedAt;
  schema_version?: SchemaVersion40;
  source_id: SourceId;
  source_type: SourceType;
  title: Title4;
  uri: Uri1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerResult".
 */
export interface WorkerResult {
  findings: Findings1;
  missing_evidence?: MissingEvidence;
  next_steps: NextSteps;
  professional_reasoning?: ProfessionalReasoning;
  project_evidence?: ProjectEvidence;
  qa_plan?: QaPlan;
  source_ids?: SourceIds2;
  summary: Summary;
  uncertainty?: Uncertainty;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GMEvent".
 */
export interface GMEvent {
  actor_id: ActorId19;
  actor_type: ActorType19;
  correlation_id: CorrelationId19;
  event_id: EventId19;
  event_type: EventType19;
  payload: GMRecord;
  project_id: ProjectId35;
  schema_version?: SchemaVersion44;
  sequence: Sequence19;
  task_id: TaskId31;
  timestamp: Timestamp19;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GMRecord".
 */
export interface GMRecord {
  detail: Detail4;
  objective: Objective1;
  project_id: ProjectId34;
  request_id: RequestId4;
  schema_version?: SchemaVersion43;
  state: State5;
  thread_id: ThreadId2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanEvent".
 */
export interface PlanEvent {
  actor_id: ActorId20;
  actor_type: ActorType20;
  correlation_id: CorrelationId20;
  event_id: EventId20;
  event_type: EventType20;
  payload: ProductionPlan;
  project_id: ProjectId37;
  schema_version?: SchemaVersion46;
  sequence: Sequence20;
  task_id: TaskId33;
  timestamp: Timestamp20;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionPlan".
 */
export interface ProductionPlan {
  assignments: Assignments;
  objective: Objective2;
  plan_id: PlanId1;
  policy: Policy;
  project_id: ProjectId36;
  questions: Questions;
  schema_version?: SchemaVersion45;
  summary: Summary1;
  tasks: Tasks;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanAssignment".
 */
export interface PlanAssignment {
  agent: AgentDefinition | null;
  missing_capabilities: MissingCapabilities1;
  task_id: TaskId32;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanQuestion".
 */
export interface PlanQuestion {
  affected_step_keys: AffectedStepKeys;
  category: Category;
  consequences: Consequences2;
  key: Key;
  options: Options2;
  reason: Reason5;
  recommendation: Recommendation2;
  title: Title5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InboxEvent".
 */
export interface InboxEvent {
  actor_id: ActorId21;
  actor_type: ActorType21;
  correlation_id: CorrelationId21;
  event_id: EventId21;
  event_type: EventType21;
  payload: InboxDecision;
  project_id: ProjectId38;
  schema_version?: SchemaVersion47;
  sequence: Sequence21;
  task_id: TaskId34;
  timestamp: Timestamp21;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IntelligenceEvent".
 */
export interface IntelligenceEvent {
  actor_id: ActorId22;
  actor_type: ActorType22;
  correlation_id: CorrelationId22;
  event_id: EventId22;
  event_type: EventType22;
  payload: ProjectIntelligence;
  project_id: ProjectId40;
  schema_version?: SchemaVersion49;
  sequence: Sequence22;
  task_id: TaskId35;
  timestamp: Timestamp22;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectIntelligence".
 */
export interface ProjectIntelligence {
  indexed_at: IndexedAt;
  knowledge: Knowledge1;
  project_id: ProjectId39;
  resources: Resources;
  schema_version?: SchemaVersion48;
  workspace_digest: WorkspaceDigest;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IndexedResource".
 */
export interface IndexedResource {
  excerpt?: Excerpt;
  kind: Kind4;
  media_type: MediaType1;
  path: Path1;
  sha256: Sha2561;
  size: Size1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvidenceRecordedEvent".
 */
export interface EvidenceRecordedEvent {
  actor_id: ActorId23;
  actor_type: ActorType23;
  correlation_id: CorrelationId23;
  event_id: EventId23;
  event_type: EventType23;
  payload: Evidence;
  project_id: ProjectId42;
  schema_version?: SchemaVersion51;
  sequence: Sequence23;
  task_id: TaskId37;
  timestamp: Timestamp23;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Evidence".
 */
export interface Evidence {
  capture_origin: CaptureOrigin;
  captured_at: CapturedAt1;
  evidence_class: EvidenceClass;
  evidence_id: EvidenceId;
  producer_id: ProducerId;
  producer_type: ProducerType;
  project_id: ProjectId41;
  schema_version?: SchemaVersion50;
  source: SourceRef;
  summary: Summary2;
  task_id: TaskId36;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvaluationRecordedEvent".
 */
export interface EvaluationRecordedEvent {
  actor_id: ActorId24;
  actor_type: ActorType24;
  correlation_id: CorrelationId24;
  event_id: EventId24;
  event_type: EventType24;
  payload: Evaluation;
  project_id: ProjectId43;
  schema_version?: SchemaVersion52;
  sequence: Sequence24;
  task_id: TaskId38;
  timestamp: Timestamp24;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentEvent".
 */
export interface RecruitmentEvent {
  actor_id: ActorId25;
  actor_type: ActorType25;
  correlation_id: CorrelationId25;
  event_id: EventId25;
  event_type: EventType25;
  payload: RecruitmentRecord;
  project_id: ProjectId45;
  schema_version?: SchemaVersion57;
  sequence: Sequence25;
  task_id: TaskId40;
  timestamp: Timestamp25;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentRecord".
 */
export interface RecruitmentRecord {
  adjacent_agent_ids: AdjacentAgentIds;
  audition?: AgentAudition | null;
  candidate: AgentDefinition;
  created_at: CreatedAt2;
  diagnosis: RecruitmentDiagnosis;
  expertise_packs?: ExpertisePacks3;
  expertise_snapshot?: ExpertiseSnapshot;
  gap: CapabilityGap;
  missing_expertise_capabilities?: MissingExpertiseCapabilities;
  project_id: ProjectId44;
  recruitment_id: RecruitmentId;
  schema_version?: SchemaVersion56;
  state: State7;
  task_id: TaskId39;
  tool_discoveries: ToolDiscoveries;
  updated_at: UpdatedAt1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentAudition".
 */
export interface AgentAudition {
  audition_id: AuditionId;
  candidate_id: CandidateId;
  evaluated_at: EvaluatedAt1;
  representative_objective: RepresentativeObjective;
  result: Result1;
  review: AuditionReview;
  sandbox?: Sandbox1;
  schema_version?: SchemaVersion53;
  submission: AuditionSubmission;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AuditionReview".
 */
export interface AuditionReview {
  dimensions: Dimensions;
  rationale: Rationale2;
  recommendation: Recommendation3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AuditionDimension".
 */
export interface AuditionDimension {
  detail: Detail5;
  dimension: Dimension;
  result: Result2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AuditionSubmission".
 */
export interface AuditionSubmission {
  requested_tool_ids?: RequestedToolIds;
  risks: Risks;
  summary: Summary3;
  test_cases: TestCases;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AuditionTestCase".
 */
export interface AuditionTestCase {
  capability_id: CapabilityId2;
  evidence_class: EvidenceClass1;
  expected_result: ExpectedResult;
  procedure: Procedure;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentDiagnosis".
 */
export interface RecruitmentDiagnosis {
  action: Action;
  agent_id?: AgentId4;
  detail: Detail6;
  missing_pack_ids?: MissingPackIds;
  missing_tool_ids?: MissingToolIds;
  problem: Problem;
  required_pack_ids?: RequiredPackIds;
  stale_pack_ids?: StalePackIds;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExpertisePack".
 */
export interface ExpertisePack {
  capability_ids: CapabilityIds1;
  created_at: CreatedAt3;
  description: Description3;
  domain_ids: DomainIds;
  evaluation_ids: EvaluationIds;
  items: Items1;
  methods: Methods1;
  name: Name2;
  pack_id: PackId1;
  required_tool_ids?: RequiredToolIds;
  reviewed_at?: ReviewedAt;
  schema_version?: SchemaVersion55;
  sources: Sources1;
  state: State6;
  supersedes_version?: SupersedesVersion;
  version: Version5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExpertiseKnowledgeItem".
 */
export interface ExpertiseKnowledgeItem {
  capability_ids: CapabilityIds2;
  confidence: Confidence2;
  domain_ids: DomainIds1;
  freshness_class: FreshnessClass2;
  item_id: ItemId;
  kind: Kind5;
  method_ids?: MethodIds1;
  schema_version?: SchemaVersion54;
  source_ids: SourceIds3;
  statement: Statement3;
  title: Title6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ToolDiscovery".
 */
export interface ToolDiscovery {
  capability_ids: CapabilityIds3;
  decision: Decision1;
  detail: Detail7;
  tool_id: ToolId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GateWaivedEvent".
 */
export interface GateWaivedEvent {
  actor_id: ActorId26;
  actor_type: ActorType26;
  correlation_id: CorrelationId26;
  event_id: EventId26;
  event_type: EventType26;
  payload: GateWaiver;
  project_id: ProjectId47;
  schema_version?: SchemaVersion59;
  sequence: Sequence26;
  task_id: TaskId42;
  timestamp: Timestamp26;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GateWaiver".
 */
export interface GateWaiver {
  gate_id: GateId1;
  project_id: ProjectId46;
  reason: Reason6;
  schema_version?: SchemaVersion58;
  task_id: TaskId41;
  waived_at: WaivedAt;
  waived_by: WaivedBy;
  waiver_id: WaiverId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelBenchmarkEvent".
 */
export interface ModelBenchmarkEvent {
  actor_id: ActorId27;
  actor_type: ActorType27;
  correlation_id: CorrelationId27;
  event_id: EventId27;
  event_type: EventType27;
  payload: ModelBenchmark;
  project_id: ProjectId49;
  schema_version?: SchemaVersion61;
  sequence: Sequence27;
  task_id: TaskId44;
  timestamp: Timestamp27;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelBenchmark".
 */
export interface ModelBenchmark {
  benchmark_id: BenchmarkId;
  benchmarked_at: BenchmarkedAt;
  completion_tokens: CompletionTokens;
  contract_score: ContractScore;
  latency_ms: LatencyMs;
  model_digest: ModelDigest;
  model_name: ModelName;
  output_channel?: OutputChannel;
  project_id: ProjectId48;
  prompt_sha256: PromptSha256;
  prompt_tokens: PromptTokens;
  required_capability_ids: RequiredCapabilityIds;
  response?: SourceRef | null;
  result: Result3;
  schema_version?: SchemaVersion60;
  summary: Summary4;
  task_id: TaskId43;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRoutingEvent".
 */
export interface ModelRoutingEvent {
  actor_id: ActorId28;
  actor_type: ActorType28;
  correlation_id: CorrelationId28;
  event_id: EventId28;
  event_type: EventType28;
  payload: ModelRoutingRecord;
  project_id: ProjectId51;
  schema_version?: SchemaVersion63;
  sequence: Sequence28;
  task_id: TaskId46;
  timestamp: Timestamp28;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRoutingRecord".
 */
export interface ModelRoutingRecord {
  candidates: Candidates;
  created_at: CreatedAt4;
  project_id: ProjectId50;
  reason: Reason8;
  routing_id: RoutingId;
  schema_version?: SchemaVersion62;
  selected_model_name?: SelectedModelName;
  selected_provider_id?: SelectedProviderId;
  selected_route: SelectedRoute;
  task_id: TaskId45;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRouteCandidate".
 */
export interface ModelRouteCandidate {
  confidence: Confidence3;
  expected_external_cost_avoided_cents: ExpectedExternalCostAvoidedCents;
  expected_external_cost_cents?: ExpectedExternalCostCents;
  expected_quality: ExpectedQuality;
  expected_runtime_ms?: ExpectedRuntimeMs;
  model_name?: ModelName1;
  provider_id?: ProviderId6;
  reason: Reason7;
  route: Route;
  viable: Viable;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainInspectionEvent".
 */
export interface ProductionDomainInspectionEvent {
  actor_id: ActorId29;
  actor_type: ActorType29;
  correlation_id: CorrelationId29;
  event_id: EventId29;
  event_type: EventType29;
  payload: ProductionDomainInspection;
  project_id: ProjectId53;
  schema_version?: SchemaVersion65;
  sequence: Sequence29;
  task_id: TaskId48;
  timestamp: Timestamp29;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainInspection".
 */
export interface ProductionDomainInspection {
  domain_id: DomainId;
  evaluation_id: EvaluationId2;
  evidence_id: EvidenceId1;
  findings: Findings2;
  inspected_at: InspectedAt;
  inspected_file_count: InspectedFileCount;
  inspection_id: InspectionId;
  project_id: ProjectId52;
  schema_version?: SchemaVersion64;
  status: Status;
  task_id: TaskId47;
  tool_id: ToolId1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainFinding".
 */
export interface ProductionDomainFinding {
  detail: Detail8;
  finding_id: FindingId;
  paths?: Paths2;
  severity: Severity;
  title: Title7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "OnboardingEvent".
 */
export interface OnboardingEvent {
  actor_id: ActorId30;
  actor_type: ActorType30;
  correlation_id: CorrelationId30;
  event_id: EventId30;
  event_type: EventType30;
  payload: OnboardingEventPayload;
  project_id: ProjectId56;
  schema_version?: SchemaVersion68;
  sequence: Sequence30;
  task_id: TaskId49;
  timestamp: Timestamp30;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "OnboardingEventPayload".
 */
export interface OnboardingEventPayload {
  assessment?: LeadDomainAssessment | null;
  detail: Detail9;
  domain?: Domain1;
  onboarding?: ProjectOnboarding | null;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LeadDomainAssessment".
 */
export interface LeadDomainAssessment {
  agent_id: AgentId5;
  assessed_at: AssessedAt;
  assessment_id: AssessmentId;
  assumptions: Assumptions;
  contradictions: Contradictions;
  domain: Domain;
  evidence: Evidence1;
  expertise_packs?: ExpertisePacks4;
  inferred_facts: InferredFacts;
  knowledge_packet?: KnowledgePacket | null;
  known_facts: KnownFacts;
  project_id: ProjectId54;
  readiness: DomainReadiness;
  recommendations: Recommendations;
  requested_human_inputs: RequestedHumanInputs;
  risks: Risks1;
  schema_version?: SchemaVersion66;
  summary: Summary5;
  unknowns: Unknowns;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DomainAssumption".
 */
export interface DomainAssumption {
  confidence: Confidence4;
  expires_when: ExpiresWhen;
  impact: Impact;
  statement: Statement4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DomainReadiness".
 */
export interface DomainReadiness {
  confidence: Confidence5;
  status: Status1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DomainUnknown".
 */
export interface DomainUnknown {
  blocks_current_work: BlocksCurrentWork;
  impact: Impact1;
  question: Question;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectOnboarding".
 */
export interface ProjectOnboarding {
  assessments: Assessments;
  blocking_questions: BlockingQuestions;
  completed_at: CompletedAt;
  deferred_questions: DeferredQuestions;
  onboarding_id: OnboardingId;
  project_id: ProjectId55;
  reconciliation_summary: ReconciliationSummary;
  reconnaissance_summary: ReconnaissanceSummary;
  relevant_domains: RelevantDomains;
  schema_version?: SchemaVersion67;
  started_at: StartedAt;
  state: State8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExperienceObservedEvent".
 */
export interface ExperienceObservedEvent {
  actor_id: ActorId31;
  actor_type: ActorType31;
  correlation_id: CorrelationId31;
  event_id: EventId31;
  event_type: EventType31;
  payload: ExperienceObservation;
  project_id: ProjectId58;
  schema_version?: SchemaVersion70;
  sequence: Sequence31;
  task_id: TaskId51;
  timestamp: Timestamp31;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExperienceObservation".
 */
export interface ExperienceObservation {
  agent_id?: AgentId6;
  capability_ids: CapabilityIds4;
  conclusion: Conclusion;
  confidence: Confidence6;
  context_tags?: ContextTags;
  created_at: CreatedAt5;
  evaluation_id?: EvaluationId3;
  evidence_ids: EvidenceIds4;
  expertise_packs?: ExpertisePacks5;
  method_ids?: MethodIds2;
  observation_id: ObservationId;
  outcome?: Outcome;
  project_id: ProjectId57;
  schema_version?: SchemaVersion69;
  scope?: Scope;
  source: SourceRef;
  state: State9;
  task_id: TaskId50;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExperienceLessonEvent".
 */
export interface ExperienceLessonEvent {
  actor_id: ActorId32;
  actor_type: ActorType32;
  correlation_id: CorrelationId32;
  event_id: EventId32;
  event_type: EventType32;
  payload: ExperienceLesson;
  project_id: ProjectId60;
  schema_version?: SchemaVersion72;
  sequence: Sequence32;
  task_id: TaskId52;
  timestamp: Timestamp32;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExperienceLesson".
 */
export interface ExperienceLesson {
  applicability: Applicability;
  capability_ids: CapabilityIds5;
  confidence: Confidence7;
  created_at: CreatedAt6;
  lesson_id: LessonId;
  limitations: Limitations;
  observation_ids: ObservationIds;
  project_id: ProjectId59;
  proposer_id: ProposerId;
  review_detail?: ReviewDetail;
  reviewed_at?: ReviewedAt1;
  reviewer_id?: ReviewerId;
  schema_version?: SchemaVersion71;
  scope?: Scope1;
  state: State10;
  statement: Statement5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorldResearchEvent".
 */
export interface WorldResearchEvent {
  actor_id: ActorId33;
  actor_type: ActorType33;
  correlation_id: CorrelationId33;
  event_id: EventId33;
  event_type: EventType33;
  payload: WorldResearch;
  project_id: ProjectId62;
  schema_version?: SchemaVersion74;
  sequence: Sequence33;
  task_id: TaskId54;
  timestamp: Timestamp33;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorldResearch".
 */
export interface WorldResearch {
  artifact?: SourceRef | null;
  detail: Detail10;
  excerpt?: Excerpt1;
  project_id: ProjectId61;
  requirement: Requirement;
  research_id: ResearchId;
  researched_at: ResearchedAt;
  schema_version?: SchemaVersion73;
  source?: KnowledgeSource | null;
  state: State11;
  task_id: TaskId53;
  url: Url;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExpertiseBenchmarkScenario".
 */
export interface ExpertiseBenchmarkScenario {
  acceptable_source_ids?: AcceptableSourceIds;
  applies_to_versions: AppliesToVersions;
  benchmark_id: BenchmarkId1;
  capability_ids: CapabilityIds6;
  discriminates: Discriminates;
  expected_specialist_findings: ExpectedSpecialistFindings;
  expected_uncertainty?: ExpectedUncertainty;
  pack_id: PackId2;
  scenario: Scenario;
  schema_version?: SchemaVersion75;
  scoring_notes: ScoringNotes;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LocalHardwareInventory".
 */
export interface LocalHardwareInventory {
  captured_at: CapturedAt2;
  cpu: Cpu;
  graphics?: Graphics;
  logical_core_count: LogicalCoreCount;
  machine_id: MachineId;
  operating_system: OperatingSystem;
  physical_core_count?: PhysicalCoreCount;
  ram_bytes?: RamBytes;
  schema_version?: SchemaVersion76;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GraphicsDevice".
 */
export interface GraphicsDevice {
  driver_version?: DriverVersion;
  memory_bytes?: MemoryBytes;
  name: Name3;
  vendor: Vendor;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LocalModelInventory".
 */
export interface LocalModelInventory {
  detail: Detail11;
  endpoint: Endpoint;
  inspected_at: InspectedAt1;
  models?: Models;
  runtime_id?: RuntimeId;
  schema_version?: SchemaVersion77;
  state: State12;
  version?: Version6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LocalModel".
 */
export interface LocalModel {
  context_limit?: ContextLimit;
  digest: Digest1;
  fits_memory: FitsMemory;
  modalities: Modalities;
  modified_at: ModifiedAt;
  name: Name4;
  parameter_size?: ParameterSize;
  quantization_level?: QuantizationLevel;
  size_bytes: SizeBytes;
  tool_support?: ToolSupport;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LocalModelRecommendation".
 */
export interface LocalModelRecommendation {
  action: Action1;
  alternatives?: Alternatives1;
  candidate?: ModelCatalogCandidate | null;
  catalog_checked_at: CatalogCheckedAt;
  catalog_sha256?: CatalogSha256;
  catalog_state: CatalogState;
  catalog_url: CatalogUrl;
  install_command?: InstallCommand;
  installed?: Installed1;
  project_id: ProjectId63;
  reason: Reason10;
  recommendation_id: RecommendationId;
  recommended_model_name?: RecommendedModelName;
  required_capability_ids: RequiredCapabilityIds1;
  schema_version?: SchemaVersion78;
  task_id: TaskId55;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelCatalogCandidate".
 */
export interface ModelCatalogCandidate {
  description: Description4;
  estimated_size_bytes: EstimatedSizeBytes;
  family: Family1;
  installed: Installed;
  memory_tier: MemoryTier;
  modalities: Modalities1;
  name: Name5;
  parameter_size: ParameterSize1;
  reason: Reason9;
  source_url: SourceUrl;
  suitability_score: SuitabilityScore;
  thinking_support: ThinkingSupport;
  tool_support: ToolSupport1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainDefinition".
 */
export interface ProductionDomainDefinition {
  accepted_extensions: AcceptedExtensions;
  capability_ids: CapabilityIds7;
  description: Description5;
  domain_id: DomainId1;
  gate_ids: GateIds;
  schema_version?: SchemaVersion79;
  title: Title8;
  tool_ids: ToolIds1;
  version: Version7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QAGateDefinition".
 */
export interface QAGateDefinition {
  allowed_producer_types: AllowedProducerTypes;
  claim: Claim1;
  description: Description6;
  discipline: Discipline;
  gate_id: GateId2;
  required_evidence_classes: RequiredEvidenceClasses;
  requires_independent_verification?: RequiresIndependentVerification;
  requires_runtime_capture?: RequiresRuntimeCapture;
  schema_version?: SchemaVersion80;
  title: Title9;
  version: Version8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QAReport".
 */
export interface QAReport {
  completion_state: CompletionState;
  explanation: Explanation;
  gates: Gates;
  generated_at: GeneratedAt;
  passed_gate_count: PassedGateCount;
  project_id: ProjectId64;
  report_id: ReportId;
  required_gate_count: RequiredGateCount;
  schema_version?: SchemaVersion81;
  task_id: TaskId56;
  waived_gate_count: WaivedGateCount;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QAGateStatus".
 */
export interface QAGateStatus {
  evidence_ids?: EvidenceIds5;
  explanation: Explanation1;
  gate: QAGateDefinition;
  latest_evaluation_id?: LatestEvaluationId;
  required: Required;
  state: State13;
  waiver_id?: WaiverId1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ToolDefinition".
 */
export interface ToolDefinition {
  capabilities: Capabilities2;
  cost_policy: ResourcePolicy;
  health_check: HealthCheck;
  input_contract: InputContract;
  install_state: InstallState;
  invocation: Invocation;
  location: Location;
  output_contract: OutputContract1;
  permissions: Permissions;
  schema_version?: SchemaVersion82;
  tool_id: ToolId2;
  version: Version9;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentKnowledgeCatalog".
 */
export interface AgentKnowledgeCatalog {
  profiles: Profiles;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentKnowledgeProfile".
 */
export interface AgentKnowledgeProfile {
  agent_id: AgentId7;
  method_performance?: MethodPerformance;
  methods: Methods2;
  pack_performance?: PackPerformance;
  packet: KnowledgePacket;
  qualification_state: QualificationState;
  recorded_packets?: RecordedPackets;
  required_pack_ids: RequiredPackIds1;
  resolved_packs: ResolvedPacks;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgePerformanceSummary".
 */
export interface KnowledgePerformanceSummary {
  failed_count: FailedCount1;
  inconclusive_count: InconclusiveCount;
  interpretation?: Interpretation;
  passed_count: PassedCount1;
  subject: Subject;
  task_count: TaskCount1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentRegistrySnapshot".
 */
export interface AgentRegistrySnapshot {
  entries: Entries1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "BudgetLedger".
 */
export interface BudgetLedger {
  available_cents: AvailableCents;
  budget_cents: BudgetCents;
  month: Month1;
  reserved_cents: ReservedCents;
  settled_cents: SettledCents;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ContextCommand".
 */
export interface ContextCommand {
  task_id: TaskId57;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DecisionCommand".
 */
export interface DecisionCommand {
  decision_id: DecisionId3;
  rationale: Rationale3;
  request_id: RequestId5;
  selected_option: SelectedOption2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EngineNodeInspection".
 */
export interface EngineNodeInspection {
  node_type: NodeType;
  path: Path2;
  scene: Scene;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EngineProjectInspection".
 */
export interface EngineProjectInspection {
  adapter: EngineAdapter;
  approved_assets: ApprovedAssets;
  engine_version: EngineVersion;
  inspected_at: InspectedAt2;
  main_scene: MainScene;
  project_id: ProjectId65;
  project_path: ProjectPath;
  task_id: TaskId58;
  ui_nodes: UiNodes;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EventPage".
 */
export interface EventPage {
  cursor: Cursor;
  events: Events;
  has_more: HasMore;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ExpertiseBaselineStatus".
 */
export interface ExpertiseBaselineStatus {
  pack_id: PackId3;
  state: State14;
  version?: Version10;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GateWaiverCommand".
 */
export interface GateWaiverCommand {
  gate_id: GateId3;
  reason: Reason11;
  request_id: RequestId6;
  task_id: TaskId59;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GlobalExperience".
 */
export interface GlobalExperience {
  applicability: Applicability1;
  capability_ids: CapabilityIds8;
  confidence: Confidence8;
  evidence_digests: EvidenceDigests;
  lesson_id: LessonId1;
  limitations: Limitations1;
  reviewed_at: ReviewedAt2;
  reviewer_id?: ReviewerId1;
  schema_version?: SchemaVersion83;
  scope: Scope2;
  scope_constraint?: ScopeConstraint;
  statement: Statement6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "HumanReviewCommand".
 */
export interface HumanReviewCommand {
  gate_id: GateId4;
  request_id: RequestId7;
  summary: Summary6;
  supporting_evidence_ids?: SupportingEvidenceIds;
  task_id: TaskId60;
  verdict: Verdict;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IntelligenceRefreshCommand".
 */
export interface IntelligenceRefreshCommand {
  request_id: RequestId8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeCatalog".
 */
export interface KnowledgeCatalog {
  auditions?: Auditions;
  baseline?: Baseline;
  candidates?: Candidates1;
  global_experience?: GlobalExperience1;
  lifecycle?: Lifecycle1;
  maintenance_flags?: MaintenanceFlags;
  packs: Packs;
  reviews?: Reviews;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackAudition".
 */
export interface PackAudition {
  audition_id: AuditionId1;
  baseline_score: BaselineScore;
  benchmark_id: BenchmarkId2;
  candidate_score: CandidateScore;
  candidate_sha256: CandidateSha256;
  detail: Detail12;
  evidence: SourceRef;
  evidence_class?: EvidenceClass2;
  pack: ExpertisePackRef;
  recorded_at: RecordedAt1;
  reviewer_id?: ReviewerId2;
  schema_version?: SchemaVersion84;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackLifecycleRecord".
 */
export interface PackLifecycleRecord {
  pack: ExpertisePackRef;
  reason: Reason12;
  record_id: RecordId;
  recorded_at: RecordedAt2;
  reviewer_id?: ReviewerId3;
  schema_version?: SchemaVersion85;
  state: State15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackReview".
 */
export interface PackReview {
  candidate_sha256: CandidateSha2561;
  contradictions_checked: ContradictionsChecked;
  decision: Decision2;
  detail: Detail13;
  licensing_checked: LicensingChecked;
  pack: ExpertisePackRef;
  privacy_checked: PrivacyChecked;
  provenance_checked: ProvenanceChecked;
  reviewed_at: ReviewedAt3;
  reviewer_id?: ReviewerId4;
  schema_version?: SchemaVersion86;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeMaintenanceReport".
 */
export interface KnowledgeMaintenanceReport {
  benchmark_regressions?: BenchmarkRegressions;
  broken_sources?: BrokenSources;
  contradiction_candidates?: ContradictionCandidates;
  deprecated_versions?: DeprecatedVersions;
  ran_at: RanAt;
  rebuilt_full_text_index: RebuiltFullTextIndex;
  run_id: RunId;
  stale_sources?: StaleSources;
  state: State16;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LearningMaintenanceStatus".
 */
export interface LearningMaintenanceStatus {
  detail?: Detail14;
  enabled: Enabled;
  knowledge_report?: KnowledgeMaintenanceReport | null;
  last_completed_at?: LastCompletedAt;
  last_started_at?: LastStartedAt;
  state: State17;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LessonPromotionCommand".
 */
export interface LessonPromotionCommand {
  applicability: Applicability2;
  generalization_reviewed: GeneralizationReviewed;
  lesson_id: LessonId2;
  limitations: Limitations2;
  privacy_checked: PrivacyChecked1;
  scope: Scope3;
  scope_constraint?: ScopeConstraint1;
  statement: Statement7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LessonReviewCommand".
 */
export interface LessonReviewCommand {
  decision: Decision3;
  detail: Detail15;
  lesson_id: LessonId3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelBenchmarkCommand".
 */
export interface ModelBenchmarkCommand {
  model_name?: ModelName2;
  request_id: RequestId9;
  task_id: TaskId61;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelEnvironment".
 */
export interface ModelEnvironment {
  hardware: LocalHardwareInventory;
  models: LocalModelInventory;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRecommendationCommand".
 */
export interface ModelRecommendationCommand {
  request_id: RequestId10;
  task_id: TaskId62;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRouteCommand".
 */
export interface ModelRouteCommand {
  request_id: RequestId11;
  task_id: TaskId63;
  urgency?: Urgency1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ObjectiveCommand".
 */
export interface ObjectiveCommand {
  objective: Objective3;
  request_id: RequestId12;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackAuditionCommand".
 */
export interface PackAuditionCommand {
  baseline_score: BaselineScore1;
  benchmark_id: BenchmarkId3;
  candidate_score: CandidateScore1;
  detail: Detail16;
  evidence_text: EvidenceText;
  pack: ExpertisePackRef;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackAutomatedAuditionCommand".
 */
export interface PackAutomatedAuditionCommand {
  benchmark_id: BenchmarkId4;
  pack: ExpertisePackRef;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackBuildCommand".
 */
export interface PackBuildCommand {
  pack_id: PackId4;
  task_id: TaskId64;
  version: Version11;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackCandidateCommand".
 */
export interface PackCandidateCommand {
  pack: ExpertisePack;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackLifecycleCommand".
 */
export interface PackLifecycleCommand {
  pack: ExpertisePackRef;
  reason: Reason13;
  state: State18;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PackReviewCommand".
 */
export interface PackReviewCommand {
  contradictions_checked: ContradictionsChecked1;
  decision: Decision4;
  detail: Detail17;
  licensing_checked: LicensingChecked1;
  pack: ExpertisePackRef;
  privacy_checked: PrivacyChecked2;
  provenance_checked: ProvenanceChecked1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanDraft".
 */
export interface PlanDraft {
  questions: Questions1;
  steps: Steps1;
  summary: Summary7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanStep".
 */
export interface PlanStep {
  constraints: Constraints3;
  deliverables: Deliverables1;
  dependency_keys: DependencyKeys;
  key: Key1;
  objective: Objective4;
  required_capabilities: RequiredCapabilities2;
  required_evaluations: RequiredEvaluations1;
  title: Title10;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PolicyCommand".
 */
export interface PolicyCommand {
  expected_cursor: ExpectedCursor;
  policy: Policy;
  request_id: RequestId13;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainCatalog".
 */
export interface ProductionDomainCatalog {
  domains: Domains;
  inspections: Inspections;
  tools: Tools;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProductionDomainRunCommand".
 */
export interface ProductionDomainRunCommand {
  domain_id: DomainId2;
  request_id: RequestId14;
  task_id: TaskId65;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectCatalog".
 */
export interface ProjectCatalog {
  active_project_id: ActiveProjectId;
  projects: Projects;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSummary".
 */
export interface ProjectSummary {
  engine?: Engine1;
  name: Name6;
  onboarding?: ProjectOnboarding | null;
  project_id: ProjectId66;
  root: Root;
  stage: Stage1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectImport".
 */
export interface ProjectImport {
  path: Path3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectRemoval".
 */
export interface ProjectRemoval {
  project_id: ProjectId67;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSelection".
 */
export interface ProjectSelection {
  project_id: ProjectId68;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSnapshot".
 */
export interface ProjectSnapshot {
  budget_reservations?: BudgetReservations;
  cursor: Cursor1;
  decisions?: Decisions1;
  evaluations?: Evaluations;
  evidence?: Evidence2;
  experience_lessons?: ExperienceLessons;
  experience_observations?: ExperienceObservations;
  gm?: GMRecord | null;
  history_digest: HistoryDigest;
  intelligence?: ProjectIntelligence | null;
  model_benchmarks?: ModelBenchmarks;
  model_routing_records?: ModelRoutingRecords;
  onboarding?: ProjectOnboarding | null;
  paid_invocations?: PaidInvocations;
  plans?: Plans;
  policy: Policy;
  production_domain_inspections?: ProductionDomainInspections;
  project: Project;
  providers?: Providers;
  reconciliations?: Reconciliations;
  recruitments?: Recruitments;
  requires_reconciliation?: RequiresReconciliation;
  research_records?: ResearchRecords;
  spend_approvals?: SpendApprovals;
  tasks: Tasks1;
  waivers?: Waivers;
  workers?: Workers;
  workspace?: WorkspaceFingerprint | null;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ReconciliationRecord".
 */
export interface ReconciliationRecord {
  artifacts?: Artifacts1;
  baseline_digest: BaselineDigest1;
  change_id: ChangeId2;
  detail?: Detail18;
  detected_at: DetectedAt1;
  git_commits?: GitCommits1;
  git_diff_summary?: GitDiffSummary1;
  observed: WorkspaceFingerprint;
  paths: Paths3;
  project_id: ProjectId69;
  reconciled_at?: ReconciledAt;
  schema_version?: SchemaVersion87;
  state?: State19;
  task_id?: TaskId66;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderConfigureCommand".
 */
export interface ProviderConfigureCommand {
  provider: Provider;
  request_id: RequestId15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderCredentialCommand".
 */
export interface ProviderCredentialCommand {
  provider_id: ProviderId7;
  secret: Secret;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderCredentialStatus".
 */
export interface ProviderCredentialStatus {
  configured: Configured;
  provider_id: ProviderId8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderDisableCommand".
 */
export interface ProviderDisableCommand {
  provider_id: ProviderId9;
  reason: Reason14;
  request_id: RequestId16;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderInvocationResult".
 */
export interface ProviderInvocationResult {
  output?: Output;
  record: PaidInvocationRecord;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderInvokeCommand".
 */
export interface ProviderInvokeCommand {
  max_output_tokens?: MaxOutputTokens;
  prompt: Prompt;
  provider_id: ProviderId10;
  request_id: RequestId17;
  task_id?: TaskId67;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderRegistry".
 */
export interface ProviderRegistry {
  approvals: Approvals;
  invocations: Invocations;
  ledger: BudgetLedger;
  providers: Providers1;
  reservations: Reservations;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderStatus".
 */
export interface ProviderStatus {
  adapter_available: AdapterAvailable;
  credential_configured: CredentialConfigured;
  provider: Provider;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QARunCommand".
 */
export interface QARunCommand {
  request_id: RequestId18;
  task_id: TaskId68;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ReconcileCommand".
 */
export interface ReconcileCommand {
  change_id: ChangeId3;
  detail: Detail19;
  request_id: RequestId19;
  task_id?: TaskId69;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentCommand".
 */
export interface RecruitmentCommand {
  request_id: RequestId20;
  task_id: TaskId70;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ResearchCommand".
 */
export interface ResearchCommand {
  freshness_class?: FreshnessClass3;
  requirement: Requirement1;
  task_id: TaskId71;
  url: Url1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RuntimeCaptureCommand".
 */
export interface RuntimeCaptureCommand {
  node_path: NodePath;
  request_id: RequestId21;
  task_id: TaskId72;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RuntimeCaptureResult".
 */
export interface RuntimeCaptureResult {
  evaluation: Evaluation;
  evidence: Evidence;
  inspection: EngineProjectInspection;
  log: SourceRef;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendApprovalCommand".
 */
export interface SpendApprovalCommand {
  amount_cents: AmountCents3;
  expires_at: ExpiresAt2;
  invocation_request_id: InvocationRequestId;
  provider_id: ProviderId11;
  request_id: RequestId22;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "StreamMessage".
 */
export interface StreamMessage {
  cursor: Cursor2;
  events: Events1;
  has_more: HasMore1;
  type?: Type2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskProgressCommand".
 */
export interface TaskProgressCommand {
  detail: Detail20;
  request_id: RequestId23;
  task_id: TaskId73;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskProposal".
 */
export interface TaskProposal {
  deliverables: Deliverables2;
  dependency_ids?: DependencyIds1;
  objective: Objective5;
  request_id: RequestId24;
  required_capabilities: RequiredCapabilities3;
  title: Title11;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskStartCommand".
 */
export interface TaskStartCommand {
  deliverables?: Deliverables3;
  objective?: Objective6;
  request_id: RequestId25;
  required_capabilities?: RequiredCapabilities4;
  task_id?: TaskId74;
  title?: Title12;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerCommand".
 */
export interface WorkerCommand {
  task_id: TaskId75;
  worker_id?: WorkerId1;
}
