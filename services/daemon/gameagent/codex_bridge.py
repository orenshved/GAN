"""Project-bound, read-only Codex runs using the authenticated ChatGPT session."""

import asyncio
import os
import shutil
from pathlib import Path
from uuid import uuid4

from openai_codex import ApprovalMode, AsyncCodex, AsyncTurnHandle, CodexConfig, Sandbox

from gameagent.constitution import require
from gameagent.models.api import WorkerCommand
from gameagent.models.contracts import WorkerRecord, WorkerResult
from gameagent.projects import ProjectStore


class CodexBridge:
    def __init__(self, store: ProjectStore) -> None:
        self.store = store
        codex_bin = os.getenv("GAMEAGENT_CODEX_BIN") or shutil.which("codex")
        self.client = AsyncCodex(
            CodexConfig(
                codex_bin=codex_bin,
                cwd=str(store.root),
                client_name="gan_worker_bridge",
                config_overrides=('forced_login_method="chatgpt"', 'model_provider="openai"'),
                env={"OPENAI_API_KEY": "", "CODEX_API_KEY": ""},
            )
        )
        self.lock = asyncio.Lock()
        self.jobs: dict[str, asyncio.Task[None]] = {}
        self.turns: dict[str, AsyncTurnHandle] = {}

    async def account(self) -> dict[str, str]:
        account = await self.client.account()
        kind = account.account.root.type if account.account else "signed_out"
        return {"state": "ready" if kind == "chatgpt" else "login_required", "type": kind}

    async def recover(self) -> None:
        snapshot = await asyncio.to_thread(self.store.snapshot)
        for record in snapshot.workers:
            if record.state == "running":
                await asyncio.to_thread(
                    self.store.record_worker,
                    record.model_copy(
                        update={
                            "state": "interrupted",
                            "detail": "Daemon restarted; resume this analysis explicitly",
                        }
                    ),
                )

    async def login(self) -> dict[str, str]:
        handle = await self.client.login_chatgpt()
        return {"url": handle.auth_url}

    async def start(self, command: WorkerCommand) -> WorkerRecord:
        async with self.lock:
            require(
                (await self.account())["state"] == "ready",
                "chatgpt_login_required",
                "Sign in with ChatGPT before running a worker",
            )
            snapshot = await asyncio.to_thread(self.store.snapshot)
            task = next((t for t in snapshot.tasks if t.task_id == command.task_id), None)
            require(task is not None, "task_not_found", command.task_id)
            assert task is not None
            require(
                not any(not job.done() for job in self.jobs.values()),
                "worker_busy",
                "Wait for the current worker or interrupt it",
            )
            cwd = self.store.root.resolve(strict=True)
            if command.worker_id:
                record = next(
                    (w for w in snapshot.workers if w.worker_id == command.worker_id), None
                )
                require(
                    record is not None and record.task_id == task.task_id,
                    "worker_scope_mismatch",
                    "Worker must belong to this project and task",
                )
                assert record is not None
                require(
                    Path(record.cwd).resolve(strict=True) == cwd,
                    "worker_workspace_changed",
                    "Resume requires the original project directory",
                )
                thread = await self.client.thread_resume(
                    record.thread_id,
                    cwd=str(cwd),
                    sandbox=Sandbox.read_only,
                    approval_mode=ApprovalMode.deny_all,
                    model_provider="openai",
                )
            else:
                thread = await self.client.thread_start(
                    cwd=str(cwd),
                    sandbox=Sandbox.read_only,
                    approval_mode=ApprovalMode.deny_all,
                    model_provider="openai",
                    ephemeral=False,
                )
                record = WorkerRecord(
                    worker_id=f"worker-{uuid4()}",
                    project_id=snapshot.project.project.id,
                    task_id=task.task_id,
                    thread_id=thread.id,
                    cwd=str(cwd),
                    state="ready",
                    detail="Read-only Codex thread created",
                )
                await asyncio.to_thread(self.store.record_worker, record)
            prompt = (
                "Analyze this game project for the following proposed task. This is a read-only "
                "analysis run, not task completion. Inspect the workspace with read-only local "
                "shell commands. Do not modify files or call network services. Distinguish "
                "observed facts from missing information.\n" + task.model_dump_json()
            )
            turn = await thread.turn(
                prompt,
                cwd=str(cwd),
                sandbox=Sandbox.read_only,
                approval_mode=ApprovalMode.deny_all,
                output_schema=WorkerResult.model_json_schema(),
            )
            record = record.model_copy(
                update={
                    "state": "running",
                    "turn_id": turn.id,
                    "result": None,
                    "detail": "Codex is analyzing the project",
                }
            )
            try:
                await asyncio.to_thread(self.store.record_worker, record)
            except Exception:
                await turn.interrupt()
                raise
            self.turns[record.worker_id] = turn
            self.jobs[record.worker_id] = asyncio.create_task(self._consume(record, turn))
            return record

    async def _consume(self, record: WorkerRecord, turn: AsyncTurnHandle) -> None:
        try:
            result = await turn.run()
            if result.status.value == "interrupted":
                record = record.model_copy(
                    update={"state": "interrupted", "detail": "Worker interrupted"}
                )
            else:
                require(result.status.value == "completed", "worker_failed", str(result.error))
                output = WorkerResult.model_validate_json(result.final_response or "")
                record = record.model_copy(
                    update={
                        "state": "completed",
                        "result": output,
                        "detail": "Read-only analysis complete; task still requires production planning",
                    }
                )
        except asyncio.CancelledError:
            try:
                await turn.interrupt()
            except Exception:
                pass
            record = record.model_copy(update={"state": "interrupted", "detail": "Daemon stopped"})
        except Exception as error:
            record = record.model_copy(
                update={"state": "failed", "detail": str(error) or type(error).__name__}
            )
        finally:
            self.turns.pop(record.worker_id, None)
        await asyncio.to_thread(self.store.record_worker, record)

    async def interrupt(self, worker_id: str) -> dict[str, str]:
        turn = self.turns.get(worker_id)
        require(turn is not None, "worker_not_running", worker_id)
        assert turn is not None
        await turn.interrupt()
        return {"state": "interrupt_requested"}

    async def close(self) -> None:
        for job in self.jobs.values():
            if not job.done():
                job.cancel()
        await asyncio.gather(*self.jobs.values(), return_exceptions=True)
        await self.client.close()
