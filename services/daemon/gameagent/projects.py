"""Project commands and replay. All mutations pass through the same lock/log."""

import hashlib
import json
import mimetypes
import os
import subprocess
import tempfile
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, Literal
from urllib.parse import quote
from uuid import uuid4

import yaml
from filelock import FileLock

from gameagent.constitution import provider_admission, require, validate_model_routing
from gameagent.gm import plan_decisions, task_readiness, validate_plan
from gameagent.intelligence import assemble_context as build_context
from gameagent.intelligence import index_repository
from gameagent.models.api import (
    ContextCommand,
    DecisionCommand,
    EventPage,
    GateWaiverCommand,
    HumanReviewCommand,
    IntelligenceRefreshCommand,
    LessonReviewCommand,
    PolicyCommand,
    ProjectCatalog,
    ProjectRemoval,
    ProjectSnapshot,
    ProjectSummary,
    ProviderConfigureCommand,
    ProviderDisableCommand,
    QARunCommand,
    ReconcileCommand,
    SpendApprovalCommand,
    TaskProgressCommand,
    TaskProposal,
    TaskStartCommand,
)
from gameagent.models.contracts import (
    AgentDefinition,
    BudgetReservation,
    BudgetReservationEvent,
    ContextPackage,
    Evaluation,
    EvaluationRecordedEvent,
    Event,
    Evidence,
    EvidenceRecordedEvent,
    ExperienceLesson,
    ExperienceLessonEvent,
    ExperienceObservation,
    ExperienceObservedEvent,
    ExternalChangeEvent,
    ExternalChangePayload,
    GateWaivedEvent,
    GateWaiver,
    GMEvent,
    GMRecord,
    InboxDecision,
    InboxDecisionRequestedEvent,
    InboxEvent,
    InitializationReport,
    IntelligenceEvent,
    LeadDomainAssessment,
    ModelBenchmark,
    ModelBenchmarkEvent,
    ModelRoutingEvent,
    ModelRoutingRecord,
    OnboardingEvent,
    OnboardingEventPayload,
    PaidInvocationEvent,
    PaidInvocationRecord,
    Permissions,
    PlanEvent,
    Policy,
    PolicyUpdatedEvent,
    ProductionDomainInspection,
    ProductionDomainInspectionEvent,
    ProductionPlan,
    Project,
    ProjectInitializedEvent,
    ProjectInitializedPayload,
    ProjectIntelligence,
    ProjectOnboarding,
    ProjectReconciledEvent,
    Provider,
    ProviderConfiguredEvent,
    ProviderConfiguredPayload,
    ProviderEvent,
    ProviderPayload,
    QAReport,
    ReconciliationPayload,
    ReconciliationRecord,
    RecruitmentEvent,
    RecruitmentRecord,
    Requirements,
    SourceRef,
    SpendApproval,
    SpendApprovedEvent,
    SpendEvent,
    TaskContract,
    TaskEvent,
    TaskEventPayload,
    TaskProposedEvent,
    WorkerEvent,
    WorkerRecord,
    WorkspaceBaselineEvent,
    WorkspaceEntry,
    WorkspaceFingerprint,
    WorldResearch,
    WorldResearchEvent,
)
from gameagent.persistence.history import append, read_history, write_new
from gameagent.persistence.projection import Projection
from gameagent.qa import (
    build_report,
    contract_compliance_result,
    human_review_result,
    validate_gate_evaluation,
)

if TYPE_CHECKING:
    from gameagent.knowledge import KnowledgeRouter


def timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


IGNORED_WORKSPACE_PARTS = {
    ".git",
    ".gameagent",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
}
AGENT_INSTRUCTIONS_BEGIN = "<!-- BEGIN GAME AGENT NETWORK -->"
AGENT_INSTRUCTIONS_END = "<!-- END GAME AGENT NETWORK -->"
AGENT_INSTRUCTIONS = f"""{AGENT_INSTRUCTIONS_BEGIN}

## Game Agent Network registration

When this repository is managed by GAN, register meaningful project work before editing:

```text
gameagent task start . --title \"Short task title\" --objective \"Desired outcome\"
gameagent task status .
gameagent task block . --task-id TASK_ID --detail \"What is blocking progress\"
gameagent task complete . --task-id TASK_ID --detail \"What changed and why\"
```

If meaningful work was performed without registration, run `gameagent reconcile .` and
provide an explanation. Never hide, delete, or silently rewrite GAN project history.
{AGENT_INSTRUCTIONS_END}
"""


def ensure_project_instructions(root: Path) -> Path:
    path = root / "AGENTS.md"
    require(not path.is_symlink(), "unsafe_agent_instructions", str(path))
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    has_begin = AGENT_INSTRUCTIONS_BEGIN in existing
    has_end = AGENT_INSTRUCTIONS_END in existing
    require(has_begin == has_end, "invalid_agent_instructions", str(path))
    if has_begin:
        start = existing.index(AGENT_INSTRUCTIONS_BEGIN)
        end = existing.index(AGENT_INSTRUCTIONS_END, start) + len(AGENT_INSTRUCTIONS_END)
        content = existing[:start] + AGENT_INSTRUCTIONS.rstrip() + existing[end:]
    else:
        separator = "\n\n" if existing and not existing.endswith("\n\n") else ""
        content = existing + separator + AGENT_INSTRUCTIONS
    data = content.encode("utf-8")
    if path.exists() and path.read_bytes() == data:
        return path
    with tempfile.NamedTemporaryFile(
        dir=root, prefix="agents-", suffix=".tmp", delete=False
    ) as temporary:
        temporary.write(data)
        temporary.flush()
        os.fsync(temporary.fileno())
        temporary_path = Path(temporary.name)
    os.replace(temporary_path, path)
    return path


def workspace_fingerprint(root: Path) -> WorkspaceFingerprint:
    entries: list[WorkspaceEntry] = []
    for directory, names, files in os.walk(root, followlinks=False):
        names[:] = sorted(name for name in names if name not in IGNORED_WORKSPACE_PARTS)
        for name in sorted(files):
            path = Path(directory) / name
            if path.is_symlink():
                continue
            try:
                stat = path.stat()
            except FileNotFoundError:
                continue
            entries.append(
                WorkspaceEntry(
                    path=path.relative_to(root).as_posix(),
                    size=stat.st_size,
                    modified_ns=stat.st_mtime_ns,
                )
            )
    git = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "HEAD"],
        capture_output=True,
        check=False,
        encoding="utf-8",
        errors="replace",
    )
    git_head = git.stdout.strip() if git.returncode == 0 and git.stdout.strip() else None
    status = subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "status",
            "--porcelain=v1",
            "-z",
            "--untracked-files=all",
            "--",
            ".",
            ":(exclude).gameagent",
        ],
        capture_output=True,
        check=False,
    )
    git_status = (
        sorted(item for item in status.stdout.decode("utf-8", errors="replace").split("\0") if item)
        if status.returncode == 0
        else []
    )
    material = {
        "git_head": git_head,
        "git_status": git_status,
        "entries": [entry.model_dump(mode="json") for entry in entries],
    }
    digest = hashlib.sha256(
        json.dumps(material, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return WorkspaceFingerprint(
        captured_at=timestamp(),
        git_head=git_head,
        git_status=git_status,
        entries=entries,
        digest=digest,
    )


def workspace_changes(baseline: WorkspaceFingerprint, observed: WorkspaceFingerprint) -> list[str]:
    before = {entry.path: (entry.size, entry.modified_ns) for entry in baseline.entries}
    after = {entry.path: (entry.size, entry.modified_ns) for entry in observed.entries}
    paths = sorted(
        path for path in before.keys() | after.keys() if before.get(path) != after.get(path)
    )
    if baseline.git_head != observed.git_head:
        paths.insert(0, ".git/HEAD")
    return paths


def git_change_context(
    root: Path, baseline: WorkspaceFingerprint, observed: WorkspaceFingerprint
) -> tuple[list[str], str | None]:
    commits: list[str] = []
    if observed.git_head and observed.git_head != baseline.git_head:
        revision = (
            f"{baseline.git_head}..{observed.git_head}" if baseline.git_head else observed.git_head
        )
        history = subprocess.run(
            ["git", "-C", str(root), "rev-list", "--reverse", revision],
            capture_output=True,
            check=False,
            encoding="utf-8",
            errors="replace",
        )
        if history.returncode == 0:
            commits = [line for line in history.stdout.splitlines() if line]
    diff_command = ["git", "-C", str(root), "diff", "--stat"]
    if baseline.git_head:
        diff_command.append(baseline.git_head)
    diff_command.extend(["--", ".", ":(exclude).gameagent"])
    difference = subprocess.run(
        diff_command,
        capture_output=True,
        check=False,
        encoding="utf-8",
        errors="replace",
    )
    summary = difference.stdout.strip()[:32768] if difference.returncode == 0 else ""
    return commits, summary or None


def artifact_references(root: Path, paths: list[str]) -> list[SourceRef]:
    references: list[SourceRef] = []
    for relative in paths:
        if relative == ".git/HEAD":
            continue
        path = (root / relative).resolve()
        if not path.is_relative_to(root) or path.is_symlink() or not path.is_file():
            continue
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        references.append(
            SourceRef(
                uri=f"project:///{quote(relative)}",
                media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                locator=relative,
                sha256=digest.hexdigest(),
            )
        )
    return references


def initialize(root: Path, profile: Project, intake: InitializationReport | None = None) -> Path:
    root = root.resolve(strict=True)
    require(root.is_dir(), "not_a_directory", str(root))
    if intake is None:
        from gameagent.intake import inspect

        _, intake = inspect(root)
    target = root / ".gameagent"
    lock_name = hashlib.sha256(str(root).lower().encode("utf-8")).hexdigest()
    lock_path = Path(tempfile.gettempdir()) / f"gameagent-init-{lock_name}.lock"
    with FileLock(str(lock_path), timeout=10):
        require(
            not target.exists() and not target.is_symlink(),
            "project_already_initialized",
            str(target),
        )
        ensure_project_instructions(root)
        workspace = workspace_fingerprint(root)
        with tempfile.TemporaryDirectory(prefix=".gameagent-init-", dir=root) as temporary:
            stage = Path(temporary) / ".gameagent"
            stage.mkdir()
            for directory in (
                "events",
                "decisions",
                "contracts",
                "evaluations",
                "references",
                "manifests",
            ):
                (stage / directory).mkdir()
            policy = Policy(project_id=profile.project.id)
            write_new(
                stage / "project.yaml",
                yaml.safe_dump(
                    profile.model_dump(mode="json"), sort_keys=True, allow_unicode=True
                ).encode("utf-8"),
            )
            write_new(
                stage / "policy.yaml",
                yaml.safe_dump(policy.model_dump(mode="json"), sort_keys=True).encode("utf-8"),
            )
            write_new(
                stage / "manifests" / "intake.yaml",
                yaml.safe_dump(intake.model_dump(mode="json"), sort_keys=True).encode("utf-8"),
            )
            write_new(stage / "agents.lock.json", b'{"schema_version":1,"agents":[]}\n')
            write_new(stage / ".gitignore", b"*.lock\n*.sqlite3*\n")
            event = ProjectInitializedEvent(
                event_id=f"evt-{uuid4()}",
                project_id=profile.project.id,
                timestamp=timestamp(),
                actor_type="human",
                actor_id="local-director",
                correlation_id=f"init-{uuid4()}",
                task_id=None,
                sequence=1,
                event_type="project.initialized",
                payload=ProjectInitializedPayload(
                    project=profile, policy=policy, intake=intake, workspace=workspace
                ),
            )
            append(stage / "events", event, 1024 * 1024)
            # Atomic directory publication: a failed init never presents a partial project.
            stage.rename(target)
    return target


def _onboarding_events(onboarding: ProjectOnboarding, start_sequence: int) -> list[OnboardingEvent]:
    correlation_id = onboarding.onboarding_id
    sequence = start_sequence
    events: list[OnboardingEvent] = []

    def record(
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
        ],
        detail: str,
        *,
        domain: str | None = None,
        assessment: LeadDomainAssessment | None = None,
        final: ProjectOnboarding | None = None,
    ) -> None:
        nonlocal sequence
        events.append(
            OnboardingEvent(
                event_id=f"evt-{uuid4()}",
                project_id=onboarding.project_id,
                timestamp=onboarding.completed_at,
                actor_type="system",
                actor_id="onboarding-gm",
                correlation_id=correlation_id,
                task_id=None,
                sequence=sequence,
                event_type=event_type,
                payload=OnboardingEventPayload(
                    domain=domain,
                    detail=detail,
                    assessment=assessment,
                    onboarding=final,
                ),
            )
        )
        sequence += 1

    record(
        "project.reconnaissance_started",
        "The GM began a bounded, read-only repository reconnaissance.",
    )
    record("project.reconnaissance_completed", onboarding.reconnaissance_summary)
    for assessment in onboarding.assessments:
        label = assessment.domain.replace("_", " ")
        record(
            "domain.assessment_started",
            f"The {label} Lead began its domain assessment.",
            domain=assessment.domain,
        )
        record(
            "domain.assessment_completed",
            assessment.summary,
            domain=assessment.domain,
            assessment=assessment,
        )
        for assumption in assessment.assumptions:
            record(
                "domain.assumption_recorded",
                assumption.statement,
                domain=assessment.domain,
            )
        for unknown in assessment.unknowns:
            record(
                (
                    "domain.input_needed_now"
                    if unknown.blocks_current_work
                    else "domain.input_needed_later"
                ),
                unknown.question,
                domain=assessment.domain,
            )
    record(
        "project.reconciliation_started",
        "The GM began reconciling duplicate questions, assumptions, and cross-domain findings.",
    )
    record("project.reconciliation_completed", onboarding.reconciliation_summary)
    record(
        "project.onboarding_completed",
        "Domain-led onboarding completed and its project understanding became active.",
        final=onboarding,
    )
    return events


class ProjectStore:
    def __init__(self, root: Path, *, max_segment_bytes: int = 1024 * 1024) -> None:
        self.root = root.resolve(strict=True)
        self.directory = self.root / ".gameagent"
        require(self.directory.is_dir(), "project_not_initialized", str(self.root))
        require(max_segment_bytes > 0, "invalid_segment_size", "Must be positive")
        self.max_segment_bytes = max_segment_bytes
        self._safe_paths()
        self.lock = FileLock(str(self.directory / "writer.lock"), timeout=10)

    def _safe_paths(self) -> None:
        for name in (
            ".",
            "events",
            "contracts",
            "project.yaml",
            "policy.yaml",
            "projection.sqlite3",
            "writer.lock",
        ):
            path = self.directory / name
            require(
                path.resolve().is_relative_to(self.root) and not path.is_symlink(),
                "unsafe_protocol_path",
                str(path),
            )

    def _replay(self) -> tuple[ProjectSnapshot, list[Event]]:
        self._safe_paths()
        events, digest = read_history(self.directory / "events")
        require(
            bool(events) and isinstance(events[0], ProjectInitializedEvent),
            "missing_initial_event",
            "History must start with project.initialized",
        )
        initial = events[0]
        assert isinstance(initial, ProjectInitializedEvent)
        project, policy = initial.payload.project, initial.payload.policy
        workspace = initial.payload.workspace
        require(
            Project.model_validate(
                yaml.safe_load((self.directory / "project.yaml").read_text(encoding="utf-8"))
            )
            == project,
            "project_manifest_changed",
            "Initial project manifest differs from history",
        )
        require(
            Policy.model_validate(
                yaml.safe_load((self.directory / "policy.yaml").read_text(encoding="utf-8"))
            )
            == policy,
            "policy_manifest_changed",
            "Change policy through the CLI or Studio",
        )
        require(
            InitializationReport.model_validate(
                yaml.safe_load(
                    (self.directory / "manifests" / "intake.yaml").read_text(encoding="utf-8")
                )
            )
            == initial.payload.intake,
            "intake_manifest_changed",
            "Initial repository findings differ from history",
        )
        tasks: dict[str, TaskContract] = {}
        workers: dict[str, WorkerRecord] = {}
        reconciliations: dict[str, ReconciliationRecord] = {}
        gm: GMRecord | None = None
        plans: dict[str, ProductionPlan] = {}
        decisions: dict[str, InboxDecision] = {}
        intelligence: ProjectIntelligence | None = None
        evidence: dict[str, Evidence] = {}
        evaluations: dict[str, Evaluation] = {}
        waivers: dict[str, GateWaiver] = {}
        recruitments: dict[str, RecruitmentRecord] = {}
        model_benchmarks: dict[str, ModelBenchmark] = {}
        model_routing_records: dict[str, ModelRoutingRecord] = {}
        providers: dict[str, Provider] = {}
        spend_approvals: dict[str, SpendApproval] = {}
        budget_reservations: dict[str, BudgetReservation] = {}
        paid_invocations: dict[str, PaidInvocationRecord] = {}
        production_domain_inspections: dict[str, ProductionDomainInspection] = {}
        onboarding: ProjectOnboarding | None = None
        observations: dict[str, ExperienceObservation] = {}
        lessons: dict[str, ExperienceLesson] = {}
        research_records: dict[str, WorldResearch] = {}
        for index, event in enumerate(events):
            require(
                event.project_id == project.project.id, "project_scope_mismatch", event.event_id
            )
            if isinstance(event, ProjectInitializedEvent):
                require(
                    index == 0 and event.payload.policy.project_id == project.project.id,
                    "invalid_initial_event",
                    event.event_id,
                )
            elif isinstance(event, TaskProposedEvent):
                task = event.payload
                require(
                    event.actor_type == "human"
                    and event.task_id == task.task_id
                    and task.project_id == project.project.id
                    and task.state == "PROPOSED",
                    "invalid_task_proposal",
                    event.event_id,
                )
                require(task.task_id not in tasks, "duplicate_task", task.task_id)
                require(
                    set(task.dependency_ids) <= tasks.keys(), "missing_dependency", task.task_id
                )
                require(
                    all(entity.project_id == project.project.id for entity in task.entities),
                    "project_scope_mismatch",
                    task.task_id,
                )
                tasks[task.task_id] = task
            elif isinstance(event, PolicyUpdatedEvent):
                require(
                    event.actor_type == "human" and event.payload.project_id == project.project.id,
                    "invalid_policy_event",
                    event.event_id,
                )
                policy = event.payload
            elif isinstance(event, TaskEvent):
                require(
                    event.actor_type in {"human", "external", "system"}
                    and event.task_id == event.payload.task_id
                    and event.payload.task_id in tasks,
                    "invalid_task_registration_event",
                    event.event_id,
                )
                task = tasks[event.payload.task_id]
                if event.event_type == "task.started":
                    require(
                        task.state in {"PROPOSED", "BLOCKED"},
                        "invalid_task_transition",
                        f"{task.state} -> RUNNING",
                    )
                    state = "RUNNING"
                elif event.event_type == "task.blocked":
                    require(
                        task.state == "RUNNING",
                        "invalid_task_transition",
                        f"{task.state} -> BLOCKED",
                    )
                    state = "BLOCKED"
                elif event.event_type == "task.blocked_knowledge":
                    require(
                        task.state in {"QUEUED", "READY", "RUNNING", "NEEDS_HUMAN"},
                        "invalid_task_transition",
                        f"{task.state} -> BLOCKED_KNOWLEDGE",
                    )
                    state = "BLOCKED_KNOWLEDGE"
                elif event.event_type == "task.knowledge_resolved":
                    require(
                        task.state == "BLOCKED_KNOWLEDGE",
                        "invalid_task_transition",
                        f"{task.state} -> READY",
                    )
                    state = "READY"
                elif event.event_type == "task.completed":
                    require(
                        task.state in {"RUNNING", "BLOCKED"},
                        "invalid_task_transition",
                        f"{task.state} -> REVIEW",
                    )
                    state = "REVIEW"
                else:
                    require(False, "unsupported_projection_event", event.event_type)
                tasks[task.task_id] = task.model_copy(update={"state": state})
            elif isinstance(event, WorkspaceBaselineEvent):
                require(
                    event.actor_type == "system" and event.task_id is None,
                    "invalid_workspace_baseline",
                    event.event_id,
                )
                workspace = event.payload
            elif isinstance(event, ExternalChangeEvent):
                require(
                    event.actor_type == "system"
                    and event.task_id is None
                    and workspace is not None
                    and event.payload.baseline_digest == workspace.digest
                    and event.payload.change_id not in reconciliations,
                    "invalid_external_change",
                    event.event_id,
                )
                reconciliations[event.payload.change_id] = ReconciliationRecord(
                    change_id=event.payload.change_id,
                    project_id=project.project.id,
                    detected_at=event.timestamp,
                    paths=event.payload.paths,
                    baseline_digest=event.payload.baseline_digest,
                    observed=event.payload.observed,
                    git_commits=event.payload.git_commits,
                    git_diff_summary=event.payload.git_diff_summary,
                )
            elif isinstance(event, ProjectReconciledEvent):
                reconciliation = reconciliations.get(event.payload.change_id)
                require(
                    event.actor_type == "human"
                    and reconciliation is not None
                    and reconciliation.state == "unresolved"
                    and event.task_id == event.payload.task_id
                    and event.payload.task_id in tasks,
                    "invalid_reconciliation",
                    event.event_id,
                )
                assert reconciliation is not None
                require(
                    event.payload.paths == reconciliation.paths,
                    "reconciliation_paths_changed",
                    event.event_id,
                )
                reconciliations[reconciliation.change_id] = reconciliation.model_copy(
                    update={
                        "state": "reconciled",
                        "task_id": event.payload.task_id,
                        "detail": event.payload.detail,
                        "artifacts": event.payload.artifacts,
                        "reconciled_at": event.timestamp,
                    }
                )
                workspace = event.payload.fingerprint
            elif isinstance(event, GMEvent):
                gm_record = event.payload
                require(
                    event.actor_type == "gm"
                    and event.actor_id == "project-gm"
                    and event.task_id is None
                    and gm_record.project_id == project.project.id,
                    "invalid_gm_event",
                    event.event_id,
                )
                require(
                    gm is None or gm.thread_id == gm_record.thread_id,
                    "gm_thread_changed",
                    event.event_id,
                )
                require(
                    not any(w.thread_id == gm_record.thread_id for w in workers.values()),
                    "thread_already_bound",
                    event.event_id,
                )
                if gm and gm.request_id == gm_record.request_id:
                    require(
                        gm.objective == gm_record.objective,
                        "request_id_conflict",
                        gm_record.request_id,
                    )
                gm = gm_record
            elif isinstance(event, PlanEvent):
                plan = event.payload
                require(
                    event.actor_type == "gm"
                    and event.actor_id == "project-gm"
                    and event.task_id is None
                    and plan.project_id == project.project.id
                    and plan.policy == policy,
                    "invalid_plan_event",
                    event.event_id,
                )
                require(
                    gm is not None
                    and plan.plan_id == f"plan-{gm.request_id}"
                    and plan.objective == gm.objective,
                    "plan_request_mismatch",
                    event.event_id,
                )
                require(
                    plan.plan_id not in plans and not any(t.task_id in tasks for t in plan.tasks),
                    "duplicate_plan",
                    plan.plan_id,
                )
                validate_plan(plan)
                plans[plan.plan_id] = plan
                tasks.update({t.task_id: t for t in plan.tasks})
                decisions.update({d.decision_id: d for d in plan_decisions(plan)})
            elif isinstance(event, InboxEvent):
                decision = event.payload
                previous_decision = decisions.get(decision.decision_id)
                require(
                    event.actor_type == "human"
                    and event.actor_id == "local-director"
                    and event.task_id is None
                    and previous_decision is not None,
                    "human_authority_required",
                    event.event_id,
                )
                assert previous_decision is not None
                require(
                    previous_decision.selected_option is None
                    and decision.selected_option in previous_decision.options
                    and decision.rationale is not None
                    and decision.model_copy(update={"selected_option": None, "rationale": None})
                    == previous_decision,
                    "invalid_decision_resolution",
                    event.event_id,
                )
                decisions[decision.decision_id] = decision
            elif isinstance(event, InboxDecisionRequestedEvent):
                decision = event.payload
                require(
                    event.actor_type == "gm"
                    and event.actor_id == "project-gm"
                    and event.task_id in decision.task_ids
                    and decision.project_id == project.project.id
                    and decision.decision_id not in decisions
                    and decision.selected_option is None
                    and decision.rationale is None,
                    "invalid_decision_request",
                    event.event_id,
                )
                decisions[decision.decision_id] = decision
            elif isinstance(event, IntelligenceEvent):
                index_record = event.payload
                require(
                    event.actor_type == "system"
                    and event.actor_id == "project-indexer"
                    and event.task_id is None
                    and index_record.project_id == project.project.id,
                    "invalid_intelligence_event",
                    event.event_id,
                )
                intelligence = index_record
            elif isinstance(event, WorkerEvent):
                worker_record = event.payload
                require(
                    worker_record.project_id == project.project.id
                    and worker_record.task_id in tasks,
                    "worker_scope_mismatch",
                    worker_record.worker_id,
                )
                previous = workers.get(worker_record.worker_id)
                if previous is not None:
                    require(
                        (previous.knowledge_packet, previous.specialist, previous.context_package)
                        == (
                            worker_record.knowledge_packet,
                            worker_record.specialist,
                            worker_record.context_package,
                        ),
                        "worker_composition_immutable",
                        worker_record.worker_id,
                    )
                require(
                    gm is None or gm.thread_id != worker_record.thread_id,
                    "thread_already_bound",
                    worker_record.worker_id,
                )
                require(
                    previous is None
                    or (previous.thread_id, previous.task_id, previous.cwd)
                    == (worker_record.thread_id, worker_record.task_id, worker_record.cwd),
                    "worker_binding_changed",
                    worker_record.worker_id,
                )
                require(
                    not any(
                        w.thread_id == worker_record.thread_id
                        and w.worker_id != worker_record.worker_id
                        for w in workers.values()
                    ),
                    "thread_already_bound",
                    worker_record.worker_id,
                )
                workers[worker_record.worker_id] = worker_record
            elif isinstance(event, EvidenceRecordedEvent):
                evidence_record = event.payload
                require(
                    event.actor_type
                    == ("human" if evidence_record.producer_type == "human" else "system")
                    and event.task_id == evidence_record.task_id
                    and evidence_record.project_id == project.project.id
                    and evidence_record.task_id in tasks
                    and evidence_record.evidence_id not in evidence,
                    "invalid_evidence_event",
                    event.event_id,
                )
                evidence[evidence_record.evidence_id] = evidence_record
            elif isinstance(event, EvaluationRecordedEvent):
                evaluation_record = event.payload
                require(
                    event.actor_type
                    == ("human" if evaluation_record.authority == "human" else "system")
                    and event.task_id == evaluation_record.task_id
                    and evaluation_record.project_id == project.project.id
                    and evaluation_record.task_id in tasks
                    and evaluation_record.evaluation_id not in evaluations,
                    "invalid_evaluation_event",
                    event.event_id,
                )
                validate_gate_evaluation(evaluation_record, list(evidence.values()))
                evaluations[evaluation_record.evaluation_id] = evaluation_record
            elif isinstance(event, GateWaivedEvent):
                waiver = event.payload
                require(
                    event.actor_type == "human"
                    and event.actor_id == "local-director"
                    and event.task_id == waiver.task_id
                    and waiver.project_id == project.project.id
                    and waiver.task_id in tasks
                    and waiver.waived_by == "human"
                    and waiver.waiver_id not in waivers,
                    "invalid_gate_waiver_event",
                    event.event_id,
                )
                waivers[waiver.waiver_id] = waiver
            elif isinstance(event, RecruitmentEvent):
                record = event.payload
                require(
                    event.actor_type == "gm"
                    and event.actor_id == "project-gm"
                    and event.task_id == record.task_id
                    and record.project_id == project.project.id
                    and record.task_id in tasks
                    and record.gap.project_id == record.project_id
                    and record.gap.task_id == record.task_id,
                    "invalid_recruitment_event",
                    event.event_id,
                )
                recruitment_previous = recruitments.get(record.recruitment_id)
                if recruitment_previous and recruitment_previous.state == "auditioning":
                    require(
                        record.expertise_snapshot == recruitment_previous.expertise_snapshot
                        and record.expertise_packs == recruitment_previous.expertise_packs,
                        "recruitment_expertise_changed",
                        record.recruitment_id,
                    )
                transitions = {
                    None: {"candidate_composed", "remediation_required"},
                    "candidate_composed": {"candidate_composed", "auditioning"},
                    "remediation_required": {"remediation_required", "candidate_composed"},
                    "auditioning": {"probation", "rejected"},
                    "probation": set(),
                    "rejected": set(),
                }
                require(
                    record.state
                    in transitions[recruitment_previous.state if recruitment_previous else None],
                    "invalid_recruitment_state",
                    record.state,
                )
                require(
                    record.created_at
                    == (
                        recruitment_previous.created_at
                        if recruitment_previous
                        else record.created_at
                    )
                    and (record.audition is not None)
                    == (record.state in {"probation", "rejected"}),
                    "invalid_recruitment_record",
                    record.recruitment_id,
                )
                recruitments[record.recruitment_id] = record
                if record.state == "probation":
                    matching_plan = next(
                        (
                            item
                            for item in plans.values()
                            if record.task_id in {t.task_id for t in item.tasks}
                        ),
                        None,
                    )
                    require(matching_plan is not None, "recruitment_plan_missing", record.task_id)
                    assert matching_plan is not None
                    assignments = []
                    for assignment in matching_plan.assignments:
                        if assignment.task_id == record.task_id:
                            require(
                                assignment.agent is None
                                and set(assignment.missing_capabilities)
                                == set(record.gap.missing_capabilities)
                                and set(tasks[record.task_id].required_capabilities)
                                <= set(record.candidate.capabilities),
                                "capability_gap_mismatch",
                                record.task_id,
                            )
                            assignment = assignment.model_copy(
                                update={"agent": record.candidate, "missing_capabilities": []}
                            )
                        assignments.append(assignment)
                    plans[matching_plan.plan_id] = matching_plan.model_copy(
                        update={"assignments": assignments}
                    )
            elif isinstance(event, ModelBenchmarkEvent):
                benchmark = event.payload
                benchmark_task = tasks.get(benchmark.task_id)
                require(
                    event.actor_type == "system"
                    and event.actor_id == "local-model-expert"
                    and event.task_id == benchmark.task_id
                    and benchmark.project_id == project.project.id
                    and benchmark_task is not None
                    and benchmark.required_capability_ids == benchmark_task.required_capabilities
                    and benchmark.benchmark_id not in model_benchmarks,
                    "invalid_model_benchmark_event",
                    event.event_id,
                )
                model_benchmarks[benchmark.benchmark_id] = benchmark
            elif isinstance(event, ModelRoutingEvent):
                routing = event.payload
                require(
                    event.actor_type == "system"
                    and event.actor_id == "local-model-expert"
                    and event.task_id == routing.task_id
                    and routing.project_id == project.project.id
                    and routing.task_id in tasks
                    and routing.routing_id not in model_routing_records,
                    "invalid_model_routing_event",
                    event.event_id,
                )
                validate_model_routing(routing)
                model_routing_records[routing.routing_id] = routing
            elif isinstance(event, ProviderConfiguredEvent):
                configured = event.payload.provider
                require(
                    event.actor_type == "human"
                    and event.actor_id == "local-director"
                    and event.task_id is None,
                    "human_authority_required",
                    event.event_id,
                )
                if configured.billing == "paid" and not configured.cap.verified:
                    require(
                        configured.state == "DISABLED_UNCAPPED",
                        "disabled_uncapped",
                        configured.provider_id,
                    )
                providers[configured.provider_id] = configured
            elif isinstance(event, ProviderEvent):
                disabled_provider = providers.get(event.payload.provider_id)
                require(
                    event.actor_type == "human"
                    and disabled_provider is not None
                    and event.task_id is None,
                    "invalid_provider_event",
                    event.event_id,
                )
                assert disabled_provider is not None
                providers[disabled_provider.provider_id] = disabled_provider.model_copy(
                    update={"state": "DISABLED"}
                )
            elif isinstance(event, SpendApprovedEvent):
                approval = event.payload
                require(
                    event.actor_type == "human"
                    and event.actor_id == "local-director"
                    and approval.project_id == project.project.id
                    and approval.provider_id in providers
                    and datetime.fromisoformat(approval.approved_at.replace("Z", "+00:00"))
                    < datetime.fromisoformat(approval.expires_at.replace("Z", "+00:00")),
                    "invalid_spend_approval",
                    event.event_id,
                )
                previous_approval = spend_approvals.get(approval.approval_id)
                require(
                    previous_approval is None or previous_approval == approval,
                    "request_id_conflict",
                    approval.approval_id,
                )
                spend_approvals[approval.approval_id] = approval
            elif isinstance(event, BudgetReservationEvent):
                reservation = event.payload
                previous_reservation = budget_reservations.get(reservation.reservation_id)
                require(
                    event.actor_type == "system"
                    and event.actor_id == "provider-gateway"
                    and reservation.project_id == project.project.id
                    and reservation.provider_id in providers,
                    "invalid_budget_reservation",
                    event.event_id,
                )
                if previous_reservation is not None:
                    require(
                        (
                            reservation.project_id,
                            reservation.provider_id,
                            reservation.request_id,
                            reservation.task_id,
                            reservation.month,
                            reservation.predicted_cents,
                            reservation.created_at,
                        )
                        == (
                            previous_reservation.project_id,
                            previous_reservation.provider_id,
                            previous_reservation.request_id,
                            previous_reservation.task_id,
                            previous_reservation.month,
                            previous_reservation.predicted_cents,
                            previous_reservation.created_at,
                        ),
                        "reservation_binding_changed",
                        reservation.reservation_id,
                    )
                    transitions = {
                        "reserved": {"reserved", "in_flight", "released"},
                        "in_flight": {"in_flight", "settled", "uncertain"},
                        "uncertain": {"uncertain", "settled"},
                        "settled": {"settled"},
                        "released": {"released"},
                    }
                    require(
                        reservation.state in transitions[previous_reservation.state],
                        "invalid_reservation_transition",
                        f"{previous_reservation.state} -> {reservation.state}",
                    )
                require(
                    (reservation.actual_cents is not None) == (reservation.state == "settled"),
                    "invalid_reservation_cost",
                    reservation.reservation_id,
                )
                budget_reservations[reservation.reservation_id] = reservation
            elif isinstance(event, PaidInvocationEvent):
                invocation = event.payload
                invocation_reservation = budget_reservations.get(invocation.reservation_id)
                require(
                    event.actor_type == "system"
                    and event.actor_id == "provider-gateway"
                    and invocation.project_id == project.project.id
                    and invocation_reservation is not None
                    and invocation.provider_id == invocation_reservation.provider_id
                    and invocation.request_id == invocation_reservation.request_id
                    and invocation.predicted_cents == invocation_reservation.predicted_cents,
                    "invalid_paid_invocation",
                    event.event_id,
                )
                previous_invocation = paid_invocations.get(invocation.invocation_id)
                require(
                    previous_invocation is None or previous_invocation == invocation,
                    "request_id_conflict",
                    invocation.invocation_id,
                )
                paid_invocations[invocation.invocation_id] = invocation
            elif isinstance(event, SpendEvent):
                require(
                    event.actor_type == "system" and event.payload.provider_id in providers,
                    "invalid_provider_spend",
                    event.event_id,
                )
            elif isinstance(event, ProductionDomainInspectionEvent):
                inspection = event.payload
                require(
                    event.actor_type == "system"
                    and event.actor_id == inspection.tool_id
                    and event.task_id == inspection.task_id
                    and inspection.project_id == project.project.id
                    and inspection.task_id in tasks
                    and inspection.evidence_id in evidence
                    and inspection.evaluation_id in evaluations
                    and inspection.inspection_id not in production_domain_inspections,
                    "invalid_production_domain_inspection",
                    event.event_id,
                )
                production_domain_inspections[inspection.inspection_id] = inspection
            elif isinstance(event, OnboardingEvent):
                require(
                    event.actor_type == "system"
                    and event.actor_id == "onboarding-gm"
                    and event.task_id is None,
                    "invalid_onboarding_event",
                    event.event_id,
                )
                if event.event_type == "domain.assessment_completed":
                    require(
                        event.payload.assessment is not None
                        and event.payload.domain == event.payload.assessment.domain,
                        "invalid_domain_assessment_event",
                        event.event_id,
                    )
                if event.event_type == "project.onboarding_completed":
                    require(
                        event.payload.onboarding is not None
                        and event.payload.onboarding.project_id == project.project.id,
                        "invalid_onboarding_completion",
                        event.event_id,
                    )
                    onboarding = event.payload.onboarding
            elif isinstance(event, WorldResearchEvent):
                research = event.payload
                require(
                    event.actor_type == "system"
                    and event.actor_id == "research-specialist"
                    and research.project_id == project.project.id
                    and research.task_id in tasks
                    and research.research_id not in research_records
                    and (
                        research.state != "available"
                        or (
                            tasks[research.task_id].permissions.network
                            and research.source is not None
                            and research.artifact is not None
                            and research.excerpt is not None
                        )
                    ),
                    "invalid_research_record",
                    research.research_id,
                )
                research_records[research.research_id] = research
            elif isinstance(event, ExperienceObservedEvent):
                observation = event.payload
                evaluation = evaluations.get(observation.evaluation_id or "")
                require(
                    event.actor_type == "system"
                    and event.actor_id == "experience-capture"
                    and observation.project_id == project.project.id
                    and observation.state == "observed"
                    and observation.scope == "project_private"
                    and evaluation is not None
                    and evaluation.task_id == observation.task_id
                    and observation.evidence_ids == evaluation.evidence_ids
                    and observation.outcome == evaluation.result,
                    "invalid_experience_observation",
                    observation.observation_id,
                )
                previous_observation = observations.get(observation.observation_id)
                require(
                    previous_observation is None or previous_observation == observation,
                    "observation_immutable",
                    observation.observation_id,
                )
                observations[observation.observation_id] = observation
            elif isinstance(event, ExperienceLessonEvent):
                lesson = event.payload
                require(
                    lesson.project_id == project.project.id
                    and set(lesson.observation_ids) <= observations.keys(),
                    "invalid_lesson_evidence",
                    lesson.lesson_id,
                )
                previous_lesson = lessons.get(lesson.lesson_id)
                if previous_lesson is None:
                    require(
                        event.actor_type == "system"
                        and event.actor_id == "experience-distiller"
                        and lesson.state in {"candidate", "repeated"}
                        and lesson.scope == "project"
                        and lesson.reviewer_id is None,
                        "invalid_lesson_proposal",
                        lesson.lesson_id,
                    )
                else:
                    require(
                        event.actor_type == "human"
                        and lesson.reviewer_id == "human"
                        and lesson.proposer_id != lesson.reviewer_id
                        and lesson.state in {"validated", "rejected", "expired", "superseded"}
                        and lesson.review_detail is not None
                        and lesson.reviewed_at is not None,
                        "independent_lesson_review_required",
                        lesson.lesson_id,
                    )
                    unchanged = {
                        "state",
                        "reviewer_id",
                        "review_detail",
                        "reviewed_at",
                        "confidence",
                    }
                    require(
                        lesson.model_dump(exclude=unchanged)
                        == previous_lesson.model_dump(exclude=unchanged),
                        "lesson_content_changed",
                        lesson.lesson_id,
                    )
                    require(
                        previous_lesson.state not in {"rejected", "expired", "superseded"},
                        "terminal_lesson_state",
                        lesson.lesson_id,
                    )
                lessons[lesson.lesson_id] = lesson
            else:
                # Do not silently project future event semantics as current Phase 1 state.
                require(False, "unsupported_projection_event", event.event_type)
        for plan in plans.values():
            for task in plan.tasks:
                tasks[task.task_id] = task_readiness(
                    tasks[task.task_id], plan, list(decisions.values()), tasks
                )
        return ProjectSnapshot(
            project=project,
            policy=policy,
            tasks=list(tasks.values()),
            cursor=len(events),
            history_digest=digest,
            workers=list(workers.values()),
            gm=gm,
            plans=list(plans.values()),
            decisions=list(decisions.values()),
            intelligence=intelligence,
            evidence=list(evidence.values()),
            evaluations=list(evaluations.values()),
            waivers=list(waivers.values()),
            recruitments=list(recruitments.values()),
            model_benchmarks=list(model_benchmarks.values()),
            model_routing_records=list(model_routing_records.values()),
            providers=list(providers.values()),
            spend_approvals=list(spend_approvals.values()),
            budget_reservations=list(budget_reservations.values()),
            paid_invocations=list(paid_invocations.values()),
            production_domain_inspections=list(production_domain_inspections.values()),
            onboarding=onboarding,
            experience_observations=list(observations.values()),
            experience_lessons=list(lessons.values()),
            research_records=list(research_records.values()),
            workspace=workspace,
            reconciliations=list(reconciliations.values()),
            requires_reconciliation=any(
                record.state == "unresolved" for record in reconciliations.values()
            ),
        ), events

    def record_research(self, research: WorldResearch) -> WorldResearch:
        with self.lock:
            snapshot, events = self._replay()
            task = self._task(snapshot, research.task_id)
            require(
                research.project_id == task.project_id
                and (research.state != "available" or task.permissions.network),
                "research_scope_mismatch",
                research.research_id,
            )
            append(
                self.directory / "events",
                WorldResearchEvent(
                    event_id=f"evt-{research.research_id}",
                    project_id=research.project_id,
                    task_id=research.task_id,
                    timestamp=research.researched_at,
                    actor_type="system",
                    actor_id="research-specialist",
                    correlation_id=research.research_id,
                    sequence=len(events) + 1,
                    event_type="knowledge.research_recorded",
                    payload=research,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return research

    def capture_experience(self) -> ProjectSnapshot:
        """Idempotent local evidence capture; never promotes or exports project data."""
        with self.lock:
            snapshot, events = self._replay()
            known = {item.evaluation_id for item in snapshot.experience_observations}
            sequence = len(events)
            for evaluation in snapshot.evaluations:
                if evaluation.evaluation_id in known:
                    continue
                task = self._task(snapshot, evaluation.task_id)
                worker = next(
                    (item for item in reversed(snapshot.workers) if item.task_id == task.task_id),
                    None,
                )
                observation = ExperienceObservation(
                    observation_id=f"observation-{evaluation.evaluation_id}",
                    project_id=evaluation.project_id,
                    task_id=task.task_id,
                    capability_ids=task.required_capabilities,
                    conclusion=evaluation.rationale,
                    state="observed",
                    evidence_ids=evaluation.evidence_ids,
                    source=SourceRef(
                        uri=f"gan:evaluation:{evaluation.evaluation_id}",
                        media_type="application/json",
                        sha256=hashlib.sha256(evaluation.model_dump_json().encode()).hexdigest(),
                    ),
                    confidence=0.5,
                    created_at=timestamp(),
                    outcome=evaluation.result,
                    evaluation_id=evaluation.evaluation_id,
                    context_tags=[evaluation.gate_id, evaluation.claim, evaluation.authority],
                    agent_id=worker.specialist.agent_id if worker and worker.specialist else None,
                    method_ids=worker.knowledge_packet.selected_method_ids
                    if worker and worker.knowledge_packet
                    else [],
                    expertise_packs=worker.expertise_packs if worker else [],
                )
                sequence += 1
                append(
                    self.directory / "events",
                    ExperienceObservedEvent(
                        event_id=f"evt-{observation.observation_id}",
                        project_id=evaluation.project_id,
                        timestamp=observation.created_at,
                        actor_type="system",
                        actor_id="experience-capture",
                        correlation_id=observation.observation_id,
                        task_id=task.task_id,
                        sequence=sequence,
                        event_type="experience.observed",
                        payload=observation,
                    ),
                    self.max_segment_bytes,
                )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return replayed

    def distill_experience(self) -> ProjectSnapshot:
        """Propose repeated QA patterns, explicitly without causal or global claims."""
        self.capture_experience()
        with self.lock:
            snapshot, events = self._replay()
            groups: dict[str, list[ExperienceObservation]] = {}
            for observation in snapshot.experience_observations:
                if observation.outcome == "failed" and observation.context_tags:
                    groups.setdefault(observation.context_tags[0], []).append(observation)
            known = {item.lesson_id for item in snapshot.experience_lessons}
            sequence = len(events)
            for gate, group in sorted(groups.items()):
                if len({item.task_id for item in group}) < 2:
                    continue
                lesson_id = (
                    "lesson-"
                    + hashlib.sha256(
                        json.dumps(sorted(item.observation_id for item in group)).encode()
                    ).hexdigest()[:24]
                )
                if lesson_id in known:
                    continue
                lesson = ExperienceLesson(
                    lesson_id=lesson_id,
                    project_id=snapshot.project.project.id,
                    observation_ids=[item.observation_id for item in group],
                    capability_ids=sorted({cap for item in group for cap in item.capability_ids}),
                    statement=f"Repeated failures at {gate}: include an explicit check of this gate before submitting similar work.",
                    applicability=f"This project's tasks requiring {gate}.",
                    limitations=[
                        "Correlation only; no controlled comparison establishes causality.",
                        "Project-local QA outcomes do not establish a universal professional rule.",
                        "The underlying failures and corrective action require independent review.",
                    ],
                    state="repeated",
                    proposer_id="experience-distiller",
                    created_at=timestamp(),
                    confidence=0.4,
                )
                sequence += 1
                append(
                    self.directory / "events",
                    ExperienceLessonEvent(
                        event_id=f"evt-{lesson_id}",
                        project_id=lesson.project_id,
                        timestamp=lesson.created_at,
                        actor_type="system",
                        actor_id="experience-distiller",
                        correlation_id=lesson_id,
                        task_id=None,
                        sequence=sequence,
                        event_type="experience.lesson_recorded",
                        payload=lesson,
                    ),
                    self.max_segment_bytes,
                )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return replayed

    def review_lesson(self, command: LessonReviewCommand) -> ExperienceLesson:
        with self.lock:
            snapshot, events = self._replay()
            lesson = next(
                (
                    item
                    for item in snapshot.experience_lessons
                    if item.lesson_id == command.lesson_id
                ),
                None,
            )
            require(lesson is not None, "lesson_not_found", command.lesson_id)
            assert lesson is not None
            require(
                lesson.state not in {"rejected", "expired", "superseded"},
                "terminal_lesson_state",
                lesson.lesson_id,
            )
            updated = lesson.model_copy(
                update={
                    "state": command.decision,
                    "reviewer_id": "human",
                    "review_detail": command.detail,
                    "reviewed_at": timestamp(),
                }
            )
            append(
                self.directory / "events",
                ExperienceLessonEvent(
                    event_id=f"evt-{uuid4()}",
                    project_id=lesson.project_id,
                    timestamp=updated.reviewed_at or timestamp(),
                    actor_type="human",
                    actor_id="human",
                    correlation_id=lesson.lesson_id,
                    task_id=None,
                    sequence=len(events) + 1,
                    event_type="experience.lesson_recorded",
                    payload=updated,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return updated

    def record_model_benchmark(self, benchmark: ModelBenchmark) -> ModelBenchmark:
        with self.lock:
            snapshot, events = self._replay()
            existing = next(
                (
                    item
                    for item in snapshot.model_benchmarks
                    if item.benchmark_id == benchmark.benchmark_id
                ),
                None,
            )
            if existing is not None:
                require(existing == benchmark, "request_id_conflict", benchmark.benchmark_id)
                return existing
            task = self._task(snapshot, benchmark.task_id)
            require(
                benchmark.project_id == snapshot.project.project.id
                and benchmark.required_capability_ids == task.required_capabilities,
                "model_benchmark_scope_mismatch",
                benchmark.benchmark_id,
            )
            append(
                self.directory / "events",
                ModelBenchmarkEvent(
                    event_id=f"evt-{benchmark.benchmark_id}",
                    project_id=benchmark.project_id,
                    timestamp=benchmark.benchmarked_at,
                    actor_type="system",
                    actor_id="local-model-expert",
                    correlation_id=benchmark.benchmark_id,
                    task_id=benchmark.task_id,
                    sequence=len(events) + 1,
                    event_type="model.benchmark_recorded",
                    payload=benchmark,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return benchmark

    def record_model_routing(self, routing: ModelRoutingRecord) -> ModelRoutingRecord:
        with self.lock:
            snapshot, events = self._replay()
            existing = next(
                (
                    item
                    for item in snapshot.model_routing_records
                    if item.routing_id == routing.routing_id
                ),
                None,
            )
            if existing is not None:
                require(existing == routing, "request_id_conflict", routing.routing_id)
                return existing
            self._task(snapshot, routing.task_id)
            require(
                routing.project_id == snapshot.project.project.id,
                "model_routing_scope_mismatch",
                routing.routing_id,
            )
            validate_model_routing(routing)
            append(
                self.directory / "events",
                ModelRoutingEvent(
                    event_id=f"evt-{routing.routing_id}",
                    project_id=routing.project_id,
                    timestamp=routing.created_at,
                    actor_type="system",
                    actor_id="local-model-expert",
                    correlation_id=routing.routing_id,
                    task_id=routing.task_id,
                    sequence=len(events) + 1,
                    event_type="model.routing_recorded",
                    payload=routing,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return routing

    def record_recruitment(self, record: RecruitmentRecord) -> RecruitmentRecord:
        with self.lock:
            snapshot, events = self._replay()
            event_id = f"evt-{record.recruitment_id}-{record.state}"
            duplicate = next((event for event in events if event.event_id == event_id), None)
            if duplicate:
                require(
                    isinstance(duplicate, RecruitmentEvent) and duplicate.payload == record,
                    "request_id_conflict",
                    record.recruitment_id,
                )
                return record
            event = RecruitmentEvent(
                event_id=event_id,
                project_id=record.project_id,
                timestamp=record.updated_at,
                actor_type="gm",
                actor_id="project-gm",
                correlation_id=record.recruitment_id,
                task_id=record.task_id,
                sequence=snapshot.cursor + 1,
                event_type="recruitment.updated",
                payload=record,
            )
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return record

    def record_knowledge_escalation(self, record: RecruitmentRecord) -> InboxDecision:
        """Surface an unresolved capability or expertise gap to the Director."""
        with self.lock:
            snapshot, events = self._replay()
            decision_id = f"knowledge-gap-{record.task_id}"
            existing = next(
                (item for item in snapshot.decisions if item.decision_id == decision_id), None
            )
            if existing is not None:
                return existing
            plan = next(
                (
                    item
                    for item in snapshot.plans
                    if record.task_id in {t.task_id for t in item.tasks}
                ),
                None,
            )
            require(plan is not None, "recruitment_plan_missing", record.task_id)
            assert plan is not None
            current_agent = record.diagnosis.agent_id
            recommendation = (
                "Teach the current agent"
                if current_agent is not None
                else "Create and teach a new specialist"
            )
            decision = InboxDecision(
                decision_id=decision_id,
                plan_id=plan.plan_id,
                project_id=record.project_id,
                title="Specialist knowledge is missing",
                reason=(
                    f"This task requires {', '.join(record.gap.missing_capabilities)}, but GAN cannot "
                    "proceed with a qualified specialist until the missing knowledge is reviewed and attached."
                ),
                task_ids=[record.task_id],
                options=["Teach the current agent", "Create and teach a new specialist"],
                recommendation=recommendation,
                consequences=[
                    "The task remains blocked until a reviewed expertise pack covers the missing capabilities.",
                    "The Learning Director owns the teaching plan and records what the learner was taught.",
                    "A new specialist must pass its audition before entering probation.",
                ],
            )
            append(
                self.directory / "events",
                InboxDecisionRequestedEvent(
                    event_id=f"evt-{decision_id}",
                    project_id=record.project_id,
                    timestamp=record.updated_at,
                    actor_type="gm",
                    actor_id="project-gm",
                    correlation_id=record.recruitment_id,
                    task_id=record.task_id,
                    sequence=len(events) + 1,
                    event_type="gm.decision_requested",
                    payload=decision,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return decision

    def record_runtime_evaluation(
        self,
        request_id: str,
        evidence: Evidence,
        evaluation: Evaluation,
    ) -> tuple[Evidence, Evaluation]:
        return self.record_qa_result(request_id, evidence, evaluation, actor_id="engine-adapter")

    def record_domain_inspection(
        self,
        request_id: str,
        inspection: ProductionDomainInspection,
        evidence: Evidence,
        evaluation: Evaluation,
    ) -> ProductionDomainInspection:
        existing = next(
            (
                item
                for item in self.snapshot().production_domain_inspections
                if item.inspection_id == inspection.inspection_id
            ),
            None,
        )
        if existing is not None:
            require(existing == inspection, "request_id_conflict", request_id)
            return existing
        self.record_qa_result(
            f"{request_id}-domain",
            evidence,
            evaluation,
            actor_id=inspection.tool_id,
        )
        with self.lock:
            snapshot, events = self._replay()
            event_id = f"evt-{request_id}-domain-inspection"
            previous = next((item for item in events if item.event_id == event_id), None)
            if previous is not None:
                require(
                    isinstance(previous, ProductionDomainInspectionEvent)
                    and previous.payload == inspection,
                    "request_id_conflict",
                    request_id,
                )
                return inspection
            require(
                any(item.evidence_id == inspection.evidence_id for item in snapshot.evidence)
                and any(
                    item.evaluation_id == inspection.evaluation_id for item in snapshot.evaluations
                ),
                "domain_evidence_missing",
                inspection.inspection_id,
            )
            append(
                self.directory / "events",
                ProductionDomainInspectionEvent(
                    event_id=event_id,
                    project_id=inspection.project_id,
                    timestamp=inspection.inspected_at,
                    actor_type="system",
                    actor_id=inspection.tool_id,
                    correlation_id=request_id,
                    task_id=inspection.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="production_domain.inspected",
                    payload=inspection,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return inspection

    def record_qa_result(
        self,
        request_id: str,
        evidence: Evidence,
        evaluation: Evaluation,
        *,
        actor_id: str,
    ) -> tuple[Evidence, Evaluation]:
        with self.lock:
            snapshot, events = self._replay()
            task = self._task(snapshot, evidence.task_id)
            require(
                evidence.project_id == task.project_id
                and evaluation.project_id == task.project_id
                and evaluation.task_id == task.task_id,
                "project_scope_mismatch",
                task.task_id,
            )
            evidence_event_id = f"evt-{request_id}-evidence"
            evaluation_event_id = f"evt-{request_id}-evaluation"
            previous_evidence = next(
                (item for item in events if item.event_id == evidence_event_id), None
            )
            previous_evaluation = next(
                (item for item in events if item.event_id == evaluation_event_id), None
            )
            if previous_evidence or previous_evaluation:
                require(
                    isinstance(previous_evidence, EvidenceRecordedEvent)
                    and previous_evidence.payload == evidence
                    and isinstance(previous_evaluation, EvaluationRecordedEvent)
                    and previous_evaluation.payload == evaluation,
                    "request_id_conflict",
                    request_id,
                )
                return evidence, evaluation
            validate_gate_evaluation(evaluation, [*snapshot.evidence, evidence])
            actor_type: Literal["human", "system"] = (
                "human" if evaluation.authority == "human" else "system"
            )
            require(
                (evidence.producer_type == "human") == (actor_type == "human"),
                "evidence_actor_mismatch",
                evidence.evidence_id,
            )
            append(
                self.directory / "events",
                EvidenceRecordedEvent(
                    event_id=evidence_event_id,
                    project_id=task.project_id,
                    timestamp=evidence.captured_at,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    correlation_id=request_id,
                    task_id=task.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="evidence.recorded",
                    payload=evidence,
                ),
                self.max_segment_bytes,
            )
            snapshot, _ = self._replay()
            append(
                self.directory / "events",
                EvaluationRecordedEvent(
                    event_id=evaluation_event_id,
                    project_id=task.project_id,
                    timestamp=evaluation.evaluated_at,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    correlation_id=request_id,
                    task_id=task.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="evaluation.recorded",
                    payload=evaluation,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return evidence, evaluation

    def qa_report(self, task_id: str) -> QAReport:
        snapshot = self.snapshot()
        task = self._task(snapshot, task_id)
        return build_report(
            task,
            snapshot.evidence,
            snapshot.evaluations,
            snapshot.waivers,
            unresolved_change_ids=[
                item.change_id for item in snapshot.reconciliations if item.state == "unresolved"
            ],
            generated_at=timestamp(),
        )

    def run_qa(self, command: QARunCommand) -> QAReport:
        snapshot = self.snapshot()
        task = self._task(snapshot, command.task_id)
        if any(
            item.evidence_id == f"evidence-{command.request_id}-contract"
            for item in snapshot.evidence
        ):
            require(
                any(
                    item.evaluation_id == f"evaluation-{command.request_id}-contract"
                    for item in snapshot.evaluations
                ),
                "qa_evaluation_missing",
                command.request_id,
            )
            return self.qa_report(task.task_id)
        evidence, evaluation = contract_compliance_result(
            self.root,
            task,
            snapshot.tasks,
            request_id=command.request_id,
            captured_at=timestamp(),
        )
        self.record_qa_result(command.request_id, evidence, evaluation, actor_id="qa-fabric")
        return self.qa_report(task.task_id)

    def record_human_review(self, command: HumanReviewCommand) -> QAReport:
        snapshot = self.snapshot()
        task = self._task(snapshot, command.task_id)
        if any(
            item.evidence_id == f"evidence-{command.request_id}-human" for item in snapshot.evidence
        ):
            require(
                any(
                    item.evaluation_id == f"evaluation-{command.request_id}-human"
                    for item in snapshot.evaluations
                ),
                "qa_evaluation_missing",
                command.request_id,
            )
            return self.qa_report(task.task_id)
        by_id = {item.evidence_id: item for item in snapshot.evidence}
        require(
            all(item in by_id for item in command.supporting_evidence_ids),
            "missing_evidence",
            command.gate_id,
        )
        supporting = [by_id[item] for item in command.supporting_evidence_ids]
        require(
            all(item.task_id == task.task_id for item in supporting),
            "evidence_scope_mismatch",
            task.task_id,
        )
        evidence, evaluation = human_review_result(
            self.root,
            task,
            supporting,
            request_id=command.request_id,
            gate_id=command.gate_id,
            verdict=command.verdict,
            summary=command.summary,
            captured_at=timestamp(),
        )
        self.record_qa_result(
            command.request_id,
            evidence,
            evaluation,
            actor_id="local-director",
        )
        return self.qa_report(task.task_id)

    def waive_gate(self, command: GateWaiverCommand) -> QAReport:
        with self.lock:
            snapshot, events = self._replay()
            task = self._task(snapshot, command.task_id)
            require(
                command.gate_id in task.required_evaluations,
                "gate_not_required",
                command.gate_id,
            )
            event_id = f"evt-{command.request_id}-waiver"
            previous = next((item for item in events if item.event_id == event_id), None)
            if previous:
                require(
                    isinstance(previous, GateWaivedEvent)
                    and previous.payload.task_id == command.task_id
                    and previous.payload.gate_id == command.gate_id
                    and previous.payload.reason == command.reason,
                    "request_id_conflict",
                    command.request_id,
                )
                return build_report(
                    task,
                    snapshot.evidence,
                    snapshot.evaluations,
                    snapshot.waivers,
                    unresolved_change_ids=[
                        item.change_id
                        for item in snapshot.reconciliations
                        if item.state == "unresolved"
                    ],
                    generated_at=timestamp(),
                )
            waiver = GateWaiver(
                waiver_id=f"waiver-{command.request_id}",
                project_id=task.project_id,
                task_id=task.task_id,
                gate_id=command.gate_id,
                reason=command.reason,
                waived_by="human",
                waived_at=timestamp(),
            )
            append(
                self.directory / "events",
                GateWaivedEvent(
                    event_id=event_id,
                    project_id=task.project_id,
                    timestamp=waiver.waived_at,
                    actor_type="human",
                    actor_id="local-director",
                    correlation_id=command.gate_id,
                    task_id=task.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="qa.gate_waived",
                    payload=waiver,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
        return self.qa_report(command.task_id)

    def refresh_intelligence(self, command: IntelligenceRefreshCommand) -> ProjectIntelligence:
        with self.lock:
            snapshot, events = self._replay()
            event_id = f"evt-{command.request_id}"
            previous = next((event for event in events if event.event_id == event_id), None)
            if previous:
                require(
                    isinstance(previous, IntelligenceEvent),
                    "request_id_conflict",
                    command.request_id,
                )
                assert isinstance(previous, IntelligenceEvent)
                return previous.payload
            initial = events[0]
            assert isinstance(initial, ProjectInitializedEvent)
            record = index_repository(
                self.root,
                snapshot.project,
                initial.payload.intake,
                snapshot.decisions,
                timestamp(),
            )
            append(
                self.directory / "events",
                IntelligenceEvent(
                    event_id=event_id,
                    project_id=snapshot.project.project.id,
                    timestamp=record.indexed_at,
                    actor_type="system",
                    actor_id="project-indexer",
                    correlation_id=command.request_id,
                    task_id=None,
                    sequence=snapshot.cursor + 1,
                    event_type="project.intelligence_indexed",
                    payload=record,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            assert replayed.intelligence is not None
            return replayed.intelligence

    def task_context(self, command: ContextCommand) -> ContextPackage:
        snapshot = self.snapshot()
        intelligence = snapshot.intelligence
        if intelligence is None:
            intelligence = self.refresh_intelligence(
                IntelligenceRefreshCommand(request_id=f"index-{uuid4()}")
            )
            snapshot = self.snapshot()
        task = self._task(snapshot, command.task_id)
        return build_context(task, intelligence, snapshot.decisions, timestamp())

    def gm_request(self, request_id: str) -> GMRecord | None:
        with self.lock:
            _, events = self._replay()
            return next(
                (
                    e.payload
                    for e in reversed(events)
                    if isinstance(e, GMEvent) and e.payload.request_id == request_id
                ),
                None,
            )

    def record_gm(self, record: GMRecord) -> GMRecord:
        with self.lock:
            snapshot, _ = self._replay()
            require(
                record.project_id == snapshot.project.project.id,
                "project_scope_mismatch",
                record.request_id,
            )
            require(
                snapshot.gm is None or snapshot.gm.thread_id == record.thread_id,
                "gm_thread_changed",
                record.request_id,
            )
            require(
                not any(w.thread_id == record.thread_id for w in snapshot.workers),
                "thread_already_bound",
                record.request_id,
            )
            if snapshot.gm and snapshot.gm.request_id == record.request_id:
                require(
                    snapshot.gm.objective == record.objective,
                    "request_id_conflict",
                    record.request_id,
                )
            event = GMEvent(
                event_id=f"evt-{uuid4()}",
                project_id=record.project_id,
                timestamp=timestamp(),
                actor_type="gm",
                actor_id="project-gm",
                correlation_id=record.request_id,
                task_id=None,
                sequence=snapshot.cursor + 1,
                event_type="gm.updated",
                payload=record,
            )
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, events = self._replay()
            self._sync(replayed, events)
            return record

    def record_plan(self, plan: ProductionPlan) -> ProductionPlan:
        with self.lock:
            snapshot, events = self._replay()
            previous = next((p for p in snapshot.plans if p.plan_id == plan.plan_id), None)
            if previous:
                require(previous == plan, "request_id_conflict", plan.plan_id)
                return previous
            require(not snapshot.requires_reconciliation, "reconciliation_required", plan.plan_id)
            require(
                snapshot.gm is not None
                and plan.plan_id == f"plan-{snapshot.gm.request_id}"
                and plan.objective == snapshot.gm.objective,
                "plan_request_mismatch",
                plan.plan_id,
            )
            require(
                plan.project_id == snapshot.project.project.id and plan.policy == snapshot.policy,
                "stale_plan_policy",
                plan.plan_id,
            )
            validate_plan(plan)
            require(
                not any(t.task_id in {old.task_id for old in snapshot.tasks} for t in plan.tasks),
                "duplicate_task",
                plan.plan_id,
            )
            event = PlanEvent(
                event_id=f"evt-{plan.plan_id}",
                project_id=plan.project_id,
                timestamp=timestamp(),
                actor_type="gm",
                actor_id="project-gm",
                correlation_id=plan.plan_id,
                task_id=None,
                sequence=snapshot.cursor + 1,
                event_type="gm.plan_created",
                payload=plan,
            )
            for task in plan.tasks:
                self._write_contract(task)
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, events = self._replay()
            self._sync(replayed, events)
            return plan

    def resolve_decision(self, command: DecisionCommand) -> InboxDecision:
        with self.lock:
            snapshot, events = self._replay()
            event_id = f"evt-{command.request_id}"
            duplicate = next((e for e in events if e.event_id == event_id), None)
            if duplicate:
                require(
                    isinstance(duplicate, InboxEvent)
                    and duplicate.payload.decision_id == command.decision_id
                    and duplicate.payload.selected_option == command.selected_option
                    and duplicate.payload.rationale == command.rationale,
                    "request_id_conflict",
                    command.request_id,
                )
                assert isinstance(duplicate, InboxEvent)
                return duplicate.payload
            previous = next(
                (d for d in snapshot.decisions if d.decision_id == command.decision_id), None
            )
            require(
                previous is not None and previous.selected_option is None,
                "decision_unavailable",
                command.decision_id,
            )
            assert previous is not None
            require(
                command.selected_option in previous.options,
                "invalid_decision_option",
                command.selected_option,
            )
            decision = previous.model_copy(
                update={"selected_option": command.selected_option, "rationale": command.rationale}
            )
            event = InboxEvent(
                event_id=event_id,
                project_id=decision.project_id,
                timestamp=timestamp(),
                actor_type="human",
                actor_id="local-director",
                correlation_id=command.request_id,
                task_id=None,
                sequence=snapshot.cursor + 1,
                event_type="gm.decision_resolved",
                payload=decision,
            )
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, events = self._replay()
            self._sync(replayed, events)
            return decision

    def record_worker(self, record: WorkerRecord) -> WorkerRecord:
        with self.lock:
            snapshot, _ = self._replay()
            require(
                snapshot.gm is None or snapshot.gm.thread_id != record.thread_id,
                "thread_already_bound",
                record.worker_id,
            )
            require(
                record.project_id == snapshot.project.project.id
                and record.task_id in {task.task_id for task in snapshot.tasks},
                "worker_scope_mismatch",
                record.worker_id,
            )
            previous = next((w for w in snapshot.workers if w.worker_id == record.worker_id), None)
            if previous is not None:
                require(
                    (previous.knowledge_packet, previous.specialist, previous.context_package)
                    == (record.knowledge_packet, record.specialist, record.context_package),
                    "worker_composition_immutable",
                    record.worker_id,
                )
            require(
                previous is None
                or (previous.thread_id, previous.task_id, previous.cwd)
                == (record.thread_id, record.task_id, record.cwd),
                "worker_binding_changed",
                record.worker_id,
            )
            require(
                not any(
                    w.thread_id == record.thread_id and w.worker_id != record.worker_id
                    for w in snapshot.workers
                ),
                "thread_already_bound",
                record.worker_id,
            )
            event = WorkerEvent(
                event_id=f"evt-{uuid4()}",
                project_id=record.project_id,
                timestamp=timestamp(),
                actor_type="system",
                actor_id="codex-bridge",
                correlation_id=record.worker_id,
                task_id=record.task_id,
                sequence=snapshot.cursor + 1,
                event_type="worker.updated",
                payload=record,
            )
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return record

    def configure_provider(self, command: ProviderConfigureCommand) -> Provider:
        with self.lock:
            snapshot, events = self._replay()
            provider = command.provider
            if provider.billing == "paid" and not provider.cap.verified:
                provider = provider.model_copy(update={"state": "DISABLED_UNCAPPED"})
            event_id = f"evt-{command.request_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            payload = ProviderConfiguredPayload(request_id=command.request_id, provider=provider)
            if duplicate is not None:
                require(
                    isinstance(duplicate, ProviderConfiguredEvent) and duplicate.payload == payload,
                    "request_id_conflict",
                    command.request_id,
                )
                return provider
            append(
                self.directory / "events",
                ProviderConfiguredEvent(
                    event_id=event_id,
                    project_id=snapshot.project.project.id,
                    timestamp=timestamp(),
                    actor_type="human",
                    actor_id="local-director",
                    correlation_id=command.request_id,
                    task_id=None,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.configured",
                    payload=payload,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return provider

    def disable_provider(self, command: ProviderDisableCommand) -> Provider:
        with self.lock:
            snapshot, events = self._replay()
            provider = next(
                (item for item in snapshot.providers if item.provider_id == command.provider_id),
                None,
            )
            require(provider is not None, "provider_not_found", command.provider_id)
            assert provider is not None
            event_id = f"evt-{command.request_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate is not None:
                require(
                    isinstance(duplicate, ProviderEvent)
                    and duplicate.payload.provider_id == provider.provider_id
                    and duplicate.payload.reason == command.reason,
                    "request_id_conflict",
                    command.request_id,
                )
                return provider.model_copy(update={"state": "DISABLED"})
            append(
                self.directory / "events",
                ProviderEvent(
                    event_id=event_id,
                    project_id=snapshot.project.project.id,
                    timestamp=timestamp(),
                    actor_type="human",
                    actor_id="local-director",
                    correlation_id=command.request_id,
                    task_id=None,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.disabled",
                    payload=ProviderPayload(
                        provider_id=provider.provider_id, reason=command.reason
                    ),
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return provider.model_copy(update={"state": "DISABLED"})

    def approve_spend(
        self, command: SpendApprovalCommand, *, now: datetime | None = None
    ) -> SpendApproval:
        approved_at = now or datetime.now(UTC)
        require(approved_at.tzinfo is not None, "invalid_time", "Use a timezone-aware clock")
        expires_at = datetime.fromisoformat(command.expires_at.replace("Z", "+00:00"))
        require(expires_at > approved_at, "invalid_approval_expiry", command.expires_at)
        with self.lock:
            snapshot, events = self._replay()
            require(
                any(item.provider_id == command.provider_id for item in snapshot.providers),
                "provider_not_found",
                command.provider_id,
            )
            event_id = f"evt-{command.request_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate is not None:
                require(
                    isinstance(duplicate, SpendApprovedEvent)
                    and duplicate.payload.provider_id == command.provider_id
                    and duplicate.payload.request_id == command.invocation_request_id
                    and duplicate.payload.amount_cents == command.amount_cents
                    and duplicate.payload.expires_at == command.expires_at,
                    "request_id_conflict",
                    command.request_id,
                )
                assert isinstance(duplicate, SpendApprovedEvent)
                return duplicate.payload
            approval = SpendApproval(
                approval_id=f"approval-{command.request_id}",
                project_id=snapshot.project.project.id,
                provider_id=command.provider_id,
                request_id=command.invocation_request_id,
                amount_cents=command.amount_cents,
                approved_at=approved_at.astimezone(UTC)
                .isoformat(timespec="microseconds")
                .replace("+00:00", "Z"),
                expires_at=command.expires_at,
            )
            append(
                self.directory / "events",
                SpendApprovedEvent(
                    event_id=event_id,
                    project_id=approval.project_id,
                    timestamp=approval.approved_at,
                    actor_type="human",
                    actor_id="local-director",
                    correlation_id=command.request_id,
                    task_id=None,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.spend_approved",
                    payload=approval,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return approval

    @staticmethod
    def budget_totals(snapshot: ProjectSnapshot, month: str) -> tuple[int, int]:
        settled = sum(
            item.actual_cents or 0
            for item in snapshot.budget_reservations
            if item.month == month and item.state == "settled"
        )
        reserved = sum(
            item.predicted_cents
            for item in snapshot.budget_reservations
            if item.month == month and item.state in {"reserved", "in_flight", "uncertain"}
        )
        return settled, reserved

    def reserve_provider_budget(
        self,
        provider_id: str,
        request_id: str,
        predicted_cents: int,
        *,
        task_id: str | None = None,
        now: datetime | None = None,
    ) -> BudgetReservation:
        reserved_at = now or datetime.now(UTC)
        require(reserved_at.tzinfo is not None, "invalid_time", "Use a timezone-aware clock")
        normalized_now = reserved_at.astimezone(UTC)
        month = normalized_now.strftime("%Y-%m")
        reservation_id = f"reservation-{request_id}"
        with self.lock:
            snapshot, events = self._replay()
            existing = next(
                (
                    item
                    for item in snapshot.budget_reservations
                    if item.reservation_id == reservation_id
                ),
                None,
            )
            if existing is not None:
                require(
                    (
                        existing.provider_id,
                        existing.request_id,
                        existing.task_id,
                        existing.predicted_cents,
                    )
                    == (provider_id, request_id, task_id, predicted_cents),
                    "request_id_conflict",
                    request_id,
                )
                return existing
            provider = next(
                (item for item in snapshot.providers if item.provider_id == provider_id), None
            )
            require(provider is not None, "provider_not_found", provider_id)
            assert provider is not None
            if task_id is not None:
                self._task(snapshot, task_id)
            settled, reserved = self.budget_totals(snapshot, month)
            human_approved = any(
                approval.provider_id == provider_id
                and approval.request_id == request_id
                and approval.amount_cents == predicted_cents
                and datetime.fromisoformat(approval.approved_at.replace("Z", "+00:00"))
                <= normalized_now
                < datetime.fromisoformat(approval.expires_at.replace("Z", "+00:00"))
                for approval in snapshot.spend_approvals
            )
            admission = provider_admission(
                provider,
                snapshot.policy,
                predicted_cents=predicted_cents,
                spent_cents=settled,
                reserved_cents=reserved,
                now=normalized_now,
                human_approved=human_approved,
            )
            require(
                admission == "allowed",
                "human_approval_required",
                f"Approve the {predicted_cents}-cent upper bound for {request_id}",
            )
            instant = normalized_now.isoformat(timespec="microseconds").replace("+00:00", "Z")
            reservation = BudgetReservation(
                reservation_id=reservation_id,
                project_id=snapshot.project.project.id,
                provider_id=provider_id,
                request_id=request_id,
                task_id=task_id,
                month=month,
                predicted_cents=predicted_cents,
                state="reserved",
                created_at=instant,
                updated_at=instant,
            )
            append(
                self.directory / "events",
                BudgetReservationEvent(
                    event_id=f"evt-{reservation_id}-reserved",
                    project_id=reservation.project_id,
                    timestamp=instant,
                    actor_type="system",
                    actor_id="provider-gateway",
                    correlation_id=request_id,
                    task_id=task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.reservation_updated",
                    payload=reservation,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return reservation

    def update_provider_reservation(
        self,
        reservation_id: str,
        state: Literal["in_flight", "settled", "released", "uncertain"],
        *,
        actual_cents: int | None = None,
        now: datetime | None = None,
    ) -> BudgetReservation:
        changed_at = (now or datetime.now(UTC)).astimezone(UTC)
        with self.lock:
            snapshot, events = self._replay()
            previous = next(
                (
                    item
                    for item in snapshot.budget_reservations
                    if item.reservation_id == reservation_id
                ),
                None,
            )
            require(previous is not None, "reservation_not_found", reservation_id)
            assert previous is not None
            if previous.state == state:
                require(
                    previous.actual_cents == (actual_cents if state == "settled" else None),
                    "request_id_conflict",
                    reservation_id,
                )
                return previous
            updated = previous.model_copy(
                update={
                    "state": state,
                    "actual_cents": actual_cents if state == "settled" else None,
                    "updated_at": changed_at.isoformat(timespec="microseconds").replace(
                        "+00:00", "Z"
                    ),
                }
            )
            event_id = f"evt-{reservation_id}-{state}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate is not None:
                require(
                    isinstance(duplicate, BudgetReservationEvent) and duplicate.payload == updated,
                    "request_id_conflict",
                    reservation_id,
                )
                return updated
            append(
                self.directory / "events",
                BudgetReservationEvent(
                    event_id=event_id,
                    project_id=updated.project_id,
                    timestamp=updated.updated_at,
                    actor_type="system",
                    actor_id="provider-gateway",
                    correlation_id=updated.request_id,
                    task_id=updated.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.reservation_updated",
                    payload=updated,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return updated

    def record_paid_invocation(self, record: PaidInvocationRecord) -> PaidInvocationRecord:
        with self.lock:
            snapshot, events = self._replay()
            event_id = f"evt-{record.invocation_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate is not None:
                require(
                    isinstance(duplicate, PaidInvocationEvent) and duplicate.payload == record,
                    "request_id_conflict",
                    record.request_id,
                )
                return record
            append(
                self.directory / "events",
                PaidInvocationEvent(
                    event_id=event_id,
                    project_id=record.project_id,
                    timestamp=record.recorded_at,
                    actor_type="system",
                    actor_id="provider-gateway",
                    correlation_id=record.request_id,
                    task_id=record.task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="provider.invocation_recorded",
                    payload=record,
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return record

    def _sync(self, snapshot: ProjectSnapshot, events: list[Event]) -> ProjectSnapshot:
        projection = Projection(self.directory / "projection.sqlite3")
        try:
            previous = projection.snapshot()
            if previous != snapshot:
                projection.replace(snapshot, events)
            result = projection.snapshot()
            assert result is not None
            return result
        finally:
            projection.close()

    def snapshot(self) -> ProjectSnapshot:
        with self.lock:
            snapshot, events = self._replay()
            return self._sync(snapshot, events)

    def ensure_onboarding(
        self,
        knowledge_router: KnowledgeRouter | None = None,
        agents: list[AgentDefinition] | None = None,
    ) -> ProjectOnboarding:
        """Create one durable domain-led onboarding record for an imported project."""

        with self.lock:
            snapshot, events = self._replay()
            if snapshot.onboarding is not None:
                return snapshot.onboarding
            from gameagent.intake import assess_project_domains, inspect

            _, intake = inspect(self.root)
            intelligence = index_repository(
                self.root,
                snapshot.project,
                intake,
                snapshot.decisions,
                timestamp(),
            )
            onboarding = assess_project_domains(
                self.root,
                snapshot.project,
                intake,
                timestamp(),
                knowledge_router,
                agents,
                intelligence,
            )
            for event in _onboarding_events(onboarding, snapshot.cursor + 1):
                append(self.directory / "events", event, self.max_segment_bytes)
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            assert replayed.onboarding is not None
            return replayed.onboarding

    def events(self, after: int = 0, limit: int = 100) -> EventPage:
        require(after >= 0 and 1 <= limit <= 500, "invalid_cursor", "Invalid event page")
        with self.lock:
            _, events = self._replay()
            require(
                after <= len(events), "cursor_ahead", "Reload project state before reconnecting"
            )
            page = events[after : after + limit]
            return EventPage(
                events=page, cursor=after + len(page), has_more=after + len(page) < len(events)
            )

    def _write_contract(self, task: TaskContract) -> None:
        document = task.model_dump_json().encode("utf-8")
        path = self.directory / "contracts" / f"{hashlib.sha256(document).hexdigest()}.json"
        if not path.exists():
            write_new(path, document)

    def _task(self, snapshot: ProjectSnapshot, task_id: str) -> TaskContract:
        task = next((item for item in snapshot.tasks if item.task_id == task_id), None)
        require(task is not None, "task_not_found", task_id)
        assert task is not None
        return task

    def start_task(self, command: TaskStartCommand) -> TaskContract:
        with self.lock:
            snapshot, events = self._replay()
            require(
                not snapshot.requires_reconciliation,
                "reconciliation_required",
                "Resolve detected external changes before starting project work",
            )
            task_id = command.task_id or f"task-{command.request_id}"
            require(
                not any(t.task_id == task_id for p in snapshot.plans for t in p.tasks),
                "gm_authority_required",
                "Planned tasks are controlled by the GM",
            )
            if command.task_id is None:
                require(
                    command.title is not None
                    and command.objective is not None
                    and bool(command.required_capabilities)
                    and bool(command.deliverables),
                    "registration_details_required",
                    "A new task needs title, objective, capabilities and deliverables",
                )
                assert command.title is not None and command.objective is not None
                task = TaskContract(
                    task_id=task_id,
                    project_id=snapshot.project.project.id,
                    title=command.title,
                    objective=command.objective,
                    entities=[],
                    references=[],
                    required_capabilities=command.required_capabilities,
                    requirements=Requirements(
                        functional=[], visual=[], technical=[], accessibility=[], production=[]
                    ),
                    constraints=[],
                    deliverables=command.deliverables,
                    dependency_ids=[],
                    permissions=Permissions(),
                    required_evaluations=["contract_compliance"],
                    escalation_criteria=[],
                )
                proposal_id = f"evt-{command.request_id}-proposal"
                previous = next((item for item in events if item.event_id == proposal_id), None)
                if previous:
                    require(
                        isinstance(previous, TaskProposedEvent) and previous.payload == task,
                        "request_id_conflict",
                        "Request ID was used for different registration content",
                    )
                else:
                    require(
                        all(item.task_id != task_id for item in snapshot.tasks),
                        "duplicate_task",
                        task_id,
                    )
                    self._write_contract(task)
                    append(
                        self.directory / "events",
                        TaskProposedEvent(
                            event_id=proposal_id,
                            project_id=task.project_id,
                            timestamp=timestamp(),
                            actor_type="human",
                            actor_id="local-director",
                            correlation_id=command.request_id,
                            task_id=task.task_id,
                            sequence=snapshot.cursor + 1,
                            event_type="task.proposed",
                            payload=task,
                        ),
                        self.max_segment_bytes,
                    )
                    snapshot, events = self._replay()
            task = self._task(snapshot, task_id)
            event_id = f"evt-{command.request_id}"
            payload = TaskEventPayload(task_id=task_id, detail="Meaningful project work registered")
            previous = next((item for item in events if item.event_id == event_id), None)
            if previous:
                require(
                    isinstance(previous, TaskEvent)
                    and previous.event_type == "task.started"
                    and previous.payload == payload,
                    "request_id_conflict",
                    "Request ID was used for a different task action",
                )
            else:
                require(
                    task.state in {"PROPOSED", "BLOCKED"},
                    "invalid_task_transition",
                    f"{task.state} -> RUNNING",
                )
                append(
                    self.directory / "events",
                    TaskEvent(
                        event_id=event_id,
                        project_id=task.project_id,
                        timestamp=timestamp(),
                        actor_type="human",
                        actor_id="local-director",
                        correlation_id=command.request_id,
                        task_id=task_id,
                        sequence=snapshot.cursor + 1,
                        event_type="task.started",
                        payload=payload,
                    ),
                    self.max_segment_bytes,
                )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return self._task(replayed, task_id)

    def _record_task_progress(
        self,
        command: TaskProgressCommand,
        event_type: Literal["task.blocked", "task.completed"],
    ) -> TaskContract:
        with self.lock:
            snapshot, events = self._replay()
            task = self._task(snapshot, command.task_id)
            require(
                not any(t.task_id == task.task_id for p in snapshot.plans for t in p.tasks),
                "gm_authority_required",
                "Planned tasks are controlled by the GM",
            )
            event_id = f"evt-{command.request_id}"
            payload = TaskEventPayload(task_id=task.task_id, detail=command.detail)
            previous = next((item for item in events if item.event_id == event_id), None)
            if previous:
                require(
                    isinstance(previous, TaskEvent)
                    and previous.event_type == event_type
                    and previous.payload == payload,
                    "request_id_conflict",
                    "Request ID was used for a different task action",
                )
            else:
                expected = {"task.blocked": {"RUNNING"}, "task.completed": {"RUNNING", "BLOCKED"}}
                require(
                    task.state in expected[event_type],
                    "invalid_task_transition",
                    f"Cannot record {event_type} from {task.state}",
                )
                append(
                    self.directory / "events",
                    TaskEvent(
                        event_id=event_id,
                        project_id=task.project_id,
                        timestamp=timestamp(),
                        actor_type="human",
                        actor_id="local-director",
                        correlation_id=command.request_id,
                        task_id=task.task_id,
                        sequence=snapshot.cursor + 1,
                        event_type=event_type,
                        payload=payload,
                    ),
                    self.max_segment_bytes,
                )
                snapshot, events = self._replay()
            if event_type == "task.completed":
                baseline_id = f"evt-{command.request_id}-baseline"
                baseline = next((item for item in events if item.event_id == baseline_id), None)
                if baseline is None:
                    append(
                        self.directory / "events",
                        WorkspaceBaselineEvent(
                            event_id=baseline_id,
                            project_id=task.project_id,
                            timestamp=timestamp(),
                            actor_type="system",
                            actor_id="workspace-watcher",
                            correlation_id=command.request_id,
                            task_id=None,
                            sequence=snapshot.cursor + 1,
                            event_type="project.baseline_recorded",
                            payload=workspace_fingerprint(self.root),
                        ),
                        self.max_segment_bytes,
                    )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return self._task(replayed, task.task_id)

    def block_task(self, command: TaskProgressCommand) -> TaskContract:
        return self._record_task_progress(command, "task.blocked")

    def record_knowledge_state(self, task_id: str, *, blocked: bool, detail: str) -> TaskContract:
        with self.lock:
            snapshot, _ = self._replay()
            task = self._task(snapshot, task_id)
            event_type: Literal["task.blocked_knowledge", "task.knowledge_resolved"] = (
                "task.blocked_knowledge" if blocked else "task.knowledge_resolved"
            )
            expected = (
                {"QUEUED", "READY", "RUNNING", "NEEDS_HUMAN"} if blocked else {"BLOCKED_KNOWLEDGE"}
            )
            if task.state not in expected:
                return task
            identity = hashlib.sha256(f"{task_id}\0{event_type}\0{detail}".encode()).hexdigest()[
                :20
            ]
            append(
                self.directory / "events",
                TaskEvent(
                    event_id=f"evt-knowledge-{identity}",
                    project_id=task.project_id,
                    timestamp=timestamp(),
                    actor_type="system",
                    actor_id="knowledge-router",
                    correlation_id=f"knowledge-{identity}",
                    task_id=task_id,
                    sequence=snapshot.cursor + 1,
                    event_type=event_type,
                    payload=TaskEventPayload(task_id=task_id, detail=detail),
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return self._task(replayed, task_id)

    def complete_task(self, command: TaskProgressCommand) -> TaskContract:
        return self._record_task_progress(command, "task.completed")

    def detect_external_changes(self) -> ProjectSnapshot:
        with self.lock:
            snapshot, events = self._replay()
            observed = workspace_fingerprint(self.root)
            if snapshot.workspace is None:
                append(
                    self.directory / "events",
                    WorkspaceBaselineEvent(
                        event_id=f"evt-{uuid4()}",
                        project_id=snapshot.project.project.id,
                        timestamp=timestamp(),
                        actor_type="system",
                        actor_id="workspace-watcher",
                        correlation_id=f"baseline-{uuid4()}",
                        task_id=None,
                        sequence=snapshot.cursor + 1,
                        event_type="project.baseline_recorded",
                        payload=observed,
                    ),
                    self.max_segment_bytes,
                )
            elif observed.digest != snapshot.workspace.digest:
                active = any(task.state in {"RUNNING", "BLOCKED"} for task in snapshot.tasks)
                unresolved = any(item.state == "unresolved" for item in snapshot.reconciliations)
                if not active and not unresolved:
                    paths = workspace_changes(snapshot.workspace, observed)
                    require(bool(paths), "workspace_digest_mismatch", observed.digest)
                    commits, diff_summary = git_change_context(
                        self.root, snapshot.workspace, observed
                    )
                    change_id = f"change-{uuid4()}"
                    append(
                        self.directory / "events",
                        ExternalChangeEvent(
                            event_id=f"evt-{uuid4()}",
                            project_id=snapshot.project.project.id,
                            timestamp=timestamp(),
                            actor_type="system",
                            actor_id="workspace-watcher",
                            correlation_id=change_id,
                            task_id=None,
                            sequence=snapshot.cursor + 1,
                            event_type="project.external_change_detected",
                            payload=ExternalChangePayload(
                                change_id=change_id,
                                paths=paths,
                                baseline_digest=snapshot.workspace.digest,
                                observed=observed,
                                git_commits=commits,
                                git_diff_summary=diff_summary,
                            ),
                        ),
                        self.max_segment_bytes,
                    )
            replayed, committed = self._replay()
            return self._sync(replayed, committed)

    def reconcile(self, command: ReconcileCommand) -> ReconciliationRecord:
        with self.lock:
            snapshot, events = self._replay()
            record = next(
                (item for item in snapshot.reconciliations if item.change_id == command.change_id),
                None,
            )
            require(record is not None, "change_not_found", command.change_id)
            assert record is not None
            event_id = f"evt-{command.request_id}"
            previous = next((item for item in events if item.event_id == event_id), None)
            if previous:
                require(
                    isinstance(previous, ProjectReconciledEvent)
                    and previous.payload.change_id == command.change_id
                    and previous.payload.detail == command.detail,
                    "request_id_conflict",
                    "Request ID was used for a different reconciliation",
                )
                replayed, committed = self._replay()
                self._sync(replayed, committed)
                return next(
                    item for item in replayed.reconciliations if item.change_id == command.change_id
                )
            require(record.state == "unresolved", "change_already_reconciled", command.change_id)
            artifacts = artifact_references(self.root, record.paths)
            task_id = command.task_id
            if task_id is not None:
                self._task(snapshot, task_id)
            else:
                task_id = f"task-reconcile-{command.change_id.removeprefix('change-')}"
                task = TaskContract(
                    task_id=task_id,
                    project_id=snapshot.project.project.id,
                    title="Reconcile external project changes",
                    objective=command.detail,
                    state="PROPOSED",
                    entities=[],
                    references=artifacts,
                    required_capabilities=["version_control_analysis"],
                    requirements=Requirements(
                        functional=[], visual=[], technical=[], accessibility=[], production=[]
                    ),
                    constraints=[],
                    deliverables=["Attributed external change record"],
                    dependency_ids=[],
                    permissions=Permissions(),
                    required_evaluations=["contract_compliance"],
                    escalation_criteria=[],
                )
                proposal_id = f"evt-{command.request_id}-proposal"
                proposal = next((item for item in events if item.event_id == proposal_id), None)
                if proposal is None:
                    self._write_contract(task)
                    append(
                        self.directory / "events",
                        TaskProposedEvent(
                            event_id=proposal_id,
                            project_id=task.project_id,
                            timestamp=timestamp(),
                            actor_type="human",
                            actor_id="local-director",
                            correlation_id=command.request_id,
                            task_id=task_id,
                            sequence=snapshot.cursor + 1,
                            event_type="task.proposed",
                            payload=task,
                        ),
                        self.max_segment_bytes,
                    )
                    snapshot, events = self._replay()
                else:
                    require(
                        isinstance(proposal, TaskProposedEvent) and proposal.payload == task,
                        "request_id_conflict",
                        "Request ID was used for different reconciliation content",
                    )
                reconstruction_events: tuple[
                    tuple[str, Literal["task.started", "task.completed"], str], ...
                ] = (
                    ("started", "task.started", "Reconstructing unregistered work"),
                    ("completed", "task.completed", "External work attributed for review"),
                )
                for suffix, reconstruction_type, detail in reconstruction_events:
                    reconstruction_id = f"evt-{command.request_id}-{suffix}"
                    payload = TaskEventPayload(task_id=task_id, detail=detail)
                    reconstruction = next(
                        (item for item in events if item.event_id == reconstruction_id), None
                    )
                    if reconstruction is None:
                        append(
                            self.directory / "events",
                            TaskEvent(
                                event_id=reconstruction_id,
                                project_id=task.project_id,
                                timestamp=timestamp(),
                                actor_type="human",
                                actor_id="local-director",
                                correlation_id=command.request_id,
                                task_id=task_id,
                                sequence=snapshot.cursor + 1,
                                event_type=reconstruction_type,
                                payload=payload,
                            ),
                            self.max_segment_bytes,
                        )
                        snapshot, events = self._replay()
                    else:
                        require(
                            isinstance(reconstruction, TaskEvent)
                            and reconstruction.event_type == reconstruction_type
                            and reconstruction.payload == payload,
                            "request_id_conflict",
                            "Request ID was used for different reconciliation content",
                        )
            fingerprint = workspace_fingerprint(self.root)
            append(
                self.directory / "events",
                ProjectReconciledEvent(
                    event_id=event_id,
                    project_id=snapshot.project.project.id,
                    timestamp=timestamp(),
                    actor_type="human",
                    actor_id="local-director",
                    correlation_id=command.request_id,
                    task_id=task_id,
                    sequence=snapshot.cursor + 1,
                    event_type="project.reconciled",
                    payload=ReconciliationPayload(
                        change_id=command.change_id,
                        paths=record.paths,
                        task_id=task_id,
                        detail=command.detail,
                        fingerprint=fingerprint,
                        artifacts=artifacts,
                    ),
                ),
                self.max_segment_bytes,
            )
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return next(
                item for item in replayed.reconciliations if item.change_id == command.change_id
            )

    def propose(self, command: TaskProposal) -> TaskContract:
        with self.lock:
            snapshot, events = self._replay()
            task = TaskContract(
                task_id=f"task-{command.request_id}",
                project_id=snapshot.project.project.id,
                title=command.title,
                objective=command.objective,
                entities=[],
                references=[],
                required_capabilities=command.required_capabilities,
                requirements=Requirements(
                    functional=[], visual=[], technical=[], accessibility=[], production=[]
                ),
                constraints=[],
                deliverables=command.deliverables,
                dependency_ids=command.dependency_ids,
                permissions=Permissions(),
                required_evaluations=["contract_compliance"],
                escalation_criteria=[],
            )
            event_id = f"evt-{command.request_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate:
                require(
                    isinstance(duplicate, TaskProposedEvent) and duplicate.payload == task,
                    "request_id_conflict",
                    "Request ID was used for different content",
                )
                self._sync(snapshot, events)
                return task
            require(
                set(task.dependency_ids) <= {item.task_id for item in snapshot.tasks},
                "missing_dependency",
                "Dependencies must be existing tasks in this project",
            )
            event = TaskProposedEvent(
                event_id=event_id,
                project_id=task.project_id,
                timestamp=timestamp(),
                actor_type="human",
                actor_id="local-director",
                correlation_id=command.request_id,
                task_id=task.task_id,
                sequence=snapshot.cursor + 1,
                event_type="task.proposed",
                payload=task,
            )
            # Content-addressed immutable contract; an interrupted append may leave an orphan.
            self._write_contract(task)
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return task

    def update_policy(self, command: PolicyCommand) -> Policy:
        with self.lock:
            snapshot, events = self._replay()
            require(
                command.policy.project_id == snapshot.project.project.id,
                "project_scope_mismatch",
                "Policy belongs to another project",
            )
            event_id = f"evt-{command.request_id}"
            duplicate = next((item for item in events if item.event_id == event_id), None)
            if duplicate:
                require(
                    isinstance(duplicate, PolicyUpdatedEvent)
                    and duplicate.payload == command.policy,
                    "request_id_conflict",
                    "Request ID was used for different content",
                )
                self._sync(snapshot, events)
                return command.policy
            require(
                command.expected_cursor == snapshot.cursor,
                "stale_policy",
                "Reload settings before saving",
            )
            event = PolicyUpdatedEvent(
                event_id=event_id,
                project_id=command.policy.project_id,
                timestamp=timestamp(),
                actor_type="human",
                actor_id="local-director",
                correlation_id=command.request_id,
                task_id=None,
                sequence=snapshot.cursor + 1,
                event_type="policy.updated",
                payload=command.policy,
            )
            append(self.directory / "events", event, self.max_segment_bytes)
            replayed, committed = self._replay()
            self._sync(replayed, committed)
            return command.policy

    def rebuild(self) -> ProjectSnapshot:
        with self.lock:
            snapshot, events = self._replay()
            replacement = self.directory / f"rebuild-{uuid4()}.sqlite3"
            projection = Projection(replacement)
            try:
                projection.replace(snapshot, events)
                require(
                    projection.snapshot() == snapshot,
                    "rebuild_mismatch",
                    "Projection verification failed",
                )
            finally:
                projection.close()
            os.replace(replacement, self.directory / "projection.sqlite3")
            return snapshot


class ProjectRegistry:
    """Small global catalog of project roots; project history remains project-local."""

    def __init__(
        self,
        initial: ProjectStore,
        registry_path: Path | None = None,
        knowledge_router: KnowledgeRouter | None = None,
        agents: list[AgentDefinition] | None = None,
    ) -> None:
        self.registry_path = registry_path
        self.knowledge_router = knowledge_router
        self.agents = agents
        self.lock = threading.RLock()
        self.stores: dict[str, ProjectStore] = {}
        self.active_project_id = self._add_store(initial)
        if registry_path and registry_path.exists():
            value = json.loads(registry_path.read_text(encoding="utf-8"))
            require(value.get("schema_version") == 1, "unsupported_registry", str(registry_path))
            for entry in value.get("projects", []):
                registered = ProjectStore(Path(entry["root"]))
                project_id = self._add_store(registered)
                require(
                    project_id == entry["project_id"],
                    "project_registry_mismatch",
                    entry["root"],
                )
            selected = value.get("active_project_id")
            require(selected in self.stores, "active_project_missing", str(selected))
            self.active_project_id = selected
        self._persist()

    def _add_store(self, store: ProjectStore) -> str:
        project_id = store.snapshot().project.project.id
        previous = self.stores.get(project_id)
        require(
            previous is None or previous.root == store.root,
            "duplicate_project_id",
            project_id,
        )
        self.stores[project_id] = store
        return project_id

    def _persist(self) -> None:
        if self.registry_path is None:
            return
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        value = {
            "schema_version": 1,
            "active_project_id": self.active_project_id,
            "projects": [
                {"project_id": project_id, "root": str(store.root)}
                for project_id, store in self.stores.items()
            ],
        }
        data = (json.dumps(value, indent=2) + "\n").encode("utf-8")
        with tempfile.NamedTemporaryFile(
            dir=self.registry_path.parent, prefix="projects-", suffix=".tmp", delete=False
        ) as temporary:
            temporary.write(data)
            temporary.flush()
            os.fsync(temporary.fileno())
            temporary_path = Path(temporary.name)
        os.replace(temporary_path, self.registry_path)

    @property
    def current(self) -> ProjectStore:
        with self.lock:
            return self.stores[self.active_project_id]

    def catalog(self) -> ProjectCatalog:
        with self.lock:
            projects = []
            for project_id, store in self.stores.items():
                snapshot = store.snapshot()
                projects.append(
                    ProjectSummary(
                        project_id=project_id,
                        name=snapshot.project.project.name,
                        root=str(store.root),
                        engine=(snapshot.project.engine.type if snapshot.project.engine else None),
                        stage=snapshot.project.production.stage,
                        onboarding=snapshot.onboarding,
                    )
                )
            return ProjectCatalog(
                projects=sorted(projects, key=lambda item: item.name.casefold()),
                active_project_id=self.active_project_id,
            )

    def select(self, project_id: str) -> ProjectCatalog:
        with self.lock:
            require(project_id in self.stores, "project_not_found", project_id)
            self.active_project_id = project_id
            self._persist()
            return self.catalog()

    def remove(self, command: ProjectRemoval) -> ProjectCatalog:
        with self.lock:
            require(command.project_id in self.stores, "project_not_found", command.project_id)
            require(len(self.stores) > 1, "last_project_removal_forbidden", command.project_id)
            del self.stores[command.project_id]
            if self.active_project_id == command.project_id:
                self.active_project_id = sorted(self.stores)[0]
            self._persist()
            return self.catalog()

    def import_local(self, path: Path) -> ProjectCatalog:
        with self.lock:
            candidate = path.expanduser()
            require(candidate.exists(), "repository_not_found", str(candidate))
            root = candidate.resolve(strict=True)
            require(root.is_dir(), "not_a_directory", str(root))
            if not (root / ".gameagent").is_dir():
                from gameagent.intake import inspect

                project, report = inspect(root)
                root = Path(report.repository_root)
                initialize(root, project, report)
            store = ProjectStore(root)
            store.ensure_onboarding(self.knowledge_router, self.agents)
            self.active_project_id = self._add_store(store)
            self._persist()
            return self.catalog()
