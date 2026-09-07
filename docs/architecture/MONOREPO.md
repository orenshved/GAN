# Monorepo structure (Phase 3)

```text
apps/studio/                    Next 16 / React 19 local production Studio
  app/api/daemon/              Server-only authenticated loopback proxy
  app/network.tsx              Project task dependency graph
services/daemon/
  gameagent/models/            Canonical Pydantic contracts
  gameagent/constitution.py    Pure state/authority admission rules
  gameagent/intake.py          Repository and engine inspection
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
  engines/godot/               Reserved implementation boundary
  generation/comfyui/          Reserved implementation boundary
  inference/ollama/            Reserved implementation boundary
  source-control/git/          Reserved implementation boundary
agents/builtin/                Roster deferred to Phase 4
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

## Phase 3 runtime

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

Later phases add `gm`, `orchestration`, `providers`, `qa`, `recruiter`, project
intelligence and engine adapters when their workflows can be tested. No engine
execution or paid-provider call path exists in Phase 3.

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
