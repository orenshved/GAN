"""Loopback-only service for project state and authenticated Codex workers."""

import asyncio
import hashlib
import logging
import secrets
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from gameagent.adapters.godot import GodotAdapter
from gameagent.codex_bridge import CodexBridge
from gameagent.constitution import ConstitutionError, require
from gameagent.local_models import LocalModelExpert
from gameagent.models.api import (
    ContextCommand,
    DecisionCommand,
    EngineProjectInspection,
    EventPage,
    GateWaiverCommand,
    HumanReviewCommand,
    IntelligenceRefreshCommand,
    ModelBenchmarkCommand,
    ModelEnvironment,
    ModelRecommendationCommand,
    ModelRouteCommand,
    ObjectiveCommand,
    PolicyCommand,
    ProjectCatalog,
    ProjectImport,
    ProjectRemoval,
    ProjectSelection,
    ProjectSnapshot,
    QARunCommand,
    ReconcileCommand,
    RecruitmentCommand,
    RuntimeCaptureCommand,
    RuntimeCaptureResult,
    StreamMessage,
    TaskProgressCommand,
    TaskProposal,
    TaskStartCommand,
    WorkerCommand,
)
from gameagent.models.contracts import (
    AgentDefinition,
    AgentRegistrySnapshot,
    ContextPackage,
    GMRecord,
    InboxDecision,
    LocalModelRecommendation,
    ModelBenchmark,
    ModelRoutingRecord,
    Policy,
    ProjectIntelligence,
    QAGateDefinition,
    QAReport,
    ReconciliationRecord,
    RecruitmentRecord,
    TaskContract,
    WorkerRecord,
)
from gameagent.projects import ProjectRegistry, ProjectStore
from gameagent.qa import gate_catalog
from gameagent.recruiter import Recruiter

logger = logging.getLogger(__name__)


def create_app(
    store: ProjectStore,
    token: str,
    studio_origin: str,
    registry_path: Path | None = None,
) -> FastAPI:
    if len(token) < 32:
        raise ValueError("GAMEAGENT_DAEMON_TOKEN must contain at least 32 characters")
    registry = ProjectRegistry(store, registry_path)
    agent_registry_path = (
        registry_path.parent / "agents.json"
        if registry_path is not None
        else Path.home() / ".gameagent" / "agents.json"
    )
    recruiter = Recruiter.from_environment(agent_registry_path)
    model_expert = LocalModelExpert.from_environment()
    bridges = {
        project_id: CodexBridge(project_store, recruiter)
        for project_id, project_store in registry.stores.items()
    }
    watcher_failures: dict[str, str] = {}

    def bridge() -> CodexBridge:
        project_id = registry.active_project_id
        if project_id not in bridges:
            bridges[project_id] = CodexBridge(registry.current, recruiter)
        return bridges[project_id]

    async def watch_projects() -> None:
        while True:
            for project_store in list(registry.stores.values()):
                key = str(project_store.root)
                try:
                    await asyncio.to_thread(project_store.detect_external_changes)
                    watcher_failures.pop(key, None)
                except Exception as error:
                    detail = str(error)
                    if watcher_failures.get(key) != detail:
                        logger.exception("Workspace watcher failed for %s", project_store.root)
                    watcher_failures[key] = detail
            await asyncio.sleep(0.5)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        for worker_bridge in bridges.values():
            await worker_bridge.recover()
        watcher = asyncio.create_task(watch_projects())
        try:
            yield
        finally:
            watcher.cancel()
            await asyncio.gather(watcher, return_exceptions=True)
            await asyncio.gather(*(worker_bridge.close() for worker_bridge in bridges.values()))

    app = FastAPI(title="Game Agent Network", version="0.11.0", lifespan=lifespan)
    app.state.registry = registry

    @app.exception_handler(Exception)
    async def service_error(_: Request, error: Exception) -> JSONResponse:
        return JSONResponse({"error": "service_unavailable", "detail": str(error)}, status_code=503)

    @app.get("/worker-account")
    async def worker_account() -> dict[str, str]:
        try:
            return await bridge().account()
        except Exception as error:
            return {"state": "unavailable", "error": "codex_unavailable", "detail": str(error)}

    @app.post("/worker-login")
    async def worker_login() -> dict[str, str]:
        return await bridge().login()

    @app.post("/gm-objective", response_model=GMRecord, status_code=202)
    async def gm_objective(command: ObjectiveCommand) -> GMRecord:
        return await bridge().plan(command)

    @app.get("/agent-roster", response_model=list[AgentDefinition])
    def agent_roster() -> list[AgentDefinition]:
        return bridge().roster()

    @app.get("/agent-registry", response_model=AgentRegistrySnapshot)
    def agent_registry() -> AgentRegistrySnapshot:
        return recruiter.registry.snapshot()

    @app.get("/recruitments", response_model=list[RecruitmentRecord])
    def recruitments() -> list[RecruitmentRecord]:
        return registry.current.snapshot().recruitments

    @app.post("/recruit", response_model=RecruitmentRecord)
    async def recruit(command: RecruitmentCommand) -> RecruitmentRecord:
        return await bridge().recruit(command)

    @app.get("/qa-gates", response_model=list[QAGateDefinition])
    def qa_gates() -> list[QAGateDefinition]:
        return gate_catalog()

    @app.get("/qa-report", response_model=QAReport)
    def qa_report(task_id: str) -> QAReport:
        return registry.current.qa_report(task_id)

    @app.post("/qa-run", response_model=QAReport)
    def qa_run(command: QARunCommand) -> QAReport:
        return registry.current.run_qa(command)

    @app.post("/qa-human-review", response_model=QAReport)
    def qa_human_review(command: HumanReviewCommand) -> QAReport:
        return registry.current.record_human_review(command)

    @app.post("/qa-waive", response_model=QAReport)
    def qa_waive(command: GateWaiverCommand) -> QAReport:
        return registry.current.waive_gate(command)

    @app.get("/model-environment", response_model=ModelEnvironment)
    async def model_environment() -> ModelEnvironment:
        return await asyncio.to_thread(model_expert.inspect)

    @app.post("/model-benchmark", response_model=ModelBenchmark)
    async def model_benchmark(command: ModelBenchmarkCommand) -> ModelBenchmark:
        snapshot = registry.current.snapshot()
        benchmark_id = f"benchmark-{command.request_id}"
        existing = next(
            (item for item in snapshot.model_benchmarks if item.benchmark_id == benchmark_id),
            None,
        )
        if existing is not None:
            require(existing.task_id == command.task_id, "request_id_conflict", command.request_id)
            return existing
        task = next((item for item in snapshot.tasks if item.task_id == command.task_id), None)
        require(task is not None, "task_not_found", command.task_id)
        assert task is not None
        benchmark = await asyncio.to_thread(
            model_expert.benchmark,
            registry.current.root,
            task,
            command.request_id,
            command.model_name,
        )
        return registry.current.record_model_benchmark(benchmark)

    @app.post("/model-recommend", response_model=LocalModelRecommendation)
    async def model_recommend(
        command: ModelRecommendationCommand,
    ) -> LocalModelRecommendation:
        task = next(
            (item for item in registry.current.snapshot().tasks if item.task_id == command.task_id),
            None,
        )
        require(task is not None, "task_not_found", command.task_id)
        assert task is not None
        return await asyncio.to_thread(
            model_expert.recommend,
            task,
            command.request_id,
        )

    @app.post("/model-route", response_model=ModelRoutingRecord)
    async def model_route(command: ModelRouteCommand) -> ModelRoutingRecord:
        snapshot = registry.current.snapshot()
        routing_id = f"routing-{command.request_id}"
        existing = next(
            (item for item in snapshot.model_routing_records if item.routing_id == routing_id),
            None,
        )
        if existing is not None:
            require(existing.task_id == command.task_id, "request_id_conflict", command.request_id)
            return existing
        task = next((item for item in snapshot.tasks if item.task_id == command.task_id), None)
        require(task is not None, "task_not_found", command.task_id)
        assert task is not None
        environment, account = await asyncio.gather(
            asyncio.to_thread(model_expert.inspect), bridge().account()
        )
        routing = model_expert.route(
            task,
            command.request_id,
            environment,
            snapshot.model_benchmarks,
            account.get("state") == "ready",
            command.urgency,
        )
        return registry.current.record_model_routing(routing)

    @app.post("/decision-resolve", response_model=InboxDecision)
    def decision_resolve(command: DecisionCommand) -> InboxDecision:
        return registry.current.resolve_decision(command)

    @app.post("/workers", response_model=WorkerRecord)
    async def worker_start(command: WorkerCommand) -> WorkerRecord:
        return await bridge().start(command)

    @app.post("/worker-interrupt")
    async def worker_interrupt(command: WorkerCommand) -> dict[str, str]:
        return await bridge().interrupt(command.worker_id or "")

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
    def health() -> dict[str, object]:
        if watcher_failures:
            return {
                "status": "degraded",
                "phase": "8+10",
                "error": "workspace_watcher_failed",
                "detail": "; ".join(
                    f"{root}: {detail}" for root, detail in watcher_failures.items()
                ),
            }
        return {"status": "ready", "phase": "8+10"}

    @app.get("/projects", response_model=ProjectCatalog)
    def projects() -> ProjectCatalog:
        return registry.catalog()

    @app.post("/project-select", response_model=ProjectCatalog)
    def select_project(command: ProjectSelection) -> ProjectCatalog:
        return registry.select(command.project_id)

    @app.post("/project-import", response_model=ProjectCatalog)
    async def import_project(command: ProjectImport) -> ProjectCatalog:
        catalog = await asyncio.to_thread(registry.import_local, Path(command.path))
        await bridge().recover()
        return catalog

    @app.post("/project-remove", response_model=ProjectCatalog)
    async def remove_project(command: ProjectRemoval) -> ProjectCatalog:
        catalog = registry.remove(command)
        removed_bridge = bridges.pop(command.project_id, None)
        if removed_bridge is not None:
            await removed_bridge.close()
        return catalog

    @app.get("/project", response_model=ProjectSnapshot)
    def project() -> ProjectSnapshot:
        return registry.current.snapshot()

    @app.get("/project-intelligence", response_model=ProjectIntelligence | None)
    def project_intelligence() -> ProjectIntelligence | None:
        return registry.current.snapshot().intelligence

    @app.post("/project-intelligence-refresh", response_model=ProjectIntelligence)
    def project_intelligence_refresh(
        command: IntelligenceRefreshCommand,
    ) -> ProjectIntelligence:
        return registry.current.refresh_intelligence(command)

    @app.post("/task-context", response_model=ContextPackage)
    def task_context(command: ContextCommand) -> ContextPackage:
        return registry.current.task_context(command)

    @app.get("/engine-inspection", response_model=EngineProjectInspection)
    def engine_inspection(task_id: str) -> EngineProjectInspection:
        snapshot = registry.current.snapshot()
        require(any(task.task_id == task_id for task in snapshot.tasks), "task_not_found", task_id)
        return GodotAdapter(registry.current.root).inspect(snapshot.project.project.id, task_id)

    @app.post("/runtime-capture", response_model=RuntimeCaptureResult)
    def runtime_capture(command: RuntimeCaptureCommand) -> RuntimeCaptureResult:
        snapshot = registry.current.snapshot()
        require(
            any(task.task_id == command.task_id for task in snapshot.tasks),
            "task_not_found",
            command.task_id,
        )
        adapter = GodotAdapter(registry.current.root)
        evidence_id = f"evidence-{command.request_id}"
        existing = next(
            (item for item in snapshot.evidence if item.evidence_id == evidence_id), None
        )
        if existing is not None:
            evaluation = next(
                (
                    item
                    for item in snapshot.evaluations
                    if item.evaluation_id == f"evaluation-{command.request_id}"
                ),
                None,
            )
            require(evaluation is not None, "capture_evaluation_missing", evidence_id)
            assert evaluation is not None
            return RuntimeCaptureResult(
                inspection=adapter.inspect(snapshot.project.project.id, command.task_id),
                evidence=existing,
                evaluation=evaluation,
                log=adapter.log_reference(evidence_id),
            )
        inspection, evidence, evaluation, log = adapter.capture(
            snapshot.project.project.id,
            command.task_id,
            command.request_id,
            command.node_path,
        )
        registry.current.record_runtime_evaluation(command.request_id, evidence, evaluation)
        return RuntimeCaptureResult(
            inspection=inspection,
            evidence=evidence,
            evaluation=evaluation,
            log=log,
        )

    @app.get("/evidence-file")
    def evidence_file(evidence_id: str) -> FileResponse:
        snapshot = registry.current.snapshot()
        evidence = next(
            (item for item in snapshot.evidence if item.evidence_id == evidence_id), None
        )
        require(evidence is not None, "evidence_not_found", evidence_id)
        assert evidence is not None
        path = (registry.current.root / evidence.source.uri).resolve(strict=True)
        evidence_root = (registry.current.root / ".gameagent" / "evidence").resolve(strict=True)
        require(path.is_relative_to(evidence_root), "unsafe_evidence_path", str(path))
        require(
            hashlib.sha256(path.read_bytes()).hexdigest() == evidence.source.sha256,
            "evidence_digest_mismatch",
            evidence_id,
        )
        return FileResponse(path, media_type=evidence.source.media_type)

    @app.get("/events", response_model=EventPage)
    def events(after: int = 0, limit: int = 100) -> EventPage:
        return registry.current.events(after, limit)

    @app.post("/tasks", response_model=TaskContract, status_code=201)
    def propose(command: TaskProposal) -> TaskContract:
        return registry.current.propose(command)

    @app.post("/task-start", response_model=TaskContract)
    def task_start(command: TaskStartCommand) -> TaskContract:
        return registry.current.start_task(command)

    @app.post("/task-block", response_model=TaskContract)
    def task_block(command: TaskProgressCommand) -> TaskContract:
        return registry.current.block_task(command)

    @app.post("/task-complete", response_model=TaskContract)
    def task_complete(command: TaskProgressCommand) -> TaskContract:
        return registry.current.complete_task(command)

    @app.post("/workspace-scan", response_model=ProjectSnapshot)
    def workspace_scan() -> ProjectSnapshot:
        return registry.current.detect_external_changes()

    @app.post("/reconcile", response_model=ReconciliationRecord)
    def reconcile(command: ReconcileCommand) -> ReconciliationRecord:
        return registry.current.reconcile(command)

    @app.put("/policy", response_model=Policy)
    def policy(command: PolicyCommand) -> Policy:
        return registry.current.update_policy(command)

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
            selected_project_id = registry.active_project_id
            selected_store = registry.current
            while True:
                if registry.active_project_id != selected_project_id:
                    await websocket.close(code=1000)
                    return
                page = await asyncio.to_thread(selected_store.events, after, 100)
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
