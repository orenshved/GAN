# Monorepo structure (Phases 7–12)

```text
apps/studio/                    Next 16 / React 19 local production Studio
  app/api/daemon/              Server-only authenticated loopback proxy
  app/network.tsx              Project task dependency graph
apps/desktop/                   Electron lifecycle and browser-security shell
services/daemon/
  gameagent/models/            Canonical Pydantic contracts
  gameagent/constitution.py    Pure state/authority admission rules
  gameagent/intake.py          Repository and engine inspection
  gameagent/intelligence.py    Bounded indexing, provenance and context retrieval
  gameagent/knowledge.py       Global pack registry, FTS and Knowledge Router
  gameagent/qa.py              Reusable gate policies and derived QA reports
  gameagent/local_models.py    Hardware/Ollama inventory, benchmarks and routing
  gameagent/providers.py       Secure credentials, paid adapters and execution gateway
  gameagent/recruiter.py       Capability gaps, auditions and global admission
  gameagent/production_domains.py Read-only discipline tools and evidence assembly
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
  qa-schema/                   Evidence, evaluation, gate, waiver and report facade
adapters/
  engines/godot/               Adapter documentation boundary
  generation/comfyui/          Reserved implementation boundary
  inference/ollama/            Reserved implementation boundary
  source-control/git/          Reserved implementation boundary
agents/builtin/                Phase 4 capability specialist roster
expertise/builtin/             Reviewed versioned Expertise Pack manifests
capabilities/ontology/         PRD section 15 capability catalog
docs/
  GREENLIGHT_HARVEST.md
  architecture/               Structure, vocabulary, invariant coverage
  decisions/                  Accepted architectural decisions
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

## Production runtime

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

The Knowledge Fabric keeps curated professional expertise in a configurable global
directory while Project Intelligence remains project-local. Reviewed, versioned
Expertise Pack manifests are canonical; SQLite FTS is derived and contains no
project content. The Knowledge Router assembles bounded task packets whose project,
discipline, world and experience items retain distinct provenance. Workers and the
Agent Inspector expose exact pack versions, selected methods, freshness and missing
knowledge. Automated experience promotion and Pack Builder research remain paused.

The Godot adapter detects a single project manifest up to three levels below the
repository root, reads its engine version and main scene, inventories `OptionButton`
nodes and imported PNG references, builds C# projects when present, and launches a
single-window capture driver. The driver advances the mapped `ui_accept` action only
until the selected control is visible, opens its real popup and saves the live
viewport as PNG. Runtime bytes and logs live under project-local `.gameagent`; the
canonical history records their digest, dimensions, scope, capture origin and the
resulting evaluation. Studio serves only recorded evidence whose current bytes match
the canonical digest.

Phase 7 generalizes the first runtime capture into a reusable UI/engineering gate
catalog covering all five evidence classes. It records deterministic contract
checks and human reviews as content-addressed evidence, persists explicit human
waivers, and derives reports from canonical history. Advisory probation passes
remain visible but cannot satisfy a required gate. The Phase 10 recruiter can
expand evaluator availability without changing evidence truth.

Phase 8 adds a first-class Local Model Expert. Machine hardware and installed
Ollama models are inspected live, while task-specific benchmark and routing records
remain canonical project events. Local qualification pins the current model digest,
memory fit and a passing representative contract benchmark. Studio compares local,
authenticated Codex, deterministic, paid and wait paths with explicit quality,
confidence, runtime and cost rationale.

Phase 9 adds the only paid-provider execution boundary. Provider configuration,
verified cap evidence, scoped approvals, upper-bound reservations and invocation
summaries are canonical events. Reservation admission replays and appends under the
same cross-process project lock, so concurrent requests cannot overspend the
aggregate monthly budget. Ambiguous outcomes retain their full reservation across
restart; idempotent retries never repeat an in-flight or recorded invocation.
Credential values live only in the operating system credential store. The Studio
Providers workspace exposes readiness and ledger state without receiving secrets
back from the daemon.

Phase 11 adds bounded read-only vertical slices for gameplay, level design, art,
audio and narrative. Each domain publishes a versioned definition and independent
tool contract, produces content-addressed project evidence, evaluates a
discipline-specific technical gate, and records a canonical task-scoped inspection
event. The scans validate discoverability and structural readability only. They do
not execute discovered code or claim creative quality, behavior, continuity, mix
quality or fun. Studio presents the same definitions, tool health, evidence and run
history returned by the daemon.

Phase 12 packages the existing local architecture without moving authority into the
desktop layer. Electron verifies and extracts a content-addressed Next.js standalone
archive, launches Studio and the PyInstaller daemon on loopback, loads a random or
configured bearer token, denies remote navigation and browser permissions, and owns
child-process shutdown. The same daemon bundle is copied to a headless distribution,
so project initialization, status, rebuild, task registration, reconciliation and
serving remain available without Electron. The first distribution target is Windows
x64.

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
