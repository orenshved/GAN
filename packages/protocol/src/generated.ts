/* Generated from Pydantic. Run pnpm protocol:generate; do not edit. */

export type AgentId = string;
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
export type ProjectId = string;
export type Sandbox = "read_only" | "workspace_write";
export type SchemaVersion2 = 1;
export type TaskId = string;
export type ThreadId = string | null;
export type WorkingDirectory = string;
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
export type SchemaVersion3 = 1;
export type Version1 = string;
export type DetectedAt = string;
export type GapId = string;
/**
 * @minItems 1
 */
export type MissingCapabilities = [string, ...string[]];
export type ProjectId1 = string;
export type Reason = string;
export type SchemaVersion4 = 1;
export type TaskId1 = string;
export type AssembledAt = string;
export type ContextId = string;
export type Consequences = string[];
export type DecisionId = string;
/**
 * @minItems 2
 */
export type Options = [string, string, ...string[]];
export type PlanId = string;
export type ProjectId2 = string;
export type Rationale = string | null;
export type Reason1 = string;
export type Recommendation = string;
export type SchemaVersion5 = 1;
export type SelectedOption = string | null;
export type TaskIds = string[];
export type Title = string;
export type Decisions = InboxDecision[];
export type HistoryEventsIncluded = 0;
export type IndexedResourceCount = number;
export type Confidence = number;
export type CreatedAt = string;
export type EntityId = string;
export type Kind = string;
export type ProjectId3 = string;
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
export type ProjectId4 = string;
export type SchemaVersion6 = 1;
export type Locator = string | null;
export type MediaType = string;
export type Sha256 = string;
export type Uri = string;
export type Statement = string;
export type SupersedesId = string | null;
export type Knowledge = KnowledgeEntry[];
export type ProjectId5 = string;
export type References = SourceRef[];
export type SchemaVersion7 = 1;
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
export type ProjectId6 = string;
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
export type SchemaVersion8 = 1;
export type State =
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
  | "NEEDS_HUMAN";
export type TaskId2 = string;
export type Title1 = string;
export type TaskId3 = string;
export type Consequences1 = string[];
export type DecidedAt = string;
export type DecidedBy = "human";
export type DecisionId1 = string;
export type EvidenceIds1 = string[];
/**
 * @minItems 1
 */
export type Options1 = [string, ...string[]];
export type ProjectId7 = string;
export type Reason2 = string;
export type Recommendation1 = string;
export type SchemaVersion9 = 1;
export type SelectedOption1 = string;
export type TaskId4 = string | null;
export type Title2 = string;
export type Urgency = "low" | "normal" | "urgent";
export type AdapterId = string;
/**
 * @minItems 1
 */
export type Capabilities1 = [string, ...string[]];
export type EngineType = string;
export type SchemaVersion10 = 1;
export type SupportedVersions = string;
/**
 * @minItems 1
 */
export type ToolIds = [string, ...string[]];
export type Version2 = string;
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
export type ProjectId8 = string;
export type Rationale1 = string;
export type Result = "passed" | "failed" | "inconclusive";
export type SchemaVersion11 = 1;
export type TaskId5 = string;
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
    )
  | null;
export type ActorId = string;
export type ActorType = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId = string;
export type EventId = string;
export type EventType = "task.created" | "task.started" | "task.blocked" | "task.completed";
export type Detail = string;
export type TaskId6 = string;
export type ProjectId9 = string;
export type SchemaVersion12 = 1;
export type Sequence = number;
export type TaskId7 = string | null;
export type Timestamp = string;
export type ActorId1 = string;
export type ActorType1 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId1 = string;
export type EventId1 = string;
export type EventType1 = "agent.assigned" | "agent.failed" | "agent.hired";
export type AgentId2 = string;
export type AssignmentId1 = string;
export type ProjectId10 = string;
export type SchemaVersion13 = 1;
export type Sequence1 = number;
export type TaskId8 = string | null;
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
export type ProjectId11 = string;
export type SchemaVersion14 = 1;
export type Sequence2 = number;
export type TaskId9 = string | null;
export type Timestamp2 = string;
export type ActorId3 = string;
export type ActorType3 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId3 = string;
export type EventId3 = string;
export type EventType3 = "decision.requested" | "decision.resolved" | "gm.challenge_raised" | "gate.waived";
export type DecisionId2 = string;
export type Reason3 = string;
export type ProjectId12 = string;
export type SchemaVersion15 = 1;
export type Sequence3 = number;
export type TaskId10 = string | null;
export type Timestamp3 = string;
export type ActorId4 = string;
export type ActorType4 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId4 = string;
export type EventId4 = string;
export type EventType4 = "artifact.created" | "artifact.modified";
export type ProjectId13 = string;
export type SchemaVersion16 = 1;
export type Sequence4 = number;
export type TaskId11 = string | null;
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
export type SchemaVersion17 = 1;
export type ProjectId14 = string;
export type SchemaVersion18 = 1;
export type Sequence5 = number;
export type TaskId12 = string | null;
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
export type ProjectId15 = string;
export type SchemaVersion19 = 1;
export type Sequence6 = number;
export type TaskId13 = string | null;
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
export type TaskId14 = string;
export type ProjectId16 = string;
export type SchemaVersion20 = 1;
export type Sequence7 = number;
export type TaskId15 = string | null;
export type Timestamp7 = string;
export type ActorId8 = string;
export type ActorType8 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId8 = string;
export type EventId8 = string;
export type EventType8 = "provider.spend_recorded";
export type AmountCents = number;
export type ProviderId = string;
export type ReservationId = string;
export type ProjectId17 = string;
export type SchemaVersion21 = 1;
export type Sequence8 = number;
export type TaskId16 = string | null;
export type Timestamp8 = string;
export type ActorId9 = string;
export type ActorType9 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId9 = string;
export type EventId9 = string;
export type EventType9 = "provider.disabled";
export type ProviderId1 = string;
export type Reason4 = string;
export type ProjectId18 = string;
export type SchemaVersion22 = 1;
export type Sequence9 = number;
export type TaskId17 = string | null;
export type Timestamp9 = string;
export type ActorId10 = string;
export type ActorType10 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId10 = string;
export type EventId10 = string;
export type EventType10 = "git.commit.created";
export type CommitId = string;
export type Workspace = string;
export type ProjectId19 = string;
export type SchemaVersion23 = 1;
export type Sequence10 = number;
export type TaskId18 = string | null;
export type Timestamp10 = string;
export type ActorId11 = string;
export type ActorType11 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId11 = string;
export type EventId11 = string;
export type EventType11 = "project.initialized";
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
export type SchemaVersion24 = 1;
export type ApprovalThresholdCents = number;
export type Authority1 = "ask_first" | "recommend_and_proceed" | "autonomous_within_policy";
export type Currency = "USD";
export type MonthlyExternalBudgetCents = number;
export type PostSpecialistNonprogressLimit = 3;
export type Proactivity = "reactive" | "balanced" | "active";
export type ProjectId20 = string;
export type RequireProviderHardCap = true;
export type RequireRegistrationOrReconciliation = true;
export type SchemaVersion25 = 1;
export type Direction1 = string;
export type References2 = SourceRef[];
export type Constraints2 = string[];
export type Type = string;
export type Version3 = string;
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
export type SchemaVersion26 = 1;
export type ProjectId21 = string;
export type SchemaVersion27 = 1;
export type Sequence11 = number;
export type TaskId19 = string | null;
export type Timestamp11 = string;
export type ActorId12 = string;
export type ActorType12 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId12 = string;
export type EventId12 = string;
export type EventType12 = "task.proposed";
export type ProjectId22 = string;
export type SchemaVersion28 = 1;
export type Sequence12 = number;
export type TaskId20 = string | null;
export type Timestamp12 = string;
export type ActorId13 = string;
export type ActorType13 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId13 = string;
export type EventId13 = string;
export type EventType13 = "policy.updated";
export type ProjectId23 = string;
export type SchemaVersion29 = 1;
export type Sequence13 = number;
export type TaskId21 = string | null;
export type Timestamp13 = string;
export type ActorId14 = string;
export type ActorType14 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId14 = string;
export type EventId14 = string;
export type EventType14 = "worker.updated";
export type Cwd = string;
export type Detail2 = string;
export type ProjectId24 = string;
export type Findings1 = string[];
export type NextSteps = string[];
export type Summary = string;
export type SchemaVersion30 = 1;
export type State1 = "ready" | "running" | "completed" | "failed" | "interrupted";
export type TaskId22 = string;
export type ThreadId1 = string;
export type TurnId = string | null;
export type WorkerId = string;
export type ProjectId25 = string;
export type SchemaVersion31 = 1;
export type Sequence14 = number;
export type TaskId23 = string | null;
export type Timestamp14 = string;
export type ActorId15 = string;
export type ActorType15 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId15 = string;
export type EventId15 = string;
export type EventType15 = "gm.updated";
export type Detail3 = string;
export type Objective1 = string;
export type ProjectId26 = string;
export type RequestId = string;
export type SchemaVersion32 = 1;
export type State2 = "ready" | "planning" | "completed" | "failed" | "interrupted";
export type ThreadId2 = string;
export type ProjectId27 = string;
export type SchemaVersion33 = 1;
export type Sequence15 = number;
export type TaskId24 = string | null;
export type Timestamp15 = string;
export type ActorId16 = string;
export type ActorType16 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId16 = string;
export type EventId16 = string;
export type EventType16 = "gm.plan_created";
export type MissingCapabilities1 = string[];
export type TaskId25 = string;
export type Assignments = PlanAssignment[];
export type Objective2 = string;
export type PlanId1 = string;
export type ProjectId28 = string;
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
export type Title3 = string;
export type Questions = PlanQuestion[];
export type SchemaVersion34 = 1;
export type Summary1 = string;
/**
 * @minItems 1
 */
export type Tasks = [TaskContract, ...TaskContract[]];
export type ProjectId29 = string;
export type SchemaVersion35 = 1;
export type Sequence16 = number;
export type TaskId26 = string | null;
export type Timestamp16 = string;
export type ActorId17 = string;
export type ActorType17 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId17 = string;
export type EventId17 = string;
export type EventType17 = "gm.decision_resolved";
export type ProjectId30 = string;
export type SchemaVersion36 = 1;
export type Sequence17 = number;
export type TaskId27 = string | null;
export type Timestamp17 = string;
export type ActorId18 = string;
export type ActorType18 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId18 = string;
export type EventId18 = string;
export type EventType18 = "project.intelligence_indexed";
export type IndexedAt = string;
export type Knowledge1 = KnowledgeEntry[];
export type ProjectId31 = string;
export type Excerpt = string | null;
export type Kind3 = "document" | "source" | "asset" | "configuration";
export type MediaType1 = string;
export type Path1 = string;
export type Sha2561 = string;
export type Size1 = number;
export type Resources = IndexedResource[];
export type SchemaVersion37 = 1;
export type WorkspaceDigest = string;
export type ProjectId32 = string;
export type SchemaVersion38 = 1;
export type Sequence18 = number;
export type TaskId28 = string | null;
export type Timestamp18 = string;
export type ActorId19 = string;
export type ActorType19 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId19 = string;
export type EventId19 = string;
export type EventType19 = "evidence.recorded";
export type CaptureOrigin = "runtime" | "source" | "simulation" | "human_observation" | "model_output";
export type CapturedAt1 = string;
export type EvidenceClass = "deterministic" | "measured" | "comparative" | "heuristic" | "human";
export type EvidenceId = string;
export type ProducerId = string;
export type ProducerType = "tool" | "model" | "human";
export type ProjectId33 = string;
export type SchemaVersion39 = 1;
export type Summary2 = string;
export type TaskId29 = string;
export type ProjectId34 = string;
export type SchemaVersion40 = 1;
export type Sequence19 = number;
export type TaskId30 = string | null;
export type Timestamp19 = string;
export type ActorId20 = string;
export type ActorType20 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId20 = string;
export type EventId20 = string;
export type EventType20 = "evaluation.recorded";
export type ProjectId35 = string;
export type SchemaVersion41 = 1;
export type Sequence20 = number;
export type TaskId31 = string | null;
export type Timestamp20 = string;
export type ActorId21 = string;
export type ActorType21 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId21 = string;
export type EventId21 = string;
export type EventType21 = "recruitment.updated";
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
export type Detail4 = string;
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
export type SchemaVersion42 = 1;
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
export type CreatedAt1 = string;
export type ProjectId36 = string;
export type RecruitmentId = string;
export type SchemaVersion43 = 1;
export type State3 = "candidate_composed" | "auditioning" | "probation" | "rejected";
export type TaskId32 = string;
export type CapabilityIds = string[];
export type Decision1 = "trusted" | "needs_approval" | "forbidden" | "unavailable";
export type Detail5 = string;
export type ToolId = string;
export type ToolDiscoveries = ToolDiscovery[];
export type UpdatedAt = string;
export type ProjectId37 = string;
export type SchemaVersion44 = 1;
export type Sequence21 = number;
export type TaskId33 = string | null;
export type Timestamp21 = string;
export type ActorId22 = string;
export type ActorType22 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId22 = string;
export type EventId22 = string;
export type EventType22 = "qa.gate_waived";
export type GateId1 = string;
export type ProjectId38 = string;
export type Reason6 = string;
export type SchemaVersion45 = 1;
export type TaskId34 = string;
export type WaivedAt = string;
export type WaivedBy = "human";
export type WaiverId = string;
export type ProjectId39 = string;
export type SchemaVersion46 = 1;
export type Sequence22 = number;
export type TaskId35 = string | null;
export type Timestamp22 = string;
export type ActorId23 = string;
export type ActorType23 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId23 = string;
export type EventId23 = string;
export type EventType23 = "model.benchmark_recorded";
export type BenchmarkId = string;
export type BenchmarkedAt = string;
export type CompletionTokens = number;
export type ContractScore = number;
export type LatencyMs = number;
export type ModelDigest = string;
export type ModelName = string;
export type OutputChannel = "response" | "thinking";
export type ProjectId40 = string;
export type PromptSha256 = string;
export type PromptTokens = number;
/**
 * @minItems 1
 */
export type RequiredCapabilityIds = [string, ...string[]];
export type Result3 = "passed" | "failed" | "unavailable";
export type SchemaVersion47 = 1;
export type Summary4 = string;
export type TaskId36 = string;
export type ProjectId41 = string;
export type SchemaVersion48 = 1;
export type Sequence23 = number;
export type TaskId37 = string | null;
export type Timestamp23 = string;
export type ActorId24 = string;
export type ActorType24 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId24 = string;
export type EventId24 = string;
export type EventType24 = "model.routing_recorded";
/**
 * @minItems 3
 */
export type Candidates = [ModelRouteCandidate, ModelRouteCandidate, ModelRouteCandidate, ...ModelRouteCandidate[]];
export type Confidence1 = number;
export type ExpectedExternalCostAvoidedCents = number;
export type ExpectedExternalCostCents = number | null;
export type ExpectedQuality = "unknown" | "low" | "medium" | "high";
export type ExpectedRuntimeMs = number | null;
export type ModelName1 = string | null;
export type ProviderId2 = string | null;
export type Reason7 = string;
export type Route = "deterministic_tool" | "local_ollama" | "codex_authenticated" | "paid_provider" | "wait_for_codex";
export type Viable = boolean;
export type CreatedAt2 = string;
export type ProjectId42 = string;
export type Reason8 = string;
export type RoutingId = string;
export type SchemaVersion49 = 1;
export type SelectedModelName = string | null;
export type SelectedProviderId = string | null;
export type SelectedRoute =
  "deterministic_tool" | "local_ollama" | "codex_authenticated" | "paid_provider" | "wait_for_codex";
export type TaskId38 = string;
export type ProjectId43 = string;
export type SchemaVersion50 = 1;
export type Sequence24 = number;
export type TaskId39 = string | null;
export type Timestamp24 = string;
export type CapturedAt2 = string;
export type Cpu = string;
export type DriverVersion = string | null;
export type MemoryBytes = number | null;
export type Name2 = string;
export type Vendor = string;
export type Graphics = GraphicsDevice[];
export type LogicalCoreCount = number;
export type MachineId = string;
export type OperatingSystem = string;
export type PhysicalCoreCount = number | null;
export type RamBytes = number | null;
export type SchemaVersion51 = 1;
export type Detail6 = string;
export type Endpoint = string;
export type InspectedAt = string;
export type ContextLimit = number | null;
export type Digest1 = string;
export type FitsMemory = boolean;
/**
 * @minItems 1
 */
export type Modalities = ["text" | "image" | "audio", ...("text" | "image" | "audio")[]];
export type ModifiedAt = string;
export type Name3 = string;
export type ParameterSize = string | null;
export type QuantizationLevel = string | null;
export type SizeBytes = number;
export type ToolSupport = boolean;
export type Models = LocalModel[];
export type RuntimeId = "ollama";
export type SchemaVersion52 = 1;
export type State4 = "available" | "unavailable";
export type Version4 = string | null;
export type Action = "install" | "keep_installed" | "no_recommendation";
export type Description3 = string;
export type EstimatedSizeBytes = number;
export type Family1 = string;
export type Installed = boolean;
export type MemoryTier = "full_gpu" | "hybrid" | "system" | "unfit";
/**
 * @minItems 1
 */
export type Modalities1 = ["text" | "image" | "audio", ...("text" | "image" | "audio")[]];
export type Name4 = string;
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
export type ProjectId44 = string;
export type Reason10 = string;
export type RecommendationId = string;
export type RecommendedModelName = string | null;
/**
 * @minItems 1
 */
export type RequiredCapabilityIds1 = [string, ...string[]];
export type SchemaVersion53 = 1;
export type TaskId40 = string;
export type Billing = "local" | "codex_subscription" | "paid";
export type Cap = UnverifiedCap | VerifiedCap;
export type Verified = false;
export type AmountCents1 = number;
export type ExpiresAt = string;
export type ProviderSide = true;
export type VerificationMethod = "provider_api" | "manual_provider_console" | "prepaid_wallet";
export type Verified1 = true;
export type VerifiedAt = string;
export type Currency1 = "USD";
export type ProviderId3 = string;
export type SchemaVersion54 = 1;
export type State5 = "ACTIVE" | "DISABLED" | "DISABLED_UNCAPPED";
/**
 * @minItems 1
 */
export type AllowedProducerTypes = ["tool" | "model" | "human", ...("tool" | "model" | "human")[]];
export type Claim1 = "technical" | "visual" | "subjective" | "fun";
export type Description4 = string;
export type Discipline = "ui" | "engineering";
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
export type SchemaVersion55 = 1;
export type Title4 = string;
export type Version5 = string;
export type CompletionState = "passed" | "blocked" | "human_rejected";
export type Explanation = string;
/**
 * @minItems 1
 */
export type Gates = [QAGateStatus, ...QAGateStatus[]];
export type EvidenceIds4 = string[];
export type Explanation1 = string;
export type LatestEvaluationId = string | null;
export type Required = boolean;
export type State6 = "missing" | "passed" | "failed" | "inconclusive" | "advisory" | "waived";
export type WaiverId1 = string | null;
export type GeneratedAt = string;
export type PassedGateCount = number;
export type ProjectId45 = string;
export type ReportId = string;
export type RequiredGateCount = number;
export type SchemaVersion56 = 1;
export type TaskId41 = string;
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
export type SchemaVersion57 = 1;
export type ToolId1 = string;
export type Version6 = string;
export type Entries1 = AgentRegistryEntry[];
export type TaskId42 = string;
export type DecisionId3 = string;
export type Rationale3 = string;
export type RequestId1 = string;
export type SelectedOption2 = string;
export type NodeType = string;
export type Path2 = string;
export type Scene = string;
export type ApprovedAssets = SourceRef[];
export type EngineVersion = string;
export type InspectedAt1 = string;
export type MainScene = string;
export type ProjectId46 = string;
export type ProjectPath = string;
export type TaskId43 = string;
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
)[];
export type HasMore = boolean;
export type GateId3 = string;
export type Reason11 = string;
export type RequestId2 = string;
export type TaskId44 = string;
export type GateId4 = string;
export type RequestId3 = string;
export type Summary5 = string;
export type SupportingEvidenceIds = string[];
export type TaskId45 = string;
export type Verdict = "approved" | "rejected" | "observation";
export type RequestId4 = string;
export type ModelName2 = string | null;
export type RequestId5 = string;
export type TaskId46 = string;
export type RequestId6 = string;
export type TaskId47 = string;
export type RequestId7 = string;
export type TaskId48 = string;
export type Urgency1 = "low" | "normal" | "high";
export type Objective3 = string;
export type RequestId8 = string;
export type Questions1 = PlanQuestion[];
/**
 * @minItems 1
 * @maxItems 30
 */
export type Steps = [PlanStep, ...PlanStep[]];
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
export type Title5 = string;
export type Summary6 = string;
export type ExpectedCursor = number;
export type RequestId9 = string;
export type ActiveProjectId = string;
export type Engine1 = string | null;
export type Name5 = string;
export type ProjectId47 = string;
export type Root = string;
export type Stage1 = string;
export type Projects = ProjectSummary[];
export type Path3 = string;
export type ProjectId48 = string;
export type ProjectId49 = string;
export type Cursor1 = number;
export type Decisions1 = InboxDecision[];
export type Evaluations = Evaluation[];
export type Evidence1 = Evidence[];
export type HistoryDigest = string;
export type ModelBenchmarks = ModelBenchmark[];
export type ModelRoutingRecords = ModelRoutingRecord[];
export type Plans = ProductionPlan[];
export type Artifacts1 = SourceRef[];
export type BaselineDigest1 = string;
export type ChangeId2 = string;
export type Detail7 = string | null;
export type DetectedAt1 = string;
export type GitCommits1 = string[];
export type GitDiffSummary1 = string | null;
/**
 * @minItems 1
 */
export type Paths2 = [string, ...string[]];
export type ProjectId50 = string;
export type ReconciledAt = string | null;
export type SchemaVersion58 = 1;
export type State7 = "unresolved" | "reconciled";
export type TaskId49 = string | null;
export type Reconciliations = ReconciliationRecord[];
export type Recruitments = RecruitmentRecord[];
export type RequiresReconciliation = boolean;
export type Tasks1 = TaskContract[];
export type Waivers = GateWaiver[];
export type Workers = WorkerRecord[];
export type RequestId10 = string;
export type TaskId50 = string;
export type ChangeId3 = string;
export type Detail8 = string;
export type RequestId11 = string;
export type TaskId51 = string | null;
export type RequestId12 = string;
export type TaskId52 = string;
export type NodePath = string;
export type RequestId13 = string;
export type TaskId53 = string;
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
)[];
export type HasMore1 = boolean;
export type Type2 = "events";
export type Detail9 = string;
export type RequestId14 = string;
export type TaskId54 = string;
/**
 * @minItems 1
 */
export type Deliverables2 = [string, ...string[]];
export type DependencyIds1 = string[];
export type Objective5 = string;
export type RequestId15 = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities3 = [string, ...string[]];
export type Title6 = string;
export type Deliverables3 = string[];
export type Objective6 = string | null;
export type RequestId16 = string;
export type RequiredCapabilities4 = string[];
export type TaskId55 = string | null;
export type Title7 = string | null;
export type TaskId56 = string;
export type WorkerId1 = string | null;

/**
 * Discriminated export root; each document remains independently addressable.
 */
export interface ProtocolDocument {
  agent?: AgentDefinition | null;
  agent_registry_entry?: AgentRegistryEntry | null;
  assignment?: AgentAssignment | null;
  capability?: Capability | null;
  capability_gap?: CapabilityGap | null;
  context_package?: ContextPackage | null;
  decision?: Decision | null;
  engine_adapter?: EngineAdapter | null;
  evaluation?: Evaluation | null;
  event?: Event;
  evidence?: Evidence | null;
  gate_waiver?: GateWaiver | null;
  hardware_inventory?: LocalHardwareInventory | null;
  knowledge?: KnowledgeEntry | null;
  local_model_inventory?: LocalModelInventory | null;
  local_model_recommendation?: LocalModelRecommendation | null;
  model_benchmark?: ModelBenchmark | null;
  model_routing?: ModelRoutingRecord | null;
  policy?: Policy | null;
  project?: Project | null;
  project_intelligence?: ProjectIntelligence | null;
  provider?: Provider | null;
  qa_gate?: QAGateDefinition | null;
  qa_report?: QAReport | null;
  recruitment?: RecruitmentRecord | null;
  task?: TaskContract | null;
  tool?: ToolDefinition | null;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "AgentDefinition".
 */
export interface AgentDefinition {
  agent_id: AgentId;
  allowed_tool_ids: AllowedToolIds;
  capabilities: Capabilities;
  description: Description;
  instructions: Instructions;
  models: ModelPreferences;
  name: Name;
  output_contract: OutputContract;
  permissions: Permissions;
  probationary?: Probationary;
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
  granted_permissions: Permissions;
  project_id: ProjectId;
  sandbox?: Sandbox;
  schema_version?: SchemaVersion2;
  task_id: TaskId;
  thread_id?: ThreadId;
  working_directory: WorkingDirectory;
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
  schema_version?: SchemaVersion3;
  version: Version1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CapabilityGap".
 */
export interface CapabilityGap {
  detected_at: DetectedAt;
  gap_id: GapId;
  missing_capabilities: MissingCapabilities;
  project_id: ProjectId1;
  reason: Reason;
  schema_version?: SchemaVersion4;
  task_id: TaskId1;
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
  project_id: ProjectId5;
  references: References;
  schema_version?: SchemaVersion7;
  selected_resource_count: SelectedResourceCount;
  snippets: Snippets;
  task: TaskContract;
  task_id: TaskId3;
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
  project_id: ProjectId2;
  rationale?: Rationale;
  reason: Reason1;
  recommendation: Recommendation;
  schema_version?: SchemaVersion5;
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
  created_at: CreatedAt;
  entities: Entities;
  evidence_ids: EvidenceIds;
  kind: Kind1;
  knowledge_id: KnowledgeId;
  project_id: ProjectId4;
  schema_version?: SchemaVersion6;
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
  project_id: ProjectId3;
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
  project_id: ProjectId6;
  references: References1;
  required_capabilities: RequiredCapabilities;
  required_evaluations: RequiredEvaluations;
  requirements: Requirements;
  schema_version?: SchemaVersion8;
  state?: State;
  task_id: TaskId2;
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
  project_id: ProjectId7;
  reason: Reason2;
  recommendation: Recommendation1;
  schema_version?: SchemaVersion9;
  selected_option: SelectedOption1;
  task_id: TaskId4;
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
  schema_version?: SchemaVersion10;
  supported_versions: SupportedVersions;
  tool_ids: ToolIds;
  version: Version2;
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
  project_id: ProjectId8;
  rationale: Rationale1;
  result: Result;
  schema_version?: SchemaVersion11;
  task_id: TaskId5;
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
  project_id: ProjectId9;
  schema_version?: SchemaVersion12;
  sequence: Sequence;
  task_id: TaskId7;
  timestamp: Timestamp;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskEventPayload".
 */
export interface TaskEventPayload {
  detail: Detail;
  task_id: TaskId6;
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
  project_id: ProjectId10;
  schema_version?: SchemaVersion13;
  sequence: Sequence1;
  task_id: TaskId8;
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
  project_id: ProjectId11;
  schema_version?: SchemaVersion14;
  sequence: Sequence2;
  task_id: TaskId9;
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
  project_id: ProjectId12;
  schema_version?: SchemaVersion15;
  sequence: Sequence3;
  task_id: TaskId10;
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
  project_id: ProjectId13;
  schema_version?: SchemaVersion16;
  sequence: Sequence4;
  task_id: TaskId11;
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
  project_id: ProjectId14;
  schema_version?: SchemaVersion18;
  sequence: Sequence5;
  task_id: TaskId12;
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
  schema_version?: SchemaVersion17;
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
  project_id: ProjectId15;
  schema_version?: SchemaVersion19;
  sequence: Sequence6;
  task_id: TaskId13;
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
  project_id: ProjectId16;
  schema_version?: SchemaVersion20;
  sequence: Sequence7;
  task_id: TaskId15;
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
  task_id: TaskId14;
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
  project_id: ProjectId17;
  schema_version?: SchemaVersion21;
  sequence: Sequence8;
  task_id: TaskId16;
  timestamp: Timestamp8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendPayload".
 */
export interface SpendPayload {
  amount_cents: AmountCents;
  provider_id: ProviderId;
  reservation_id: ReservationId;
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
  project_id: ProjectId18;
  schema_version?: SchemaVersion22;
  sequence: Sequence9;
  task_id: TaskId17;
  timestamp: Timestamp9;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderPayload".
 */
export interface ProviderPayload {
  provider_id: ProviderId1;
  reason: Reason4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CommitEvent".
 */
export interface CommitEvent {
  actor_id: ActorId10;
  actor_type: ActorType10;
  correlation_id: CorrelationId10;
  event_id: EventId10;
  event_type: EventType10;
  payload: CommitPayload;
  project_id: ProjectId19;
  schema_version?: SchemaVersion23;
  sequence: Sequence10;
  task_id: TaskId18;
  timestamp: Timestamp10;
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
  actor_id: ActorId11;
  actor_type: ActorType11;
  correlation_id: CorrelationId11;
  event_id: EventId11;
  event_type: EventType11;
  payload: ProjectInitializedPayload;
  project_id: ProjectId21;
  schema_version?: SchemaVersion27;
  sequence: Sequence11;
  task_id: TaskId19;
  timestamp: Timestamp11;
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
  schema_version?: SchemaVersion24;
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
  currency?: Currency;
  monthly_external_budget_cents?: MonthlyExternalBudgetCents;
  post_specialist_nonprogress_limit?: PostSpecialistNonprogressLimit;
  proactivity?: Proactivity;
  project_id: ProjectId20;
  require_provider_hard_cap?: RequireProviderHardCap;
  require_registration_or_reconciliation?: RequireRegistrationOrReconciliation;
  schema_version?: SchemaVersion25;
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
  schema_version?: SchemaVersion26;
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
  version: Version3;
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
  actor_id: ActorId12;
  actor_type: ActorType12;
  correlation_id: CorrelationId12;
  event_id: EventId12;
  event_type: EventType12;
  payload: TaskContract;
  project_id: ProjectId22;
  schema_version?: SchemaVersion28;
  sequence: Sequence12;
  task_id: TaskId20;
  timestamp: Timestamp12;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PolicyUpdatedEvent".
 */
export interface PolicyUpdatedEvent {
  actor_id: ActorId13;
  actor_type: ActorType13;
  correlation_id: CorrelationId13;
  event_id: EventId13;
  event_type: EventType13;
  payload: Policy;
  project_id: ProjectId23;
  schema_version?: SchemaVersion29;
  sequence: Sequence13;
  task_id: TaskId21;
  timestamp: Timestamp13;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerEvent".
 */
export interface WorkerEvent {
  actor_id: ActorId14;
  actor_type: ActorType14;
  correlation_id: CorrelationId14;
  event_id: EventId14;
  event_type: EventType14;
  payload: WorkerRecord;
  project_id: ProjectId25;
  schema_version?: SchemaVersion31;
  sequence: Sequence14;
  task_id: TaskId23;
  timestamp: Timestamp14;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerRecord".
 */
export interface WorkerRecord {
  cwd: Cwd;
  detail: Detail2;
  project_id: ProjectId24;
  result?: WorkerResult | null;
  schema_version?: SchemaVersion30;
  state: State1;
  task_id: TaskId22;
  thread_id: ThreadId1;
  turn_id?: TurnId;
  worker_id: WorkerId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerResult".
 */
export interface WorkerResult {
  findings: Findings1;
  next_steps: NextSteps;
  summary: Summary;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GMEvent".
 */
export interface GMEvent {
  actor_id: ActorId15;
  actor_type: ActorType15;
  correlation_id: CorrelationId15;
  event_id: EventId15;
  event_type: EventType15;
  payload: GMRecord;
  project_id: ProjectId27;
  schema_version?: SchemaVersion33;
  sequence: Sequence15;
  task_id: TaskId24;
  timestamp: Timestamp15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GMRecord".
 */
export interface GMRecord {
  detail: Detail3;
  objective: Objective1;
  project_id: ProjectId26;
  request_id: RequestId;
  schema_version?: SchemaVersion32;
  state: State2;
  thread_id: ThreadId2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanEvent".
 */
export interface PlanEvent {
  actor_id: ActorId16;
  actor_type: ActorType16;
  correlation_id: CorrelationId16;
  event_id: EventId16;
  event_type: EventType16;
  payload: ProductionPlan;
  project_id: ProjectId29;
  schema_version?: SchemaVersion35;
  sequence: Sequence16;
  task_id: TaskId26;
  timestamp: Timestamp16;
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
  project_id: ProjectId28;
  questions: Questions;
  schema_version?: SchemaVersion34;
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
  task_id: TaskId25;
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
  title: Title3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InboxEvent".
 */
export interface InboxEvent {
  actor_id: ActorId17;
  actor_type: ActorType17;
  correlation_id: CorrelationId17;
  event_id: EventId17;
  event_type: EventType17;
  payload: InboxDecision;
  project_id: ProjectId30;
  schema_version?: SchemaVersion36;
  sequence: Sequence17;
  task_id: TaskId27;
  timestamp: Timestamp17;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IntelligenceEvent".
 */
export interface IntelligenceEvent {
  actor_id: ActorId18;
  actor_type: ActorType18;
  correlation_id: CorrelationId18;
  event_id: EventId18;
  event_type: EventType18;
  payload: ProjectIntelligence;
  project_id: ProjectId32;
  schema_version?: SchemaVersion38;
  sequence: Sequence18;
  task_id: TaskId28;
  timestamp: Timestamp18;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectIntelligence".
 */
export interface ProjectIntelligence {
  indexed_at: IndexedAt;
  knowledge: Knowledge1;
  project_id: ProjectId31;
  resources: Resources;
  schema_version?: SchemaVersion37;
  workspace_digest: WorkspaceDigest;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IndexedResource".
 */
export interface IndexedResource {
  excerpt?: Excerpt;
  kind: Kind3;
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
  actor_id: ActorId19;
  actor_type: ActorType19;
  correlation_id: CorrelationId19;
  event_id: EventId19;
  event_type: EventType19;
  payload: Evidence;
  project_id: ProjectId34;
  schema_version?: SchemaVersion40;
  sequence: Sequence19;
  task_id: TaskId30;
  timestamp: Timestamp19;
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
  project_id: ProjectId33;
  schema_version?: SchemaVersion39;
  source: SourceRef;
  summary: Summary2;
  task_id: TaskId29;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvaluationRecordedEvent".
 */
export interface EvaluationRecordedEvent {
  actor_id: ActorId20;
  actor_type: ActorType20;
  correlation_id: CorrelationId20;
  event_id: EventId20;
  event_type: EventType20;
  payload: Evaluation;
  project_id: ProjectId35;
  schema_version?: SchemaVersion41;
  sequence: Sequence20;
  task_id: TaskId31;
  timestamp: Timestamp20;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentEvent".
 */
export interface RecruitmentEvent {
  actor_id: ActorId21;
  actor_type: ActorType21;
  correlation_id: CorrelationId21;
  event_id: EventId21;
  event_type: EventType21;
  payload: RecruitmentRecord;
  project_id: ProjectId37;
  schema_version?: SchemaVersion44;
  sequence: Sequence21;
  task_id: TaskId33;
  timestamp: Timestamp21;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentRecord".
 */
export interface RecruitmentRecord {
  adjacent_agent_ids: AdjacentAgentIds;
  audition?: AgentAudition | null;
  candidate: AgentDefinition;
  created_at: CreatedAt1;
  gap: CapabilityGap;
  project_id: ProjectId36;
  recruitment_id: RecruitmentId;
  schema_version?: SchemaVersion43;
  state: State3;
  task_id: TaskId32;
  tool_discoveries: ToolDiscoveries;
  updated_at: UpdatedAt;
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
  schema_version?: SchemaVersion42;
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
  detail: Detail4;
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
 * via the `definition` "ToolDiscovery".
 */
export interface ToolDiscovery {
  capability_ids: CapabilityIds;
  decision: Decision1;
  detail: Detail5;
  tool_id: ToolId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GateWaivedEvent".
 */
export interface GateWaivedEvent {
  actor_id: ActorId22;
  actor_type: ActorType22;
  correlation_id: CorrelationId22;
  event_id: EventId22;
  event_type: EventType22;
  payload: GateWaiver;
  project_id: ProjectId39;
  schema_version?: SchemaVersion46;
  sequence: Sequence22;
  task_id: TaskId35;
  timestamp: Timestamp22;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GateWaiver".
 */
export interface GateWaiver {
  gate_id: GateId1;
  project_id: ProjectId38;
  reason: Reason6;
  schema_version?: SchemaVersion45;
  task_id: TaskId34;
  waived_at: WaivedAt;
  waived_by: WaivedBy;
  waiver_id: WaiverId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelBenchmarkEvent".
 */
export interface ModelBenchmarkEvent {
  actor_id: ActorId23;
  actor_type: ActorType23;
  correlation_id: CorrelationId23;
  event_id: EventId23;
  event_type: EventType23;
  payload: ModelBenchmark;
  project_id: ProjectId41;
  schema_version?: SchemaVersion48;
  sequence: Sequence23;
  task_id: TaskId37;
  timestamp: Timestamp23;
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
  project_id: ProjectId40;
  prompt_sha256: PromptSha256;
  prompt_tokens: PromptTokens;
  required_capability_ids: RequiredCapabilityIds;
  response?: SourceRef | null;
  result: Result3;
  schema_version?: SchemaVersion47;
  summary: Summary4;
  task_id: TaskId36;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRoutingEvent".
 */
export interface ModelRoutingEvent {
  actor_id: ActorId24;
  actor_type: ActorType24;
  correlation_id: CorrelationId24;
  event_id: EventId24;
  event_type: EventType24;
  payload: ModelRoutingRecord;
  project_id: ProjectId43;
  schema_version?: SchemaVersion50;
  sequence: Sequence24;
  task_id: TaskId39;
  timestamp: Timestamp24;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRoutingRecord".
 */
export interface ModelRoutingRecord {
  candidates: Candidates;
  created_at: CreatedAt2;
  project_id: ProjectId42;
  reason: Reason8;
  routing_id: RoutingId;
  schema_version?: SchemaVersion49;
  selected_model_name?: SelectedModelName;
  selected_provider_id?: SelectedProviderId;
  selected_route: SelectedRoute;
  task_id: TaskId38;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRouteCandidate".
 */
export interface ModelRouteCandidate {
  confidence: Confidence1;
  expected_external_cost_avoided_cents: ExpectedExternalCostAvoidedCents;
  expected_external_cost_cents?: ExpectedExternalCostCents;
  expected_quality: ExpectedQuality;
  expected_runtime_ms?: ExpectedRuntimeMs;
  model_name?: ModelName1;
  provider_id?: ProviderId2;
  reason: Reason7;
  route: Route;
  viable: Viable;
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
  schema_version?: SchemaVersion51;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "GraphicsDevice".
 */
export interface GraphicsDevice {
  driver_version?: DriverVersion;
  memory_bytes?: MemoryBytes;
  name: Name2;
  vendor: Vendor;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "LocalModelInventory".
 */
export interface LocalModelInventory {
  detail: Detail6;
  endpoint: Endpoint;
  inspected_at: InspectedAt;
  models?: Models;
  runtime_id?: RuntimeId;
  schema_version?: SchemaVersion52;
  state: State4;
  version?: Version4;
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
  name: Name3;
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
  action: Action;
  alternatives?: Alternatives1;
  candidate?: ModelCatalogCandidate | null;
  catalog_checked_at: CatalogCheckedAt;
  catalog_sha256?: CatalogSha256;
  catalog_state: CatalogState;
  catalog_url: CatalogUrl;
  install_command?: InstallCommand;
  installed?: Installed1;
  project_id: ProjectId44;
  reason: Reason10;
  recommendation_id: RecommendationId;
  recommended_model_name?: RecommendedModelName;
  required_capability_ids: RequiredCapabilityIds1;
  schema_version?: SchemaVersion53;
  task_id: TaskId40;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelCatalogCandidate".
 */
export interface ModelCatalogCandidate {
  description: Description3;
  estimated_size_bytes: EstimatedSizeBytes;
  family: Family1;
  installed: Installed;
  memory_tier: MemoryTier;
  modalities: Modalities1;
  name: Name4;
  parameter_size: ParameterSize1;
  reason: Reason9;
  source_url: SourceUrl;
  suitability_score: SuitabilityScore;
  thinking_support: ThinkingSupport;
  tool_support: ToolSupport1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Provider".
 */
export interface Provider {
  billing: Billing;
  cap: Cap;
  currency?: Currency1;
  provider_id: ProviderId3;
  schema_version?: SchemaVersion54;
  state: State5;
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
 * via the `definition` "QAGateDefinition".
 */
export interface QAGateDefinition {
  allowed_producer_types: AllowedProducerTypes;
  claim: Claim1;
  description: Description4;
  discipline: Discipline;
  gate_id: GateId2;
  required_evidence_classes: RequiredEvidenceClasses;
  requires_independent_verification?: RequiresIndependentVerification;
  requires_runtime_capture?: RequiresRuntimeCapture;
  schema_version?: SchemaVersion55;
  title: Title4;
  version: Version5;
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
  project_id: ProjectId45;
  report_id: ReportId;
  required_gate_count: RequiredGateCount;
  schema_version?: SchemaVersion56;
  task_id: TaskId41;
  waived_gate_count: WaivedGateCount;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QAGateStatus".
 */
export interface QAGateStatus {
  evidence_ids?: EvidenceIds4;
  explanation: Explanation1;
  gate: QAGateDefinition;
  latest_evaluation_id?: LatestEvaluationId;
  required: Required;
  state: State6;
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
  schema_version?: SchemaVersion57;
  tool_id: ToolId1;
  version: Version6;
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
 * via the `definition` "ContextCommand".
 */
export interface ContextCommand {
  task_id: TaskId42;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DecisionCommand".
 */
export interface DecisionCommand {
  decision_id: DecisionId3;
  rationale: Rationale3;
  request_id: RequestId1;
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
  inspected_at: InspectedAt1;
  main_scene: MainScene;
  project_id: ProjectId46;
  project_path: ProjectPath;
  task_id: TaskId43;
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
 * via the `definition` "GateWaiverCommand".
 */
export interface GateWaiverCommand {
  gate_id: GateId3;
  reason: Reason11;
  request_id: RequestId2;
  task_id: TaskId44;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "HumanReviewCommand".
 */
export interface HumanReviewCommand {
  gate_id: GateId4;
  request_id: RequestId3;
  summary: Summary5;
  supporting_evidence_ids?: SupportingEvidenceIds;
  task_id: TaskId45;
  verdict: Verdict;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "IntelligenceRefreshCommand".
 */
export interface IntelligenceRefreshCommand {
  request_id: RequestId4;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelBenchmarkCommand".
 */
export interface ModelBenchmarkCommand {
  model_name?: ModelName2;
  request_id: RequestId5;
  task_id: TaskId46;
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
  request_id: RequestId6;
  task_id: TaskId47;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ModelRouteCommand".
 */
export interface ModelRouteCommand {
  request_id: RequestId7;
  task_id: TaskId48;
  urgency?: Urgency1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ObjectiveCommand".
 */
export interface ObjectiveCommand {
  objective: Objective3;
  request_id: RequestId8;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PlanDraft".
 */
export interface PlanDraft {
  questions: Questions1;
  steps: Steps;
  summary: Summary6;
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
  title: Title5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PolicyCommand".
 */
export interface PolicyCommand {
  expected_cursor: ExpectedCursor;
  policy: Policy;
  request_id: RequestId9;
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
  name: Name5;
  project_id: ProjectId47;
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
  project_id: ProjectId48;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSelection".
 */
export interface ProjectSelection {
  project_id: ProjectId49;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSnapshot".
 */
export interface ProjectSnapshot {
  cursor: Cursor1;
  decisions?: Decisions1;
  evaluations?: Evaluations;
  evidence?: Evidence1;
  gm?: GMRecord | null;
  history_digest: HistoryDigest;
  intelligence?: ProjectIntelligence | null;
  model_benchmarks?: ModelBenchmarks;
  model_routing_records?: ModelRoutingRecords;
  plans?: Plans;
  policy: Policy;
  project: Project;
  reconciliations?: Reconciliations;
  recruitments?: Recruitments;
  requires_reconciliation?: RequiresReconciliation;
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
  detail?: Detail7;
  detected_at: DetectedAt1;
  git_commits?: GitCommits1;
  git_diff_summary?: GitDiffSummary1;
  observed: WorkspaceFingerprint;
  paths: Paths2;
  project_id: ProjectId50;
  reconciled_at?: ReconciledAt;
  schema_version?: SchemaVersion58;
  state?: State7;
  task_id?: TaskId49;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "QARunCommand".
 */
export interface QARunCommand {
  request_id: RequestId10;
  task_id: TaskId50;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ReconcileCommand".
 */
export interface ReconcileCommand {
  change_id: ChangeId3;
  detail: Detail8;
  request_id: RequestId11;
  task_id?: TaskId51;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RecruitmentCommand".
 */
export interface RecruitmentCommand {
  request_id: RequestId12;
  task_id: TaskId52;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "RuntimeCaptureCommand".
 */
export interface RuntimeCaptureCommand {
  node_path: NodePath;
  request_id: RequestId13;
  task_id: TaskId53;
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
  detail: Detail9;
  request_id: RequestId14;
  task_id: TaskId54;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskProposal".
 */
export interface TaskProposal {
  deliverables: Deliverables2;
  dependency_ids?: DependencyIds1;
  objective: Objective5;
  request_id: RequestId15;
  required_capabilities: RequiredCapabilities3;
  title: Title6;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskStartCommand".
 */
export interface TaskStartCommand {
  deliverables?: Deliverables3;
  objective?: Objective6;
  request_id: RequestId16;
  required_capabilities?: RequiredCapabilities4;
  task_id?: TaskId55;
  title?: Title7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerCommand".
 */
export interface WorkerCommand {
  task_id: TaskId56;
  worker_id?: WorkerId1;
}
