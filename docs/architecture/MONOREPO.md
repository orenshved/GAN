# Proposed monorepo structure (Phase 0 baseline)

```text
apps/studio/                    Next 16 / React 19 foundation validation page
services/daemon/
  gameagent/models/            Canonical Pydantic contracts
  gameagent/constitution.py    Pure state/authority admission rules
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
scripts/                      Windows-compatible Node entry points
.github/workflows/ci.yml       Windows + Linux foundation checks
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

## Planned additions, not implemented in Phase 0

Phase 1 adds `gameagent/api`, `events`, `persistence`, a CLI package,
FastAPI, SQLAlchemy and Alembic; event replay, SQLite WAL and query/stream APIs.
Phase 2 adds `gameagent/codex` and the official `openai-codex` dependency.
Later phases add `gm`, `orchestration`, `providers`, `qa`, `recruiter`,
`reconciliation`, and engine adapters when their workflows can be tested.
TanStack Query, React Flow, Tailwind and inspectable interactive primitives are
introduced with the real Studio shell; no unused frontend dependencies now.

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
