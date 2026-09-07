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
export type AgentId1 = string;
export type AgentVersion = string;
export type AssignedBy = "gm";
export type AssignmentId = string;
export type ProjectId = string;
export type Sandbox = "read_only" | "workspace_write";
export type SchemaVersion1 = 1;
export type TaskId = string;
export type ThreadId = string | null;
export type WorkingDirectory = string;
export type CapabilityId = string;
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
export type SchemaVersion2 = 1;
export type Version1 = string;
export type Consequences = string[];
export type DecidedAt = string;
export type DecidedBy = "human";
export type DecisionId = string;
export type EvidenceIds = string[];
/**
 * @minItems 1
 */
export type Options = [string, ...string[]];
export type ProjectId1 = string;
export type Reason = string;
export type Recommendation = string;
export type SchemaVersion3 = 1;
export type SelectedOption = string;
export type TaskId1 = string | null;
export type Title = string;
export type Urgency = "low" | "normal" | "urgent";
export type AdapterId = string;
/**
 * @minItems 1
 */
export type Capabilities1 = [string, ...string[]];
export type EngineType = string;
export type SchemaVersion4 = 1;
export type SupportedVersions = string;
/**
 * @minItems 1
 */
export type ToolIds = [string, ...string[]];
export type Version2 = string;
export type Claim = "technical" | "visual" | "subjective" | "fun";
export type EvaluatedAt = string;
export type EvaluationId = string;
export type EvaluatorId = string;
/**
 * @minItems 1
 */
export type EvidenceIds1 = [string, ...string[]];
export type GateId = string;
export type ProjectId2 = string;
export type Rationale = string;
export type Result = "passed" | "failed" | "inconclusive";
export type SchemaVersion5 = 1;
export type TaskId2 = string;
export type Event =
  | (
      | TaskEvent
      | AgentEvent
      | EvaluationEvent
      | DecisionEvent
      | ArtifactEvent
      | ChangeEvent
      | SpendEvent
      | ProviderEvent
      | CommitEvent
      | ProjectInitializedEvent
      | TaskProposedEvent
      | PolicyUpdatedEvent
      | WorkerEvent
    )
  | null;
export type ActorId = string;
export type ActorType = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId = string;
export type EventId = string;
export type EventType = "task.created" | "task.started" | "task.blocked" | "task.completed";
export type Detail = string;
export type TaskId3 = string;
export type ProjectId3 = string;
export type SchemaVersion6 = 1;
export type Sequence = number;
export type TaskId4 = string | null;
export type Timestamp = string;
export type ActorId1 = string;
export type ActorType1 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId1 = string;
export type EventId1 = string;
export type EventType1 = "agent.assigned" | "agent.failed" | "agent.hired";
export type AgentId2 = string;
export type AssignmentId1 = string;
export type ProjectId4 = string;
export type SchemaVersion7 = 1;
export type Sequence1 = number;
export type TaskId5 = string | null;
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
export type EvidenceIds2 = [string, ...string[]];
export type ProjectId5 = string;
export type SchemaVersion8 = 1;
export type Sequence2 = number;
export type TaskId6 = string | null;
export type Timestamp2 = string;
export type ActorId3 = string;
export type ActorType3 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId3 = string;
export type EventId3 = string;
export type EventType3 = "decision.requested" | "decision.resolved" | "gm.challenge_raised" | "gate.waived";
export type DecisionId1 = string;
export type Reason1 = string;
export type ProjectId6 = string;
export type SchemaVersion9 = 1;
export type Sequence3 = number;
export type TaskId7 = string | null;
export type Timestamp3 = string;
export type ActorId4 = string;
export type ActorType4 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId4 = string;
export type EventId4 = string;
export type EventType4 = "artifact.created" | "artifact.modified";
export type Locator = string | null;
export type MediaType = string;
export type Sha256 = string;
export type Uri = string;
export type ProjectId7 = string;
export type SchemaVersion10 = 1;
export type Sequence4 = number;
export type TaskId8 = string | null;
export type Timestamp4 = string;
export type ActorId5 = string;
export type ActorType5 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId5 = string;
export type EventId5 = string;
export type EventType5 = "project.external_change_detected" | "project.reconciled";
export type ChangeId = string;
/**
 * @minItems 1
 */
export type Paths = [string, ...string[]];
export type ProjectId8 = string;
export type SchemaVersion11 = 1;
export type Sequence5 = number;
export type TaskId9 = string | null;
export type Timestamp5 = string;
export type ActorId6 = string;
export type ActorType6 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId6 = string;
export type EventId6 = string;
export type EventType6 = "provider.spend_recorded";
export type AmountCents = number;
export type ProviderId = string;
export type ReservationId = string;
export type ProjectId9 = string;
export type SchemaVersion12 = 1;
export type Sequence6 = number;
export type TaskId10 = string | null;
export type Timestamp6 = string;
export type ActorId7 = string;
export type ActorType7 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId7 = string;
export type EventId7 = string;
export type EventType7 = "provider.disabled";
export type ProviderId1 = string;
export type Reason2 = string;
export type ProjectId10 = string;
export type SchemaVersion13 = 1;
export type Sequence7 = number;
export type TaskId11 = string | null;
export type Timestamp7 = string;
export type ActorId8 = string;
export type ActorType8 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId8 = string;
export type EventId8 = string;
export type EventType8 = "git.commit.created";
export type CommitId = string;
export type Workspace = string;
export type ProjectId11 = string;
export type SchemaVersion14 = 1;
export type Sequence8 = number;
export type TaskId12 = string | null;
export type Timestamp8 = string;
export type ActorId9 = string;
export type ActorType9 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId9 = string;
export type EventId9 = string;
export type EventType9 = "project.initialized";
export type Field = string;
export type Kind = "known" | "inferred" | "missing";
export type Source = string;
export type Value = string | null;
export type Findings = InitializationFinding[];
export type GitHead = string | null;
export type GitRecentCommits = string[];
export type InspectedAssets = string[];
export type InspectedDocuments = string[];
export type RepositoryRoot = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities = [string, ...string[]];
export type SchemaVersion15 = 1;
export type ApprovalThresholdCents = number;
export type Authority = "ask_first" | "recommend_and_proceed" | "autonomous_within_policy";
export type Currency = "USD";
export type MonthlyExternalBudgetCents = number;
export type PostSpecialistNonprogressLimit = 3;
export type Proactivity = "reactive" | "balanced" | "active";
export type ProjectId12 = string;
export type RequireProviderHardCap = true;
export type RequireRegistrationOrReconciliation = true;
export type SchemaVersion16 = 1;
export type Direction1 = string;
export type References = SourceRef[];
export type Constraints1 = string[];
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
export type SchemaVersion17 = 1;
export type ProjectId13 = string;
export type SchemaVersion18 = 1;
export type Sequence9 = number;
export type TaskId13 = string | null;
export type Timestamp9 = string;
export type ActorId10 = string;
export type ActorType10 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId10 = string;
export type EventId10 = string;
export type EventType10 = "task.proposed";
export type Constraints2 = string[];
/**
 * @minItems 1
 */
export type Deliverables = [string, ...string[]];
export type DependencyIds = string[];
export type EntityId = string;
export type Kind1 = string;
export type ProjectId14 = string;
export type Entities = EntityRef[];
export type EscalationCriteria = string[];
export type Objective = string;
export type ParentTaskId = string | null;
export type Priority = "low" | "normal" | "high" | "urgent";
export type ProjectId15 = string;
export type References1 = SourceRef[];
/**
 * @minItems 1
 */
export type RequiredCapabilities1 = [string, ...string[]];
/**
 * @minItems 1
 */
export type RequiredEvaluations = [string, ...string[]];
export type Accessibility = string[];
export type Functional = string[];
export type Production1 = string[];
export type Technical = string[];
export type Visual = string[];
export type SchemaVersion19 = 1;
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
export type TaskId14 = string;
export type Title1 = string;
export type ProjectId16 = string;
export type SchemaVersion20 = 1;
export type Sequence10 = number;
export type TaskId15 = string | null;
export type Timestamp10 = string;
export type ActorId11 = string;
export type ActorType11 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId11 = string;
export type EventId11 = string;
export type EventType11 = "policy.updated";
export type ProjectId17 = string;
export type SchemaVersion21 = 1;
export type Sequence11 = number;
export type TaskId16 = string | null;
export type Timestamp11 = string;
export type ActorId12 = string;
export type ActorType12 = "human" | "gm" | "agent" | "system" | "external";
export type CorrelationId12 = string;
export type EventId12 = string;
export type EventType12 = "worker.updated";
export type Cwd = string;
export type Detail1 = string;
export type ProjectId18 = string;
export type Findings1 = string[];
export type NextSteps = string[];
export type Summary = string;
export type SchemaVersion22 = 1;
export type State1 = "ready" | "running" | "completed" | "failed" | "interrupted";
export type TaskId17 = string;
export type ThreadId1 = string;
export type TurnId = string | null;
export type WorkerId = string;
export type ProjectId19 = string;
export type SchemaVersion23 = 1;
export type Sequence12 = number;
export type TaskId18 = string | null;
export type Timestamp12 = string;
export type CaptureOrigin = "runtime" | "source" | "simulation" | "human_observation" | "model_output";
export type CapturedAt = string;
export type EvidenceClass = "deterministic" | "measured" | "comparative" | "heuristic" | "human";
export type EvidenceId = string;
export type ProducerId = string;
export type ProducerType = "tool" | "model" | "human";
export type ProjectId20 = string;
export type SchemaVersion24 = 1;
export type Summary1 = string;
export type TaskId19 = string;
export type Confidence = number;
export type CreatedAt = string;
export type Entities1 = EntityRef[];
export type EvidenceIds3 = string[];
export type Kind2 =
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
export type ProjectId21 = string;
export type SchemaVersion25 = 1;
export type Statement = string;
export type SupersedesId = string | null;
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
export type ProviderId2 = string;
export type SchemaVersion26 = 1;
export type State2 = "ACTIVE" | "DISABLED" | "DISABLED_UNCAPPED";
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
export type SchemaVersion27 = 1;
export type ToolId = string;
export type Version4 = string;
export type Cursor = number;
export type Events = (
  | TaskEvent
  | AgentEvent
  | EvaluationEvent
  | DecisionEvent
  | ArtifactEvent
  | ChangeEvent
  | SpendEvent
  | ProviderEvent
  | CommitEvent
  | ProjectInitializedEvent
  | TaskProposedEvent
  | PolicyUpdatedEvent
  | WorkerEvent
)[];
export type HasMore = boolean;
export type ExpectedCursor = number;
export type RequestId = string;
export type Cursor1 = number;
export type HistoryDigest = string;
export type Tasks = TaskContract[];
export type Workers = WorkerRecord[];
export type Cursor2 = number;
export type Events1 = (
  | TaskEvent
  | AgentEvent
  | EvaluationEvent
  | DecisionEvent
  | ArtifactEvent
  | ChangeEvent
  | SpendEvent
  | ProviderEvent
  | CommitEvent
  | ProjectInitializedEvent
  | TaskProposedEvent
  | PolicyUpdatedEvent
  | WorkerEvent
)[];
export type HasMore1 = boolean;
export type Type2 = "events";
/**
 * @minItems 1
 */
export type Deliverables1 = [string, ...string[]];
export type DependencyIds1 = string[];
export type Objective1 = string;
export type RequestId1 = string;
/**
 * @minItems 1
 */
export type RequiredCapabilities2 = [string, ...string[]];
export type Title2 = string;
export type TaskId20 = string;
export type WorkerId1 = string | null;

/**
 * Discriminated export root; each document remains independently addressable.
 */
export interface ProtocolDocument {
  agent?: AgentDefinition | null;
  assignment?: AgentAssignment | null;
  capability?: Capability | null;
  decision?: Decision | null;
  engine_adapter?: EngineAdapter | null;
  evaluation?: Evaluation | null;
  event?: Event;
  evidence?: Evidence | null;
  knowledge?: KnowledgeEntry | null;
  policy?: Policy | null;
  project?: Project | null;
  provider?: Provider | null;
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
  schema_version?: SchemaVersion1;
  task_id: TaskId;
  thread_id?: ThreadId;
  working_directory: WorkingDirectory;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Capability".
 */
export interface Capability {
  capability_id: CapabilityId;
  description: Description1;
  evaluation_requirements: EvaluationRequirements;
  expected_outputs: ExpectedOutputs;
  family: Family;
  required_inputs: RequiredInputs1;
  schema_version?: SchemaVersion2;
  version: Version1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Decision".
 */
export interface Decision {
  consequences: Consequences;
  decided_at: DecidedAt;
  decided_by: DecidedBy;
  decision_id: DecisionId;
  evidence_ids: EvidenceIds;
  options: Options;
  project_id: ProjectId1;
  reason: Reason;
  recommendation: Recommendation;
  schema_version?: SchemaVersion3;
  selected_option: SelectedOption;
  task_id: TaskId1;
  title: Title;
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
  schema_version?: SchemaVersion4;
  supported_versions: SupportedVersions;
  tool_ids: ToolIds;
  version: Version2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Evaluation".
 */
export interface Evaluation {
  claim: Claim;
  evaluated_at: EvaluatedAt;
  evaluation_id: EvaluationId;
  evaluator_id: EvaluatorId;
  evidence_ids: EvidenceIds1;
  gate_id: GateId;
  project_id: ProjectId2;
  rationale: Rationale;
  result: Result;
  schema_version?: SchemaVersion5;
  task_id: TaskId2;
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
  project_id: ProjectId3;
  schema_version?: SchemaVersion6;
  sequence: Sequence;
  task_id: TaskId4;
  timestamp: Timestamp;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskEventPayload".
 */
export interface TaskEventPayload {
  detail: Detail;
  task_id: TaskId3;
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
  project_id: ProjectId4;
  schema_version?: SchemaVersion7;
  sequence: Sequence1;
  task_id: TaskId5;
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
  project_id: ProjectId5;
  schema_version?: SchemaVersion8;
  sequence: Sequence2;
  task_id: TaskId6;
  timestamp: Timestamp2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EvaluationPayload".
 */
export interface EvaluationPayload {
  evaluation_id: EvaluationId1;
  evidence_ids: EvidenceIds2;
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
  project_id: ProjectId6;
  schema_version?: SchemaVersion9;
  sequence: Sequence3;
  task_id: TaskId7;
  timestamp: Timestamp3;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "DecisionPayload".
 */
export interface DecisionPayload {
  decision_id: DecisionId1;
  reason: Reason1;
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
  project_id: ProjectId7;
  schema_version?: SchemaVersion10;
  sequence: Sequence4;
  task_id: TaskId8;
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
 * via the `definition` "ChangeEvent".
 */
export interface ChangeEvent {
  actor_id: ActorId5;
  actor_type: ActorType5;
  correlation_id: CorrelationId5;
  event_id: EventId5;
  event_type: EventType5;
  payload: ChangePayload;
  project_id: ProjectId8;
  schema_version?: SchemaVersion11;
  sequence: Sequence5;
  task_id: TaskId9;
  timestamp: Timestamp5;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ChangePayload".
 */
export interface ChangePayload {
  change_id: ChangeId;
  paths: Paths;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "SpendEvent".
 */
export interface SpendEvent {
  actor_id: ActorId6;
  actor_type: ActorType6;
  correlation_id: CorrelationId6;
  event_id: EventId6;
  event_type: EventType6;
  payload: SpendPayload;
  project_id: ProjectId9;
  schema_version?: SchemaVersion12;
  sequence: Sequence6;
  task_id: TaskId10;
  timestamp: Timestamp6;
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
  actor_id: ActorId7;
  actor_type: ActorType7;
  correlation_id: CorrelationId7;
  event_id: EventId7;
  event_type: EventType7;
  payload: ProviderPayload;
  project_id: ProjectId10;
  schema_version?: SchemaVersion13;
  sequence: Sequence7;
  task_id: TaskId11;
  timestamp: Timestamp7;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProviderPayload".
 */
export interface ProviderPayload {
  provider_id: ProviderId1;
  reason: Reason2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "CommitEvent".
 */
export interface CommitEvent {
  actor_id: ActorId8;
  actor_type: ActorType8;
  correlation_id: CorrelationId8;
  event_id: EventId8;
  event_type: EventType8;
  payload: CommitPayload;
  project_id: ProjectId11;
  schema_version?: SchemaVersion14;
  sequence: Sequence8;
  task_id: TaskId12;
  timestamp: Timestamp8;
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
  actor_id: ActorId9;
  actor_type: ActorType9;
  correlation_id: CorrelationId9;
  event_id: EventId9;
  event_type: EventType9;
  payload: ProjectInitializedPayload;
  project_id: ProjectId13;
  schema_version?: SchemaVersion18;
  sequence: Sequence9;
  task_id: TaskId13;
  timestamp: Timestamp9;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectInitializedPayload".
 */
export interface ProjectInitializedPayload {
  intake: InitializationReport;
  policy: Policy;
  project: Project;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InitializationReport".
 */
export interface InitializationReport {
  findings: Findings;
  git_head: GitHead;
  git_recent_commits: GitRecentCommits;
  inspected_assets: InspectedAssets;
  inspected_documents: InspectedDocuments;
  repository_root: RepositoryRoot;
  required_capabilities: RequiredCapabilities;
  schema_version?: SchemaVersion15;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "InitializationFinding".
 */
export interface InitializationFinding {
  field: Field;
  kind: Kind;
  source: Source;
  value: Value;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Policy".
 */
export interface Policy {
  approval_threshold_cents?: ApprovalThresholdCents;
  authority?: Authority;
  currency?: Currency;
  monthly_external_budget_cents?: MonthlyExternalBudgetCents;
  post_specialist_nonprogress_limit?: PostSpecialistNonprogressLimit;
  proactivity?: Proactivity;
  project_id: ProjectId12;
  require_provider_hard_cap?: RequireProviderHardCap;
  require_registration_or_reconciliation?: RequireRegistrationOrReconciliation;
  schema_version?: SchemaVersion16;
  worker_permissions?: Permissions;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Project".
 */
export interface Project {
  audio: Direction;
  constraints: Constraints1;
  engine?: Engine | null;
  input_methods: InputMethods;
  locked_decision_ids: LockedDecisionIds;
  medium: Medium;
  multiplayer: Multiplayer;
  platforms: Platforms;
  production: Production;
  project: ProjectIdentity;
  rendering: Rendering;
  schema_version?: SchemaVersion17;
  visual: Direction;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Direction".
 */
export interface Direction {
  direction: Direction1;
  references: References;
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
export interface Production {
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
  actor_id: ActorId10;
  actor_type: ActorType10;
  correlation_id: CorrelationId10;
  event_id: EventId10;
  event_type: EventType10;
  payload: TaskContract;
  project_id: ProjectId16;
  schema_version?: SchemaVersion20;
  sequence: Sequence10;
  task_id: TaskId15;
  timestamp: Timestamp10;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "TaskContract".
 */
export interface TaskContract {
  constraints: Constraints2;
  deliverables: Deliverables;
  dependency_ids: DependencyIds;
  entities: Entities;
  escalation_criteria: EscalationCriteria;
  objective: Objective;
  parent_task_id?: ParentTaskId;
  permissions: Permissions;
  priority?: Priority;
  project_id: ProjectId15;
  references: References1;
  required_capabilities: RequiredCapabilities1;
  required_evaluations: RequiredEvaluations;
  requirements: Requirements;
  schema_version?: SchemaVersion19;
  state?: State;
  task_id: TaskId14;
  title: Title1;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "EntityRef".
 */
export interface EntityRef {
  entity_id: EntityId;
  kind: Kind1;
  project_id: ProjectId14;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Requirements".
 */
export interface Requirements {
  accessibility: Accessibility;
  functional: Functional;
  production: Production1;
  technical: Technical;
  visual: Visual;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "PolicyUpdatedEvent".
 */
export interface PolicyUpdatedEvent {
  actor_id: ActorId11;
  actor_type: ActorType11;
  correlation_id: CorrelationId11;
  event_id: EventId11;
  event_type: EventType11;
  payload: Policy;
  project_id: ProjectId17;
  schema_version?: SchemaVersion21;
  sequence: Sequence11;
  task_id: TaskId16;
  timestamp: Timestamp11;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerEvent".
 */
export interface WorkerEvent {
  actor_id: ActorId12;
  actor_type: ActorType12;
  correlation_id: CorrelationId12;
  event_id: EventId12;
  event_type: EventType12;
  payload: WorkerRecord;
  project_id: ProjectId19;
  schema_version?: SchemaVersion23;
  sequence: Sequence12;
  task_id: TaskId18;
  timestamp: Timestamp12;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerRecord".
 */
export interface WorkerRecord {
  cwd: Cwd;
  detail: Detail1;
  project_id: ProjectId18;
  result?: WorkerResult | null;
  schema_version?: SchemaVersion22;
  state: State1;
  task_id: TaskId17;
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
 * via the `definition` "Evidence".
 */
export interface Evidence {
  capture_origin: CaptureOrigin;
  captured_at: CapturedAt;
  evidence_class: EvidenceClass;
  evidence_id: EvidenceId;
  producer_id: ProducerId;
  producer_type: ProducerType;
  project_id: ProjectId20;
  schema_version?: SchemaVersion24;
  source: SourceRef;
  summary: Summary1;
  task_id: TaskId19;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "KnowledgeEntry".
 */
export interface KnowledgeEntry {
  confidence: Confidence;
  created_at: CreatedAt;
  entities: Entities1;
  evidence_ids: EvidenceIds3;
  kind: Kind2;
  knowledge_id: KnowledgeId;
  project_id: ProjectId21;
  schema_version?: SchemaVersion25;
  source: SourceRef;
  statement: Statement;
  supersedes_id?: SupersedesId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "Provider".
 */
export interface Provider {
  billing: Billing;
  cap: Cap;
  currency?: Currency1;
  provider_id: ProviderId2;
  schema_version?: SchemaVersion26;
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
  schema_version?: SchemaVersion27;
  tool_id: ToolId;
  version: Version4;
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
 * via the `definition` "PolicyCommand".
 */
export interface PolicyCommand {
  expected_cursor: ExpectedCursor;
  policy: Policy;
  request_id: RequestId;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "ProjectSnapshot".
 */
export interface ProjectSnapshot {
  cursor: Cursor1;
  history_digest: HistoryDigest;
  policy: Policy;
  project: Project;
  tasks: Tasks;
  workers?: Workers;
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
 * via the `definition` "TaskProposal".
 */
export interface TaskProposal {
  deliverables: Deliverables1;
  dependency_ids?: DependencyIds1;
  objective: Objective1;
  request_id: RequestId1;
  required_capabilities: RequiredCapabilities2;
  title: Title2;
}
/**
 * This interface was referenced by `ProtocolDocument`'s JSON-Schema
 * via the `definition` "WorkerCommand".
 */
export interface WorkerCommand {
  task_id: TaskId20;
  worker_id?: WorkerId1;
}
