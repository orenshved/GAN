# ADR 0011: Production domains ship as evidence-backed vertical slices

Status: accepted and implemented in Phase 11.

## Context

GAN's ontology names the full production lifecycle, but capability names alone do
not make a discipline operational. The PRD requires each additional discipline to
ship its contract, tools, QA, evidence, task history and frontend representation
together. It also warns against treating model opinion or superficial file
inventory as proof of creative quality or fun.

## Decision

Phase 11 adds gameplay, level design, art, audio and narrative through one
extensible production-domain contract. Each domain declares its capabilities,
accepted project formats, built-in read-only audit tool and discipline QA gate.
The daemon scans a bounded set of project files without following symlinks or
executing discovered code, validates format-specific structure, writes a
content-addressed evidence manifest, records the evaluation, and appends a
task-scoped `production_domain.inspected` event.

Gameplay and narrative source checks, and level-scene checks, are deterministic.
Art and audio metadata checks are measured. A passing result means only that the
matched material is structurally readable. It does not prove behavior, balance,
navigation, aesthetics, animation quality, mix quality, continuity, tone or fun.
Those claims continue to require the stronger evidence policies defined by the QA
fabric and human judgment.

Studio exposes the daemon-owned domain and tool catalog, task selection, latest
status, findings, content-addressed evidence and run history. No discipline state
is fabricated in the browser.

## Consequences

New domains can follow the same contract without adding enum-driven orchestration
logic. Audit tools remain engine-neutral and cost-free, but format coverage is
deliberately conservative. Unsupported or absent assets produce an inconclusive
result rather than a false pass. Domain-specific execution and subjective QA can
be layered later without changing canonical history.

## Validation

Tests cover all five domain definitions, installed read-only tool contracts,
format-specific success, invalid audio failure, evidence and evaluation recording,
canonical replay, task-scoped history and the authenticated Studio API. The
Playwright smoke runs a level-design audit through Studio and verifies the visible
recorded result.
