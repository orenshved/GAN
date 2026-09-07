# Monorepo structure (Phase 6)

```text
apps/studio/                    Next 16 / React 19 local production Studio
  app/api/daemon/              Server-only authenticated loopback proxy
  app/network.tsx              Project task dependency graph
services/daemon/
  gameagent/models/            Canonical Pydantic contracts
  gameagent/constitution.py    Pure state/authority admission rules
  gameagent/intake.py          Repository and engine inspection
  gameagent/intelligence.py    Bounded indexing, provenance and context retrieval
  gameagent/adapters/godot.py  Godot inspection, build and runtime capture
  gameagent/projects.py        Registration, watcher, reconciliation and replay
  gameagent/api.py             Authenticated REST/WebSocket service
  gameagent/codex_bridge.py    ChatGPT-authenticated Codex thread lifecycle
  gameagent/persistence/       JSONL history, Alembic, SQLite projections
  gameagent/cli.py             Project, task registration and reconciliation CLI
  gameagent/export_schema.py   Deterministic wire-schema export
  tests/                       Contract, invariant and boundary checks
  pyproject.toml, uv.lock       Python package and locked environment
packages/
  protocol/                    Generated JSON Schema, TS types, AJV shape validator
  ui/                          Semantic tokens and evidence-label primitive
  capability-registry/         Capability contract facade
  project-model/               Project, knowledge, entity, decision facade
  agent-schema/                Global definition and project assignment facade
  tool-schema/                 Tool and permission facade
  engine-adapters/             Engine-neutral adapter contract facade
  qa-schema/                   Evidence and evaluation facade
adapters/
  engines/godot/               Adapter documentation boundary
  generation/comfyui/          Reserved implementation boundary
  inference/ollama/            Reserved implementation boundary
  source-control/git/          Reserved implementation boundary
agents/builtin/                Phase 4 capability specialist roster
capabilities/ontology/         PRD section 15 capability catalog
docs/
  GREENLIGHT_HARVEST.md
  architecture/               Structure, vocabulary, invariant coverage
  decisions/                  Eight architectural decisions
  development/                Setup, checks, phase handoff
examples/                     Links to executable protocol fixtures
scripts/                      Windows-compatible dev, schema and E2E entry points
.github/workflows/ci.yml       Windows + Linux checks
```

## Ownership and dependency direction

Pydantic models → JSON Schema 2020-12 → generated TypeScript. Protocol validates
wire shape using AJV. Semantic rules requiring trusted state remain Python-owned;
shape validation is never permission to execute. Shared valid/invalid fixtures
exercise both runtimes. CI fails on generated artifact drift.

Domain facades depend only on protocol. UI depends on protocol types and React.
Studio depends on UI and protocol. Neither Studio nor domain packages may import
adapters. Python domain models contain no service, persistence or engine imports.

The facade packages deliberately contain contracts only. They are explicit
ownership boundaries, not duplicate implementations or empty agent subsystems.

The daemon's global project catalog contains resolved local roots and the active
selection only. It does not contain project history, conversation context or
creative identity. Each listed repository remains authoritative through its own
`.gameagent` history and projection.

## Phase 6 runtime

The daemon owns the official `openai-codex` SDK adapter. It selects the current
Codex executable when available, falls back to the SDK runtime, clears API-key
environment variables, and requires a ChatGPT account before dispatch.

Each initialized repository receives a managed registration section in its root
`AGENTS.md`, preserving any existing instructions. The CLI records task start,
block and completion events. Completion advances the accepted workspace baseline;
active registered work is not mislabeled as external work.

The daemon polls Git HEAD/status and meaningful file metadata while excluding its
own `.gameagent` history and generated/tool output directories. A change with no
active task creates one durable unresolved record. Reconciliation records Git
commits, a bounded diff summary, changed paths, content-addressed surviving files,
the human explanation and an associated task. Replay keeps the project unclean
until the matching reconciliation event exists. Studio presents this state and
the production browser smoke exercises the complete workflow.

Project Intelligence indexes bounded inspectable repository files without executing
discovered code. It records content-addressed documents, source, configuration and
asset references plus typed knowledge that keeps source facts, deterministic
consequences, inferences, constraints and human decisions distinct. Task context
retrieval scores only the current project's index against the task contract, returns
bounded excerpts and references, and explicitly includes zero canonical history
events. Codex workers consume this package before any targeted read-only inspection.

Studio exposes the same index and context package through authenticated loopback
routes. Index events remain canonical and rebuild into SQLite with the rest of the
project snapshot.

The Godot adapter detects a single project manifest up to three levels below the
repository root, reads its engine version and main scene, inventories `OptionButton`
nodes and imported PNG references, builds C# projects when present, and launches a
single-window capture driver. The driver advances the mapped `ui_accept` action only
until the selected control is visible, opens its real popup and saves the live
viewport as PNG. Runtime bytes and logs live under project-local `.gameagent`; the
canonical history records their digest, dimensions, scope, capture origin and the
resulting evaluation. Studio serves only recorded evidence whose current bytes match
the canonical digest.

Phase 7 generalizes the first runtime gate into a reusable QA fabric. Provider,
model-router and recruiter execution paths remain absent; no paid-provider call path
exists in Phase 6.

## Wire conventions

Snake_case fields, schema_version 1, stable opaque lowercase identifiers,
semantic package versions, UTC timestamps, integer USD cents, explicit nullable
values and unknown-field rejection. Lists remain ordinary JSON arrays. Engine
and medium IDs are extensible. `Project.medium` and `Project.rendering` flatten
the PRD's illustrative one-field wrappers; all required concepts are retained.

The event union uses event_type discriminators and typed payloads. Adding an
event type requires a schema change and replay tests in Phase 1. Unknown versions
fail closed; historical upcasters must never rewrite canonical old event files.

Runtime handlers must validate references, dates, actor identity, context scope,
and authorization against trusted canonical/projected state. Validation cannot
authenticate an actor, prove a screenshot exists, or prove a provider cap by itself.

## Version choices

Registry inspection on 2026-09-06 found Next 16.3.4 and Turbo 2.10.12. Both are
pinned; React 19 and all transitive dependencies are locked. Next 16 is Active LTS
per https://nextjs.org/support-policy. Python targets 3.12+; uv locks dependencies.
The installed local Python is 3.14; CI also checks the 3.12 baseline.
