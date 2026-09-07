"""Project commands and replay. All mutations pass through the same lock/log."""

import hashlib
import os
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import yaml
from filelock import FileLock

from gameagent.constitution import require
from gameagent.models.api import EventPage, PolicyCommand, ProjectSnapshot, TaskProposal
from gameagent.models.contracts import (
    Event,
    InitializationReport,
    Permissions,
    Policy,
    PolicyUpdatedEvent,
    Project,
    ProjectInitializedEvent,
    ProjectInitializedPayload,
    Requirements,
    TaskContract,
    TaskProposedEvent,
    WorkerEvent,
    WorkerRecord,
)
from gameagent.persistence.history import append, read_history, write_new
from gameagent.persistence.projection import Projection


def timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


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
                payload=ProjectInitializedPayload(project=profile, policy=policy, intake=intake),
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
            elif isinstance(event, WorkerEvent):
                record = event.payload
                require(
                    record.project_id == project.project.id and record.task_id in tasks,
                    "worker_scope_mismatch",
                    record.worker_id,
                )
                previous = workers.get(record.worker_id)
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
                        for w in workers.values()
                    ),
                    "thread_already_bound",
                    record.worker_id,
                )
                workers[record.worker_id] = record
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
            document = task.model_dump_json().encode("utf-8")
            path = self.directory / "contracts" / f"{hashlib.sha256(document).hexdigest()}.json"
            if not path.exists():
                write_new(path, document)
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
