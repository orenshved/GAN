"""Loopback-only service for project state and authenticated Codex workers."""

import asyncio
import hashlib
import logging
import os
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
from gameagent.knowledge import KnowledgeFabric, research_source
from gameagent.local_models import LocalModelExpert
from gameagent.models.api import (
    AgentKnowledgeCatalog,
    AgentKnowledgeProfile,
    ContextCommand,
    DecisionCommand,
    EngineProjectInspection,
    EventPage,
    GateWaiverCommand,
    HumanReviewCommand,
    IntelligenceRefreshCommand,
    KnowledgeCatalog,
    KnowledgeMaintenanceReport,
    KnowledgePerformanceSummary,
    LearningMaintenanceStatus,
    LessonPromotionCommand,
    LessonReviewCommand,
    ModelBenchmarkCommand,
    ModelEnvironment,
    ModelRecommendationCommand,
    ModelRouteCommand,
    ObjectiveCommand,
    PackAuditionCommand,
    PackAutomatedAuditionCommand,
    PackBuildCommand,
    PackCandidateCommand,
    PackLifecycleCommand,
    PackReviewCommand,
    PolicyCommand,
    ProductionDomainCatalog,
    ProductionDomainRunCommand,
    ProjectCatalog,
    ProjectImport,
    ProjectRemoval,
    ProjectSelection,
    ProjectSnapshot,
    ProviderConfigureCommand,
    ProviderCredentialCommand,
    ProviderCredentialStatus,
    ProviderDisableCommand,
    ProviderInvocationResult,
    ProviderInvokeCommand,
    ProviderRegistry,
    QARunCommand,
    ReconcileCommand,
    RecruitmentCommand,
    ResearchCommand,
    RuntimeCaptureCommand,
    RuntimeCaptureResult,
    SpendApprovalCommand,
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
    ExperienceLesson,
    ExperienceObservation,
    ExpertisePack,
    GlobalExperience,
    GMRecord,
    InboxDecision,
    LocalModelRecommendation,
    ModelBenchmark,
    ModelRoutingRecord,
    PackAudition,
    PackLifecycleRecord,
    PackReview,
    Policy,
    ProductionDomainInspection,
    ProjectIntelligence,
    Provider,
    QAGateDefinition,
    QAReport,
    ReconciliationRecord,
    RecruitmentRecord,
    SpendApproval,
    TaskContract,
    WorkerRecord,
    WorldResearch,
)
from gameagent.production_domains import (
    DOMAINS_BY_ID,
    domain_catalog,
    inspect_domain,
    tool_catalog,
)
from gameagent.projects import ProjectRegistry, ProjectStore, timestamp
from gameagent.providers import (
    CredentialStore,
    PaidProviderGateway,
    ProviderAdapter,
    adapters_from_environment,
    credential_key,
    system_credential_store,
)
from gameagent.providers import (
    provider_registry as build_provider_registry,
)
from gameagent.qa import gate_catalog
from gameagent.recruiter import Recruiter

logger = logging.getLogger(__name__)


def create_app(
    store: ProjectStore,
    token: str,
    studio_origin: str,
    registry_path: Path | None = None,
    credential_store: CredentialStore | None = None,
    provider_adapters: dict[str, ProviderAdapter] | None = None,
    knowledge_root: Path | None = None,
) -> FastAPI:
    if len(token) < 32:
        raise ValueError("GAMEAGENT_DAEMON_TOKEN must contain at least 32 characters")
    agent_registry_path = (
        registry_path.parent / "agents.json"
        if registry_path is not None
        else Path.home() / ".gameagent" / "agents.json"
    )
    recruiter = Recruiter.from_environment(agent_registry_path)
    knowledge = KnowledgeFabric.from_environment(
        knowledge_root
        or (
            Path(os.environ["GAMEAGENT_KNOWLEDGE_HOME"])
            if os.environ.get("GAMEAGENT_KNOWLEDGE_HOME")
            else None
        )
        or (registry_path.parent / "knowledge" if registry_path is not None else None)
    )
    recruiter.knowledge_registry = knowledge.registry
    registry = ProjectRegistry(
        store,
        registry_path,
        knowledge.router,
        recruiter.registry.roster(),
    )
    model_expert = LocalModelExpert.from_environment()
    credentials = credential_store or system_credential_store()
    adapters = provider_adapters if provider_adapters is not None else adapters_from_environment()
    bridges = {
        project_id: CodexBridge(project_store, recruiter, knowledge.router)
        for project_id, project_store in registry.stores.items()
    }
    watcher_failures: dict[str, str] = {}
    learning_enabled = os.getenv("GAMEAGENT_BACKGROUND_LEARNING") == "1"
    learning_status = LearningMaintenanceStatus(
        enabled=learning_enabled,
        state="idle" if learning_enabled else "disabled",
    )

    def bridge() -> CodexBridge:
        project_id = registry.active_project_id
        if project_id not in bridges:
            bridges[project_id] = CodexBridge(registry.current, recruiter, knowledge.router)
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

    async def maintain_knowledge() -> None:
        nonlocal learning_status
        interval = max(10.0, float(os.getenv("GAMEAGENT_LEARNING_INTERVAL_SECONDS", "60")))
        while True:
            await asyncio.sleep(interval)
            if any(
                any(not job.done() for job in worker_bridge.jobs.values())
                or (worker_bridge.gm_job is not None and not worker_bridge.gm_job.done())
                for worker_bridge in bridges.values()
            ):
                learning_status = learning_status.model_copy(
                    update={
                        "state": "waiting_for_idle",
                        "detail": "Active production work has priority.",
                    }
                )
                continue
            learning_status = learning_status.model_copy(
                update={"state": "running", "last_started_at": timestamp(), "detail": None}
            )
            failure: str | None = None
            knowledge_report: KnowledgeMaintenanceReport | None = None
            try:
                knowledge_report = await asyncio.to_thread(knowledge.maintain)
            except Exception as error:
                failure = str(error) or type(error).__name__
                logger.exception("Global knowledge maintenance failed")
            for project_store in list(registry.stores.values()):
                try:
                    await asyncio.to_thread(project_store.distill_experience)
                except Exception as error:
                    failure = str(error) or type(error).__name__
                    logger.exception(
                        "Local experience maintenance failed for %s", project_store.root
                    )
            learning_status = learning_status.model_copy(
                update={
                    "state": "failed" if failure else "idle",
                    "last_completed_at": timestamp(),
                    "detail": failure,
                    "knowledge_report": knowledge_report,
                }
            )

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        for worker_bridge in bridges.values():
            await worker_bridge.recover()
        watcher = asyncio.create_task(watch_projects())
        maintenance = (
            asyncio.create_task(maintain_knowledge())
            if os.getenv("GAMEAGENT_BACKGROUND_LEARNING") == "1"
            else None
        )
        try:
            yield
        finally:
            watcher.cancel()
            if maintenance is not None:
                maintenance.cancel()
                await asyncio.gather(maintenance, return_exceptions=True)
            await asyncio.gather(watcher, return_exceptions=True)
            await asyncio.gather(*(worker_bridge.close() for worker_bridge in bridges.values()))

    app = FastAPI(title="Game Agent Network", version="0.12.0", lifespan=lifespan)
    app.state.registry = registry

    @app.get("/learning-status", response_model=LearningMaintenanceStatus)
    async def learning_status_route() -> LearningMaintenanceStatus:
        return learning_status

    @app.post("/knowledge-maintenance-run", response_model=KnowledgeMaintenanceReport)
    async def knowledge_maintenance_run() -> KnowledgeMaintenanceReport:
        nonlocal learning_status
        learning_status = learning_status.model_copy(
            update={"state": "running", "last_started_at": timestamp(), "detail": None}
        )
        try:
            report = await asyncio.to_thread(knowledge.maintain)
        except Exception as error:
            learning_status = learning_status.model_copy(
                update={
                    "state": "failed",
                    "last_completed_at": timestamp(),
                    "detail": str(error) or type(error).__name__,
                }
            )
            raise
        learning_status = learning_status.model_copy(
            update={
                "state": "idle",
                "last_completed_at": timestamp(),
                "detail": None,
                "knowledge_report": report,
            }
        )
        return report

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

    @app.get("/knowledge-catalog", response_model=KnowledgeCatalog)
    def knowledge_catalog() -> KnowledgeCatalog:
        return knowledge.catalog()

    @app.post("/pack-candidate", response_model=ExpertisePack)
    def pack_candidate(command: PackCandidateCommand) -> ExpertisePack:
        return knowledge.propose_pack(command.pack)

    @app.post("/pack-build", response_model=ExpertisePack)
    async def pack_build(command: PackBuildCommand) -> ExpertisePack:
        return await bridge().build_expertise(command, knowledge)

    @app.post("/pack-audition-run", response_model=PackAudition)
    async def pack_audition_run(command: PackAutomatedAuditionCommand) -> PackAudition:
        return await bridge().audition_expertise(command, knowledge)

    @app.post("/pack-audition", response_model=PackAudition)
    def pack_audition(command: PackAuditionCommand) -> PackAudition:
        return knowledge.record_audition(command)

    @app.post("/pack-review", response_model=PackReview)
    def pack_review(command: PackReviewCommand) -> PackReview:
        return knowledge.review_pack(command)

    @app.post("/pack-lifecycle", response_model=PackLifecycleRecord)
    def pack_lifecycle(command: PackLifecycleCommand) -> PackLifecycleRecord:
        return knowledge.set_lifecycle(command)

    @app.get("/agent-knowledge", response_model=AgentKnowledgeCatalog)
    def agent_knowledge() -> AgentKnowledgeCatalog:
        snapshot = registry.current.snapshot()
        assigned_tasks: dict[str, TaskContract] = {}
        for plan in snapshot.plans:
            for assignment in plan.assignments:
                if assignment.agent is not None:
                    task = next(
                        (item for item in snapshot.tasks if item.task_id == assignment.task_id),
                        None,
                    )
                    if task is not None:
                        assigned_tasks[assignment.agent.agent_id] = task
        profiles: list[AgentKnowledgeProfile] = []
        for agent in bridge().roster():
            task = assigned_tasks.get(agent.agent_id)
            task_id = task.task_id if task is not None else f"profile-{agent.agent_id}"
            task_text = (
                " ".join(
                    [
                        task.title,
                        task.objective,
                        *task.deliverables,
                        *task.constraints,
                    ]
                )
                if task is not None
                else " ".join(
                    [
                        snapshot.project.project.name,
                        agent.description,
                        *agent.capabilities,
                    ]
                )
            )
            packet = knowledge.router.assemble(
                project_id=snapshot.project.project.id,
                task_id=task_id,
                task_text=task_text,
                capability_ids=(
                    task.required_capabilities if task is not None else agent.capabilities
                ),
                agent=agent,
                intelligence=snapshot.intelligence,
                project_engine=(snapshot.project.engine.type if snapshot.project.engine else None),
                experience=snapshot.experience_lessons,
                research=snapshot.research_records,
            )
            selected_pack_ids = {item.pack_id for item in packet.expertise_packs}
            methods = packet.methods
            observations = [
                item for item in snapshot.experience_observations if item.agent_id == agent.agent_id
            ]

            def performance(
                subject: str,
                records: list[ExperienceObservation],
                *,
                pack: bool = False,
            ) -> KnowledgePerformanceSummary:
                matching = [
                    item
                    for item in records
                    if (
                        subject in {ref.pack_id for ref in item.expertise_packs}
                        if pack
                        else subject in item.method_ids
                    )
                ]
                return KnowledgePerformanceSummary(
                    subject=subject,
                    task_count=len({item.task_id for item in matching}),
                    passed_count=sum(item.outcome == "passed" for item in matching),
                    failed_count=sum(item.outcome == "failed" for item in matching),
                    inconclusive_count=sum(item.outcome == "inconclusive" for item in matching),
                )

            profiles.append(
                AgentKnowledgeProfile(
                    agent_id=agent.agent_id,
                    qualification_state=(
                        "expertise_available"
                        if selected_pack_ids
                        and set(agent.required_expertise_pack_ids) <= selected_pack_ids
                        else "missing_required_expertise"
                    ),
                    required_pack_ids=agent.required_expertise_pack_ids,
                    resolved_packs=packet.expertise_packs,
                    methods=methods,
                    packet=packet,
                    recorded_packets=[
                        assessment.knowledge_packet
                        for assessment in (
                            snapshot.onboarding.assessments if snapshot.onboarding else []
                        )
                        if assessment.knowledge_packet is not None
                        and assessment.knowledge_packet.agent_id == agent.agent_id
                    ]
                    + [
                        worker.knowledge_packet
                        for worker in snapshot.workers
                        if worker.knowledge_packet is not None
                        and worker.knowledge_packet.agent_id == agent.agent_id
                    ],
                    method_performance=[
                        performance(method_id, observations)
                        for method_id in sorted(
                            {
                                item
                                for observation in observations
                                for item in observation.method_ids
                            }
                        )
                    ],
                    pack_performance=[
                        performance(pack_id, observations, pack=True)
                        for pack_id in sorted(
                            {
                                ref.pack_id
                                for observation in observations
                                for ref in observation.expertise_packs
                            }
                        )
                    ],
                )
            )
        return AgentKnowledgeCatalog(profiles=profiles)

    @app.post("/research-run", response_model=WorldResearch)
    def research_run(command: ResearchCommand) -> WorldResearch:
        project_store = registry.current
        snapshot = project_store.snapshot()
        task = next((item for item in snapshot.tasks if item.task_id == command.task_id), None)
        require(task is not None, "task_not_found", command.task_id)
        assert task is not None
        return project_store.record_research(research_source(command, task, project_store.root))

    @app.post("/learning-run", response_model=ProjectSnapshot)
    def learning_run() -> ProjectSnapshot:
        return registry.current.distill_experience()

    @app.post("/lesson-review", response_model=ExperienceLesson)
    def lesson_review(command: LessonReviewCommand) -> ExperienceLesson:
        return registry.current.review_lesson(command)

    @app.post("/lesson-promote", response_model=GlobalExperience)
    def lesson_promote(command: LessonPromotionCommand) -> GlobalExperience:
        snapshot = registry.current.snapshot()
        lesson = next(
            (item for item in snapshot.experience_lessons if item.lesson_id == command.lesson_id),
            None,
        )
        require(lesson is not None, "lesson_not_found", command.lesson_id)
        assert lesson is not None
        return knowledge.promote_lesson(
            command, lesson, snapshot.experience_observations, snapshot.project.project.name
        )

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

    @app.get("/providers", response_model=ProviderRegistry)
    def providers() -> ProviderRegistry:
        return build_provider_registry(registry.current, credentials, adapters)

    @app.post("/provider-configure", response_model=Provider)
    def provider_configure(command: ProviderConfigureCommand) -> Provider:
        return registry.current.configure_provider(command)

    @app.post("/provider-disable", response_model=Provider)
    def provider_disable(command: ProviderDisableCommand) -> Provider:
        return registry.current.disable_provider(command)

    @app.post("/provider-credential", response_model=ProviderCredentialStatus)
    def provider_credential(command: ProviderCredentialCommand) -> ProviderCredentialStatus:
        provider = next(
            (
                item
                for item in registry.current.snapshot().providers
                if item.provider_id == command.provider_id
            ),
            None,
        )
        require(provider is not None, "provider_not_found", command.provider_id)
        assert provider is not None
        credentials.set(credential_key(provider), command.secret.get_secret_value())
        return ProviderCredentialStatus(provider_id=provider.provider_id, configured=True)

    @app.post("/provider-approve", response_model=SpendApproval)
    def provider_approve(command: SpendApprovalCommand) -> SpendApproval:
        return registry.current.approve_spend(command)

    @app.post("/provider-invoke", response_model=ProviderInvocationResult)
    async def provider_invoke(command: ProviderInvokeCommand) -> ProviderInvocationResult:
        return await PaidProviderGateway(registry.current, credentials, adapters).invoke(command)

    @app.get("/production-domains", response_model=ProductionDomainCatalog)
    def production_domains() -> ProductionDomainCatalog:
        return ProductionDomainCatalog(
            domains=domain_catalog(),
            tools=tool_catalog(),
            inspections=registry.current.snapshot().production_domain_inspections,
        )

    @app.post("/production-domain-run", response_model=ProductionDomainInspection)
    def production_domain_run(
        command: ProductionDomainRunCommand,
    ) -> ProductionDomainInspection:
        snapshot = registry.current.snapshot()
        inspection_id = f"domain-inspection-{command.request_id}"
        existing = next(
            (
                item
                for item in snapshot.production_domain_inspections
                if item.inspection_id == inspection_id
            ),
            None,
        )
        if existing is not None:
            require(
                existing.task_id == command.task_id and existing.domain_id == command.domain_id,
                "request_id_conflict",
                command.request_id,
            )
            return existing
        require(command.domain_id in DOMAINS_BY_ID, "unknown_production_domain", command.domain_id)
        task = next((item for item in snapshot.tasks if item.task_id == command.task_id), None)
        require(task is not None, "task_not_found", command.task_id)
        assert task is not None
        inspection, evidence, evaluation = inspect_domain(
            registry.current.root,
            task,
            command.domain_id,
            command.request_id,
            timestamp(),
        )
        return registry.current.record_domain_inspection(
            command.request_id,
            inspection,
            evidence,
            evaluation,
        )

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
                "phase": "12",
                "error": "workspace_watcher_failed",
                "detail": "; ".join(
                    f"{root}: {detail}" for root, detail in watcher_failures.items()
                ),
            }
        return {"status": "ready", "phase": "12"}

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
