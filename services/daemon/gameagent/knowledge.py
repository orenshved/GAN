"""Curated global expertise and task-scoped Knowledge Fabric retrieval.

Canonical expertise lives as human-readable pack manifests. The SQLite FTS
database is disposable and contains no project material.
"""

from __future__ import annotations

import hashlib
import html
import ipaddress
import json
import os
import re
import socket
import sqlite3
import ssl
import tempfile
from datetime import UTC, datetime, timedelta
from http.client import HTTPSConnection
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit
from uuid import uuid4

import yaml
from dotenv import load_dotenv
from filelock import FileLock

from gameagent.constitution import ConstitutionError, require
from gameagent.models.api import (
    ExpertiseBaselineStatus,
    KnowledgeCatalog,
    KnowledgeMaintenanceReport,
    LessonPromotionCommand,
    PackAuditionCommand,
    PackLifecycleCommand,
    PackReviewCommand,
    ResearchCommand,
)
from gameagent.models.contracts import (
    AgentDefinition,
    ExperienceLesson,
    ExperienceObservation,
    ExpertiseBenchmarkScenario,
    ExpertiseKnowledgeItem,
    ExpertisePack,
    ExpertisePackRef,
    GlobalExperience,
    KnowledgeEntry,
    KnowledgeMethod,
    KnowledgePacket,
    KnowledgeSource,
    PackAudition,
    PackLifecycleRecord,
    PackReview,
    ProjectIntelligence,
    RetrievedKnowledge,
    RetrievedKnowledgeKind,
    SourceAuthority,
    SourceRef,
    TaskContract,
    WorldResearch,
)

MAX_DISCIPLINE_ITEMS = 10
MAX_PROJECT_ITEMS = 8
MAX_PACKET_BYTES = 48_000
INITIAL_EXPERTISE_PACK_IDS = (
    "game-production-core",
    "game-design-core",
    "game-engineering-core",
    "game-art-direction",
    "game-ux-core",
    "game-qa-core",
    "project-intelligence-analysis",
    "godot-core",
    "godot-ui-engineering",
    "2d-game-art",
    "pixel-art-production",
    "controller-navigation",
    "game-accessibility-basics",
    "local-model-selection",
)
AUTHORITY_SCORE: dict[SourceAuthority, int] = {
    "primary_standard": 8,
    "official_documentation": 7,
    "peer_reviewed": 6,
    "industry_reference": 5,
    "curated_practice": 4,
    "project_source": 8,
    "measured_result": 8,
    "human_judgment": 7,
}


def _timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _tokens(value: str) -> set[str]:
    return set(re.findall(r"[a-z0-9][a-z0-9_-]{2,}", value.casefold()))


def _atomic_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temporary:
        temporary.write(source.read_bytes())
        temporary.flush()
        os.fsync(temporary.fileno())
        temporary_path = Path(temporary.name)
    os.replace(temporary_path, target)


class KnowledgeDirectory:
    """Global, configurable canonical knowledge directory.

    Project files are accepted only as retrieval inputs and are never written
    through this abstraction.
    """

    def __init__(
        self,
        root: Path,
        builtin_root: Path | None = None,
        benchmark_root: Path | None = None,
    ) -> None:
        self.root = root.expanduser().resolve()
        self.packs_root = self.root / "packs"
        self.blobs_root = self.root / "blobs" / "sha256"
        self.index_path = self.root / "index.sqlite3"
        self.builtin_root = builtin_root or (
            Path(__file__).resolve().parents[3] / "expertise" / "builtin"
        )
        self.benchmark_root = benchmark_root or (
            Path(__file__).resolve().parents[3] / "expertise" / "benchmarks"
        )

    @classmethod
    def from_environment(
        cls,
        root: Path | None = None,
        builtin_root: Path | None = None,
        benchmark_root: Path | None = None,
    ) -> KnowledgeDirectory:
        load_dotenv()
        configured = os.environ.get("GAMEAGENT_KNOWLEDGE_HOME")
        configured_builtin = os.environ.get("GAMEAGENT_BUILTIN_EXPERTISE_PATH")
        configured_benchmarks = os.environ.get("GAMEAGENT_EXPERTISE_BENCHMARK_PATH")
        selected = root or (
            Path(configured) if configured else Path.home() / ".gameagent" / "knowledge"
        )
        selected_builtin = builtin_root or (
            Path(configured_builtin) if configured_builtin else None
        )
        selected_benchmarks = benchmark_root or (
            Path(configured_benchmarks) if configured_benchmarks else None
        )
        return cls(selected, selected_builtin, selected_benchmarks)

    def initialize(self) -> None:
        self.packs_root.mkdir(parents=True, exist_ok=True)
        self.blobs_root.mkdir(parents=True, exist_ok=True)
        require(self.builtin_root.is_dir(), "builtin_expertise_missing", str(self.builtin_root))
        for source in sorted(self.builtin_root.glob("*/pack.yaml")):
            pack = ExpertisePack.model_validate(yaml.safe_load(source.read_text(encoding="utf-8")))
            target = self.packs_root / pack.pack_id / pack.version / "pack.yaml"
            if target.exists():
                existing = ExpertisePack.model_validate(
                    yaml.safe_load(target.read_text(encoding="utf-8"))
                )
                require(
                    existing == pack,
                    "knowledge_pack_conflict",
                    f"{pack.pack_id}@{pack.version}",
                )
            else:
                _atomic_copy(source, target)

    def manifest_paths(self) -> list[Path]:
        return sorted(self.packs_root.glob("*/*/pack.yaml"))

    def assert_global_path(self, path: Path) -> None:
        root = self.root.absolute()
        candidate = path.absolute()
        require(candidate.is_relative_to(root), "project_knowledge_leak", str(path))
        current = root
        for part in candidate.relative_to(root).parts:
            current /= part
            require(not current.is_symlink(), "project_knowledge_leak", str(path))


class ExpertisePackRegistry:
    def __init__(self, directory: KnowledgeDirectory) -> None:
        self.directory = directory
        self._packs: dict[tuple[str, str], ExpertisePack] = {}

    def load(self) -> None:
        self.directory.initialize()
        packs: dict[tuple[str, str], ExpertisePack] = {}
        for path in self.directory.manifest_paths():
            self.directory.assert_global_path(path)
            pack = ExpertisePack.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))
            self._validate(pack)
            key = (pack.pack_id, pack.version)
            require(key not in packs, "duplicate_knowledge_pack", "@".join(key))
            packs[key] = pack
        self._packs = packs
        self.rebuild_index()

    @staticmethod
    def _validate(pack: ExpertisePack) -> None:
        source_ids = [source.source_id for source in pack.sources]
        method_ids = [method.method_id for method in pack.methods]
        item_ids = [item.item_id for item in pack.items]
        require(len(source_ids) == len(set(source_ids)), "duplicate_pack_source", pack.pack_id)
        require(len(method_ids) == len(set(method_ids)), "duplicate_pack_method", pack.pack_id)
        require(len(item_ids) == len(set(item_ids)), "duplicate_pack_item", pack.pack_id)
        known_sources = set(source_ids)
        known_methods = set(method_ids)
        for method in pack.methods:
            require(
                set(method.source_ids) <= known_sources,
                "unknown_method_source",
                method.method_id,
            )
        for item in pack.items:
            require(set(item.source_ids) <= known_sources, "unknown_item_source", item.item_id)
            require(set(item.method_ids) <= known_methods, "unknown_item_method", item.item_id)

    def rebuild_index(self) -> None:
        self.directory.index_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.directory.index_path)
        try:
            connection.executescript(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS expertise_fts USING fts5(
                    pack_id UNINDEXED,
                    version UNINDEXED,
                    item_id UNINDEXED,
                    title,
                    statement,
                    capabilities,
                    domains
                );
                """
            )
            connection.execute("DELETE FROM expertise_fts")
            for pack in self.packs():
                for item in pack.items:
                    connection.execute(
                        "INSERT INTO expertise_fts VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (
                            pack.pack_id,
                            pack.version,
                            item.item_id,
                            item.title,
                            item.statement,
                            " ".join(item.capability_ids),
                            " ".join(item.domain_ids),
                        ),
                    )
            connection.commit()
        finally:
            connection.close()

    def packs(self) -> list[ExpertisePack]:
        return sorted(self._packs.values(), key=lambda pack: (pack.pack_id, pack.version))

    def latest(self, pack_id: str) -> ExpertisePack | None:
        candidates = [
            pack
            for pack in self._packs.values()
            if pack.pack_id == pack_id and self.effective_state(pack) in {"reviewed", "active"}
        ]
        return (
            max(candidates, key=lambda pack: tuple(map(int, pack.version.split("."))))
            if candidates
            else None
        )

    def lifecycle(self) -> list[PackLifecycleRecord]:
        records = []
        for path in (self.directory.root / "lifecycle").glob("*.json"):
            self.directory.assert_global_path(path)
            records.append(
                PackLifecycleRecord.model_validate_json(path.read_text(encoding="utf-8"))
            )
        return sorted(records, key=lambda item: (item.recorded_at, item.record_id))

    def effective_state(self, pack: ExpertisePack) -> str:
        matching = [
            item
            for item in self.lifecycle()
            if item.pack.pack_id == pack.pack_id and item.pack.version == pack.version
        ]
        return matching[-1].state if matching else pack.state

    def search(self, query: str, limit: int = 20) -> list[tuple[str, str, str]]:
        terms = sorted(_tokens(query))[:12]
        if not terms:
            return []
        connection = sqlite3.connect(self.directory.index_path)
        try:
            rows = connection.execute(
                "SELECT pack_id, version, item_id FROM expertise_fts WHERE expertise_fts MATCH ? LIMIT ?",
                (" OR ".join('"' + term + '"' for term in terms), limit),
            ).fetchall()
            return [
                (str(pack_id), str(version), str(item_id)) for pack_id, version, item_id in rows
            ]
        finally:
            connection.close()


class KnowledgeRouter:
    """Domain-aware deterministic router; embeddings are intentionally optional."""

    def __init__(self, registry: ExpertisePackRegistry) -> None:
        self.registry = registry

    def assemble(
        self,
        *,
        project_id: str,
        task_id: str,
        task_text: str,
        capability_ids: list[str],
        agent: AgentDefinition,
        intelligence: ProjectIntelligence | None,
        project_engine: str | None,
        assembled_at: str | None = None,
        context_package_id: str | None = None,
        experience: list[ExperienceLesson] | None = None,
        research: list[WorldResearch] | None = None,
    ) -> KnowledgePacket:
        now = assembled_at or _timestamp()
        require(
            intelligence is None
            or (
                intelligence.project_id == project_id
                and all(entry.project_id == project_id for entry in intelligence.knowledge)
            ),
            "project_scope_mismatch",
            project_id,
        )
        required = list(dict.fromkeys(agent.required_expertise_pack_ids))
        optional = list(dict.fromkeys(agent.optional_expertise_pack_ids))
        selected: list[ExpertisePack] = []
        missing: list[str] = []
        for pack_id in required:
            pack = self.registry.latest(pack_id)
            if pack is None or pack.state not in {"reviewed", "active"}:
                missing.append(f"Required expertise pack {pack_id} is unavailable or unreviewed.")
            else:
                selected.append(pack)
        for pack_id in optional:
            pack = self.registry.latest(pack_id)
            if pack is None or pack.state not in {"reviewed", "active"}:
                continue
            relevant = bool(set(pack.capability_ids) & set(capability_ids))
            engine_matches = "godot" not in pack.domain_ids or project_engine == "godot"
            if relevant and engine_matches:
                selected.append(pack)
        selected = list({(pack.pack_id, pack.version): pack for pack in selected}.values())
        covered_capabilities = {
            capability_id for pack in selected for capability_id in pack.capability_ids
        }
        uncovered_capabilities = sorted(
            (set(capability_ids) & set(agent.capabilities)) - covered_capabilities
        )
        if required and uncovered_capabilities:
            missing.append(
                "Required expertise is unavailable or unreviewed for capabilities: "
                + ", ".join(uncovered_capabilities)
                + "."
            )

        query_text = " ".join([task_text, *capability_ids, project_engine or ""])
        query_terms = _tokens(query_text)
        lexical_matches = set(self.registry.search(query_text))
        retrieved: list[RetrievedKnowledge] = []
        sources: dict[str, KnowledgeSource] = {}
        stale: list[str] = []
        methods: list[str] = []
        method_definitions: dict[str, KnowledgeMethod] = {}
        scored_items: list[tuple[int, ExpertisePack, ExpertiseKnowledgeItem]] = []
        for pack in selected:
            source_by_id = {source.source_id: source for source in pack.sources}
            for item in pack.items:
                overlap = len(
                    query_terms
                    & _tokens(
                        " ".join(
                            [
                                item.title,
                                item.statement,
                                *item.capability_ids,
                                *item.domain_ids,
                            ]
                        )
                    )
                )
                capability_match = len(set(capability_ids) & set(item.capability_ids))
                authority = max(
                    AUTHORITY_SCORE[source_by_id[source_id].authority]
                    for source_id in item.source_ids
                )
                stale_count = sum(
                    self._is_stale(source_by_id[source_id], now) for source_id in item.source_ids
                )
                if stale_count and (capability_match or overlap):
                    stale.extend(
                        f"{source.source_id} ({source.freshness_class}) requires current research or a reviewed pack update."
                        for source in (
                            source_by_id[source_id]
                            for source_id in item.source_ids
                            if self._is_stale(source_by_id[source_id], now)
                        )
                    )
                    continue
                lexical_score = (
                    5 if (pack.pack_id, pack.version, item.item_id) in lexical_matches else 0
                )
                scored_items.append(
                    (
                        capability_match * 20
                        + overlap * 3
                        + authority
                        + lexical_score
                        - stale_count * 5,
                        pack,
                        item,
                    )
                )
        for score, pack, item in sorted(
            scored_items, key=lambda value: (-value[0], value[1].pack_id, value[2].item_id)
        )[:MAX_DISCIPLINE_ITEMS]:
            source_by_id = {source.source_id: source for source in pack.sources}
            item_sources = [source_by_id[source_id] for source_id in item.source_ids]
            prefix = f"{pack.pack_id}-{pack.version}-"
            for source in item_sources:
                qualified_id = prefix + source.source_id
                sources[qualified_id] = source.model_copy(update={"source_id": qualified_id})
                if self._is_stale(source, now):
                    stale.append(f"{source.source_id} ({source.freshness_class}) requires review.")
            allowed_methods = [
                method for method in item.method_ids if method in agent.allowed_method_ids
            ]
            qualified_methods = [prefix + method_id for method_id in allowed_methods]
            methods.extend(qualified_methods)
            for method in pack.methods:
                if method.method_id in allowed_methods:
                    method_definitions[prefix + method.method_id] = method.model_copy(
                        update={
                            "method_id": prefix + method.method_id,
                            "source_ids": [prefix + source_id for source_id in method.source_ids],
                        }
                    )
                    for source_id in method.source_ids:
                        source = source_by_id[source_id]
                        sources[prefix + source_id] = source.model_copy(
                            update={"source_id": prefix + source_id}
                        )
            best_authority = max(
                item_sources, key=lambda source: AUTHORITY_SCORE[source.authority]
            ).authority
            retrieved.append(
                RetrievedKnowledge(
                    retrieval_id=f"retrieval-{pack.pack_id}-{pack.version}-{item.item_id}",
                    plane="discipline",
                    kind=(
                        "heuristic"
                        if item.kind in {"heuristic", "anti_pattern"}
                        else "professional_knowledge"
                    ),
                    statement=item.statement,
                    source_ids=[prefix + source_id for source_id in item.source_ids],
                    pack=ExpertisePackRef(pack_id=pack.pack_id, version=pack.version),
                    method_ids=qualified_methods,
                    authority=best_authority,
                    freshness_class=item.freshness_class,
                    confidence=item.confidence,
                    relevance=max(0.0, min(1.0, score / 60)),
                    selection_reason="Matched task capabilities, domain terms, source authority, and pack qualification.",
                )
            )

        project_sources = {}
        if intelligence is not None:

            def project_score(entry: KnowledgeEntry) -> int:
                return len(query_terms & _tokens(entry.statement)) * 4 + (
                    3 if entry.kind in {"user_decision", "technical_constraint"} else 0
                )

            ranked = sorted(
                intelligence.knowledge, key=lambda item: (-project_score(item), item.knowledge_id)
            )
            for entry in ranked[:MAX_PROJECT_ITEMS]:
                project_kind: RetrievedKnowledgeKind = (
                    "hypothesis"
                    if entry.kind == "hypothesis"
                    else "heuristic"
                    if entry.kind in {"agent_recommendation", "evaluation"}
                    else "project_inference"
                    if entry.kind == "inferred_fact"
                    else "human_judgment"
                    if entry.kind in {"user_decision", "production_decision"}
                    else "project_fact"
                )
                project_sources[entry.source.uri] = entry.source
                retrieved.append(
                    RetrievedKnowledge(
                        retrieval_id=f"retrieval-{entry.knowledge_id}",
                        plane="project",
                        kind=project_kind,
                        statement=entry.statement,
                        project_knowledge_id=entry.knowledge_id,
                        authority=(
                            "human_judgment"
                            if project_kind == "human_judgment"
                            else "project_source"
                        ),
                        freshness_class="version_sensitive",
                        confidence=entry.confidence,
                        relevance=min(1.0, max(0.1, project_score(entry) / 20)),
                        selection_reason="Matched current project facts, decisions, or constraints to the task.",
                    )
                )
        else:
            missing.append(
                "Project Intelligence is unavailable; no project-plane knowledge was retrieved."
            )

        for path in sorted((self.registry.directory.root / "experience").glob("*.json")):
            self.registry.directory.assert_global_path(path)
            global_lesson = GlobalExperience.model_validate_json(path.read_text(encoding="utf-8"))
            if not set(global_lesson.capability_ids) & set(capability_ids):
                continue
            if global_lesson.scope == "engine" and global_lesson.scope_constraint != project_engine:
                continue
            if (
                global_lesson.scope == "domain"
                and global_lesson.scope_constraint not in query_terms
            ):
                continue
            if sum(item.plane == "experience" for item in retrieved) >= 4:
                break
            retrieved.append(
                RetrievedKnowledge(
                    retrieval_id=f"retrieval-{global_lesson.lesson_id}",
                    plane="experience",
                    kind="heuristic",
                    statement=global_lesson.statement
                    + " Applicability: "
                    + global_lesson.applicability
                    + " Limitations: "
                    + "; ".join(global_lesson.limitations),
                    authority="human_judgment",
                    freshness_class="slow_changing",
                    confidence=global_lesson.confidence,
                    relevance=0.5,
                    selection_reason="Explicitly abstracted and human-reviewed global experience; not a universal fact.",
                )
            )
        for lesson in sorted(experience or [], key=lambda value: value.lesson_id):
            require(lesson.project_id == project_id, "project_scope_mismatch", lesson.lesson_id)
            if lesson.state != "validated" or not set(lesson.capability_ids) & set(capability_ids):
                continue
            if sum(item.plane == "experience" for item in retrieved) >= 4:
                break
            retrieved.append(
                RetrievedKnowledge(
                    retrieval_id=f"retrieval-{lesson.lesson_id}",
                    plane="experience",
                    kind="heuristic",
                    statement=lesson.statement
                    + " Applicability: "
                    + lesson.applicability
                    + " Limitations: "
                    + "; ".join(lesson.limitations),
                    source_ids=lesson.observation_ids,
                    authority="human_judgment",
                    freshness_class="slow_changing",
                    confidence=lesson.confidence,
                    relevance=0.5,
                    selection_reason="Independently validated project-local lesson matching task capabilities; not a universal rule.",
                )
            )
        for result in research or []:
            require(result.project_id == project_id, "project_scope_mismatch", result.research_id)
            if (
                result.task_id != task_id
                or result.state != "available"
                or result.source is None
                or not result.excerpt
            ):
                continue
            if self._is_stale(result.source, now):
                stale.append(
                    f"Research {result.research_id} has expired; refresh before relying on it."
                )
                continue
            if sum(item.plane == "world" for item in retrieved) >= 3:
                break
            sources[result.source.source_id] = result.source
            retrieved.append(
                RetrievedKnowledge(
                    retrieval_id=f"retrieval-{result.research_id}",
                    plane="world",
                    kind="external_fact",
                    statement=result.excerpt,
                    source_ids=[result.source.source_id],
                    authority=result.source.authority,
                    freshness_class=result.source.freshness_class,
                    confidence=0.5,
                    relevance=0.7,
                    selection_reason="Task-requested primary-source excerpt, not a verified project outcome.",
                )
            )
        if not selected:
            missing.append("No qualified expertise pack was selected for this agent and task.")
        if not any(item.plane == "discipline" for item in retrieved):
            missing.append("No discipline knowledge matched the requested capabilities.")
        plane_priority = {"project": 0, "discipline": 1, "experience": 2, "world": 3}
        retrieved.sort(
            key=lambda item: (plane_priority[item.plane], -item.relevance, item.retrieval_id)
        )
        packet_trimmed = False
        while True:
            active_method_ids = {method_id for item in retrieved for method_id in item.method_ids}
            active_methods = [
                method
                for method in method_definitions.values()
                if method.method_id in active_method_ids
            ]
            active_source_ids = {
                source_id for item in retrieved for source_id in item.source_ids
            } | {source_id for method in active_methods for source_id in method.source_ids}
            active_sources = [
                source for source_id, source in sources.items() if source_id in active_source_ids
            ]
            packet_content = json.dumps(
                {
                    "methods": [item.model_dump(mode="json") for item in active_methods],
                    "items": [item.model_dump(mode="json") for item in retrieved],
                    "sources": [item.model_dump(mode="json") for item in active_sources],
                    "project_sources": [
                        item.model_dump(mode="json") for item in project_sources.values()
                    ],
                },
                sort_keys=True,
            ).encode("utf-8")
            if len(packet_content) <= MAX_PACKET_BYTES:
                break
            require(
                bool(retrieved),
                "knowledge_packet_too_large",
                "Methods or sources exceed packet budget",
            )
            retrieved.pop()
            packet_trimmed = True
        if packet_trimmed:
            missing.append(
                f"Lower-priority knowledge was omitted to keep the packet below {MAX_PACKET_BYTES} bytes."
            )
        identity = json.dumps(
            {
                "project_id": project_id,
                "task_id": task_id,
                "agent_id": agent.agent_id,
                "capabilities": capability_ids,
                "packs": [(pack.pack_id, pack.version) for pack in selected],
                "project_digest": intelligence.workspace_digest if intelligence else None,
                "items": [item.model_dump(mode="json") for item in retrieved],
                "sources": [source.model_dump(mode="json") for source in active_sources],
                "context_package_id": context_package_id,
            },
            sort_keys=True,
        ).encode("utf-8")
        return KnowledgePacket(
            packet_id=f"knowledge-packet-{hashlib.sha256(identity).hexdigest()[:20]}",
            project_id=project_id,
            task_id=task_id,
            agent_id=agent.agent_id,
            assembled_at=now,
            capability_ids=list(dict.fromkeys(capability_ids)),
            expertise_packs=[
                ExpertisePackRef(pack_id=pack.pack_id, version=pack.version) for pack in selected
            ],
            selected_method_ids=[method.method_id for method in active_methods],
            methods=active_methods,
            items=retrieved,
            sources=active_sources,
            project_sources=list(project_sources.values()),
            missing_knowledge_flags=list(dict.fromkeys(missing)),
            stale_knowledge_flags=list(dict.fromkeys(stale)),
            project_intelligence_digest=intelligence.workspace_digest if intelligence else None,
            context_package_id=context_package_id,
        )

    @staticmethod
    def _is_stale(source: KnowledgeSource, now: str) -> bool:
        if source.fresh_until is None:
            return source.freshness_class != "stable"
        return datetime.fromisoformat(
            source.fresh_until.replace("Z", "+00:00")
        ) < datetime.fromisoformat(now.replace("Z", "+00:00"))


def fetch_primary_source(url: str) -> bytes:
    """Bounded HTTPS fetch pinned to a public address; no redirects or proxy inheritance."""
    parsed = urlsplit(url)
    hosts = {
        host.strip().lower()
        for host in os.getenv("GAMEAGENT_RESEARCH_HOSTS", "").split(",")
        if host.strip()
    }
    require(
        parsed.scheme == "https"
        and parsed.hostname in hosts
        and parsed.port in {None, 443}
        and parsed.username is None
        and parsed.password is None
        and not parsed.fragment,
        "research_source_not_allowed",
        "Configure an exact trusted HTTPS hostname in GAMEAGENT_RESEARCH_HOSTS",
    )
    assert parsed.hostname is not None
    addresses = socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)
    require(
        bool(addresses) and all(ipaddress.ip_address(row[4][0]).is_global for row in addresses),
        "research_address_not_public",
        parsed.hostname,
    )
    address = str(addresses[0][4][0])
    tls_context = ssl.create_default_context()

    class PinnedConnection(HTTPSConnection):
        def connect(self) -> None:
            sock = socket.create_connection((address, 443), timeout=15)
            try:
                self.sock = tls_context.wrap_socket(sock, server_hostname=self.host)
            except BaseException:
                sock.close()
                raise

    connection = PinnedConnection(parsed.hostname, timeout=15)
    try:
        path = parsed.path or "/"
        if parsed.query:
            path += "?" + parsed.query
        connection.request(
            "GET", path, headers={"Accept-Encoding": "identity", "User-Agent": "GAN-Research/1.0"}
        )
        response = connection.getresponse()
        require(
            response.status == 200,
            "research_http_error",
            f"HTTP {response.status}; redirects are not followed",
        )
        require(
            response.getheader("Content-Encoding", "identity") == "identity",
            "research_encoding_unsupported",
            "Expected uncompressed text",
        )
        require(
            any(
                kind in response.getheader("Content-Type", "")
                for kind in ["text/html", "text/plain"]
            ),
            "research_content_unsupported",
            "Only HTML and plain text are accepted",
        )
        content = response.read(1_000_001)
        require(len(content) <= 1_000_000, "research_response_too_large", "Limit is one megabyte")
        return content
    finally:
        connection.close()


def research_source(
    command: ResearchCommand, task: TaskContract, project_root: Path
) -> WorldResearch:
    now = _timestamp()
    identity = hashlib.sha256((command.model_dump_json() + now).encode()).hexdigest()[:24]
    base = dict(
        research_id=f"research-{identity}",
        project_id=task.project_id,
        task_id=task.task_id,
        requirement=command.requirement,
        url=command.url,
        researched_at=now,
    )
    if not task.permissions.network:
        return WorldResearch.model_validate(
            base
            | {"state": "blocked", "detail": "Task does not grant network research permission."}
        )
    try:
        content = fetch_primary_source(command.url)
        digest = hashlib.sha256(content).hexdigest()
        directory = project_root / ".gameagent" / "research"
        require(
            directory.resolve().is_relative_to(project_root.resolve()),
            "research_path_escape",
            str(directory),
        )
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / f"{digest}.txt"
        require(
            target.resolve().is_relative_to(directory.resolve()),
            "research_path_escape",
            str(target),
        )
        with tempfile.NamedTemporaryFile(dir=directory, delete=False) as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
            temporary = Path(output.name)
        try:
            try:
                os.link(temporary, target)
            except FileExistsError:
                require(target.read_bytes() == content, "research_artifact_conflict", digest)
        finally:
            temporary.unlink(missing_ok=True)
        text_content = content.decode("utf-8", errors="replace")
        text_content = re.sub(
            r"<(script|style)\b[^>]*>.*?</\1>", " ", text_content, flags=re.I | re.S
        )
        text_content = re.sub(
            r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text_content))
        ).strip()
        require(bool(text_content), "research_empty_source", command.url)
        hours = {
            "stable": 8760,
            "slow_changing": 720,
            "version_sensitive": 168,
            "policy_sensitive": 24,
            "live": 1,
        }[command.freshness_class]
        source = KnowledgeSource(
            source_id=f"source-{identity}",
            title=urlsplit(command.url).hostname or "Primary source",
            uri=command.url,
            source_type="official_documentation",
            retrieved_at=now,
            authority="official_documentation",
            freshness_class=command.freshness_class,
            fresh_until=(datetime.now(UTC) + timedelta(hours=hours))
            .isoformat()
            .replace("+00:00", "Z"),
            applicable_capability_ids=task.required_capabilities,
        )
        return WorldResearch.model_validate(
            base
            | dict(
                state="available",
                detail="Fetched an allowlisted primary source. Excerpt is untrusted source material; no global promotion.",
                source=source,
                artifact=SourceRef(
                    uri=target.relative_to(project_root).as_posix(),
                    media_type="text/plain",
                    sha256=digest,
                ),
                excerpt=text_content[:3000],
            )
        )
    except Exception as error:
        return WorldResearch.model_validate(
            base | {"state": "failed", "detail": str(error) or type(error).__name__}
        )


class KnowledgeFabric:
    def __init__(self, directory: KnowledgeDirectory) -> None:
        self.directory = directory
        self.registry = ExpertisePackRegistry(directory)
        self.registry.load()
        self.router = KnowledgeRouter(self.registry)
        self.lock = FileLock(str(directory.root / "governance.lock"), timeout=10)

    @staticmethod
    def _key(ref: ExpertisePackRef) -> str:
        return hashlib.sha256(f"{ref.pack_id}@{ref.version}".encode()).hexdigest()

    def _write_immutable(self, path: Path, data: bytes) -> None:
        self.directory.assert_global_path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            require(path.read_bytes() == data, "knowledge_record_conflict", path.name)
            return
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
            temporary = Path(output.name)
        try:
            os.link(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)

    def put_blob(self, content: bytes) -> SourceRef:
        require(len(content) <= 1_000_000, "knowledge_blob_too_large", "Limit is one megabyte")
        digest = hashlib.sha256(content).hexdigest()
        self._write_immutable(self.directory.blobs_root / digest, content)
        return SourceRef(uri=f"sha256:{digest}", media_type="text/plain", sha256=digest)

    def benchmark(self, ref: ExpertisePackRef, benchmark_id: str) -> ExpertiseBenchmarkScenario:
        candidate = self._candidate(ref)
        require(
            benchmark_id in candidate.evaluation_ids,
            "unknown_pack_benchmark",
            benchmark_id,
        )
        path = self.directory.benchmark_root / ref.pack_id / f"{benchmark_id}.yaml"
        require(path.is_file(), "pack_benchmark_missing", f"{ref.pack_id}/{benchmark_id}")
        benchmark = ExpertiseBenchmarkScenario.model_validate(
            yaml.safe_load(path.read_text(encoding="utf-8"))
        )
        require(
            benchmark.pack_id == ref.pack_id
            and benchmark.benchmark_id == benchmark_id
            and ref.version in benchmark.applies_to_versions,
            "pack_benchmark_identity_mismatch",
            f"{ref.pack_id}@{ref.version}/{benchmark_id}",
        )
        require(
            set(benchmark.capability_ids) <= set(candidate.capability_ids),
            "pack_benchmark_capability_mismatch",
            benchmark_id,
        )
        require(
            set(benchmark.acceptable_source_ids)
            <= {source.source_id for source in candidate.sources},
            "pack_benchmark_source_mismatch",
            benchmark_id,
        )
        return benchmark

    def propose_pack(self, pack: ExpertisePack) -> ExpertisePack:
        require(
            pack.state == "draft" and pack.reviewed_at is None, "draft_pack_required", pack.pack_id
        )
        require(
            re.fullmatch(r"[a-z0-9][a-z0-9-]*", pack.pack_id) is not None,
            "invalid_pack_id",
            pack.pack_id,
        )
        self.registry._validate(pack)
        ref = ExpertisePackRef(pack_id=pack.pack_id, version=pack.version)
        with self.lock:
            require(
                not any(
                    item.pack_id == pack.pack_id and item.version == pack.version
                    for item in self.registry.packs()
                ),
                "published_version_immutable",
                pack.pack_id,
            )
            self._write_immutable(
                self.directory.root / "candidates" / f"{self._key(ref)}.json",
                pack.model_dump_json(indent=2).encode(),
            )
        return pack

    def _candidate(self, ref: ExpertisePackRef) -> ExpertisePack:
        path = self.directory.root / "candidates" / f"{self._key(ref)}.json"
        self.directory.assert_global_path(path)
        require(path.is_file(), "pack_candidate_not_found", ref.pack_id)
        return ExpertisePack.model_validate_json(path.read_text(encoding="utf-8"))

    def record_audition(
        self,
        command: PackAuditionCommand,
        *,
        reviewer_id: Literal["human", "expertise-curator"] = "human",
    ) -> PackAudition:
        with self.lock:
            candidate = self._candidate(command.pack)
            require(
                command.benchmark_id in candidate.evaluation_ids,
                "unknown_pack_benchmark",
                command.benchmark_id,
            )
            evidence = self.put_blob(command.evidence_text.encode())
            digest = hashlib.sha256(candidate.model_dump_json().encode()).hexdigest()
            identity = hashlib.sha256(
                (reviewer_id + command.model_dump_json()).encode()
            ).hexdigest()
            target = self.directory.root / "auditions" / f"{identity}.json"
            if target.exists():
                return PackAudition.model_validate_json(target.read_text(encoding="utf-8"))
            audition = PackAudition(
                audition_id=f"pack-audition-{identity[:24]}",
                pack=command.pack,
                candidate_sha256=digest,
                benchmark_id=command.benchmark_id,
                baseline_score=command.baseline_score,
                candidate_score=command.candidate_score,
                evidence=evidence,
                detail=command.detail,
                recorded_at=_timestamp(),
                reviewer_id=reviewer_id,
                evidence_class="human" if reviewer_id == "human" else "heuristic",
            )
            self._write_immutable(target, audition.model_dump_json(indent=2).encode())
            return audition

    def review_pack(self, command: PackReviewCommand) -> PackReview:
        with self.lock:
            candidate = self._candidate(command.pack)
            digest = hashlib.sha256(candidate.model_dump_json().encode()).hexdigest()
            path = self.directory.root / "reviews" / f"{self._key(command.pack)}.json"
            if path.exists():
                existing = PackReview.model_validate_json(path.read_text(encoding="utf-8"))
                require(
                    existing.model_dump(
                        exclude={"schema_version", "candidate_sha256", "reviewer_id", "reviewed_at"}
                    )
                    == command.model_dump(),
                    "pack_review_immutable",
                    command.pack.pack_id,
                )
                self._publish_review(candidate, existing)
                return existing
            now = _timestamp()
            if command.decision == "approved":
                require(
                    all(
                        [
                            command.provenance_checked,
                            command.privacy_checked,
                            command.licensing_checked,
                            command.contradictions_checked,
                        ]
                    ),
                    "pack_audit_incomplete",
                    candidate.pack_id,
                )
                require(
                    all(
                        source.license and not self.router._is_stale(source, now)
                        for source in candidate.sources
                    ),
                    "pack_source_review_required",
                    candidate.pack_id,
                )
                recorded_auditions = [
                    item for item in self.catalog().auditions if item.candidate_sha256 == digest
                ]
                auditions = {
                    benchmark_id: max(
                        (item for item in recorded_auditions if item.benchmark_id == benchmark_id),
                        key=lambda item: item.recorded_at,
                        default=None,
                    )
                    for benchmark_id in candidate.evaluation_ids
                }
                require(
                    all(item is not None for item in auditions.values()),
                    "pack_audition_missing",
                    candidate.pack_id,
                )
                latest_auditions = [item for item in auditions.values() if item is not None]
                require(
                    all(item.candidate_score >= item.baseline_score for item in latest_auditions)
                    and any(
                        item.candidate_score > item.baseline_score for item in latest_auditions
                    ),
                    "pack_benchmark_regression",
                    candidate.pack_id,
                )
                require(
                    all(item.candidate_score >= 0.8 for item in latest_auditions),
                    "pack_benchmark_below_threshold",
                    candidate.pack_id,
                )
            review = PackReview(**command.model_dump(), candidate_sha256=digest, reviewed_at=now)
            self._write_immutable(path, review.model_dump_json(indent=2).encode())
            self._publish_review(candidate, review)
            return review

    def _publish_review(self, candidate: ExpertisePack, review: PackReview) -> None:
        require(
            hashlib.sha256(candidate.model_dump_json().encode()).hexdigest()
            == review.candidate_sha256,
            "reviewed_candidate_changed",
            candidate.pack_id,
        )
        if review.decision == "approved":
            trusted = candidate.model_copy(
                update={"state": "active", "reviewed_at": review.reviewed_at}
            )
            target = self.directory.packs_root / candidate.pack_id / candidate.version / "pack.yaml"
            self._write_immutable(
                target, yaml.safe_dump(trusted.model_dump(mode="json"), sort_keys=False).encode()
            )
        self.registry.load()

    def catalog(self) -> KnowledgeCatalog:
        candidates = [
            ExpertisePack.model_validate_json(path.read_text(encoding="utf-8"))
            for path in sorted((self.directory.root / "candidates").glob("*.json"))
        ]
        auditions = [
            PackAudition.model_validate_json(path.read_text(encoding="utf-8"))
            for path in sorted((self.directory.root / "auditions").glob("*.json"))
        ]
        reviews = [
            PackReview.model_validate_json(path.read_text(encoding="utf-8"))
            for path in sorted((self.directory.root / "reviews").glob("*.json"))
        ]
        now = _timestamp()
        flags = [
            f"{pack.pack_id}@{pack.version}: {source.source_id} needs freshness review"
            for pack in self.registry.packs()
            for source in pack.sources
            if self.router._is_stale(source, now)
        ]
        baseline = []
        canonical_ids = {pack.pack_id for pack in self.registry.packs()}
        draft_by_id = {pack.pack_id: pack for pack in candidates}
        for pack_id in INITIAL_EXPERTISE_PACK_IDS:
            trusted = self.registry.latest(pack_id)
            draft = draft_by_id.get(pack_id)
            baseline.append(
                ExpertiseBaselineStatus(
                    pack_id=pack_id,
                    state=(
                        "trusted"
                        if trusted is not None
                        else "unavailable"
                        if pack_id in canonical_ids
                        else "draft"
                        if draft is not None
                        else "missing"
                    ),
                    version=(
                        trusted.version if trusted is not None else draft.version if draft else None
                    ),
                )
            )
        return KnowledgeCatalog(
            packs=self.registry.packs(),
            baseline=baseline,
            candidates=candidates,
            auditions=auditions,
            reviews=reviews,
            maintenance_flags=flags,
            lifecycle=self.registry.lifecycle(),
            global_experience=[
                GlobalExperience.model_validate_json(path.read_text(encoding="utf-8"))
                for path in sorted((self.directory.root / "experience").glob("*.json"))
            ],
        )

    def maintain(self) -> KnowledgeMaintenanceReport:
        """Rebuild derived search and report review work without changing trust state."""
        with self.lock:
            self.registry.rebuild_index()
            now = _timestamp()
            stale_sources: list[str] = []
            broken_sources: list[str] = []
            deprecated_versions: list[str] = []
            titles: dict[str, tuple[str, str]] = {}
            contradictions: list[str] = []
            for pack in self.registry.packs():
                ref = f"{pack.pack_id}@{pack.version}"
                if self.registry.effective_state(pack) in {"deprecated", "expired"}:
                    deprecated_versions.append(ref)
                for source in pack.sources:
                    qualified = f"{ref}:{source.source_id}"
                    if self.router._is_stale(source, now):
                        stale_sources.append(qualified)
                    parsed = urlsplit(source.uri)
                    valid_uri = parsed.scheme in {"https", "gan", "sha256"}
                    if parsed.scheme == "sha256":
                        digest = source.uri.removeprefix("sha256:")
                        valid_uri = (
                            re.fullmatch(r"[a-f0-9]{64}", digest) is not None
                            and (self.directory.blobs_root / digest).is_file()
                        )
                    if not valid_uri:
                        broken_sources.append(qualified)
                for item in pack.items:
                    key = re.sub(r"\W+", " ", item.title.casefold()).strip()
                    previous = titles.get(key)
                    if previous is not None and previous[1] != item.statement:
                        contradictions.append(f"{previous[0]} <> {ref}:{item.item_id}")
                    else:
                        titles[key] = (f"{ref}:{item.item_id}", item.statement)
            regressions = sorted(
                {
                    f"{item.pack.pack_id}@{item.pack.version}:{item.benchmark_id}"
                    for item in self.catalog().auditions
                    if item.candidate_score < item.baseline_score
                }
            )
            report = KnowledgeMaintenanceReport(
                run_id=f"knowledge-maintenance-{uuid4()}",
                state=(
                    "attention"
                    if any(
                        [
                            stale_sources,
                            broken_sources,
                            regressions,
                            contradictions,
                            deprecated_versions,
                        ]
                    )
                    else "passed"
                ),
                rebuilt_full_text_index=True,
                stale_sources=sorted(stale_sources),
                broken_sources=sorted(broken_sources),
                benchmark_regressions=regressions,
                contradiction_candidates=sorted(set(contradictions)),
                deprecated_versions=sorted(deprecated_versions),
                ran_at=now,
            )
            target = self.directory.root / "maintenance" / "latest.json"
            target.parent.mkdir(parents=True, exist_ok=True)
            self.directory.assert_global_path(target)
            with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as output:
                output.write(report.model_dump_json(indent=2).encode())
                output.flush()
                os.fsync(output.fileno())
                temporary = Path(output.name)
            os.replace(temporary, target)
            return report

    def set_lifecycle(self, command: PackLifecycleCommand) -> PackLifecycleRecord:
        with self.lock:
            pack = next(
                (
                    item
                    for item in self.registry.packs()
                    if item.pack_id == command.pack.pack_id and item.version == command.pack.version
                ),
                None,
            )
            require(pack is not None, "pack_not_found", command.pack.pack_id)
            assert pack is not None
            if command.state == "active":
                require(
                    pack.state in {"active", "reviewed"}
                    and all(
                        not self.router._is_stale(source, _timestamp()) for source in pack.sources
                    ),
                    "pack_not_eligible_for_reactivation",
                    pack.pack_id,
                )
            record = PackLifecycleRecord(
                record_id=f"pack-state-{uuid4()}", **command.model_dump(), recorded_at=_timestamp()
            )
            self._write_immutable(
                self.directory.root / "lifecycle" / f"{record.record_id}.json",
                record.model_dump_json(indent=2).encode(),
            )
            return record

    def promote_lesson(
        self,
        command: LessonPromotionCommand,
        lesson: ExperienceLesson,
        observations: list[ExperienceObservation],
        project_name: str,
    ) -> GlobalExperience:
        require(
            lesson.state == "validated"
            and lesson.reviewer_id != lesson.proposer_id
            and lesson.scope != "user_taste",
            "validated_lesson_required",
            lesson.lesson_id,
        )
        referenced = [
            item for item in observations if item.observation_id in lesson.observation_ids
        ]
        require(
            len(referenced) == len(lesson.observation_ids)
            and len({item.task_id for item in referenced}) >= 2,
            "insufficient_lesson_evidence",
            lesson.lesson_id,
        )
        public_text = " ".join(
            [
                command.statement,
                command.applicability,
                command.scope_constraint or "",
                *command.limitations,
            ]
        ).casefold()
        forbidden = [
            lesson.project_id,
            project_name,
            *lesson.observation_ids,
            *[item.task_id for item in referenced],
        ]
        require(
            all(value.casefold() not in public_text for value in forbidden),
            "project_identity_in_global_lesson",
            "Remove project identifiers before promotion",
        )
        require(
            (command.scope == "global" and command.scope_constraint is None)
            or (command.scope != "global" and command.scope_constraint is not None),
            "experience_scope_constraint_required",
            "Domain and engine lessons require a machine-readable scope; global lessons must not have one",
        )
        identity = hashlib.sha256(command.model_dump_json().encode()).hexdigest()
        target = self.directory.root / "experience" / f"{identity}.json"
        with self.lock:
            if target.exists():
                return GlobalExperience.model_validate_json(target.read_text(encoding="utf-8"))
            global_lesson = GlobalExperience(
                lesson_id=f"global-lesson-{identity[:24]}",
                statement=command.statement,
                applicability=command.applicability,
                limitations=command.limitations,
                capability_ids=lesson.capability_ids,
                scope=command.scope,
                scope_constraint=command.scope_constraint,
                evidence_digests=[
                    hashlib.sha256(item.model_dump_json().encode()).hexdigest()
                    for item in referenced
                ],
                confidence=lesson.confidence,
                reviewed_at=_timestamp(),
            )
            self._write_immutable(target, global_lesson.model_dump_json(indent=2).encode())
            return global_lesson

    @classmethod
    def from_environment(
        cls,
        root: Path | None = None,
        builtin_root: Path | None = None,
        benchmark_root: Path | None = None,
    ) -> KnowledgeFabric:
        return cls(KnowledgeDirectory.from_environment(root, builtin_root, benchmark_root))


__all__ = [
    "ConstitutionError",
    "ExpertisePackRegistry",
    "KnowledgeDirectory",
    "KnowledgeFabric",
    "KnowledgeRouter",
]
