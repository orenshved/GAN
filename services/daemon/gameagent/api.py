"""Loopback-only service for project state and authenticated Codex workers."""

import asyncio
import secrets
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from gameagent.codex_bridge import CodexBridge
from gameagent.constitution import ConstitutionError
from gameagent.models.api import (
    EventPage,
    PolicyCommand,
    ProjectSnapshot,
    StreamMessage,
    TaskProposal,
    WorkerCommand,
)
from gameagent.models.contracts import Policy, TaskContract, WorkerRecord
from gameagent.projects import ProjectStore


def create_app(store: ProjectStore, token: str, studio_origin: str) -> FastAPI:
    if len(token) < 32:
        raise ValueError("GAMEAGENT_DAEMON_TOKEN must contain at least 32 characters")
    bridge = CodexBridge(store)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await bridge.recover()
        yield
        await bridge.close()

    app = FastAPI(title="Game Agent Network", version="0.2.0", lifespan=lifespan)
    app.state.bridge = bridge

    @app.exception_handler(Exception)
    async def service_error(_: Request, error: Exception) -> JSONResponse:
        return JSONResponse({"error": "service_unavailable", "detail": str(error)}, status_code=503)

    @app.get("/worker-account")
    async def worker_account() -> dict[str, str]:
        try:
            return await bridge.account()
        except Exception as error:
            return {"state": "unavailable", "error": "codex_unavailable", "detail": str(error)}

    @app.post("/worker-login")
    async def worker_login() -> dict[str, str]:
        return await bridge.login()

    @app.post("/workers", response_model=WorkerRecord)
    async def worker_start(command: WorkerCommand) -> WorkerRecord:
        return await bridge.start(command)

    @app.post("/worker-interrupt")
    async def worker_interrupt(command: WorkerCommand) -> dict[str, str]:
        return await bridge.interrupt(command.worker_id or "")

    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "testserver"]
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[studio_origin],
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Authorization", "Content-Type"],
    )
    stream_tickets: dict[str, float] = {}

    @app.middleware("http")
    async def authenticate(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method != "OPTIONS" and not secrets.compare_digest(
            request.headers.get("authorization", ""), f"Bearer {token}"
        ):
            return JSONResponse(
                {"error": "unauthorized", "detail": "Local daemon authentication required"},
                status_code=401,
            )
        return await call_next(request)

    @app.exception_handler(ConstitutionError)
    async def domain_error(_: Request, error: ConstitutionError) -> JSONResponse:
        return JSONResponse(error.response(), status_code=409)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_: Request, error: RequestValidationError) -> JSONResponse:
        return JSONResponse({"error": "invalid_request", "detail": str(error)}, status_code=422)

    @app.exception_handler(ValidationError)
    async def invalid_canonical(_: Request, error: ValidationError) -> JSONResponse:
        return JSONResponse(
            {"error": "invalid_project_file", "detail": str(error)}, status_code=409
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_: Request, error: SQLAlchemyError) -> JSONResponse:
        return JSONResponse(
            {"error": "projection_unavailable", "detail": f"Rebuild the projection: {error}"},
            status_code=503,
        )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ready", "phase": "2"}

    @app.get("/project", response_model=ProjectSnapshot)
    def project() -> ProjectSnapshot:
        return store.snapshot()

    @app.get("/events", response_model=EventPage)
    def events(after: int = 0, limit: int = 100) -> EventPage:
        return store.events(after, limit)

    @app.post("/tasks", response_model=TaskContract, status_code=201)
    def propose(command: TaskProposal) -> TaskContract:
        return store.propose(command)

    @app.put("/policy", response_model=Policy)
    def policy(command: PolicyCommand) -> Policy:
        return store.update_policy(command)

    @app.post("/stream-ticket")
    async def stream_ticket() -> dict[str, str]:
        now = time.monotonic()
        for expired in [key for key, deadline in stream_tickets.items() if deadline <= now]:
            del stream_tickets[expired]
        ticket = secrets.token_urlsafe(32)
        stream_tickets[ticket] = now + 10
        return {"ticket": ticket}

    @app.websocket("/events/ws")
    async def stream(websocket: WebSocket, after: int = 0) -> None:
        if websocket.headers.get("origin") != studio_origin:
            await websocket.close(code=1008)
            return
        await websocket.accept()
        try:
            credentials = await asyncio.wait_for(websocket.receive_json(), timeout=5)
            ticket = credentials.get("ticket") if isinstance(credentials, dict) else None
            deadline = stream_tickets.pop(ticket, None) if isinstance(ticket, str) else None
            if deadline is None or deadline <= time.monotonic():
                await websocket.close(code=1008)
                return
            while True:
                page = await asyncio.to_thread(store.events, after, 100)
                await websocket.send_json(
                    StreamMessage(**page.model_dump()).model_dump(mode="json")
                )
                after = page.cursor
                if not page.has_more:
                    await asyncio.sleep(0.5)
        except (TimeoutError, WebSocketDisconnect):
            return
        except ConstitutionError as exc:
            await websocket.send_json(exc.response())
            await websocket.close(code=1011)

    return app
