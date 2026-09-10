"""Read-only, evidence-backed production discipline audits."""

import csv
import hashlib
import io
import json
import os
import struct
import wave
from collections.abc import Callable
from pathlib import Path
from typing import Literal
from xml.etree import ElementTree

from gameagent.models.contracts import (
    Evaluation,
    Evidence,
    EvidenceClass,
    Permissions,
    ProductionDomainDefinition,
    ProductionDomainFinding,
    ProductionDomainInspection,
    ResourcePolicy,
    SourceRef,
    TaskContract,
    ToolDefinition,
)

MAX_DISCOVERED_FILES = 5_000
MAX_RECORDED_FILES = 250
MAX_VALIDATION_BYTES = 32 * 1024 * 1024
IGNORED_PARTS = {
    ".git",
    ".gameagent",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
}

DOMAIN_DEFINITIONS = (
    ProductionDomainDefinition(
        domain_id="gameplay",
        version="1.0.0",
        title="Gameplay",
        description="Inventories readable gameplay implementation surfaces without executing project code.",
        capability_ids=[
            "systems_design",
            "mechanics_design",
            "combat_design",
            "gameplay_engineering",
            "game_ai",
            "physics",
        ],
        tool_ids=["gameplay-source-audit"],
        gate_ids=["gameplay_source_integrity"],
        accepted_extensions=[".gd", ".cs", ".cpp", ".h", ".lua", ".py", ".ts", ".js"],
    ),
    ProductionDomainDefinition(
        domain_id="level_design",
        version="1.0.0",
        title="Level design",
        description="Inventories engine-neutral scene and level assets and validates readable scene structure.",
        capability_ids=["level_design", "encounter_design", "puzzle_design"],
        tool_ids=["level-scene-audit"],
        gate_ids=["level_scene_integrity"],
        accepted_extensions=[".tscn", ".scn", ".unity", ".umap", ".tmx", ".tsx", ".ldtk"],
    ),
    ProductionDomainDefinition(
        domain_id="art",
        version="1.0.0",
        title="Art",
        description="Validates image signatures and records dimensions where the format exposes them safely.",
        capability_ids=[
            "art_direction",
            "concept_art",
            "ui_art",
            "pixel_art",
            "character_art",
            "environment_art",
            "animation",
        ],
        tool_ids=["art-asset-audit"],
        gate_ids=["art_asset_integrity"],
        accepted_extensions=[
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".bmp",
            ".webp",
            ".svg",
            ".psd",
            ".ase",
            ".aseprite",
            ".kra",
        ],
    ),
    ProductionDomainDefinition(
        domain_id="audio",
        version="1.0.0",
        title="Audio",
        description="Validates common audio containers and measures WAV duration, channels, rate, and clipping.",
        capability_ids=[
            "audio_direction",
            "composition",
            "adaptive_music",
            "sound_design",
            "ambience",
            "dialogue_audio",
            "audio_implementation",
            "mixing",
            "mastering",
        ],
        tool_ids=["audio-asset-audit"],
        gate_ids=["audio_asset_integrity"],
        accepted_extensions=[".wav", ".ogg", ".mp3", ".flac", ".aac", ".m4a", ".opus"],
    ),
    ProductionDomainDefinition(
        domain_id="narrative",
        version="1.0.0",
        title="Narrative",
        description="Validates readable narrative and localization source files without inferring story quality.",
        capability_ids=[
            "narrative_design",
            "worldbuilding",
            "dialogue_writing",
            "interactive_dialogue",
            "quest_design",
            "continuity_review",
            "lore_management",
            "localization_ready_writing",
        ],
        tool_ids=["narrative-source-audit"],
        gate_ids=["narrative_source_integrity"],
        accepted_extensions=[
            ".dialogue",
            ".ink",
            ".yarn",
            ".po",
            ".pot",
            ".csv",
            ".json",
            ".txt",
            ".md",
        ],
    ),
)
DOMAINS_BY_ID = {item.domain_id: item for item in DOMAIN_DEFINITIONS}


def domain_catalog() -> list[ProductionDomainDefinition]:
    return list(DOMAIN_DEFINITIONS)


def tool_catalog() -> list[ToolDefinition]:
    return [
        ToolDefinition(
            tool_id=domain.tool_ids[0],
            version="1.0.0",
            capabilities=domain.capability_ids,
            install_state="installed",
            invocation="sdk",
            input_contract="ProductionDomainRunCommand",
            output_contract="ProductionDomainInspection",
            permissions=Permissions(read_project=True, execute_discovered_code="never"),
            health_check="Built-in read-only scanner loaded",
            location="local",
            cost_policy=ResourcePolicy(local_preferred=True, max_external_cost_cents=0),
        )
        for domain in DOMAIN_DEFINITIONS
    ]


def _digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            result.update(chunk)
    return result.hexdigest()


def _discover(root: Path, domain: ProductionDomainDefinition) -> list[Path]:
    extensions = {item.lower() for item in domain.accepted_extensions}
    result: list[Path] = []
    visited = 0
    for directory, names, files in os.walk(root, followlinks=False):
        names[:] = sorted(name for name in names if name not in IGNORED_PARTS)
        for name in sorted(files):
            visited += 1
            if visited > MAX_DISCOVERED_FILES:
                return result
            path = Path(directory) / name
            if path.is_symlink() or path.suffix.lower() not in extensions:
                continue
            relative = path.relative_to(root).as_posix()
            if domain.domain_id == "narrative" and not any(
                token in relative.lower()
                for token in (
                    "dialog",
                    "narrative",
                    "story",
                    "quest",
                    "lore",
                    "local",
                    "translation",
                    "i18n",
                )
            ):
                continue
            result.append(path)
            if len(result) == MAX_RECORDED_FILES:
                return result
    return result


def _read_limited(path: Path) -> bytes:
    if path.stat().st_size > MAX_VALIDATION_BYTES:
        raise ValueError(f"file exceeds {MAX_VALIDATION_BYTES} byte validation limit")
    return path.read_bytes()


def _validate_source(path: Path) -> dict[str, object]:
    body = _read_limited(path)
    text = body.decode("utf-8")
    if not text.strip():
        raise ValueError("source file is empty")
    return {"lines": len(text.splitlines())}


def _validate_level(path: Path) -> dict[str, object]:
    body = _read_limited(path)
    if not body:
        raise ValueError("level asset is empty")
    if path.suffix.lower() in {".tscn", ".tmx", ".tsx", ".unity", ".ldtk"}:
        text = body.decode("utf-8")
        if path.suffix.lower() == ".tscn" and "[gd_scene" not in text:
            raise ValueError("Godot scene header is missing")
        return {
            "lines": len(text.splitlines()),
            "node_markers": text.count("[node "),
            "navigation_markers": text.lower().count("navigation"),
        }
    return {"bytes": len(body)}


def _validate_art(path: Path) -> dict[str, object]:
    body = _read_limited(path)
    suffix = path.suffix.lower()
    if not body:
        raise ValueError("art asset is empty")
    if suffix == ".png":
        if len(body) < 24 or body[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("invalid PNG signature")
        width, height = struct.unpack(">II", body[16:24])
        return {"width": width, "height": height}
    if suffix in {".jpg", ".jpeg"}:
        if not (body.startswith(b"\xff\xd8") and body.endswith(b"\xff\xd9")):
            raise ValueError("invalid JPEG markers")
    elif suffix == ".gif":
        if len(body) < 10 or body[:6] not in {b"GIF87a", b"GIF89a"}:
            raise ValueError("invalid GIF signature")
        width, height = struct.unpack("<HH", body[6:10])
        return {"width": width, "height": height}
    elif suffix == ".bmp":
        if len(body) < 26 or not body.startswith(b"BM"):
            raise ValueError("invalid BMP signature")
        width, height = struct.unpack("<ii", body[18:26])
        return {"width": abs(width), "height": abs(height)}
    elif suffix == ".webp":
        if len(body) < 12 or body[:4] != b"RIFF" or body[8:12] != b"WEBP":
            raise ValueError("invalid WebP signature")
    elif suffix == ".svg":
        root = ElementTree.fromstring(body)
        if not root.tag.lower().endswith("svg"):
            raise ValueError("SVG root element is missing")
    elif suffix == ".psd" and not body.startswith(b"8BPS"):
        raise ValueError("invalid PSD signature")
    return {"bytes": len(body)}


def _wav_peak_ratio(frames: bytes, sample_width: int) -> float | None:
    if sample_width == 1:
        peak = max((abs(value - 128) for value in frames), default=0)
        return peak / 128
    if sample_width == 2:
        count = len(frames) // 2
        samples = struct.unpack(f"<{count}h", frames[: count * 2])
        return max((abs(value) for value in samples), default=0) / 32768
    return None


def _validate_audio(path: Path) -> dict[str, object]:
    body = _read_limited(path)
    suffix = path.suffix.lower()
    if not body:
        raise ValueError("audio asset is empty")
    if suffix == ".wav":
        with wave.open(io.BytesIO(body), "rb") as stream:
            channels = stream.getnchannels()
            sample_rate = stream.getframerate()
            frames = stream.getnframes()
            sample_width = stream.getsampwidth()
            sample = stream.readframes(min(frames, sample_rate * 10))
        if channels < 1 or sample_rate < 1:
            raise ValueError("invalid WAV channel or sample rate")
        peak = _wav_peak_ratio(sample, sample_width)
        return {
            "channels": channels,
            "sample_rate_hz": sample_rate,
            "duration_ms": round(frames * 1000 / sample_rate),
            "sample_width_bytes": sample_width,
            "sample_peak_ratio": peak,
            "sample_clips": peak is not None and peak >= 0.9999,
        }
    signatures = {
        ".ogg": body.startswith(b"OggS"),
        ".opus": body.startswith(b"OggS"),
        ".flac": body.startswith(b"fLaC"),
        ".mp3": body.startswith(b"ID3") or body.startswith(b"\xff\xfb"),
        ".m4a": len(body) >= 12 and body[4:8] == b"ftyp",
        ".aac": body.startswith(b"\xff\xf1") or body.startswith(b"\xff\xf9"),
    }
    if suffix in signatures and not signatures[suffix]:
        raise ValueError(f"invalid {suffix.removeprefix('.').upper()} signature")
    return {"bytes": len(body)}


def _validate_narrative(path: Path) -> dict[str, object]:
    text = _read_limited(path).decode("utf-8")
    if not text.strip():
        raise ValueError("narrative source is empty")
    if path.suffix.lower() == ".json":
        json.loads(text)
    elif path.suffix.lower() == ".csv":
        rows = list(csv.reader(io.StringIO(text)))
        if not rows:
            raise ValueError("narrative CSV contains no rows")
        return {"rows": len(rows), "columns": max(len(row) for row in rows)}
    return {"lines": len(text.splitlines())}


VALIDATORS: dict[str, Callable[[Path], dict[str, object]]] = {
    "gameplay": _validate_source,
    "level_design": _validate_level,
    "art": _validate_art,
    "audio": _validate_audio,
    "narrative": _validate_narrative,
}
EVIDENCE_CLASS: dict[str, EvidenceClass] = {
    "gameplay": "deterministic",
    "level_design": "deterministic",
    "art": "measured",
    "audio": "measured",
    "narrative": "deterministic",
}


def inspect_domain(
    root: Path,
    task: TaskContract,
    domain_id: str,
    request_id: str,
    inspected_at: str,
) -> tuple[ProductionDomainInspection, Evidence, Evaluation]:
    domain = DOMAINS_BY_ID.get(domain_id)
    if domain is None:
        raise ValueError(f"unknown production domain: {domain_id}")
    files = _discover(root, domain)
    records: list[dict[str, object]] = []
    errors: list[tuple[str, str]] = []
    for path in files:
        relative = path.relative_to(root).as_posix()
        try:
            measurements = VALIDATORS[domain_id](path)
            records.append(
                {
                    "path": relative,
                    "size": path.stat().st_size,
                    "sha256": _digest(path),
                    "measurements": measurements,
                }
            )
        except (OSError, UnicodeError, ValueError, wave.Error, ElementTree.ParseError) as error:
            errors.append((relative, str(error)))

    if not files:
        status: Literal["passed", "needs_attention", "not_applicable"] = "not_applicable"
        findings = [
            ProductionDomainFinding(
                finding_id="no-applicable-files",
                severity="warning",
                title="No applicable project files",
                detail="The read-only audit found no files matching this discipline's bounded format catalog.",
            )
        ]
    elif errors:
        status = "needs_attention"
        findings = [
            ProductionDomainFinding(
                finding_id="invalid-files",
                severity="error",
                title="Unreadable or invalid project files",
                detail=f"{len(errors)} of {len(files)} matched files failed structural validation.",
                paths=[item[0] for item in errors[:25]],
            ),
            ProductionDomainFinding(
                finding_id="inventory-recorded",
                severity="info",
                title="Discipline inventory recorded",
                detail=f"{len(records)} structurally readable files were captured with content digests.",
            ),
        ]
    else:
        status = "passed"
        findings = [
            ProductionDomainFinding(
                finding_id="inventory-recorded",
                severity="info",
                title="Discipline inventory recorded",
                detail=f"All {len(records)} matched files were structurally readable and content-addressed.",
            )
        ]

    inspection_id = f"domain-inspection-{request_id}"
    evidence_id = f"evidence-{request_id}-domain"
    evaluation_id = f"evaluation-{request_id}-domain"
    payload = {
        "schema_version": 1,
        "inspection_id": inspection_id,
        "project_id": task.project_id,
        "task_id": task.task_id,
        "domain_id": domain.domain_id,
        "tool_id": domain.tool_ids[0],
        "inspected_at": inspected_at,
        "matched_file_count": len(files),
        "files": records,
        "errors": [{"path": path, "detail": detail} for path, detail in errors],
        "limitations": [
            "This audit validates discoverability and structural readability only.",
            "Creative quality, behavior, continuity, composition, mix, and fun require additional evidence.",
        ],
    }
    body = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    evidence_path = root / ".gameagent" / "evidence" / "production-domains" / f"{evidence_id}.json"
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_bytes(body)
    evidence = Evidence(
        evidence_id=evidence_id,
        project_id=task.project_id,
        task_id=task.task_id,
        evidence_class=EVIDENCE_CLASS[domain.domain_id],
        producer_type="tool",
        producer_id=domain.tool_ids[0],
        captured_at=inspected_at,
        source=SourceRef(
            uri=evidence_path.relative_to(root).as_posix(),
            media_type="application/json",
            locator=f"{domain.title} read-only structural audit",
            sha256=hashlib.sha256(body).hexdigest(),
        ),
        capture_origin="source",
        summary=f"{domain.title} audit: {status.replace('_', ' ')}",
    )
    result: Literal["passed", "failed", "inconclusive"] = (
        "passed" if status == "passed" else "failed" if errors else "inconclusive"
    )
    evaluation = Evaluation(
        evaluation_id=evaluation_id,
        project_id=task.project_id,
        task_id=task.task_id,
        gate_id=domain.gate_ids[0],
        claim="technical",
        result=result,
        evidence_ids=[evidence_id],
        evaluator_id=domain.tool_ids[0],
        authority="eligible",
        rationale=(
            findings[0].detail + " This result makes no subjective quality or gameplay-fun claim."
        ),
        evaluated_at=inspected_at,
    )
    inspection = ProductionDomainInspection(
        inspection_id=inspection_id,
        project_id=task.project_id,
        task_id=task.task_id,
        domain_id=domain.domain_id,
        tool_id=domain.tool_ids[0],
        status=status,
        inspected_at=inspected_at,
        inspected_file_count=len(files),
        evidence_id=evidence_id,
        evaluation_id=evaluation_id,
        findings=findings,
    )
    return inspection, evidence, evaluation
