import json
from pathlib import Path

import pytest

from gameagent.constitution import ConstitutionError, validate_model_routing
from gameagent.local_models import (
    CatalogFamily,
    CatalogSnapshot,
    LocalModelExpert,
    OllamaAdapter,
    OllamaLibraryAdapter,
)
from gameagent.models.api import ModelEnvironment, TaskProposal
from gameagent.models.contracts import (
    GraphicsDevice,
    LocalHardwareInventory,
    LocalModel,
    LocalModelInventory,
    ModelRouteCandidate,
    ModelRoutingRecord,
    Project,
)
from gameagent.projects import ProjectStore, initialize

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]
NOW = "2026-09-08T12:00:00Z"
DIGEST = "d" * 64


def hardware() -> LocalHardwareInventory:
    return LocalHardwareInventory(
        machine_id="local-workstation",
        captured_at=NOW,
        operating_system="Windows 11",
        cpu="Test CPU",
        physical_core_count=8,
        logical_core_count=16,
        ram_bytes=32 * 1024**3,
        graphics=[
            GraphicsDevice(
                name="Test GPU",
                vendor="nvidia",
                memory_bytes=12 * 1024**3,
            )
        ],
    )


def model() -> LocalModel:
    return LocalModel(
        name="qwen-test:8b",
        digest=DIGEST,
        size_bytes=6 * 1024**3,
        modified_at=NOW,
        parameter_size="8B",
        quantization_level="Q4_K_M",
        context_limit=32768,
        modalities=["text", "image"],
        tool_support=True,
        fits_memory=True,
    )


class FakeOllama(OllamaAdapter):
    def __init__(self) -> None:
        super().__init__("http://ollama.test")

    def inventory(
        self, hardware: LocalHardwareInventory, now: str | None = None
    ) -> LocalModelInventory:
        return LocalModelInventory(
            state="available",
            version="1.0.0",
            endpoint="http://ollama.test",
            inspected_at=now or NOW,
            models=[model()],
            detail="Ollama responded with 1 installed model",
        )

    def generate(self, model: str, prompt: str) -> dict[str, object]:
        return {
            "response": "",
            "thinking": json.dumps(
                {
                    "summary": "The contract is bounded and inspectable.",
                    "risks": ["Runtime behavior remains unverified"],
                    "next_steps": ["Run the required deterministic gate"],
                }
            ),
            "prompt_eval_count": 80,
            "eval_count": 40,
        }


class InspectableOllama(OllamaAdapter):
    def __init__(self) -> None:
        super().__init__("http://ollama.test")

    def _json(self, path: str, payload=None):
        if path == "/api/version":
            return {"version": "1.0.0"}
        if path == "/api/tags":
            return {
                "models": [
                    {
                        "name": "qwen-test:8b",
                        "digest": DIGEST,
                        "size": 6 * 1024**3,
                        "modified_at": NOW,
                        "details": {
                            "parameter_size": "8B",
                            "quantization_level": "Q4_K_M",
                        },
                    }
                ]
            }
        assert path == "/api/show" and payload == {"model": "qwen-test:8b"}
        return {
            "capabilities": ["completion", "vision", "tools"],
            "model_info": {"qwen.context_length": 32768},
        }


class FakeLibrary(OllamaLibraryAdapter):
    def __init__(self) -> None:
        super().__init__("https://ollama.test/library")

    def inspect(self, now: str | None = None) -> CatalogSnapshot:
        return CatalogSnapshot(
            state="live",
            url=self.url,
            checked_at=now or NOW,
            sha256="a" * 64,
            families=(
                CatalogFamily(
                    name="qwen-test",
                    description="A general instruction model.",
                    tags=("tools", "8b"),
                    source_url="https://ollama.test/library/qwen-test",
                ),
                CatalogFamily(
                    name="qwen-coder",
                    description="A coding-focused model for agentic software engineering.",
                    tags=("tools", "thinking", "7b", "14b"),
                    source_url="https://ollama.test/library/qwen-coder",
                ),
            ),
            detail="Checked 2 Ollama library families",
        )


@pytest.fixture
def store(tmp_path: Path) -> ProjectStore:
    initialize(tmp_path, Project.model_validate(PROFILE))
    project = ProjectStore(tmp_path, max_segment_bytes=1)
    project.propose(
        TaskProposal(
            request_id="model-task",
            title="Inspect project architecture",
            objective="Explain the repository boundaries with cited constraints",
            required_capabilities=["project_analysis"],
            deliverables=["A structured analysis"],
        )
    )
    return project


def test_ollama_inventory_records_capabilities_and_memory_fit() -> None:
    inventory = InspectableOllama().inventory(hardware(), NOW)
    assert inventory.state == "available"
    assert inventory.models[0].modalities == ["text", "image"]
    assert inventory.models[0].tool_support is True
    assert inventory.models[0].context_limit == 32768
    assert inventory.models[0].fits_memory is True


def test_ollama_library_parser_discovers_installable_models() -> None:
    content = """
    <li><a href="/library/qwen-coder"><p class="max-w-lg">Agentic coding model.</p>
    <span class="inline-flex">tools</span><span class="inline-flex">7b</span>
    <span class="inline-flex">14b</span></a></li>
    <li><a href="/library/cloud-only"><p class="max-w-lg">Remote only.</p>
    <span class="inline-flex">cloud</span></a></li>
    """
    families = OllamaLibraryAdapter.parse(content, "https://ollama.test/library")
    assert [family.name for family in families] == ["qwen-coder"]
    assert families[0].tags == ("tools", "7b", "14b")
    assert families[0].source_url == "https://ollama.test/library/qwen-coder"


def test_expert_can_recommend_an_uninstalled_hardware_task_fit(store: ProjectStore) -> None:
    expert = LocalModelExpert(FakeOllama(), FakeLibrary())
    recommendation = expert.recommend(store.snapshot().tasks[-1], "discover-a", NOW)
    assert recommendation.action == "install"
    assert recommendation.recommended_model_name == "qwen-coder:7b"
    assert recommendation.installed is False
    assert recommendation.install_command == "ollama pull qwen-coder:7b"
    assert recommendation.catalog_state == "live"
    assert recommendation.catalog_sha256 == "a" * 64
    assert recommendation.candidate is not None
    assert recommendation.candidate.source_url.endswith("/qwen-coder")
    assert any(candidate.installed for candidate in recommendation.alternatives)


def test_benchmark_writes_content_addressed_artifact_and_replays(store: ProjectStore) -> None:
    expert = LocalModelExpert(FakeOllama())
    task = store.snapshot().tasks[-1]
    benchmark = expert.benchmark(store.root, task, "local-a", None)
    assert benchmark.result == "passed"
    assert benchmark.contract_score == 1
    assert benchmark.output_channel == "thinking"
    assert benchmark.response is not None
    artifact = store.root / benchmark.response.uri
    assert artifact.is_file()
    store.record_model_benchmark(benchmark)
    assert store.record_model_benchmark(benchmark) == benchmark
    assert ProjectStore(store.root).snapshot().model_benchmarks == [benchmark]


def test_router_prefers_qualified_local_and_explains_paid_boundary(
    store: ProjectStore,
) -> None:
    expert = LocalModelExpert(FakeOllama())
    task = store.snapshot().tasks[-1]
    benchmark = expert.benchmark(store.root, task, "route-benchmark", None)
    environment = ModelEnvironment(hardware=hardware(), models=FakeOllama().inventory(hardware()))
    routing = expert.route(task, "route-a", environment, [benchmark], True, "normal")
    assert routing.selected_route == "local_ollama"
    assert "task-specific benchmark passed" in routing.reason
    paid = next(candidate for candidate in routing.candidates if candidate.route == "paid_provider")
    assert paid.viable is False
    assert "Phase 9" in paid.reason
    store.record_model_benchmark(benchmark)
    store.record_model_routing(routing)
    assert ProjectStore(store.root).snapshot().model_routing_records == [routing]


def test_router_chooses_codex_without_qualified_local_evidence(store: ProjectStore) -> None:
    expert = LocalModelExpert(FakeOllama())
    task = store.snapshot().tasks[-1]
    environment = ModelEnvironment(hardware=hardware(), models=FakeOllama().inventory(hardware()))
    routing = expert.route(task, "route-codex", environment, [], True, "low")
    assert routing.selected_route == "codex_authenticated"
    assert "no local model has qualifying" in routing.reason


def test_selected_route_must_be_a_viable_candidate() -> None:
    candidate = ModelRouteCandidate(
        route="paid_provider",
        viable=False,
        expected_quality="unknown",
        confidence=0,
        expected_external_cost_cents=None,
        expected_external_cost_avoided_cents=0,
        reason="No verified provider cap",
    )
    record = ModelRoutingRecord(
        routing_id="routing-invalid",
        project_id="project-a",
        task_id="task-a",
        selected_route="paid_provider",
        candidates=[
            candidate,
            candidate.model_copy(update={"route": "local_ollama"}),
            candidate.model_copy(update={"route": "codex_authenticated"}),
        ],
        reason="Invalid selection",
        created_at=NOW,
    )
    with pytest.raises(ConstitutionError, match="routing-invalid"):
        validate_model_routing(record)
