"""Conservative repository inspection used by ``gameagent init``."""

import hashlib
import os
import re
import subprocess
from pathlib import Path
from typing import Literal

from gameagent.models.contracts import (
    Direction,
    Engine,
    InitializationFinding,
    InitializationReport,
    Multiplayer,
    Production,
    Project,
    ProjectIdentity,
)

DOCUMENT_SUFFIXES = {".md", ".mdx", ".txt", ".pdf", ".doc", ".docx", ".rtf"}
ASSET_SUFFIXES = {
    ".blend",
    ".fbx",
    ".glb",
    ".gltf",
    ".jpg",
    ".jpeg",
    ".kra",
    ".mp3",
    ".ogg",
    ".png",
    ".psd",
    ".svg",
    ".tga",
    ".wav",
    ".webp",
}
IGNORED_PARTS = {".git", ".gameagent", ".next", ".turbo", "node_modules", "Library"}


def _git(root: Path, *arguments: str) -> str | None:
    result = subprocess.run(
        ["git", "-C", str(root), *arguments],
        capture_output=True,
        check=False,
        encoding="utf-8",
        errors="replace",
    )
    value = result.stdout.strip()
    return value if result.returncode == 0 and value else None


def repository_root(path: Path) -> Path:
    candidate = path.resolve(strict=True)
    root = _git(candidate, "rev-parse", "--show-toplevel")
    return Path(root).resolve(strict=True) if root else candidate


def _files(root: Path, suffixes: set[str], limit: int = 200) -> list[str]:
    found: list[str] = []
    for directory, names, files in os.walk(root, followlinks=False):
        names[:] = [name for name in names if name not in IGNORED_PARTS]
        for name in files:
            path = Path(directory) / name
            if not path.is_symlink() and path.suffix.lower() in suffixes:
                found.append(path.relative_to(root).as_posix())
                if len(found) == limit:
                    return sorted(found)
    return sorted(found)


def _name(root: Path) -> str:
    return re.sub(r"\s+", " ", root.name.replace("_", " ").replace("-", " ")).strip()


def _identifier(root: Path) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", root.name.lower()).strip("-") or "game"
    digest = hashlib.sha256(str(root).lower().encode("utf-8")).hexdigest()[:8]
    return f"project-{slug}-{digest}"


def inspect(path: Path) -> tuple[Project, InitializationReport]:
    root = repository_root(path)
    name = _name(root)
    documents = _files(root, DOCUMENT_SUFFIXES)
    assets = _files(root, ASSET_SUFFIXES)
    findings: list[InitializationFinding] = []
    capabilities = ["project_analysis", "version_control_analysis"]
    engine: Engine | None = None
    rendering: Literal["2d", "2.5d", "3d", "non_applicable"] = "non_applicable"

    godot = root / "project.godot"
    unreal = sorted(root.glob("*.uproject"))
    unity = root / "ProjectSettings" / "ProjectVersion.txt"
    if godot.is_file():
        text = godot.read_text(encoding="utf-8", errors="replace")
        name_match = re.search(r'^config/name="([^"]+)"', text, re.MULTILINE)
        if name_match:
            name = name_match.group(1).strip() or name
        version = "unknown"
        match = re.search(r"config/features=PackedStringArray\(([^)]*)\)", text)
        if match:
            versions = re.findall(r'"([0-9]+(?:\.[0-9]+)*)"', match.group(1))
            if versions:
                version = versions[0]
        engine = Engine(type="godot", version=version)
        capabilities.append("godot_development")
        source = "project.godot"
    elif unreal:
        engine = Engine(type="unreal", version="unknown")
        capabilities.append("unreal_development")
        source = unreal[0].name
    elif unity.is_file():
        version = unity.read_text(encoding="utf-8", errors="replace").partition(":")[2].strip()
        engine = Engine(type="unity", version=version or "unknown")
        capabilities.append("unity_development")
        source = unity.relative_to(root).as_posix()
    else:
        source = "No supported engine manifest found"

    if engine:
        findings.append(
            InitializationFinding(kind="known", field="engine", value=engine.type, source=source)
        )
        scenes = _files(root, {".tscn", ".unity", ".umap"})
        sample = "\n".join(
            (root / item).read_text(encoding="utf-8", errors="ignore")[:200_000]
            for item in scenes[:20]
            if (root / item).suffix.lower() != ".umap"
        )
        has_3d = any(
            marker in sample
            for marker in ("Node3D", "CharacterBody3D", "MeshInstance3D", "m_Orthographic: 0")
        )
        has_2d = any(
            marker in sample
            for marker in ("Node2D", "CharacterBody2D", "Sprite2D", "m_Orthographic: 1")
        )
        if has_3d and has_2d:
            rendering = "2.5d"
        elif has_3d:
            rendering = "3d"
        elif has_2d:
            rendering = "2d"
        findings.append(
            InitializationFinding(
                kind="inferred" if rendering != "non_applicable" else "missing",
                field="rendering",
                value=rendering if rendering != "non_applicable" else None,
                source=f"Inspected {len(scenes[:20])} scene files",
            )
        )
    else:
        findings.append(
            InitializationFinding(kind="missing", field="engine", value=None, source=source)
        )
        findings.append(
            InitializationFinding(
                kind="missing", field="rendering", value=None, source="No engine scenes identified"
            )
        )

    for field, reason in (
        ("platforms", "No reliable platform declaration was identified"),
        ("input_methods", "No reliable input target was identified"),
        ("visual_direction", "Creative direction requires a human source"),
        ("audio_direction", "Audio direction requires a human source"),
    ):
        findings.append(
            InitializationFinding(kind="missing", field=field, value=None, source=reason)
        )
    findings.extend(
        [
            InitializationFinding(
                kind="inferred",
                field="medium",
                value="digital_game",
                source="Repository initialized as a GAN game project",
            ),
            InitializationFinding(
                kind="inferred",
                field="production_stage",
                value="preproduction",
                source="No production milestone record was identified",
            ),
        ]
    )
    project = Project(
        project=ProjectIdentity(
            id=_identifier(root),
            name=name,
            description=f"Existing {name} game project initialized by Game Agent Network.",
        ),
        medium="digital_game",
        engine=engine,
        rendering=rendering,
        platforms=[],
        input_methods=[],
        multiplayer=Multiplayer(type="single_player", max_players=1),
        visual=Direction(direction="Undetermined", references=[]),
        audio=Direction(direction="Undetermined", references=[]),
        production=Production(stage="preproduction", team_size=1, current_milestone=None),
        constraints=[],
        locked_decision_ids=[],
    )
    report = InitializationReport(
        repository_root=str(root),
        git_head=_git(root, "rev-parse", "HEAD"),
        git_recent_commits=(_git(root, "log", "-20", "--format=%H%x09%s") or "").splitlines(),
        inspected_documents=documents,
        inspected_assets=assets,
        findings=findings,
        required_capabilities=capabilities,
    )
    return project, report
