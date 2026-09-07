import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from gameagent.api import create_app
from gameagent.codex_bridge import CodexBridge
from gameagent.constitution import ConstitutionError
from gameagent.intake import inspect
from gameagent.models.api import PolicyCommand, TaskProposal, WorkerCommand
from gameagent.models.contracts import Project, WorkerRecord
from gameagent.persistence.projection import Projection
from gameagent.projects import ProjectStore, initialize

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]
TOKEN = "test-token-" + "a" * 32
ORIGIN = "http://studio.test"


@pytest.fixture
def store(tmp_path):
    initialize(tmp_path, Project.model_validate(PROFILE))
    return ProjectStore(tmp_path, max_segment_bytes=1)


def proposal(request_id="request-a", **patch):
    return TaskProposal(
        request_id=request_id,
        title="Inspect turn instructions",
        objective="Players understand their next action",
        required_capabilities=["usability_analysis"],
        deliverables=["Findings with evidence"],
        **patch,
    )


def test_intake_detects_repository_without_questionnaire(tmp_path):
    (tmp_path / "project.godot").write_text(
        '[application]\nconfig/features=PackedStringArray("4.6")\n', encoding="utf-8"
    )
    (tmp_path / "main.tscn").write_text('[node name="Main" type="Node2D"]\n', encoding="utf-8")
    (tmp_path / "README.md").write_text("# Existing game\n", encoding="utf-8")
    (tmp_path / "hero.png").write_bytes(b"asset")
    project, report = inspect(tmp_path)
    assert project.engine and project.engine.type == "godot"
    assert project.rendering == "2d"
    assert report.inspected_documents == ["README.md"]
    assert report.inspected_assets == ["hero.png"]
    assert "godot_development" in report.required_capabilities
    assert {finding.field for finding in report.findings if finding.kind == "missing"} >= {
        "platforms",
        "input_methods",
    }


def test_init_restart_rotate_delete_database_rebuild(store):
    initial = store.snapshot()
    assert initial.cursor == 1 and initial.tasks == []
    task = store.propose(proposal())
    command = PolicyCommand(
        request_id="policy-a",
        expected_cursor=2,
        policy=initial.policy.model_copy(update={"authority": "ask_first"}),
    )
    store.update_policy(command)
    before = store.snapshot()
    assert len(list((store.directory / "events").glob("*.jsonl"))) == 3
    assert before.tasks[0] == task
    assert ProjectStore(store.root).snapshot() == before
    (store.directory / "projection.sqlite3").unlink()
    assert ProjectStore(store.root).snapshot() == before
    assert store.rebuild() == before
    assert store.snapshot() == before


def test_retry_is_idempotent_and_conflicting_request_rejected(store):
    first = store.propose(proposal())
    assert store.propose(proposal()) == first
    assert store.snapshot().cursor == 2
    with pytest.raises(ConstitutionError):
        store.propose(proposal().model_copy(update={"title": "Different intent"}))


def test_concurrent_writers_get_distinct_contiguous_sequences(store):
    def write(index):
        return ProjectStore(store.root).propose(proposal(f"request-{index}"))

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(write, range(8)))
    assert store.snapshot().cursor == 9
    assert [e.sequence for e in store.events().events] == list(range(1, 10))


def test_append_survives_projection_failure_and_retry_recovers(store, monkeypatch):
    original = Projection.replace

    def fail(*args):
        raise RuntimeError("simulated crash after durable append")

    monkeypatch.setattr(Projection, "replace", fail)
    with pytest.raises(RuntimeError):
        store.propose(proposal())
    monkeypatch.setattr(Projection, "replace", original)
    assert store.propose(proposal()).task_id == "task-request-a"
    assert store.snapshot().cursor == 2


@pytest.mark.parametrize("damage", ["tail", "json", "version", "sequence", "scope", "duplicate"])
def test_corruption_is_explicit_and_canonical_bytes_remain_untouched(store, damage):
    store.propose(proposal())
    file = sorted((store.directory / "events").glob("*.jsonl"))[-1]
    data = file.read_bytes()
    value = json.loads(data)
    if damage == "tail":
        data = data[:-1]
    elif damage == "json":
        data = b"not-json\n"
    elif damage == "duplicate":
        data += data
    else:
        value[
            {"version": "schema_version", "sequence": "sequence", "scope": "project_id"}[damage]
        ] = {"version": 2, "sequence": 7, "scope": "project-b"}[damage]
        data = json.dumps(value).encode() + b"\n"
    file.write_bytes(data)
    with pytest.raises(ConstitutionError):
        store.rebuild()
    assert file.read_bytes() == data


def test_initialization_never_overwrites_and_replay_uses_event_snapshot(store):
    with pytest.raises(ConstitutionError):
        initialize(store.root, Project.model_validate(PROFILE))
    task = store.propose(proposal())
    # Exported contract files are convenient references; event payload is authoritative.
    for file in (store.directory / "contracts").glob("*.json"):
        file.write_text("changed outside the daemon")
    assert store.rebuild().tasks == [task]


def test_missing_dependency_foreign_policy_and_stale_update_rejected(store):
    with pytest.raises(ConstitutionError):
        store.propose(proposal(dependency_ids=["missing"]))
    snapshot = store.snapshot()
    for patch in ({"project_id": "project-b"}, {}):
        with pytest.raises(ConstitutionError):
            store.update_policy(
                PolicyCommand(
                    request_id="policy-a",
                    expected_cursor=0,
                    policy=snapshot.policy.model_copy(update=patch),
                )
            )
    assert store.snapshot().cursor == 1


def test_event_cursor_paging_and_ahead_cursor(store):
    store.propose(proposal())
    assert store.events(0, 1).has_more
    assert store.events(1, 1).cursor == 2
    assert store.events(2).events == []
    with pytest.raises(ConstitutionError):
        store.events(3)


def test_rest_auth_task_policy_and_websocket_replay(store):
    app = create_app(store, TOKEN, ORIGIN)
    with TestClient(app) as client:
        assert client.get("/project").status_code == 401
        headers = {"Authorization": f"Bearer {TOKEN}"}
        snapshot = client.get("/project", headers=headers).json()
        assert snapshot["cursor"] == 1
        response = client.post("/tasks", headers=headers, json=proposal().model_dump())
        assert response.status_code == 201
        assert client.post("/tasks", headers=headers, json={}).status_code == 422
        with client.websocket_connect("/events/ws?after=1", headers={"origin": ORIGIN}) as ws:
            ticket = client.post("/stream-ticket", headers=headers).json()["ticket"]
            ws.send_json({"ticket": ticket})
            message = ws.receive_json()
            assert message["cursor"] == 2 and message["events"][0]["event_type"] == "task.proposed"
            store.propose(proposal("request-b"))
            while True:
                message = ws.receive_json()
                if message["events"]:
                    assert message["cursor"] == 3
                    break


def test_websocket_rejects_foreign_origin_and_invalid_token(store):
    from starlette.websockets import WebSocketDisconnect

    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": "https://evil.test"}):
                pass
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
                ws.send_json({"ticket": "wrong"})
                ws.receive_json()


def test_websocket_ticket_is_single_use(store):
    from starlette.websockets import WebSocketDisconnect

    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        ticket = client.post("/stream-ticket", headers=headers).json()["ticket"]
        with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
            ws.send_json({"ticket": ticket})
            assert ws.receive_json()["cursor"] == 1
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/events/ws", headers={"origin": ORIGIN}) as ws:
                ws.send_json({"ticket": ticket})
                ws.receive_json()


def test_worker_bridge_persists_resumes_and_rejects_foreign_worker(store):
    task = store.propose(proposal())

    class FakeTurn:
        id = "turn-1"

        async def run(self):
            return SimpleNamespace(
                status=SimpleNamespace(value="completed"),
                error=None,
                final_response=json.dumps(
                    {
                        "summary": "Inspected",
                        "findings": ["No engine"],
                        "next_steps": ["Choose engine"],
                    }
                ),
            )

    class FakeThread:
        id = "thread-1"

        async def turn(self, prompt, **kwargs):
            assert kwargs["sandbox"].value == "read-only"
            assert kwargs["approval_mode"].value == "deny_all"
            return FakeTurn()

    class FakeClient:
        resumed = False

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            assert kwargs["cwd"] == str(store.root)
            return FakeThread()

        async def thread_resume(self, thread_id, **kwargs):
            assert thread_id == "thread-1"
            self.resumed = True
            return FakeThread()

        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store)
        fake = FakeClient()
        bridge.client = fake
        record = await bridge.start(WorkerCommand(task_id=task.task_id))
        await bridge.jobs[record.worker_id]
        assert store.rebuild().workers[0].state == "completed"
        with pytest.raises(ConstitutionError):
            await bridge.start(WorkerCommand(task_id=task.task_id, worker_id="worker-foreign"))
        await bridge.start(WorkerCommand(task_id=task.task_id, worker_id=record.worker_id))
        await bridge.jobs[record.worker_id]
        assert fake.resumed
        assert store.snapshot().tasks[0].state == "PROPOSED"
        await bridge.close()

    asyncio.run(scenario())


def test_worker_bridge_rejects_api_key_account(store):
    async def scenario():
        bridge = CodexBridge(store)

        async def account():
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="apiKey")))

        bridge.client.account = account
        with pytest.raises(ConstitutionError, match="Sign in with ChatGPT"):
            await bridge.start(WorkerCommand(task_id="task-a"))
        await bridge.close()

    asyncio.run(scenario())


def test_worker_bridge_recovers_running_state_and_interrupts_active_turn(store):
    task = store.propose(proposal())
    record = WorkerRecord(
        worker_id="worker-recovery",
        project_id=store.snapshot().project.project.id,
        task_id=task.task_id,
        thread_id="thread-recovery",
        cwd=str(store.root),
        state="running",
        turn_id="turn-recovery",
        detail="Running before restart",
    )
    store.record_worker(record)

    class FakeTurn:
        interrupted = False

        async def interrupt(self):
            self.interrupted = True

    class FakeClient:
        async def close(self):
            pass

    async def scenario():
        bridge = CodexBridge(store)
        bridge.client = FakeClient()
        await bridge.recover()
        recovered = store.snapshot().workers[0]
        assert recovered.state == "interrupted"
        assert recovered.thread_id == record.thread_id
        turn = FakeTurn()
        bridge.turns[record.worker_id] = turn
        assert await bridge.interrupt(record.worker_id) == {"state": "interrupt_requested"}
        assert turn.interrupted
        await bridge.close()

    asyncio.run(scenario())
