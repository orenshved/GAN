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
from typing import Literal
from urllib.parse import quote
from uuid import uuid4

import yaml
from filelock import FileLock

from gameagent.constitution import require
from gameagent.models.api import (
    EventPage,
    PolicyCommand,
    ProjectCatalog,
    ProjectSnapshot,
    ProjectSummary,
    ReconcileCommand,
    TaskProgressCommand,
    TaskProposal,
    TaskStartCommand,
)
from gameagent.models.contracts import (
    Event,
    ExternalChangeEvent,
    ExternalChangePayload,
    InitializationReport,
    Permissions,
    Policy,
    PolicyUpdatedEvent,
    Project,
    ProjectInitializedEvent,
    ProjectInitializedPayload,
    ProjectReconciledEvent,
    ReconciliationPayload,
    ReconciliationRecord,
    Requirements,
    SourceRef,
    TaskContract,
    TaskEvent,
    TaskEventPayload,
    TaskProposedEvent,
    WorkerEvent,
    WorkerRecord,
    WorkspaceBaselineEvent,
    WorkspaceEntry,
    WorkspaceFingerprint,
)
from gameagent.persistence.history import append, read_history, write_new
from gameagent.persistence.projection import Projection


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
                    event.actor_type in {"human", "external"}
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
            elif isinstance(event, WorkerEvent):
                worker_record = event.payload
                require(
                    worker_record.project_id == project.project.id
                    and worker_record.task_id in tasks,
                    "worker_scope_mismatch",
                    worker_record.worker_id,
                )
                previous = workers.get(worker_record.worker_id)
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
            else:
                # Do not silently project future event semantics as current Phase 1 state.
                require(False, "unsupported_projection_event", event.event_type)
        return ProjectSnapshot(
            project=project,
            policy=policy,
            tasks=list(tasks.values()),
            cursor=len(events),
            history_digest=digest,
            workers=list(workers.values()),
            workspace=workspace,
            reconciliations=list(reconciliations.values()),
            requires_reconciliation=any(
                record.state == "unresolved" for record in reconciliations.values()
            ),
        ), events

    def record_worker(self, record: WorkerRecord) -> WorkerRecord:
        with self.lock:
            snapshot, _ = self._replay()
            require(
                record.project_id == snapshot.project.project.id
                and record.task_id in {task.task_id for task in snapshot.tasks},
                "worker_scope_mismatch",
                record.worker_id,
            )
            previous = next((w for w in snapshot.workers if w.worker_id == record.worker_id), None)
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

    def __init__(self, initial: ProjectStore, registry_path: Path | None = None) -> None:
        self.registry_path = registry_path
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
            self.active_project_id = self._add_store(store)
            self._persist()
            return self.catalog()
