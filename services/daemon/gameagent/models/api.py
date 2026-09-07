"""Studio/daemon wire contracts, exported with the project protocol."""

from typing import Annotated, Literal

from pydantic import Field

from gameagent.models.contracts import (
    Event,
    Identifier,
    Policy,
    Project,
    TaskContract,
    Text,
    Value,
    WorkerRecord,
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


class ProjectSnapshot(Value):
    project: Project
    policy: Policy
    tasks: list[TaskContract]
    cursor: Annotated[int, Field(ge=0)]
    history_digest: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
    workers: list[WorkerRecord] = Field(default_factory=list)


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
    project_catalog: ProjectCatalog
    project_import: ProjectImport
    project_selection: ProjectSelection
    worker_command: WorkerCommand
    snapshot: ProjectSnapshot
    proposal: TaskProposal
    policy_command: PolicyCommand
    event_page: EventPage
    stream_message: StreamMessage
