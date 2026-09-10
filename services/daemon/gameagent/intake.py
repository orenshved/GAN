"""Conservative repository inspection used by ``gameagent init``."""

from __future__ import annotations

import hashlib
import mimetypes
import os
import re
import subprocess
from pathlib import Path
from typing import TYPE_CHECKING, Literal
from urllib.parse import quote

from gameagent.models.contracts import (
    AgentDefinition,
    Direction,
    DomainAssumption,
    DomainReadiness,
    DomainUnknown,
    Engine,
    InitializationFinding,
    InitializationReport,
    LeadDomainAssessment,
    Multiplayer,
    OnboardingReadiness,
    Production,
    Project,
    ProjectIdentity,
    ProjectIntelligence,
    ProjectOnboarding,
    SourceRef,
)

if TYPE_CHECKING:
    from gameagent.knowledge import KnowledgeRouter

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
SOURCE_SUFFIXES = {".cs", ".cpp", ".gd", ".h", ".js", ".lua", ".py", ".ts", ".tsx"}
SCENE_SUFFIXES = {".ldtk", ".scn", ".tmx", ".tscn", ".umap", ".unity"}
IMAGE_SUFFIXES = {
    ".ase",
    ".aseprite",
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".kra",
    ".png",
    ".psd",
    ".svg",
    ".tga",
    ".webp",
}
AUDIO_SUFFIXES = {".aac", ".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav"}
NARRATIVE_SUFFIXES = {".dialogue", ".ink", ".po", ".pot", ".yarn"}
TEST_MARKERS = {
    "pytest.ini",
    "vitest.config.js",
    "vitest.config.ts",
    "jest.config.js",
    "jest.config.ts",
}


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


def _manifests(root: Path, name: str, suffix: str | None = None) -> list[Path]:
    found: list[Path] = []
    for directory, names, files in os.walk(root, followlinks=False):
        relative = Path(directory).relative_to(root)
        if len(relative.parts) >= 3:
            names.clear()
        else:
            names[:] = [item for item in names if item not in IGNORED_PARTS]
        for file_name in files:
            if file_name == name or (suffix is not None and file_name.endswith(suffix)):
                found.append(Path(directory) / file_name)
    return sorted(found)


def _name(root: Path) -> str:
    return re.sub(r"\s+", " ", root.name.replace("_", " ").replace("-", " ")).strip()


def _identifier(root: Path) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", root.name.lower()).strip("-") or "game"
    digest = hashlib.sha256(str(root).lower().encode("utf-8")).hexdigest()[:8]
    return f"project-{slug}-{digest}"


def _source_ref(root: Path, relative: str) -> SourceRef:
    path = root / relative
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return SourceRef(
        uri=f"project:///{quote(relative)}",
        media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        locator=relative,
        sha256=digest,
    )


def _references(root: Path, paths: list[str], limit: int = 8) -> list[SourceRef]:
    return [_source_ref(root, path) for path in paths[:limit] if (root / path).is_file()]


def assess_project_domains(
    root: Path,
    project: Project,
    intake: InitializationReport,
    assessed_at: str,
    knowledge_router: KnowledgeRouter | None = None,
    agents: list[AgentDefinition] | None = None,
    intelligence: ProjectIntelligence | None = None,
) -> ProjectOnboarding:
    """Run bounded, evidence-led Lead assessments without executing project code."""

    source = _files(root, SOURCE_SUFFIXES)
    scenes = _files(root, SCENE_SUFFIXES)
    images = _files(root, IMAGE_SUFFIXES)
    audio = _files(root, AUDIO_SUFFIXES)
    narrative = _files(root, NARRATIVE_SUFFIXES)
    configuration = _files(root, {".cfg", ".godot", ".json", ".toml", ".yaml", ".yml"})
    test_files = sorted(
        {
            *[path for path in source if "test" in Path(path).name.casefold()],
            *[path for path in configuration if Path(path).name in TEST_MARKERS],
        }
    )
    scene_text = "\n".join(
        (root / path).read_text(encoding="utf-8", errors="ignore")[:100_000]
        for path in scenes[:20]
        if (root / path).suffix.lower() not in {".umap", ".scn"}
    )
    ui_files = [
        path
        for path in scenes
        if (root / path).suffix.lower() not in {".umap", ".scn"}
        and any(
            marker in (root / path).read_text(encoding="utf-8", errors="ignore")[:100_000]
            for marker in ("Control", "CanvasLayer", "Button", "Label")
        )
    ]
    engine_manifests = [
        *[path.relative_to(root).as_posix() for path in _manifests(root, "project.godot")],
        *[path.relative_to(root).as_posix() for path in _manifests(root, "", ".uproject")],
        *[path.relative_to(root).as_posix() for path in _manifests(root, "ProjectVersion.txt")],
    ]

    selected: list[
        tuple[
            str,
            str,
            str,
            list[str],
            list[str],
            list[DomainAssumption],
            list[DomainUnknown],
            list[str],
            list[str],
            list[str],
        ]
    ] = []
    common_unknowns: list[DomainUnknown] = []
    missing_fields = {finding.field for finding in intake.findings if finding.kind == "missing"}
    if "platforms" in missing_fields:
        common_unknowns.append(
            DomainUnknown(
                question="Which release platforms are intended?",
                impact="Needed before platform-specific packaging or certification work.",
                blocks_current_work=False,
            )
        )
    if "input_methods" in missing_fields:
        common_unknowns.append(
            DomainUnknown(
                question="Which input methods have production priority?",
                impact="Needed when interaction or accessibility work depends on input priority.",
                blocks_current_work=False,
            )
        )

    contradictions: list[str] = []
    blocking: list[DomainUnknown] = []
    if len(engine_manifests) > 1:
        contradictions.append(
            "Multiple engine manifests were detected and no single canonical project could be inferred."
        )
        blocking.append(
            DomainUnknown(
                question="Which engine project is the active production target?",
                impact="The team cannot safely choose build and runtime tooling.",
                blocks_current_work=True,
            )
        )

    engine_name = project.engine.type if project.engine else "No supported engine"
    selected.append(
        (
            "engineering",
            "implementation",
            f"{engine_name.title()} project with {len(source)} readable source files and {len(configuration)} configuration files.",
            [
                f"Engine: {engine_name}",
                f"Readable source files: {len(source)}",
                f"Configuration files: {len(configuration)}",
            ],
            [f"Rendering mode appears to be {project.rendering}."],
            []
            if project.engine
            else [
                DomainAssumption(
                    statement="The repository can be inspected before an engine adapter is selected.",
                    confidence=0.8,
                    impact="Runtime validation will wait for adapter selection.",
                    expires_when="A supported engine manifest or build workflow is identified.",
                )
            ],
            [*common_unknowns, *blocking],
            ["Confirm the project builds before implementation work changes production files."],
            contradictions,
            [*engine_manifests, *source[:5], *configuration[:3]],
        )
    )
    selected.append(
        (
            "game_design",
            "game-design-lead",
            f"Found {len(scenes)} scene or level files that expose the current playable structure.",
            [f"Scene and level files: {len(scenes)}", f"Rendering mode: {project.rendering}"],
            [
                "Existing scenes are the strongest available description of current gameplay structure."
            ],
            [
                DomainAssumption(
                    statement="Current implemented scenes represent the present design baseline.",
                    confidence=0.75,
                    impact="Recommendations will distinguish observed behavior from intended future design.",
                    expires_when="A newer design specification or Director decision supersedes the implementation.",
                )
            ],
            [],
            ["Capture the main playable loop when gameplay work becomes active."],
            [],
            scenes,
        )
    )
    if images:
        selected.append(
            (
                "art",
                "art-lead",
                f"Found {len(images)} image or editable art assets available for visual-language inspection.",
                [f"Visual assets: {len(images)}"],
                [
                    "Assets referenced by active project files should be treated as more authoritative than unused experiments."
                ],
                [
                    DomainAssumption(
                        statement="Currently used assets define the working visual language.",
                        confidence=0.78,
                        impact="New visual work will follow active assets unless a Director reference overrides them.",
                        expires_when="A visual-direction decision or approved reference set is recorded.",
                    )
                ],
                [],
                [
                    "Identify active versus unused visual assets before making style recommendations."
                ],
                [],
                images,
            )
        )
    if ui_files or "Control" in scene_text:
        selected.append(
            (
                "ux",
                "ux-specialist",
                f"Found {len(ui_files)} scenes with inspectable user-interface structure.",
                [f"UI-bearing scenes: {len(ui_files)}"],
                [
                    "Existing controls provide a usable baseline for interaction and accessibility review."
                ],
                [
                    DomainAssumption(
                        statement="Existing navigation behavior is the current interaction baseline.",
                        confidence=0.72,
                        impact="UX findings will preserve working navigation until stronger direction exists.",
                        expires_when="A Director decision defines a different input or navigation policy.",
                    )
                ],
                [item for item in common_unknowns if "input" in item.question.casefold()],
                ["Verify keyboard and controller traversal when UI work becomes active."],
                [],
                ui_files,
            )
        )
    if audio:
        selected.append(
            (
                "audio",
                "audio-lead",
                f"Found {len(audio)} audio assets suitable for technical inventory and later direction review.",
                [f"Audio assets: {len(audio)}"],
                [
                    "Existing audio establishes a technical baseline but not necessarily final direction."
                ],
                [],
                [],
                ["Measure formats and loudness before audio integration work."],
                [],
                audio,
            )
        )
    if narrative:
        selected.append(
            (
                "narrative",
                "narrative-lead",
                f"Found {len(narrative)} narrative or localization source files.",
                [f"Narrative sources: {len(narrative)}"],
                ["Readable narrative sources indicate that narrative production is relevant."],
                [],
                [],
                ["Map narrative sources to their runtime consumers before editing content."],
                [],
                narrative,
            )
        )
    selected.append(
        (
            "qa",
            "qa-specialist",
            f"Found {len(test_files)} explicit test files; runtime and discipline evidence can expand coverage progressively.",
            [f"Explicit test files: {len(test_files)}", f"Inspectable scenes: {len(scenes)}"],
            [
                "Existing automated checks are partial evidence rather than proof of player-facing quality."
            ],
            [],
            [],
            ["Establish task-specific required gates before declaring production work complete."],
            [],
            [*test_files, *engine_manifests],
        )
    )
    selected.append(
        (
            "production",
            "production-lead",
            "Repository history, documentation, and detected project structure support a staged production start.",
            [
                f"Recent Git commits recorded: {len(intake.git_recent_commits)}",
                f"Project documents: {len(intake.inspected_documents)}",
            ],
            [f"Current stage is likely {project.production.stage}."],
            [
                DomainAssumption(
                    statement=f"Treat {project.production.stage} as the current stage until milestone evidence changes it.",
                    confidence=0.7,
                    impact="Planning depth and review expectations use this stage as a provisional baseline.",
                    expires_when="A milestone or production-stage decision is recorded.",
                )
            ],
            [item for item in common_unknowns if "platform" in item.question.casefold()],
            [
                "Create the first milestone from an actual production objective rather than onboarding paperwork."
            ],
            [],
            intake.inspected_documents,
        )
    )

    assessments: list[LeadDomainAssessment] = []
    for (
        domain,
        agent_id,
        summary,
        known,
        inferred,
        assumptions,
        unknowns,
        recommendations,
        risks,
        paths,
    ) in selected:
        requested = [item.question for item in unknowns if item.blocks_current_work]
        status: OnboardingReadiness
        if requested:
            status = "NEEDS_INPUT_NOW"
        elif assumptions:
            status = "READY_WITH_ASSUMPTIONS"
        elif unknowns:
            status = "NEEDS_INPUT_LATER"
        else:
            status = "READY"
        assessments.append(
            LeadDomainAssessment(
                assessment_id=f"assessment-{project.project.id.removeprefix('project-')}-{domain}",
                project_id=project.project.id,
                domain=domain,
                agent_id=agent_id,
                assessed_at=assessed_at,
                readiness=DomainReadiness(status=status, confidence=0.72 if assumptions else 0.86),
                summary=summary,
                known_facts=known,
                inferred_facts=inferred,
                evidence=_references(root, sorted(dict.fromkeys(paths))),
                assumptions=assumptions,
                unknowns=unknowns,
                recommendations=recommendations,
                risks=risks,
                contradictions=contradictions if domain == "engineering" else [],
                requested_human_inputs=requested,
            )
        )

    if knowledge_router is not None and agents is not None:
        agents_by_id = {agent.agent_id: agent for agent in agents}
        enriched: list[LeadDomainAssessment] = []
        for assessment in assessments:
            agent = agents_by_id.get(assessment.agent_id)
            if agent is None:
                enriched.append(assessment)
                continue
            packet = knowledge_router.assemble(
                project_id=project.project.id,
                task_id=f"onboarding-{assessment.domain}",
                task_text=" ".join(
                    [
                        assessment.summary,
                        *assessment.known_facts,
                        *assessment.inferred_facts,
                        *assessment.recommendations,
                    ]
                ),
                capability_ids=agent.capabilities,
                agent=agent,
                intelligence=intelligence,
                project_engine=project.engine.type if project.engine else None,
                assembled_at=assessed_at,
            )
            missing_required = set(agent.required_expertise_pack_ids) - {
                ref.pack_id for ref in packet.expertise_packs
            }
            if missing_required or packet.stale_knowledge_flags:
                enriched.append(
                    assessment.model_copy(
                        update={
                            "readiness": DomainReadiness(status="BLOCKED_KNOWLEDGE", confidence=0),
                            "summary": (
                                f"{assessment.domain.title()} was detected, but its Lead assessment did not run because required expertise is unavailable."
                            ),
                            "inferred_facts": [],
                            "recommendations": [],
                            "risks": [
                                *assessment.risks,
                                (
                                    "Missing or unreviewed expertise: "
                                    + ", ".join(sorted(missing_required))
                                    if missing_required
                                    else "Version-sensitive expertise requires current research or a reviewed pack update."
                                ),
                            ],
                            "expertise_packs": packet.expertise_packs,
                            "knowledge_packet": packet,
                        }
                    )
                )
                continue
            enriched.append(
                assessment.model_copy(
                    update={
                        "expertise_packs": packet.expertise_packs,
                        "knowledge_packet": packet,
                    }
                )
            )
        assessments = enriched

    blocking_questions = list(
        dict.fromkeys(question for item in assessments for question in item.requested_human_inputs)
    )
    deferred_questions = list(
        dict.fromkeys(
            unknown.question
            for item in assessments
            for unknown in item.unknowns
            if not unknown.blocks_current_work
        )
    )
    ready_count = sum(item.readiness.status == "READY" for item in assessments)
    assumption_count = sum(
        item.readiness.status == "READY_WITH_ASSUMPTIONS" for item in assessments
    )
    knowledge_block_count = sum(
        item.readiness.status == "BLOCKED_KNOWLEDGE" for item in assessments
    )
    return ProjectOnboarding(
        onboarding_id=f"onboarding-{project.project.id.removeprefix('project-')}",
        project_id=project.project.id,
        state=(
            "NEEDS_HUMAN_INPUT"
            if blocking_questions
            else "BLOCKED_KNOWLEDGE"
            if knowledge_block_count
            else "ACTIVE"
        ),
        started_at=assessed_at,
        completed_at=assessed_at,
        reconnaissance_summary=(
            f"Detected {engine_name}, {project.rendering} rendering, and {len(assessments)} relevant production domains."
        ),
        relevant_domains=[item.domain for item in assessments],
        assessments=assessments,
        reconciliation_summary=(
            f"{knowledge_block_count} domain Lead assessment is blocked until required expertise is reviewed and available."
            if knowledge_block_count and not blocking_questions
            else f"The team can begin: {ready_count} domains are ready and {assumption_count} are ready with explicit assumptions."
            if not blocking_questions
            else f"The team found {len(blocking_questions)} decision that must be resolved before affected work proceeds."
        ),
        blocking_questions=blocking_questions,
        deferred_questions=deferred_questions,
    )


def inspect(path: Path) -> tuple[Project, InitializationReport]:
    root = repository_root(path)
    name = _name(root)
    documents = _files(root, DOCUMENT_SUFFIXES)
    assets = _files(root, ASSET_SUFFIXES)
    findings: list[InitializationFinding] = []
    capabilities = ["project_analysis", "version_control_analysis"]
    engine: Engine | None = None
    rendering: Literal["2d", "2.5d", "3d", "non_applicable"] = "non_applicable"

    godot_projects = _manifests(root, "project.godot")
    godot = godot_projects[0] if len(godot_projects) == 1 else None
    unreal = _manifests(root, "", ".uproject")
    unity_projects = _manifests(root, "ProjectVersion.txt")
    unity = unity_projects[0] if len(unity_projects) == 1 else None
    if godot is not None:
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
        source = godot.relative_to(root).as_posix()
    elif unreal:
        engine = Engine(type="unreal", version="unknown")
        capabilities.append("unreal_development")
        source = unreal[0].name
    elif unity is not None:
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
