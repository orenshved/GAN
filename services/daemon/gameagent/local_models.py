"""Local hardware/model inspection, Ollama benchmarking, and explainable routing."""

import hashlib
import html
import json
import os
import platform
import re
import shutil
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal, cast
from urllib.error import URLError
from urllib.request import Request, urlopen

from gameagent.constitution import require
from gameagent.models.api import ModelEnvironment
from gameagent.models.contracts import (
    GraphicsDevice,
    LocalHardwareInventory,
    LocalModel,
    LocalModelInventory,
    LocalModelRecommendation,
    ModelBenchmark,
    ModelCatalogCandidate,
    ModelRoute,
    ModelRouteCandidate,
    ModelRoutingRecord,
    SourceRef,
    TaskContract,
)


def _timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _utc(value: str) -> str:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _safe_digest(value: str) -> str:
    candidate = value.removeprefix("sha256:").lower()
    if len(candidate) == 64 and all(character in "0123456789abcdef" for character in candidate):
        return candidate
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _count(value: object) -> int:
    return value if isinstance(value, int) and value >= 0 else 0


def _plain_text(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def _parameter_billions(value: str) -> float | None:
    match = re.fullmatch(r"(?i)(\d+(?:\.\d+)?)([bm])", value.strip())
    if match is None:
        return None
    amount = float(match.group(1))
    return amount / 1000 if match.group(2).lower() == "m" else amount


def _estimated_model_bytes(parameter_size: str) -> int:
    billions = _parameter_billions(parameter_size) or 0
    # Q4 weights plus runtime overhead. This is deliberately conservative and
    # remains an estimate until Ollama reports the actual pulled artifact size.
    return round(billions * 0.75 * 1024**3)


@dataclass(frozen=True)
class CatalogFamily:
    name: str
    description: str
    tags: tuple[str, ...]
    source_url: str


@dataclass(frozen=True)
class CatalogSnapshot:
    state: Literal["live", "unavailable"]
    url: str
    checked_at: str
    sha256: str | None
    families: tuple[CatalogFamily, ...]
    detail: str


class OllamaLibraryAdapter:
    """Read the public Ollama library without coupling discovery to installed models."""

    def __init__(self, url: str, timeout_seconds: float = 12) -> None:
        self.url = url
        self.timeout_seconds = timeout_seconds

    @classmethod
    def from_environment(cls) -> "OllamaLibraryAdapter":
        return cls(os.getenv("GAMEAGENT_OLLAMA_LIBRARY_URL", "https://ollama.com/library"))

    @staticmethod
    def parse(content: str, base_url: str) -> tuple[CatalogFamily, ...]:
        families: list[CatalogFamily] = []
        for block in re.findall(r"<li\b[^>]*>(.*?)</li>", content, flags=re.DOTALL):
            name_match = re.search(r'href="/library/([^"?#]+)"', block)
            if name_match is None:
                continue
            name = html.unescape(name_match.group(1)).strip()
            description_match = re.search(
                r'<p\b[^>]*class="[^"]*max-w-lg[^"]*"[^>]*>(.*?)</p>',
                block,
                flags=re.DOTALL,
            )
            badges = tuple(
                _plain_text(value).lower()
                for value in re.findall(
                    r'<span\b[^>]*class="[^"]*inline-flex[^"]*"[^>]*>(.*?)</span>',
                    block,
                    flags=re.DOTALL,
                )
                if _plain_text(value)
            )
            if not any(_parameter_billions(value) is not None for value in badges):
                continue
            families.append(
                CatalogFamily(
                    name=name,
                    description=(
                        _plain_text(description_match.group(1))
                        if description_match is not None
                        else "Ollama library model"
                    ),
                    tags=badges,
                    source_url=f"{base_url.rstrip('/')}/{name}",
                )
            )
        return tuple(families)

    def inspect(self, now: str | None = None) -> CatalogSnapshot:
        checked_at = now or _timestamp()
        try:
            request = Request(
                self.url,
                headers={"Accept": "text/html", "User-Agent": "GameAgentNetwork/0.11"},
                method="GET",
            )
            with urlopen(request, timeout=self.timeout_seconds) as response:  # noqa: S310
                payload = response.read()
            content = payload.decode("utf-8")
            base_url = self.url.split("/library", 1)[0] + "/library"
            families = self.parse(content, base_url)
            if not families:
                raise RuntimeError("Ollama library returned no installable model families")
            return CatalogSnapshot(
                state="live",
                url=self.url,
                checked_at=checked_at,
                sha256=hashlib.sha256(payload).hexdigest(),
                families=families,
                detail=f"Checked {len(families)} Ollama library families",
            )
        except (OSError, URLError, TimeoutError, UnicodeError, RuntimeError) as error:
            return CatalogSnapshot(
                state="unavailable",
                url=self.url,
                checked_at=checked_at,
                sha256=None,
                families=(),
                detail=f"Ollama library unavailable: {error}",
            )


def _windows_inventory() -> tuple[str, int | None, int | None, list[GraphicsDevice]]:
    executable = shutil.which("powershell") or shutil.which("pwsh")
    if executable is None:
        return platform.processor() or "Unknown CPU", None, None, []
    script = (
        "$cpu=Get-CimInstance Win32_Processor | Select-Object -First 1;"
        "$system=Get-CimInstance Win32_ComputerSystem;"
        "$gpus=@(Get-CimInstance Win32_VideoController | ForEach-Object {"
        "[pscustomobject]@{name=$_.Name;memory_bytes=[int64]$_.AdapterRAM;"
        "driver_version=$_.DriverVersion}});"
        "[pscustomobject]@{cpu=$cpu.Name;physical_cores=$cpu.NumberOfCores;"
        "ram_bytes=[int64]$system.TotalPhysicalMemory;gpus=$gpus} | "
        "ConvertTo-Json -Depth 4 -Compress"
    )
    try:
        completed = subprocess.run(
            [executable, "-NoProfile", "-NonInteractive", "-Command", script],
            check=True,
            capture_output=True,
            text=True,
            timeout=8,
        )
        value = json.loads(completed.stdout)
        devices = [
            GraphicsDevice(
                name=item["name"],
                vendor=("nvidia" if "nvidia" in item["name"].lower() else "amd"),
                memory_bytes=item.get("memory_bytes"),
                driver_version=item.get("driver_version"),
            )
            for item in value.get("gpus", [])
        ]
        return value["cpu"], value.get("physical_cores"), value.get("ram_bytes"), devices
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return platform.processor() or "Unknown CPU", None, None, []


def _nvidia_memory() -> dict[str, int]:
    executable = shutil.which("nvidia-smi")
    if executable is None:
        return {}
    try:
        completed = subprocess.run(
            [
                executable,
                "--query-gpu=name,memory.total",
                "--format=csv,noheader,nounits",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=5,
        )
        result: dict[str, int] = {}
        for line in completed.stdout.splitlines():
            name, memory_mib = (part.strip() for part in line.rsplit(",", 1))
            result[name] = int(memory_mib) * 1024 * 1024
        return result
    except (OSError, subprocess.SubprocessError, ValueError):
        return {}


def hardware_inventory(now: str | None = None) -> LocalHardwareInventory:
    cpu = platform.processor() or platform.machine() or "Unknown CPU"
    physical: int | None = None
    ram: int | None = None
    graphics: list[GraphicsDevice] = []
    if platform.system() == "Windows":
        cpu, physical, ram, graphics = _windows_inventory()
    elif Path("/proc/meminfo").is_file():
        for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
            if line.startswith("MemTotal:"):
                ram = int(line.split()[1]) * 1024
                break
    nvidia = _nvidia_memory()
    graphics = [
        device.model_copy(update={"memory_bytes": nvidia.get(device.name, device.memory_bytes)})
        for device in graphics
    ]
    return LocalHardwareInventory(
        machine_id="local-workstation",
        captured_at=now or _timestamp(),
        operating_system=f"{platform.system()} {platform.release()}",
        cpu=cpu.strip(),
        physical_core_count=physical,
        logical_core_count=os.cpu_count() or 0,
        ram_bytes=ram,
        graphics=graphics,
    )


class OllamaAdapter:
    def __init__(
        self,
        endpoint: str | None,
        timeout_seconds: float = 5,
        benchmark_timeout_seconds: float = 120,
    ) -> None:
        self.endpoint = endpoint.rstrip("/") if endpoint else None
        self.timeout_seconds = timeout_seconds
        self.benchmark_timeout_seconds = benchmark_timeout_seconds

    @classmethod
    def from_environment(cls) -> "OllamaAdapter":
        return cls(
            os.getenv("GAMEAGENT_OLLAMA_URL") or os.getenv("OLLAMA_HOST"),
            benchmark_timeout_seconds=float(
                os.getenv("GAMEAGENT_OLLAMA_BENCHMARK_TIMEOUT_SECONDS", "120")
            ),
        )

    def _json(
        self,
        path: str,
        payload: dict[str, object] | None = None,
        timeout_seconds: float | None = None,
    ) -> dict[str, object]:
        require(
            self.endpoint is not None,
            "ollama_not_configured",
            "Set GAMEAGENT_OLLAMA_URL to the local Ollama endpoint",
        )
        assert self.endpoint is not None
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.endpoint}{path}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="GET" if body is None else "POST",
        )
        try:
            with urlopen(  # noqa: S310
                request, timeout=timeout_seconds or self.timeout_seconds
            ) as response:
                value = json.loads(response.read())
        except (OSError, URLError, TimeoutError, ValueError) as error:
            raise RuntimeError(f"Ollama unavailable: {error}") from error
        if not isinstance(value, dict):
            raise RuntimeError("Ollama returned a non-object response")
        return value

    def _show(self, name: str) -> dict[str, object]:
        return self._json("/api/show", {"model": name})

    def inventory(
        self, hardware: LocalHardwareInventory, now: str | None = None
    ) -> LocalModelInventory:
        inspected_at = now or _timestamp()
        endpoint = self.endpoint or "not-configured"
        if self.endpoint is None:
            return LocalModelInventory(
                state="unavailable",
                endpoint=endpoint,
                inspected_at=inspected_at,
                detail="Ollama endpoint is not configured",
            )
        try:
            version = str(self._json("/api/version").get("version") or "unknown")
            items = self._json("/api/tags").get("models", [])
            if not isinstance(items, list):
                raise RuntimeError("Ollama model inventory is malformed")
            names = [str(item["name"]) for item in items if isinstance(item, dict)]
            with ThreadPoolExecutor(max_workers=min(4, max(1, len(names)))) as executor:
                shown = dict(zip(names, executor.map(self._show, names), strict=True))
            capacity = max(
                [hardware.ram_bytes or 0]
                + [device.memory_bytes or 0 for device in hardware.graphics]
            )
            models: list[LocalModel] = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = str(item["name"])
                detail_value = item.get("details")
                detail: dict[str, object] = (
                    cast(dict[str, object], detail_value) if isinstance(detail_value, dict) else {}
                )
                show = shown[name]
                capabilities = show.get("capabilities", [])
                if not isinstance(capabilities, list):
                    capabilities = []
                info = show.get("model_info", {})
                context = (
                    next(
                        (
                            int(value)
                            for key, value in info.items()
                            if str(key).endswith(".context_length") and isinstance(value, int)
                        ),
                        None,
                    )
                    if isinstance(info, dict)
                    else None
                )
                size = int(item.get("size", 0))
                modalities: list[Literal["text", "image", "audio"]] = ["text"]
                if "vision" in capabilities:
                    modalities.append("image")
                if "audio" in capabilities:
                    modalities.append("audio")
                models.append(
                    LocalModel(
                        name=name,
                        digest=_safe_digest(str(item.get("digest", name))),
                        size_bytes=size,
                        modified_at=_utc(str(item["modified_at"])),
                        parameter_size=(
                            str(detail.get("parameter_size"))
                            if detail.get("parameter_size")
                            else None
                        ),
                        quantization_level=(
                            str(detail.get("quantization_level"))
                            if detail.get("quantization_level")
                            else None
                        ),
                        context_limit=context,
                        modalities=modalities,
                        tool_support="tools" in capabilities,
                        fits_memory=capacity > 0 and size <= int(capacity * 0.8),
                    )
                )
            return LocalModelInventory(
                state="available",
                version=version,
                endpoint=endpoint,
                inspected_at=inspected_at,
                models=sorted(models, key=lambda model: (not model.fits_memory, model.size_bytes)),
                detail=f"Ollama responded with {len(models)} installed model(s)",
            )
        except RuntimeError as error:
            return LocalModelInventory(
                state="unavailable",
                endpoint=endpoint,
                inspected_at=inspected_at,
                detail=str(error),
            )

    def generate(self, model: str, prompt: str) -> dict[str, object]:
        return self._json(
            "/api/generate",
            {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "think": False,
                "format": {
                    "type": "object",
                    "required": ["summary", "risks", "next_steps"],
                    "properties": {
                        "summary": {"type": "string"},
                        "risks": {"type": "array", "items": {"type": "string"}},
                        "next_steps": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "options": {"temperature": 0, "num_predict": 220},
            },
            self.benchmark_timeout_seconds,
        )


class LocalModelExpert:
    def __init__(
        self,
        adapter: OllamaAdapter,
        library: OllamaLibraryAdapter | None = None,
    ) -> None:
        self.adapter = adapter
        self.library = library or OllamaLibraryAdapter.from_environment()

    @classmethod
    def from_environment(cls) -> "LocalModelExpert":
        return cls(OllamaAdapter.from_environment(), OllamaLibraryAdapter.from_environment())

    def inspect(self, now: str | None = None) -> ModelEnvironment:
        captured_at = now or _timestamp()
        hardware = hardware_inventory(captured_at)
        return ModelEnvironment(
            hardware=hardware,
            models=self.adapter.inventory(hardware, captured_at),
        )

    @staticmethod
    def _memory_tier(
        estimated_bytes: int, hardware: LocalHardwareInventory
    ) -> Literal["full_gpu", "hybrid", "system", "unfit"]:
        gpu_bytes = max([device.memory_bytes or 0 for device in hardware.graphics], default=0)
        ram_bytes = hardware.ram_bytes or 0
        if gpu_bytes and estimated_bytes <= int(gpu_bytes * 0.8):
            return "full_gpu"
        if gpu_bytes and ram_bytes and estimated_bytes <= int(ram_bytes * 0.72):
            return "hybrid"
        if not gpu_bytes and ram_bytes and estimated_bytes <= int(ram_bytes * 0.72):
            return "system"
        return "unfit"

    @staticmethod
    def _candidate_score(
        family: CatalogFamily,
        parameter_size: str,
        memory_tier: str,
        task: TaskContract,
    ) -> tuple[float, str]:
        task_text = " ".join(
            [task.title, task.objective, *task.required_capabilities, *task.deliverables]
        ).lower()
        model_text = f"{family.name} {family.description}".lower()
        needs_vision = any(
            term in task_text for term in ("image", "vision", "visual", "screenshot", "asset", "ui")
        )
        needs_code = any(
            term in task_text
            for term in (
                "code",
                "coding",
                "implementation",
                "engineering",
                "repository",
                "project_analysis",
                "debug",
            )
        )
        tool_support = "tools" in family.tags
        has_vision = "vision" in family.tags
        score = 0.42
        reasons: list[str] = []
        if tool_support:
            score += 0.14
            reasons.append("tool use")
        if "thinking" in family.tags:
            score += 0.06
            reasons.append("reasoning")
        if needs_vision:
            score += 0.18 if has_vision else -0.24
            reasons.append("vision match" if has_vision else "missing requested vision")
        if needs_code:
            code_match = any(
                term in model_text for term in ("code", "coding", "agentic", "software")
            )
            score += 0.14 if code_match else 0
            if code_match:
                reasons.append("coding/agentic focus")
        memory_adjustment = {
            "full_gpu": 0.16,
            "hybrid": 0.07,
            "system": 0.04,
            "unfit": -0.45,
        }[memory_tier]
        score += memory_adjustment
        reasons.append(memory_tier.replace("_", " "))
        billions = _parameter_billions(parameter_size) or 0
        score += min(billions, 30) / 30 * 0.08
        return max(0, min(round(score, 3), 1)), ", ".join(reasons)

    def recommend(
        self,
        task: TaskContract,
        request_id: str,
        now: str | None = None,
    ) -> LocalModelRecommendation:
        checked_at = now or _timestamp()
        environment = self.inspect(checked_at)
        catalog = self.library.inspect(checked_at)
        if catalog.state == "unavailable":
            return LocalModelRecommendation(
                recommendation_id=f"recommendation-{request_id}",
                project_id=task.project_id,
                task_id=task.task_id,
                required_capability_ids=task.required_capabilities,
                action="no_recommendation",
                catalog_state="unavailable",
                catalog_url=catalog.url,
                catalog_checked_at=checked_at,
                reason=(
                    f"Could not verify installable alternatives. {catalog.detail}. "
                    "Installed models remain available, but no install claim was made."
                ),
            )

        installed_by_family: dict[str, list[LocalModel]] = {}
        for installed in environment.models.models:
            installed_by_family.setdefault(installed.name.split(":", 1)[0], []).append(installed)

        candidates: list[ModelCatalogCandidate] = []
        for family in catalog.families:
            for parameter_size in family.tags:
                parameter_billions = _parameter_billions(parameter_size)
                if parameter_billions is None:
                    continue
                estimated_size = _estimated_model_bytes(parameter_size)
                memory_tier = self._memory_tier(estimated_size, environment.hardware)
                matching_installed = next(
                    (
                        model
                        for model in installed_by_family.get(family.name, [])
                        if model.parameter_size is not None
                        and _parameter_billions(model.parameter_size) is not None
                        and abs(
                            cast(float, _parameter_billions(model.parameter_size))
                            - parameter_billions
                        )
                        <= max(0.6, parameter_billions * 0.08)
                    ),
                    None,
                )
                score, score_reason = self._candidate_score(
                    family, parameter_size, memory_tier, task
                )
                candidates.append(
                    ModelCatalogCandidate(
                        name=(
                            matching_installed.name
                            if matching_installed is not None
                            else f"{family.name}:{parameter_size}"
                        ),
                        family=family.name,
                        parameter_size=parameter_size.upper(),
                        estimated_size_bytes=estimated_size,
                        modalities=(["text", "image"] if "vision" in family.tags else ["text"]),
                        tool_support="tools" in family.tags,
                        thinking_support="thinking" in family.tags,
                        memory_tier=memory_tier,
                        installed=matching_installed is not None,
                        suitability_score=score,
                        source_url=family.source_url,
                        description=family.description,
                        reason=score_reason,
                    )
                )

        ranked = sorted(
            candidates,
            key=lambda candidate: (
                candidate.memory_tier == "unfit",
                -candidate.suitability_score,
                -candidate.estimated_size_bytes,
            ),
        )
        viable = [candidate for candidate in ranked if candidate.memory_tier != "unfit"]
        if not viable:
            return LocalModelRecommendation(
                recommendation_id=f"recommendation-{request_id}",
                project_id=task.project_id,
                task_id=task.task_id,
                required_capability_ids=task.required_capabilities,
                action="no_recommendation",
                alternatives=ranked[:3],
                catalog_state="live",
                catalog_url=catalog.url,
                catalog_checked_at=checked_at,
                catalog_sha256=catalog.sha256,
                reason="The live catalog was checked, but no candidate fits the available memory.",
            )

        best = viable[0]
        best_installed = next((candidate for candidate in viable if candidate.installed), None)
        use_installed = (
            best_installed is not None
            and best.suitability_score <= best_installed.suitability_score + 0.05
        )
        selected = best_installed if use_installed and best_installed is not None else best
        action: Literal["install", "keep_installed", "no_recommendation"] = (
            "keep_installed" if selected.installed else "install"
        )
        install_command = None if selected.installed else f"ollama pull {selected.name}"
        reason = (
            f"Checked the live Ollama library against {task.title} and this machine. "
            f"{selected.name} is the strongest scored fit ({selected.suitability_score:.0%}): "
            f"{selected.reason}. "
            + (
                "It is already installed, so no download is recommended."
                if selected.installed
                else f"It is not installed; review and run `{install_command}` to add it."
            )
        )
        return LocalModelRecommendation(
            recommendation_id=f"recommendation-{request_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            required_capability_ids=task.required_capabilities,
            action=action,
            recommended_model_name=selected.name,
            installed=selected.installed,
            install_command=install_command,
            candidate=selected,
            alternatives=[candidate for candidate in viable if candidate.name != selected.name][:3],
            catalog_state="live",
            catalog_url=catalog.url,
            catalog_checked_at=checked_at,
            catalog_sha256=catalog.sha256,
            reason=reason,
        )

    def benchmark(
        self,
        root: Path,
        task: TaskContract,
        request_id: str,
        model_name: str | None,
    ) -> ModelBenchmark:
        environment = self.inspect()
        viable = [model for model in environment.models.models if model.fits_memory]
        selected = next((model for model in viable if model.name == model_name), None)
        if model_name is None and viable:
            selected = viable[0]
        require(selected is not None, "local_model_unavailable", model_name or "No fitting model")
        assert selected is not None
        prompt = (
            "Complete this representative Game Agent Network analysis contract. "
            "Return only the requested JSON object. Separate observed constraints from guesses.\n"
            f"Task: {task.title}\nOutcome: {task.objective}\n"
            f"Required capabilities: {', '.join(task.required_capabilities)}\n"
            f"Deliverables: {', '.join(task.deliverables)}"
        )
        started = time.perf_counter()
        response = self.adapter.generate(selected.name, prompt)
        latency_ms = round((time.perf_counter() - started) * 1000)
        output_channel: Literal["response", "thinking"] = (
            "response" if response.get("response") else "thinking"
        )
        raw = str(response.get(output_channel) or "")
        parsed: object
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = None
        score = 0.0
        if isinstance(parsed, dict):
            score += (
                0.4 if isinstance(parsed.get("summary"), str) and parsed["summary"].strip() else 0
            )
            score += 0.3 if isinstance(parsed.get("risks"), list) and parsed["risks"] else 0
            score += (
                0.3 if isinstance(parsed.get("next_steps"), list) and parsed["next_steps"] else 0
            )
        result: Literal["passed", "failed", "unavailable"] = "passed" if score >= 0.75 else "failed"
        artifact = json.dumps(
            {
                "model": selected.name,
                "prompt_sha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
                "response": parsed if parsed is not None else raw,
                "output_channel": output_channel,
                "contract_score": score,
            },
            indent=2,
            sort_keys=True,
        ).encode("utf-8")
        digest = hashlib.sha256(artifact).hexdigest()
        relative = Path(".gameagent/evidence/model-router") / f"{digest}.json"
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            with path.open("xb") as handle:
                handle.write(artifact)
        return ModelBenchmark(
            benchmark_id=f"benchmark-{request_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            model_name=selected.name,
            model_digest=selected.digest,
            required_capability_ids=task.required_capabilities,
            prompt_sha256=hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
            response=SourceRef(
                uri=relative.as_posix(),
                media_type="application/json",
                locator="Representative task contract response",
                sha256=digest,
            ),
            output_channel=output_channel,
            result=result,
            contract_score=score,
            latency_ms=latency_ms,
            prompt_tokens=_count(response.get("prompt_eval_count")),
            completion_tokens=_count(response.get("eval_count")),
            summary=(
                "Local model satisfied the representative output contract"
                if result == "passed"
                else "Local model did not satisfy the representative output contract"
            ),
            benchmarked_at=_timestamp(),
        )

    def route(
        self,
        task: TaskContract,
        request_id: str,
        environment: ModelEnvironment,
        benchmarks: list[ModelBenchmark],
        codex_ready: bool,
        urgency: str,
    ) -> ModelRoutingRecord:
        latest = next(
            (
                benchmark
                for benchmark in reversed(benchmarks)
                if benchmark.task_id == task.task_id and benchmark.result == "passed"
            ),
            None,
        )
        local_model = next(
            (
                model
                for model in environment.models.models
                if latest is not None
                and model.name == latest.model_name
                and model.digest == latest.model_digest
                and model.fits_memory
            ),
            None,
        )
        local_viable = environment.models.state == "available" and local_model is not None
        local_quality: Literal["unknown", "low", "medium", "high"] = (
            "high" if latest and latest.contract_score >= 0.9 else "medium" if latest else "unknown"
        )
        local_reason = (
            f"{latest.model_name} passed this task's representative contract benchmark at "
            f"{latest.contract_score:.0%} in {latest.latency_ms} ms and fits available memory"
            if local_viable and latest
            else "No installed, memory-compatible local model has passed a benchmark for this task"
        )
        candidates = [
            ModelRouteCandidate(
                route="deterministic_tool",
                viable=False,
                expected_quality="unknown",
                confidence=1,
                expected_external_cost_cents=0,
                expected_external_cost_avoided_cents=0,
                reason="No deterministic tool advertises the complete task capability contract",
            ),
            ModelRouteCandidate(
                route="local_ollama",
                provider_id="ollama",
                model_name=latest.model_name if latest else None,
                viable=local_viable,
                expected_quality=local_quality,
                confidence=latest.contract_score if latest else 0,
                expected_runtime_ms=latest.latency_ms if latest else None,
                expected_external_cost_cents=0,
                expected_external_cost_avoided_cents=0,
                reason=local_reason,
            ),
            ModelRouteCandidate(
                route="codex_authenticated",
                provider_id="codex",
                viable=codex_ready,
                expected_quality="high",
                confidence=0.85 if codex_ready else 0,
                expected_external_cost_cents=0,
                expected_external_cost_avoided_cents=0,
                reason=(
                    "Authenticated Codex is ready and has no external transaction cost"
                    if codex_ready
                    else "Authenticated Codex is currently unavailable"
                ),
            ),
            ModelRouteCandidate(
                route="paid_provider",
                viable=False,
                expected_quality="unknown",
                confidence=0,
                expected_external_cost_cents=None,
                expected_external_cost_avoided_cents=0,
                reason="Paid execution is unavailable until Phase 9 verifies a provider-side hard cap",
            ),
            ModelRouteCandidate(
                route="wait_for_codex",
                provider_id="codex",
                viable=not local_viable and not codex_ready,
                expected_quality="high",
                confidence=0.75,
                expected_external_cost_cents=0,
                expected_external_cost_avoided_cents=0,
                reason=f"Waiting is allowed at {urgency} urgency when safe execution paths are unavailable",
            ),
        ]
        if local_viable and latest:
            selected_route: ModelRoute = "local_ollama"
            selected_provider = "ollama"
            selected_model = latest.model_name
            reason = (
                f"Selected local Ollama because a task-specific benchmark passed, the model fits "
                f"hardware, text modality is supported, and external cost is zero. {local_reason}."
            )
        elif codex_ready:
            selected_route = "codex_authenticated"
            selected_provider = "codex"
            selected_model = None
            reason = (
                "Selected authenticated Codex because no local model has qualifying task-specific "
                "benchmark evidence; the paid path is structurally unavailable."
            )
        else:
            selected_route = "wait_for_codex"
            selected_provider = "codex"
            selected_model = None
            reason = (
                "Waiting for Codex because local evidence is insufficient and paid execution is "
                "structurally unavailable."
            )
        return ModelRoutingRecord(
            routing_id=f"routing-{request_id}",
            project_id=task.project_id,
            task_id=task.task_id,
            selected_route=selected_route,
            selected_provider_id=selected_provider,
            selected_model_name=selected_model,
            candidates=candidates,
            reason=reason,
            created_at=_timestamp(),
        )
