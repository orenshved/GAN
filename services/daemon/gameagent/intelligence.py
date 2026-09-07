"""Deterministic, bounded project indexing and task-scoped context retrieval."""

import hashlib
import json
import mimetypes
import re
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from gameagent.models.contracts import (
    ContextPackage,
    ContextSnippet,
    InboxDecision,
    IndexedResource,
    InitializationReport,
    KnowledgeEntry,
    Project,
    ProjectIntelligence,
    SourceRef,
    TaskContract,
)

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
DOCUMENT_SUFFIXES = {".md", ".txt", ".rst", ".adoc", ".pdf", ".docx"}
SOURCE_SUFFIXES = {
    ".c",
    ".cfg",
    ".cpp",
    ".cs",
    ".css",
    ".gd",
    ".godot",
    ".h",
    ".html",
    ".ini",
    ".java",
    ".js",
    ".json",
    ".jsx",
    ".kt",
    ".lua",
    ".mjs",
    ".py",
    ".rs",
    ".scss",
    ".sh",
    ".toml",
    ".tres",
    ".ts",
    ".tscn",
    ".tsx",
    ".xml",
    ".yaml",
    ".yml",
}
ASSET_SUFFIXES = {
    ".ase",
    ".aseprite",
    ".blend",
    ".fbx",
    ".gif",
    ".glb",
    ".gltf",
    ".jpeg",
    ".jpg",
    ".mp3",
    ".mp4",
    ".ogg",
    ".otf",
    ".png",
    ".psd",
    ".svg",
    ".ttf",
    ".wav",
    ".webm",
    ".webp",
}
CONFIG_NAMES = {
    "package.json",
    "pnpm-workspace.yaml",
    "pyproject.toml",
    "project.godot",
    "readme.md",
}
MAX_FILES = 2000
MAX_FILE_BYTES = 64 * 1024 * 1024
MAX_TEXT_BYTES = 32 * 1024
MAX_EXCERPT_CHARS = 1600
MAX_CONTEXT_RESOURCES = 12
MAX_CONTEXT_KNOWLEDGE = 12
ResourceKind = Literal["document", "source", "asset", "configuration"]
KnowledgeKind = Literal[
    "source_fact",
    "deterministic_consequence",
    "inferred_fact",
    "production_decision",
    "user_decision",
    "technical_constraint",
    "hypothesis",
    "agent_recommendation",
    "evaluation",
]
STOP_WORDS = {
    "about",
    "after",
    "before",
    "from",
    "into",
    "project",
    "should",
    "that",
    "their",
    "this",
    "with",
}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _kind(path: Path) -> ResourceKind | None:
    suffix = path.suffix.lower()
    if path.name.lower() in CONFIG_NAMES:
        return "configuration"
    if suffix in DOCUMENT_SUFFIXES:
        return "document"
    if suffix in SOURCE_SUFFIXES:
        return "source"
    if suffix in ASSET_SUFFIXES:
        return "asset"
    return None


def _excerpt(path: Path) -> str | None:
    if path.suffix.lower() not in SOURCE_SUFFIXES | {".md", ".txt", ".rst", ".adoc"}:
        return None
    data = path.read_bytes()[:MAX_TEXT_BYTES]
    if b"\x00" in data:
        return None
    text = data.decode("utf-8", errors="ignore")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    excerpt = "\n".join(lines)[:MAX_EXCERPT_CHARS].strip()
    return excerpt or None


def _source(resource: IndexedResource, locator: str | None = None) -> SourceRef:
    return SourceRef(
        uri=f"project:///{quote(resource.path, safe='/')}",
        media_type=resource.media_type,
        locator=locator,
        sha256=resource.sha256,
    )


def _knowledge_id(kind: str, statement: str, source: SourceRef) -> str:
    identity = json.dumps(
        {"kind": kind, "statement": statement, "source": source.model_dump()},
        sort_keys=True,
    ).encode()
    return f"knowledge-{hashlib.sha256(identity).hexdigest()[:24]}"


def _knowledge(
    project_id: str,
    kind: KnowledgeKind,
    statement: str,
    source: SourceRef,
    confidence: float,
    created_at: str,
) -> KnowledgeEntry:
    return KnowledgeEntry(
        knowledge_id=_knowledge_id(kind, statement, source),
        project_id=project_id,
        kind=kind,
        statement=statement,
        source=source,
        confidence=confidence,
        created_at=created_at,
        entities=[],
        evidence_ids=[],
    )


def _manifest_source(root: Path) -> SourceRef:
    path = root / ".gameagent" / "project.yaml"
    return SourceRef(
        uri="project:///.gameagent/project.yaml",
        media_type="application/yaml",
        locator=None,
        sha256=_sha256(path),
    )


def index_repository(
    root: Path,
    project: Project,
    intake: InitializationReport,
    decisions: list[InboxDecision],
    indexed_at: str,
) -> ProjectIntelligence:
    """Index inspectable project files without executing discovered code."""
    resolved_root = root.resolve()
    resources: list[IndexedResource] = []
    for path in sorted(resolved_root.rglob("*"), key=lambda item: item.as_posix().lower()):
        if len(resources) >= MAX_FILES:
            break
        if not path.is_file() or path.is_symlink():
            continue
        relative = path.relative_to(resolved_root)
        if any(part in IGNORED_PARTS for part in relative.parts):
            continue
        kind = _kind(path)
        size = path.stat().st_size
        if kind is None or size > MAX_FILE_BYTES:
            continue
        resources.append(
            IndexedResource(
                path=relative.as_posix(),
                kind=kind,
                media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                size=size,
                sha256=_sha256(path),
                excerpt=_excerpt(path),
            )
        )

    digest_input = "\n".join(f"{item.path}\0{item.sha256}" for item in resources).encode()
    workspace_digest = hashlib.sha256(digest_input).hexdigest()
    manifest_source = _manifest_source(root)
    knowledge: list[KnowledgeEntry] = []
    project_facts = [
        f"Project medium is {project.medium}.",
        f"Rendering mode is {project.rendering}.",
        f"Production stage is {project.production.stage}.",
    ]
    if project.engine:
        project_facts.append(f"Engine is {project.engine.type} {project.engine.version}.")
    if project.platforms:
        project_facts.append(f"Target platforms are {', '.join(project.platforms)}.")
    if project.input_methods:
        project_facts.append(f"Input methods are {', '.join(project.input_methods)}.")
    if project.visual.direction.lower() != "undetermined":
        project_facts.append(f"Visual direction is {project.visual.direction}.")
    for statement in [*project_facts, *project.constraints]:
        knowledge.append(
            _knowledge(
                project.project.id,
                "source_fact" if statement in project_facts else "technical_constraint",
                statement,
                manifest_source,
                1.0,
                indexed_at,
            )
        )

    intake_by_field = {finding.field: finding for finding in intake.findings}
    for field, finding in sorted(intake_by_field.items()):
        if finding.kind == "missing" or finding.value is None:
            continue
        statement = f"{field.replace('_', ' ').title()}: {finding.value}."
        knowledge.append(
            _knowledge(
                project.project.id,
                "source_fact" if finding.kind == "known" else "inferred_fact",
                statement,
                manifest_source,
                1.0 if finding.kind == "known" else 0.75,
                indexed_at,
            )
        )

    for resource in resources:
        if resource.kind not in {"document", "configuration"} or not resource.excerpt:
            continue
        first_line = resource.excerpt.splitlines()[0].lstrip("# ").strip()
        if first_line:
            knowledge.append(
                _knowledge(
                    project.project.id,
                    "source_fact",
                    f'{resource.path} begins with "{first_line[:240]}".',
                    _source(resource, "line 1"),
                    1.0,
                    indexed_at,
                )
            )

    for decision in decisions:
        if decision.selected_option is None:
            continue
        serialized = decision.model_dump_json().encode()
        source = SourceRef(
            uri=f"gameagent://decisions/{decision.decision_id}",
            media_type="application/vnd.gameagent.decision+json",
            locator=None,
            sha256=hashlib.sha256(serialized).hexdigest(),
        )
        knowledge.append(
            _knowledge(
                project.project.id,
                "user_decision",
                f'{decision.title}: Director selected "{decision.selected_option}".',
                source,
                1.0,
                indexed_at,
            )
        )

    count_by_kind = {
        kind: sum(resource.kind == kind for resource in resources)
        for kind in ("document", "source", "asset", "configuration")
    }
    summary = ", ".join(f"{count} {kind}" for kind, count in count_by_kind.items())
    index_source = SourceRef(
        uri=f"gameagent://indexes/{workspace_digest}",
        media_type="application/vnd.gameagent.index+json",
        locator=None,
        sha256=workspace_digest,
    )
    knowledge.append(
        _knowledge(
            project.project.id,
            "deterministic_consequence",
            f"Repository index contains {summary} resources.",
            index_source,
            1.0,
            indexed_at,
        )
    )
    unique = {entry.knowledge_id: entry for entry in knowledge}
    return ProjectIntelligence(
        project_id=project.project.id,
        indexed_at=indexed_at,
        workspace_digest=workspace_digest,
        resources=resources,
        knowledge=list(unique.values()),
    )


def _tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9][a-z0-9_-]{2,}", value.lower())
        if token not in STOP_WORDS
    }


def assemble_context(
    task: TaskContract,
    intelligence: ProjectIntelligence,
    decisions: list[InboxDecision],
    assembled_at: str,
) -> ContextPackage:
    """Retrieve a bounded context package; canonical event history is never embedded."""
    task_text = " ".join(
        [
            task.title,
            task.objective,
            *task.required_capabilities,
            *task.deliverables,
            *task.constraints,
            *task.requirements.functional,
            *task.requirements.visual,
            *task.requirements.technical,
            *task.requirements.accessibility,
            *task.requirements.production,
        ]
    )
    task_terms = _tokens(task_text)
    visual_task = bool(
        task_terms & {"art", "asset", "hud", "icon", "image", "ui", "visual"}
        or any(
            "visual" in capability or "ui" in capability
            for capability in task.required_capabilities
        )
    )

    def resource_score(resource: IndexedResource) -> int:
        path_terms = _tokens(resource.path)
        content_terms = _tokens(resource.excerpt or "")
        score = 4 * len(task_terms & path_terms) + len(task_terms & content_terms)
        if resource.kind in {"document", "configuration"}:
            score += 1
        if visual_task and resource.kind == "asset":
            score += 2
        return score

    ranked_resources = sorted(
        intelligence.resources,
        key=lambda resource: (-resource_score(resource), resource.path.lower()),
    )
    selected_resources = [
        resource for resource in ranked_resources if resource_score(resource) > 0
    ][:MAX_CONTEXT_RESOURCES]
    if not selected_resources:
        selected_resources = ranked_resources[: min(4, len(ranked_resources))]

    def knowledge_score(entry: KnowledgeEntry) -> int:
        return len(task_terms & _tokens(entry.statement)) + (
            2 if entry.kind in {"user_decision", "technical_constraint"} else 0
        )

    ranked_knowledge = sorted(
        intelligence.knowledge,
        key=lambda entry: (-knowledge_score(entry), entry.knowledge_id),
    )
    selected_knowledge = [entry for entry in ranked_knowledge if knowledge_score(entry) > 0]
    if len(selected_knowledge) < 4:
        selected_ids = {entry.knowledge_id for entry in selected_knowledge}
        selected_knowledge.extend(
            entry for entry in ranked_knowledge if entry.knowledge_id not in selected_ids
        )
    selected_knowledge = selected_knowledge[:MAX_CONTEXT_KNOWLEDGE]
    selected_decisions = [
        decision
        for decision in decisions
        if task.task_id in decision.task_ids
        or bool(task_terms & _tokens(" ".join([decision.title, decision.reason])))
    ][:6]
    references = list(task.references)
    known_uris = {reference.uri for reference in references}
    snippets: list[ContextSnippet] = []
    for resource in selected_resources:
        source = _source(resource, "indexed excerpt" if resource.excerpt else None)
        if source.uri not in known_uris:
            references.append(source)
            known_uris.add(source.uri)
        if resource.excerpt:
            score = resource_score(resource)
            snippets.append(
                ContextSnippet(
                    statement=resource.excerpt[:800],
                    source=source,
                    relevance=min(1.0, score / 10),
                )
            )
    identity = json.dumps(
        {
            "task_id": task.task_id,
            "workspace_digest": intelligence.workspace_digest,
            "references": [reference.uri for reference in references],
            "decisions": [decision.decision_id for decision in selected_decisions],
        },
        sort_keys=True,
    ).encode()
    return ContextPackage(
        context_id=f"context-{hashlib.sha256(identity).hexdigest()[:24]}",
        project_id=task.project_id,
        task_id=task.task_id,
        assembled_at=assembled_at,
        task=task,
        knowledge=selected_knowledge,
        decisions=selected_decisions,
        references=references,
        snippets=snippets,
        indexed_resource_count=len(intelligence.resources),
        selected_resource_count=len(selected_resources),
    )
