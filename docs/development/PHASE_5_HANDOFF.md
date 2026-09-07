# Phase 5 handoff

Phase 5 implements persistent Project Intelligence and targeted context assembly
without beginning the Cosmic Meltdown production workflow owned by Phase 6.

## Delivered

- Bounded, deterministic indexing for repository documents, source files,
  configuration, and multimodal asset references. Generated/build directories,
  GAN history, symlinks, oversized files, and unknown formats fail closed or remain
  outside the index.
- Content-addressed `ProjectIntelligence`, `IndexedResource`, `KnowledgeEntry`, and
  `ContextPackage` contracts generated from Pydantic into JSON Schema and TypeScript.
- Explicit source facts, deterministic consequences, inferred facts, technical
  constraints, and resolved Director decisions with confidence and provenance.
- Task-scoped retrieval that ranks task terms, capabilities, design excerpts, asset
  paths, knowledge, and decisions while bounding selected context.
- A hard contract field proving canonical event history is not embedded in worker
  context. Indexed repository content is treated as untrusted project data.
- Canonical `project.intelligence_indexed` events with deterministic replay,
  restart, idempotency, and SQLite rebuild behavior.
- Authenticated daemon routes for index inspection, refresh, and task-context
  assembly. Codex workers consume the targeted package before optional read-only
  file inspection.
- A Studio Project Intelligence screen showing indexed resources, knowledge kinds,
  confidence, provenance, and an inspectable context-package preview.
- Safe project removal from the Studio catalog with explicit confirmation, active
  project fallback, last-project protection, and no repository-file deletion.

## Acceptance

Tests create a repository with relevant design guidance, a UI asset, unrelated
source files, and a resolved Director decision. Retrieval selects the relevant
materials, carries the decision, excludes most indexed resources, includes zero
history events, survives replay/rebuild, and reaches Studio through the authenticated
proxy. The production Playwright smoke exercises indexing and context assembly.
It also switches between local projects and removes the active project while
preserving its repository on disk.

## Boundary

Phase 6 has not started. There is no Godot scene inspection, asset generation or
modification, runtime game launch/capture, UI implementation, iterative visual QA,
or Cosmic Meltdown-specific production logic.

## Verification

Formatting, lint, protocol drift, TypeScript/Python type checks, 130 daemon tests,
50 cross-language protocol cases, all builds, and the Studio-to-daemon Playwright
smoke pass.

## Live preview

[Open the verified GAN Studio preview](http://127.0.0.1:4242/). The local daemon
and Studio are left running for Director review.
