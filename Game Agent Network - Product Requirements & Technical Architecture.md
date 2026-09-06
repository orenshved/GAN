# GAME AGENT NETWORK

## Product Requirements Document & Technical Architecture

**Working name:** Game Agent Network  
**CLI/package namespace:** `gameagent` / `@gameagent/*`  
**Status:** Build specification  
**Primary initial test project:** Cosmic Meltdown  
**Product category:** Local-first AI game-production orchestration system  
**Primary user role:** Game Director / Creative Director / Product Owner  
**Core implementation principle:** Humans own intent and judgment. Game Agent Network owns the production complexity required to act on them.

---

# 1. Executive Summary

Game Agent Network, abbreviated in this document as **GAN**, is a persistent AI production operating layer for creating games.

GAN is not a single coding agent, game engine plugin, image generator, project-management dashboard, or collection of role-playing AI personas.

GAN is an orchestration system in which a persistent **GM Agent** understands the project, decomposes user intent into production work, identifies the capabilities required, assigns work to appropriate specialist agents, manages dependencies, evaluates outputs, integrates successful work, records project state, and hires new specialist agents when the current network lacks a required capability.

The user should be able to operate primarily at the level expected of a Game Director or Creative Director:

> “This UI feels cheap.”

> “Players don't understand what they're supposed to do here.”

> “This weapon needs to feel much more powerful.”

> “I need an asset here that fits the game.”

> “This conversation contradicts something we established earlier.”

> “This section isn't fun.”

GAN must translate those judgments into appropriate multidisciplinary production work.

The first north-star workflow is:

> **“I need a UI asset here that matches the theme, style, UX and technical specifications. Generate and implement it.”**

GAN must be capable of inspecting the project, understanding the selected context, determining UX and art requirements, retrieving relevant project references, generating or modifying the asset, implementing it in the game, launching the game, capturing the actual result, validating it using real QA evidence, iterating if necessary, and presenting the completed work.

The architecture must support games regardless of:

- scope,
- engine,
- platform,
- visual style,
- dimensionality,
- business model,
- multiplayer model,
- medium,
- production size,
- or format.

Not every capability must exist in version 1. The architecture must allow capabilities and specialists to be added dynamically without redesigning the core system.

---

# 2. Product Thesis

The fundamental abstraction is:

**Intent → Production Plan → Capabilities → Agents → Tools → Evidence → Integration**

GAN exists because current AI development workflows require the user to repeatedly translate creative intent into implementation-specific instructions.

For example, the user currently might need to specify:

- which asset needs changing,
- which generator to use,
- correct dimensions,
- file format,
- transparency,
- visual references,
- destination directory,
- engine import settings,
- scene or prefab changes,
- scaling/filtering rules,
- runtime validation,
- and subsequent corrections.

GAN should know or discover these things itself.

The user says:

> “That dropdown looks generic. Replace it with something that belongs in this game.”

GAN owns everything beneath that instruction.

---

# 3. Human Role

The user owns:

- intent,
- taste,
- creative direction,
- priorities,
- final judgment,
- strategic scope decisions,
- and explicit overrides.

GAN owns:

- production decomposition,
- production coordination,
- capability discovery,
- implementation details,
- specialist selection,
- dependency management,
- technical execution,
- routine production decisions,
- QA orchestration,
- project-state tracking,
- and escalation when necessary.

Passing automated QA does **not** mean the user must like a result.

User rejection always overrides automated scores.

Human feedback becomes evidence used by GAN in future evaluations.

---

# 4. Product Principles

## 4.1 GM-centric orchestration

The GM Agent is the central authority.

Workers do not independently reprioritize the project, change scope, hire other workers, or make major project decisions.

Specialists may publish:

- completed work,
- findings,
- blockers,
- requests,
- dependencies,
- evaluations,
- or capability gaps.

The GM decides what happens next.

Worker-to-worker dependencies are represented in GAN state, but production authority remains centralized in the GM.

---

## 4.2 Agents are capability packages, not personalities

An agent is a versioned production capability definition.

An agent definition contains:

- capabilities,
- instructions,
- preferred models,
- allowed fallback models,
- tools,
- permissions,
- required inputs,
- expected outputs,
- evaluation requirements,
- resource policies,
- and performance history.

Avoid simulated organizational theater.

Do not create arbitrary CEO, CTO, Senior Artist, Junior Designer, etc. personas unless they correspond to useful production capabilities.

The system should prefer the minimum sufficient specialist composition for a task.

---

## 4.3 Tools are separate from agents

An agent uses tools.

A tool is not an agent.

Examples:

- Godot,
- Unity,
- Unreal,
- Blender,
- ComfyUI,
- Aseprite,
- Photoshop,
- filesystem,
- Git,
- GitHub,
- terminal,
- browser,
- local inference servers,
- audio tooling,
- build systems,
- test harnesses.

The GM assigns a capable agent and gives it access only to appropriate tools.

---

## 4.4 Layers, not simplified modes

Every major GAN interface follows progressive disclosure.

The user sees the highest useful level first and can continuously drill downward.

Example:

Project Health  
→ Milestone  
→ Task  
→ Agent  
→ Subtask  
→ Action  
→ Tool invocation  
→ Raw evidence/log

There should not be a separate “simple dashboard” containing different truth from the detailed system.

Each lower level explains the level above it.

---

## 4.5 Project state must remain explicit

Important project knowledge must not live exclusively inside model context.

Project truth must be represented through durable structured state.

GAN must distinguish between:

- source facts,
- inferred facts,
- production decisions,
- user decisions,
- technical constraints,
- hypotheses,
- agent recommendations,
- evaluations,
- and evidence.

---

## 4.6 Opinionated, not obedient by default

GAN should push back when appropriate.

Examples:

- requested implementation conflicts with the project's art direction,
- proposed feature substantially increases scope,
- a request creates accessibility problems,
- requested architecture introduces unnecessary complexity,
- a user suggestion conflicts with a previously locked decision,
- a cheaper or simpler implementation accomplishes the same intent,
- the project is missing information required for responsible implementation.

Pushback should explain:

1. what GAN sees,
2. why it matters,
3. GAN's recommendation.

Explicit user override wins and must be recorded as a decision.

---

# 5. Product Surfaces

GAN consists of five conceptual layers.

## 5.1 Game Agent Network Framework

Portable repo-level project protocol.

Each participating game contains a `.gameagent/` directory.

The project remains usable without GAN Studio.

---

## 5.2 GAN Daemon

Persistent local orchestration service.

Responsibilities include:

- project state,
- GM runtime,
- worker lifecycle,
- Codex bridge,
- capability matching,
- job execution,
- provider routing,
- budget enforcement,
- event ingestion,
- reconciliation,
- local model routing,
- QA coordination,
- and frontend event streaming.

---

## 5.3 GAN Studio

Professional local frontend.

Default local address:

`http://localhost:4242`

GAN Studio is the user's production desk.

It must not be a thin chat wrapper.

---

## 5.4 Worker Providers

Initial primary worker provider:

**Codex authenticated through the user's existing ChatGPT/Codex session.**

This path must not require an OpenAI API key.

Other worker/model providers may later include:

- local LLMs,
- local vision models,
- hosted model APIs,
- image-generation systems,
- audio models,
- specialist services.

---

## 5.5 Tool / Engine Adapters

Adapters expose external applications and project environments to agents through stable GAN capabilities.

The GAN core must not contain Godot-specific logic.

---

# 6. No-API-Key Codex Architecture

The primary Codex integration must use authenticated Codex sessions rather than OpenAI API billing.

GAN Daemon must integrate with the official Codex SDK.

Requirements:

- reuse an existing authenticated Codex session when available,
- support browser ChatGPT login,
- support device-code login where necessary,
- expose login/account state to GAN Studio,
- start persistent Codex threads,
- resume persistent threads,
- configure working directory,
- configure sandbox permissions,
- request structured output,
- interrupt/steer active work where supported,
- persist thread IDs inside GAN project state.

Codex threads must be scoped to projects.

A global agent definition may be reused across projects, but model conversation memory must never accidentally mix project-specific context.

Example:

Global agent:

`godot-ui-implementer-v3`

Project assignment:

`Cosmic Meltdown / godot-ui-implementer-v3 / thread ABC`

Another project receives its own thread.

---

# 7. Canonical Architecture

```text
                         USER
                          │
                          ▼
                    GAN STUDIO
                          │
                          ▼
                    GAN DAEMON
                          │
                          ▼
                      GM AGENT
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
    Capability       Project Model      QA Fabric
     Registry
          │               │                │
          └───────────────┼────────────────┘
                          │
                          ▼
                    Task Contracts
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Codex         Local AI     Tools
         Workers        Services      /Apps
             │            │            │
             └────────────┼────────────┘
                          ▼
                       Project
                          │
                          ▼
                       Evidence
                          │
                          ▼
                         GM
                          │
                 pass / retry / hire /
                  escalate / integrate
```

---

# 8. Recommended Technical Stack

The implementation should be portfolio-quality and use a professional, modern, maintainable stack.

## 8.1 Monorepo

Use:

- `pnpm`
- Turborepo
- strict TypeScript where applicable
- workspace packages
- deterministic lockfile

---

## 8.2 GAN Studio

Use:

- Next.js 16.3.x or current compatible Active LTS
- React 19
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui or similarly inspectable component primitives
- React Flow 12.11.x or current compatible stable version
- TanStack Query
- lightweight local UI state store such as Zustand where appropriate

Do not use Redux unless a concrete requirement emerges.

Do not build the project around experimental framework features without justification.

---

## 8.3 GAN Daemon

Use:

- Python 3.12+
- FastAPI
- Pydantic
- SQLAlchemy or SQLModel
- Alembic migrations
- official OpenAI Codex Python SDK
- asyncio-based worker orchestration

Reasons for Python daemon:

- official explicit Codex ChatGPT authentication API,
- local AI ecosystem compatibility,
- model evaluation tooling,
- image/audio/data tooling,
- strong async service ecosystem.

---

## 8.4 Operational State

Use SQLite in WAL mode for the local operational database.

SQLite contains:

- indexes,
- current state projections,
- search data,
- session metadata,
- performance metrics,
- cached query results.

SQLite is **not** the only durable project history.

It must be possible to rebuild the operational database from canonical project files/event history.

Design repository persistence so Postgres can be introduced later without changing domain interfaces.

---

## 8.5 Live frontend events

Use WebSockets between GAN Daemon and GAN Studio for:

- task status,
- agent status,
- event feed,
- decisions,
- worker streaming,
- QA progress,
- provider/budget alerts.

REST endpoints remain available for ordinary CRUD/query operations.

---

## 8.6 Desktop packaging

Do not make desktop packaging a blocker for initial development.

GAN Studio initially runs locally in the browser.

Once core functionality stabilizes, package Studio + Daemon using Tauri 2 or equivalent.

Tauri packaging must not replace or tightly couple the core local service architecture.

---

# 9. Repository Structure

```text
GameAgentNetwork/
│
├── apps/
│   └── studio/
│
├── services/
│   └── daemon/
│       ├── gameagent/
│       │   ├── api/
│       │   ├── gm/
│       │   ├── orchestration/
│       │   ├── codex/
│       │   ├── providers/
│       │   ├── models/
│       │   ├── qa/
│       │   ├── recruiter/
│       │   ├── reconciliation/
│       │   ├── persistence/
│       │   └── events/
│       └── tests/
│
├── packages/
│   ├── protocol/
│   ├── ui/
│   ├── capability-registry/
│   ├── project-model/
│   ├── agent-schema/
│   ├── tool-schema/
│   ├── engine-adapters/
│   └── qa-schema/
│
├── adapters/
│   ├── engines/
│   │   └── godot/
│   ├── generation/
│   │   └── comfyui/
│   ├── inference/
│   │   └── ollama/
│   └── source-control/
│       └── git/
│
├── agents/
│   └── builtin/
│
├── capabilities/
│   └── ontology/
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── development/
│   └── portfolio/
│
├── examples/
│
├── scripts/
│
├── AGENTS.md
├── README.md
└── package.json
```

---

# 10. Per-project Structure

A GAN-enabled project contains:

```text
.gameagent/
│
├── project.yaml
├── policy.yaml
├── agents.lock.json
├── events/
│   ├── events-0001.jsonl
│   └── ...
│
├── decisions/
├── contracts/
├── evaluations/
├── references/
└── manifests/
```

Do not commit SQLite databases.

---

# 11. Event-Sourced Project History

Project history must use an append-only structured event stream.

Events are canonical durable production history.

SQLite stores projections derived from these events.

Every event contains at minimum:

```json
{
  "schema_version": 1,
  "event_id": "evt_...",
  "project_id": "project_...",
  "timestamp": "...",
  "event_type": "...",
  "actor_type": "human|gm|agent|system|external",
  "actor_id": "...",
  "correlation_id": "...",
  "task_id": "...",
  "payload": {}
}
```

Examples:

- `task.created`
- `task.started`
- `task.blocked`
- `task.completed`
- `agent.assigned`
- `agent.failed`
- `agent.hired`
- `evaluation.started`
- `evaluation.failed`
- `evaluation.passed`
- `decision.requested`
- `decision.resolved`
- `artifact.created`
- `artifact.modified`
- `git.commit.created`
- `project.external_change_detected`
- `project.reconciled`
- `provider.spend_recorded`
- `provider.disabled`
- `gm.challenge_raised`

Event files may rotate after a configurable size.

History must remain diffable and Git-friendly.

---

# 12. Project Model

Every project must expose structured information about itself.

Minimum fields:

```yaml
project:
  id:
  name:
  description:

medium:
  type:
  # examples:
  # digital_game
  # tabletop
  # mixed_media
  # interactive_installation

engine:
  type:
  version:

dimensions:
  rendering:
  # 2d / 2.5d / 3d / non_applicable

platforms: []

input_methods: []

multiplayer:
  type:
  max_players:

visual:
  direction:
  references: []

audio:
  direction:
  references: []

production:
  stage:
  team_size:
  current_milestone:

constraints: []

locked_decisions: []
```

An engine is optional.

GAN architecture must not assume every game is a digital software project.

---

# 13. Project Intelligence

GAN must continuously build a structured understanding of the project from:

- repository files,
- design documents,
- PRDs/GDDs,
- code,
- scenes,
- prefabs,
- assets,
- screenshots,
- videos,
- audio,
- Git history,
- prior tasks,
- user decisions,
- issue trackers,
- build results,
- QA results,
- agent findings.

Knowledge entries must track:

- source,
- confidence,
- type,
- timestamp,
- relevant entities,
- evidence,
- superseded state.

GAN must never silently convert inference into fact.

---

# 14. Greenlight Harvest

Before recreating foundational UI/logic, inspect the existing Greenlight Studio codebase when available.

Create:

`docs/GREENLIGHT_HARVEST.md`

For each potentially reusable component/pattern, classify it as:

- reuse directly,
- extract and generalize,
- conceptually reuse but reimplement,
- reject.

Prioritize inspection of Greenlight's:

- Knowledge Map,
- node/edge data structures,
- focused-neighborhood graph behavior,
- Inspector UX,
- Advisor/context panel patterns,
- project intelligence model,
- dependency tracing,
- approval gates,
- evidence/provenance presentation,
- audit history,
- provider routing concepts,
- loading/error states,
- design system.

Preserve Greenlight's useful conceptual separation between:

- source facts,
- deterministic consequences,
- AI inference,
- evidence,
- human decisions.

Do **not** inherit Greenlight infrastructure merely because it exists.

Specifically, do not automatically retain:

- Supabase,
- n8n,
- Express relay,
- provider-specific implementation,
- film/TV assumptions.

GAN is local-first and daemon-driven.

---

# 15. Capability Ontology

GAN must use capabilities rather than hard-coded role names.

Capability families must support the full game-production lifecycle.

Initial ontology should define, at minimum:

## Direction / Production

- game_direction
- creative_direction
- product_strategy
- production_planning
- milestone_planning
- dependency_management
- scope_management
- risk_management
- documentation
- asset_tracking
- build_coordination

## Game Design

- systems_design
- mechanics_design
- combat_design
- economy_design
- progression_design
- balance_design
- encounter_design
- level_design
- puzzle_design
- multiplayer_design
- social_design
- onboarding_design
- tutorial_design
- accessibility_design
- retention_design
- liveops_design

## Narrative

- narrative_design
- worldbuilding
- character_writing
- dialogue_writing
- interactive_dialogue
- quest_design
- cinematic_writing
- continuity_review
- lore_management
- localization_ready_writing

## UX

- ux_architecture
- interaction_design
- menu_design
- hud_design
- controller_navigation
- onboarding_ux
- accessibility_ux
- usability_analysis
- player_feedback_design

## Art

- art_direction
- concept_art
- visual_development
- ui_art
- pixel_art
- illustration
- character_art
- environment_art
- prop_art
- texture_creation
- material_creation
- animation
- rigging
- vfx
- lighting
- cinematics
- technical_art

## Engineering

- gameplay_engineering
- engine_architecture
- tooling
- editor_extensions
- ui_engineering
- game_ai
- physics
- networking
- backend
- persistence
- procedural_generation
- performance
- shader_engineering
- platform_integration
- build_engineering

## Audio

- audio_direction
- composition
- adaptive_music
- sound_design
- ambience
- dialogue_audio
- vo_pipeline
- audio_implementation
- mixing
- mastering

## QA

- functional_testing
- regression_testing
- gameplay_testing
- balance_testing
- ux_testing
- automated_testing
- visual_regression
- compatibility_testing
- performance_testing
- save_compatibility
- multiplayer_testing
- localization_qa
- accessibility_qa

## Product / Data

- telemetry_design
- analytics
- experimentation
- economy_analysis
- balance_simulation
- funnel_analysis
- ab_testing
- crash_analysis

## Shipping

- localization
- ratings_compliance
- accessibility_compliance
- achievements
- platform_certification
- store_assets
- packaging
- patching
- deployment
- release_management

## Post-launch / Commercial

- monetization
- live_operations
- community_support
- publishing_support
- marketing_assets
- trailers
- screenshots
- store_copy
- patch_notes
- customer_support
- player_sentiment_analysis

Additional capabilities must be addable without modifying GM core logic.

---

# 16. Agent Definition

Canonical conceptual schema:

```yaml
agent:
  id:
  name:
  version:
  description:

capabilities:
  - capability_id

instructions:
  base:
  constraints:

models:
  preferred:
  alternatives: []

tools:
  allowed: []

permissions:
  filesystem:
  network:
  install_software:
  modify_code:
  modify_assets:
  modify_project_settings:
  git_commit:
  git_merge:

inputs:
  required: []

outputs:
  contract:

evaluation:
  required_gates: []

resource_policy:
  local_preferred:
  max_external_cost:

status:
  probationary:
```

Agent definitions are global.

Project-specific assignments are separate objects.

---

# 17. Global Agent Registry

When GAN hires a useful agent, that agent automatically becomes available to all future projects.

Global availability does not mean automatic usage.

The GM must select agents based on capability relevance.

Registry stores performance by:

- capability,
- project,
- task type,
- model,
- toolchain,
- quality score,
- revision count,
- failure rate,
- human rejection rate,
- cost,
- latency.

A specialist can perform very differently across capabilities.

Do not reduce agent quality to one global score.

---

# 18. Task Contracts

Every meaningful unit of production work must have a task contract.

Minimum structure:

```yaml
task:
  id:
  title:
  objective:
  parent_task:
  priority:

context:
  project:
  entities:
  references:

required_capabilities: []

requirements:
  functional: []
  visual: []
  technical: []
  accessibility: []
  production: []

constraints: []

deliverables: []

dependencies: []

permissions: {}

validation:
  required_evaluations: []

escalation:
  criteria: []
```

Tasks must specify **outcome**, not merely worker instructions.

---

# 19. Task State Machine

Canonical states:

```text
PROPOSED
   ↓
QUEUED
   ↓
READY
   ↓
RUNNING
   ↓
┌───────────────┐
│               │
BLOCKED       REVIEW
│               │
│          ┌────┴────┐
│          ▼         ▼
│       FAILED      PASSED
│          │          │
│          ▼          ▼
└──────→ RETRY     INTEGRATE
                       │
                       ▼
                    COMPLETE
```

Additional terminal states:

- cancelled,
- superseded.

Human-decision dependency uses:

`NEEDS_HUMAN`

---

# 20. GM Execution Loop

For every user objective:

1. interpret intent,
2. retrieve relevant project context,
3. identify ambiguity,
4. push back if necessary,
5. determine required outcomes,
6. decompose into tasks,
7. identify required capabilities,
8. search global agent registry,
9. assign agents,
10. construct minimal context package,
11. execute,
12. collect artifacts/evidence,
13. run required QA,
14. determine progress,
15. retry, switch approach, or hire when needed,
16. escalate when required,
17. integrate successful work,
18. update project state,
19. summarize at appropriate user-visible layer.

The GM should not send the entire project context to every worker.

Context must be assembled per task.

---

# 21. GM Authority Setting

Expose a three-level slider.

## Level A — Ask First

GM recommends actions but requests approval before materially changing the project.

## Level B — Recommend + Proceed Unless Stopped

**DEFAULT.**

GM tells the user what it recommends and begins work unless the action meets mandatory escalation criteria.

## Level C — Autonomous Within Policy

GM may independently make ordinary production decisions within explicit safety/budget/creative boundaries.

No authority level overrides mandatory escalation categories.

---

# 22. GM Proactivity Setting

Expose a separate three-level slider.

## Level A — Reactive

GAN acts only on explicit user objectives and required dependency work.

## Level B — Balanced

GAN surfaces meaningful adjacent problems discovered during work.

## Level C — Active

GAN proactively analyzes the project and may create findings/tasks for quality, technical, UX, design, production, or consistency problems.

Creation of proactive findings does not automatically imply permission to implement them.

Authority setting determines execution behavior.

---

# 23. Mandatory Human Escalation

Escalate when a decision materially affects:

- creative intent,
- project scope,
- money above configured threshold,
- irreversible project structure,
- external/public exposure,
- player-facing behavior where no prior rule resolves the choice.

Escalation should be rare and useful.

Do not ask the user to approve routine implementation details.

---

# 24. Decision Inbox

GAN Studio contains a dedicated **Needs Oren** surface.

Decision cards contain:

- decision title,
- why it matters,
- affected tasks,
- available options,
- GM recommendation,
- consequences,
- urgency,
- supporting evidence,
- ability to discuss before resolving.

Example:

```text
CONTROLLER BEHAVIOR

Current implementation allows focus to wrap
from Player 4 back to Player 1.

Option A — Wrap
Option B — Stop at edge

GM Recommendation: A

Why:
Matches existing menu navigation behavior.

[Choose A]
[Choose B]
[Discuss]
```

---

# 25. Agent Hiring / Recruiter

Agent hiring is a core subsystem.

When required capabilities cannot be satisfied reliably, create a:

`CAPABILITY_GAP`

Recruiter workflow:

```text
Capability gap
      ↓
Search global roster
      ↓
Search adjacent capabilities
      ↓
Can existing agent be augmented?
      ↓
Search trusted available tools/skills
      ↓
Compose candidate agent
      ↓
Need new third-party software?
      ↓
permission policy
      ↓
Sandbox audition
      ↓
Evaluation
      ↓
Hire / reject
```

---

# 26. Agent Hiring Permissions

Separate permissions into distinct classes.

## Agent composition using trusted existing tools

May be automatic.

## Installing known dependencies/tools

Configurable:

- Always allow
- Ask
- Never

## Executing arbitrary newly discovered third-party code

Default:

**ASK**

Do not automatically clone and execute unknown GitHub repositories.

---

# 27. Agent Audition

A newly created specialist does not immediately receive production authority.

Recruiter creates a representative sandbox task.

Evaluate:

- technical correctness,
- required output compliance,
- quality,
- reliability,
- style adherence where applicable,
- cost,
- latency,
- security/tool behavior.

Passing candidates enter probation.

Probationary agents receive stricter review.

Successful agents become part of the global roster.

---

# 28. Failure Ladder

A failure is not simply “output was rejected.”

GAN must track whether attempts are making measurable progress.

Default recovery ladder:

```text
Agent attempts task
      ↓
Failure
      ↓
Change approach / retry
      ↓
No meaningful progress
      ↓
Hire/find specialist
      ↓
Specialist works
      ↓
Up to 3 additional non-progressing failures
      ↓
ESCALATE TO OREN
```

“Non-progress” means the system is repeatedly failing the same acceptance criteria or evaluation scores are not materially improving.

Do not waste attempts producing cosmetic variation of the same failed strategy.

---

# 29. Agent Retirement

Track agent performance.

Possible actions:

- retain,
- prefer,
- demote for capability,
- reconfigure,
- replace,
- retire.

An agent may remain strong in one capability while being demoted in another.

---

# 30. Model Router

GAN must not equate agents with models.

A worker capability may run on different models.

Model routing considers:

- task complexity,
- required modality,
- expected quality,
- local availability,
- hardware,
- latency tolerance,
- cost,
- context size,
- privacy policy,
- previous benchmark results.

---

# 31. Local Model Expert

Implement a first-class **Local Model Expert** agent/service.

Responsibilities:

- inventory local hardware,
- inventory available local models,
- record model capabilities,
- track model versions,
- record VRAM/RAM requirements,
- track context limits,
- detect vision/audio/tool support,
- benchmark models on representative GAN tasks,
- maintain task-specific quality history,
- advise GM on whether local execution is viable.

It must not blindly prefer local.

For each recommendation provide:

- recommended model/provider,
- expected quality,
- confidence,
- expected runtime,
- expected external cost avoided,
- reason.

---

# 32. Model Routing Priority

Default routing logic:

```text
Can result be reused/cached?
        ↓
Can deterministic tool solve it?
        ↓
Is local model viable?
        ↓
Can authenticated Codex perform it?
        ↓
Is paid external provider justified?
```

Waiting for Codex usage availability is acceptable when urgency is low.

The project must support urgency later, but current defaults should optimize quality/cost rather than speed.

---

# 33. External Provider Budget Policy

Default monthly external paid-provider budget:

**$25 total**

Automatic transaction threshold:

**< $1**

Any single predicted action costing:

**≥ $1 → ask Oren**

Global budget cannot be exceeded automatically.

---

# 34. Hard Wallet Cap Invariant

This is a non-negotiable safety rule.

**GAN MUST NEVER USE A PAID API/PROVIDER THAT DOES NOT HAVE A VERIFIED HARD SPENDING LIMIT.**

Application-level accounting is not sufficient.

Every paid provider must have:

```text
provider_cap:
    required: true
    verified: true
    amount:
    verification_method:
    verified_at:
```

If:

`verified = false`

provider state becomes:

`DISABLED_UNCAPPED`

GAN's own $25 budget exists **in addition to** the provider-side hard limit.

For providers where hard caps cannot be programmatically verified, require explicit manual verification before activation.

If a provider fundamentally offers no hard cap/prepaid bounded wallet equivalent, GAN must not use it.

---

# 35. Secrets

Never commit credentials.

Provider credentials must use an abstraction capable of storing secrets through the operating system's secure credential mechanism.

Do not store plaintext provider keys inside:

- `.gameagent`,
- Git,
- SQLite,
- logs,
- event payloads.

---

# 36. Direct Codex Work Invariant

Users must remain free to open Codex directly and work outside GAN Studio.

However:

**MEANINGFUL PROJECT WORK MAY NEVER BE SILENTLY INVISIBLE TO GAN.**

Preferred flow:

```text
Direct Codex
     ↓
register GAN task
     ↓
work
     ↓
report result
```

Fallback:

```text
Direct unregistered change
     ↓
GAN detects repository change
     ↓
create reconciliation requirement
     ↓
reconstruct what changed / why
     ↓
attach to project history
```

This requirement can never be disabled.

---

# 37. Registration Protocol

Provide CLI commands such as:

```bash
gameagent task start
gameagent task complete
gameagent task block
gameagent task status
gameagent reconcile
```

`AGENTS.md` generated into GAN-enabled projects must instruct Codex and other compatible agents to register meaningful work before editing whenever GAN is available.

---

# 38. Reconciliation

GAN Daemon watches:

- Git status,
- commits,
- filesystem changes to meaningful project paths.

If changes occur without an active GAN task:

1. create `project.external_change_detected`,
2. flag project as requiring reconciliation,
3. inspect diff/history,
4. request explanation from active external agent if possible,
5. create reconstructed task record,
6. associate artifacts/commits,
7. update project intelligence,
8. record reconciliation event.

GAN Studio must visibly show unresolved external changes.

The project cannot report a fully clean/known state until reconciled.

---

# 39. Source Control

Every meaningful production task should execute in a safe workspace.

Preferred model:

- Git branch or worktree per substantial task,
- record task → branch/worktree mapping,
- attribute commits,
- run QA before integration.

Agent permissions separately govern:

- editing,
- committing,
- merging.

Default initial policy:

Agents may edit and commit inside task workspaces.

Meaningful merge behavior follows authority/project policy.

---

# 40. QA Fabric

QA is a first-class subsystem.

Do not implement QA as:

> creator LLM → reviewer LLM → “looks good”

LLMs may interpret evidence.

LLM judgment alone is insufficient evidence for many quality claims.

Every evaluation must state what type of evidence supports it.

---

# 41. Evidence Classes

Use at least:

## Deterministic

Examples:

- build success,
- file dimensions,
- schema validation,
- compiler output,
- asset import rules,
- test result,
- crash detection.

## Measured

Examples:

- FPS,
- memory,
- input latency,
- contrast ratio,
- alignment distance,
- navigation path length,
- balance simulation result.

## Comparative

Examples:

- screenshot regression,
- approved-reference comparison,
- before/after telemetry.

## Heuristic

Examples:

- UX principles,
- composition analysis,
- readability assessment,
- style consistency.

## Human

Examples:

- Oren approval,
- playtest observation,
- player feedback,
- expert review.

An evaluation must expose its evidence class.

---

# 42. UI QA

UI validation should eventually support:

- actual runtime captures,
- multiple resolutions,
- multiple aspect ratios,
- overflow detection,
- clipping detection,
- alignment measurement,
- spacing consistency,
- pixel-scale validation,
- asset filtering/import validation,
- keyboard traversal,
- controller traversal,
- focus visibility,
- contrast where applicable,
- visual regression,
- text overflow,
- localization expansion stress tests.

Vision models may help interpret results but must not replace deterministic checks.

---

# 43. UX QA

UX evaluation may use:

- task completion paths,
- navigation graphs,
- number of required interactions,
- dead ends,
- ambiguous affordances,
- controller navigation,
- observed player behavior,
- telemetry,
- playtests,
- user feedback.

LLM UX review may generate hypotheses.

It must not claim objective usability success without evidence.

---

# 44. Art / Style QA

Use combinations of:

- approved project references,
- technical asset rules,
- palette analysis where applicable,
- visual embedding comparison,
- composition metrics where meaningful,
- consistency across related assets,
- human approval history,
- independent vision evaluations.

Style similarity is probabilistic.

Do not represent it as deterministic truth.

---

# 45. Gameplay / “Fun” QA

GAN must never reduce fun to an LLM score.

Possible evidence:

- automated play,
- simulations,
- balance models,
- encounter outcomes,
- telemetry,
- death/failure distribution,
- completion rate,
- pacing data,
- player choice distribution,
- behavioral traces,
- session recordings,
- human playtests,
- user judgment.

LLMs may analyze evidence and propose causes.

Only human evidence can make strong subjective claims such as:

> “This is fun.”

The system should distinguish:

- technically functioning,
- behaving as designed,
- heuristically promising,
- human-validated.

---

# 46. Narrative QA

Support:

- continuity validation,
- character knowledge tracking,
- timeline consistency,
- lore contradiction detection,
- variable/state validation,
- branching reachability,
- dialogue condition validation,
- tone/style comparison,
- localization readiness.

---

# 47. Audio QA

Support eventual checks for:

- file validity,
- clipping,
- loudness consistency,
- channel configuration,
- looping,
- runtime triggering,
- missing assets,
- mix conflicts,
- dynamic/adaptive transitions,
- subjective human evaluation.

---

# 48. Engineering QA

Support:

- unit tests,
- integration tests,
- builds,
- runtime smoke tests,
- static analysis,
- lint/type checking,
- crash monitoring,
- profiling,
- save/load checks,
- deterministic repros,
- multiplayer/network checks where relevant.

---

# 49. QA Gates

Tasks define required quality gates.

Example:

```yaml
validation:
  required_evaluations:
    - godot_build
    - ui_runtime_capture
    - resolution_matrix
    - controller_navigation
    - visual_reference_review
```

GM must not mark a task complete until required gates pass or are explicitly waived.

Waivers must create audit events.

---

# 50. GAN Studio — Primary Navigation

Required primary screens:

1. Director Desk
2. Decisions
3. Production
4. Network
5. QA
6. Project Intelligence
7. Agents
8. Activity
9. Providers & Budget
10. Settings

---

# 51. Director Desk

Default homepage.

Show:

- project name,
- current milestone,
- production health,
- active tasks,
- blocked tasks,
- agents working,
- agents waiting,
- items needing user decision,
- recent meaningful changes,
- important GM findings.

Do not flood the homepage with raw logs.

---

# 52. Decisions

Dedicated user-decision inbox.

Sort by:

- blocking,
- important,
- informational.

Every decision links to affected tasks and evidence.

---

# 53. Production

Task/dependency view.

Support:

- hierarchy,
- status,
- dependencies,
- owner,
- capability requirements,
- milestone,
- blocking reason,
- QA state.

---

# 54. Network Map

Use React Flow.

The map represents actual current production structure.

Examples of node types:

- GM,
- agent assignment,
- task,
- decision,
- evaluator,
- capability gap.

Default map should emphasize agents and their current dependencies.

Clicking any node opens Inspector.

Example:

```text
                 GM
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
      UX      UI Artist   Godot
       │         │         │
       └────→ Visual QA ←──┘
```

Edges must represent real state.

Avoid decorative fake network complexity.

---

# 55. Inspector

Inspector uses progressive disclosure.

Agent Inspector example:

High level:

- current status,
- current task,
- waiting for,
- recent result.

Expand:

- task history,
- capabilities,
- tools,
- model,
- QA history,
- performance,
- costs.

Expand further:

- raw events,
- tool invocations,
- thread IDs,
- logs.

---

# 56. QA Screen

Show quality status by discipline.

Example:

```text
UI IMPLEMENTATION #184

UX Specification         PASS
Assets                    PASS
Implementation            PASS
Build                     PASS
Controller QA             PASS
Resolution QA             PASS
Visual QA                 FAIL
Human Judgment            NOT REQUIRED
```

Click evaluation to inspect evidence.

Evidence view may include:

- screenshots,
- diffs,
- measurements,
- logs,
- videos,
- metrics,
- affected files.

---

# 57. Agent Registry

Show global roster.

Agent card:

- name,
- capabilities,
- status,
- probation state,
- projects used,
- task count,
- success rate,
- human rejection rate,
- primary strengths,
- known weaknesses.

Do not optimize visual design around anthropomorphic avatars.

This is a production system, not a virtual-office simulation.

---

# 58. Providers & Budget

Show:

- provider,
- purpose,
- authentication state,
- wallet-cap state,
- cap amount,
- current GAN month spend,
- predicted costs,
- provider status.

Uncapped paid provider must appear visibly disabled.

---

# 59. Settings

## GM Authority

Three-level slider.

Default:

**Recommend + Proceed Unless Stopped**

## GM Proactivity

Three-level slider.

Default:

**Balanced**

## Permissions

Per permission:

- Always allow
- Ask
- Never

Examples:

- software installation,
- arbitrary external code execution,
- internet access,
- asset replacement,
- code refactoring,
- project settings,
- Git commit,
- Git merge,
- third-party service usage.

## Spending

Default:

- monthly external spend: $25,
- automatic individual action: <$1.

## Provider policies

- local preferred where viable,
- Codex allowed,
- sensitive material may leave machine,
- uncapped paid APIs forbidden.

## QA

Project-specific mandatory quality gates.

---

# 60. Visual Design Requirements

GAN is explicitly intended to be an impressive professional portfolio piece.

GAN Studio must look like a polished production product.

Avoid:

- generic AI gradients,
- glowing sci-fi HUD aesthetics,
- fake terminal overload,
- cartoon agent avatars,
- excessive animation,
- dashboard-template appearance,
- huge cards wasting space.

Aim for:

- professional dark/light capable product UI,
- strong typography,
- dense but readable information,
- deliberate spacing,
- excellent hierarchy,
- high-quality interaction details,
- fluid map navigation,
- elegant Inspector transitions,
- coherent status semantics,
- accessibility,
- excellent empty/loading/error states.

The interface should feel credible beside modern professional developer/design tools.

---

# 61. Project Initialization

CLI:

```bash
gameagent init
```

Initialization should:

1. identify repository,
2. detect likely game medium/engine,
3. install `.gameagent`,
4. create project ID,
5. inspect existing documents,
6. inspect existing assets,
7. inspect Git history,
8. identify engine/platform,
9. create initial project model,
10. distinguish known vs inferred information,
11. identify critical missing information,
12. create initial capability requirements,
13. connect project to GAN Daemon.

Do not force the user to complete a giant project questionnaire.

Use progressive structure.

Ask only information that is important and cannot reasonably be inferred.

---

# 62. Opinionated Intake

GAN may challenge missing production fundamentals.

Example:

> Target platforms are unknown and this changes input, performance and UI constraints. I recommend defining them before implementing the settings UI.

GAN may continue with explicit assumptions where reasonable.

Assumptions must be recorded.

---

# 63. Engine Adapter Interface

Define a stable engine abstraction.

Possible methods:

```text
detect()
inspect_project()
run()
stop()
build()
capture_frame()
collect_logs()
inspect_scene()
inspect_ui_tree()
validate_assets()
run_tests()
package()
```

Methods may be unsupported by particular engines.

Adapters advertise capabilities rather than pretending universal parity.

---

# 64. Initial Godot Adapter

Cosmic Meltdown requires the first production adapter.

Support:

- detect Godot project,
- read project version/settings,
- inspect scenes,
- inspect nodes/resources,
- run project,
- run headless when possible,
- capture runtime screenshots,
- retrieve logs/errors,
- validate imports,
- execute tests if present,
- identify modified scenes/resources,
- support UI node inspection.

Do not embed Godot assumptions in GM core.

---

# 65. Tool Adapter Interface

A tool definition describes:

- capability,
- install state,
- version,
- invocation method,
- input contract,
- output contract,
- permissions,
- health check,
- cost policy,
- local/cloud state.

Examples:

- ComfyUI,
- Ollama,
- Blender,
- Aseprite.

---

# 66. Project References

References are first-class project data.

GAN should retrieve actual relevant project references for specialists.

Examples:

- approved UI assets,
- concept art,
- screenshots,
- soundtrack,
- previous successful implementation,
- narrative excerpts,
- level layouts.

A UI artist should receive relevant approved UI assets rather than merely a textual description of the style.

---

# 67. Multimodal Project Intelligence

Architecture must support indexing and retrieving:

- text,
- code,
- images,
- audio,
- video,
- 3D metadata,
- runtime evidence.

Do not require all multimodal indexing in initial milestone.

Design the domain model so it can be added without rewriting Project Intelligence.

---

# 68. Context Assembly

Token efficiency is a core requirement.

Before invoking a model:

1. identify exact task,
2. retrieve only relevant project entities,
3. retrieve direct dependencies,
4. retrieve applicable decisions,
5. retrieve useful references,
6. retrieve recent related failures,
7. construct compact context package.

Do not automatically include entire GDDs, chat histories, or repository summaries.

Cache stable summaries.

---

# 69. Activity / Audit

Every meaningful production action should be inspectable.

Example:

```text
10:31 GM created TASK-483
10:31 UX specialist assigned
10:33 UX analysis completed
10:33 UI artist assigned
10:37 asset generated
10:38 Godot implementer assigned
10:41 build succeeded
10:42 Visual QA failed
      reason: P3 hierarchy inconsistent
10:43 revision requested
10:47 QA passed
10:48 merged
```

This view must be generated from actual events.

---

# 70. Project Health

Do not invent a vague AI-generated “health score.”

If a project health percentage is displayed, derive it transparently from measurable components such as:

- blockers,
- failing gates,
- milestone completion,
- unresolved decisions,
- build status,
- unreconciled changes.

The user must be able to inspect how it was calculated.

---

# 71. First North-star Vertical Slice

Initial production project:

**Cosmic Meltdown**

Required user experience:

The user identifies or selects a UI element and says:

> “That dropdown looks generic. Replace it with something that belongs in this game.”

GAN must:

1. register task,
2. identify selected context,
3. inspect current scene,
4. capture current appearance,
5. retrieve relevant UI references,
6. retrieve Cosmic Meltdown art direction,
7. retrieve technical UI constraints,
8. determine UX role of element,
9. identify capabilities,
10. assign relevant specialist(s),
11. create/retrieve asset,
12. validate asset technical specs,
13. modify Godot project,
14. run project,
15. capture actual runtime result,
16. perform initial deterministic UI QA,
17. perform style/UX evaluation,
18. revise when necessary,
19. present completed result,
20. update project history and intelligence.

The user must not manually specify routine details already knowable from the project.

---

# 72. Cosmic Meltdown Project Facts for Vertical Slice

The initial project profile must include:

- Godot project,
- 2D,
- four-player couch PvP,
- no boss,
- no scrolling,
- four players receive equal structural importance,
- 16-bit visual language,
- dark sci-fi presentation,
- pixel-art asset constraints,
- UI currently undergoing improvement.

Project-specific details belong in Cosmic Meltdown's `.gameagent`, not GAN core.

---

# 73. Later Vertical Slices

After UI pipeline works, expand into:

## Gameplay

> “This weapon doesn't feel powerful.”

## Level Design

> “Players keep getting lost here.”

## Art

> “This enemy needs a death animation.”

## Audio

> “This room sounds too sterile.”

## Narrative

> “This conversation contradicts established lore.”

Each slice must add general capabilities rather than Cosmic-Meltdown-specific hacks.

---

# 74. Non-goals for Initial Build

Do not initially build:

- 100-agent concurrency,
- virtual studio roleplay,
- elaborate organizational hierarchies,
- arbitrary autonomous software installation,
- every engine,
- every platform,
- cloud Kubernetes infrastructure,
- agent marketplace,
- multiplayer GAN server,
- enterprise account system,
- automatic full-game generation,
- autonomous creative-director replacement.

One correct multidisciplinary workflow is worth more than dozens of shallow agents.

---

# 75. Build Milestones

## Phase -1 — Greenlight Harvest

Deliver:

`docs/GREENLIGHT_HARVEST.md`

Inspect reusable architecture/UI.

No implementation assumptions before this step where Greenlight may save substantial work.

---

## Phase 0 — Foundation / Constitution

Deliver:

- monorepo,
- CI,
- domain vocabulary,
- capability schema,
- agent schema,
- task contract,
- event schema,
- project schema,
- policy schema,
- QA evidence schema,
- architectural decision records.

Acceptance:

Schemas validated through tests.

---

## Phase 1 — Project Protocol + Studio Shell

Deliver:

- GAN Daemon,
- SQLite projections,
- event-log persistence,
- `gameagent init`,
- project loading,
- WebSocket events,
- Studio navigation,
- Director Desk shell,
- Network shell,
- Inspector,
- Activity view,
- Settings.

Use real backend state, even if initial project contains manually seeded tasks.

Do not build fake frontend-only prototype state.

---

## Phase 2 — Codex Bridge

Deliver:

- Codex account detection,
- ChatGPT authentication flow,
- persistent thread creation,
- resume,
- working directory isolation,
- structured output,
- worker event ingestion,
- Studio worker status.

Acceptance:

From Studio, run a Codex task inside a test repo without using an OpenAI API key.

---

## Phase 3 — Registration + Reconciliation

Deliver:

- CLI task registration,
- generated `AGENTS.md`,
- Git/worktree watcher,
- unregistered-change detection,
- reconciliation workflow.

Acceptance:

Modify project directly through external Codex without registration.

GAN must detect the change and refuse to silently treat project state as fully reconciled.

---

## Phase 4 — GM + Capability Matching

Deliver:

- persistent project GM,
- task decomposition,
- capability resolution,
- initial manually defined specialists,
- dependency management,
- authority policy,
- proactivity policy,
- decision inbox.

Acceptance:

A broad user objective becomes a visible multidisciplinary production plan.

---

## Phase 5 — Project Intelligence

Deliver:

- repository indexing,
- design-document indexing,
- decision retrieval,
- asset-reference retrieval,
- context assembly,
- fact/inference distinction.

Acceptance:

Worker receives targeted project context without receiving entire project history.

---

## Phase 6 — Cosmic Meltdown UI Vertical Slice

Deliver end-to-end:

inspect  
→ understand  
→ design  
→ generate/reuse  
→ implement  
→ run  
→ capture  
→ evaluate  
→ iterate

This is the first public-demo milestone.

---

## Phase 7 — QA Fabric

Generalize UI QA architecture into:

- deterministic evidence,
- measured evidence,
- comparative evidence,
- heuristic evidence,
- human evidence.

Implement initial UI/engineering QA gates.

Acceptance:

GAN can explain **why** a task passed, with inspectable evidence.

---

## Phase 8 — Local Model Expert + Model Router

Deliver:

- local hardware inventory,
- local model inventory,
- Ollama adapter,
- benchmark history,
- local-vs-Codex-vs-paid recommendation,
- model routing records.

Acceptance:

For a representative task, Studio explains why GAN chose local or Codex.

---

## Phase 9 — Provider Budget Safety

Deliver:

- provider registry,
- secret storage abstraction,
- hard-wallet-cap verification state,
- $25 monthly budget,
- <$1 automation threshold,
- budget ledger,
- disabled-uncapped state.

Acceptance:

Attempting a paid call through an uncapped provider must be structurally blocked.

---

## Phase 10 — Recruiter

Deliver:

- capability-gap detection,
- global agent search,
- candidate composition,
- permission-aware tool discovery,
- sandbox audition,
- probation,
- global registry.

Acceptance:

Give GM a task requiring an unavailable test capability.

It must create and audition a specialist rather than fabricate capability.

---

## Phase 11 — Additional Production Domains

Add vertical slices one discipline at a time.

Every added capability requires:

- contract,
- tools,
- QA,
- evidence,
- task history,
- frontend representation.

---

## Phase 12 — Desktop Packaging

Package GAN Studio and Daemon.

Preserve command-line/headless usability.

---

# 76. Automated Testing

Minimum test layers:

## Unit

Schemas, state machines, budget logic, matching, event projections.

## Integration

Daemon/database, Codex bridge mocks, adapters, reconciliation.

## E2E

Studio ↔ Daemon.

Use Playwright for Studio E2E.

## Contract tests

Every adapter must satisfy its advertised interface.

## Regression

Known production workflows must remain replayable where feasible.

---

# 77. CI

GitHub Actions should run:

- formatting,
- lint,
- TypeScript typecheck,
- Python type/lint checks,
- unit tests,
- integration tests,
- Studio build,
- daemon package/build,
- E2E smoke test where practical.

Protect `main`.

---

# 78. Documentation

Repository must contain a portfolio-quality README.

README should explain:

1. problem,
2. architecture,
3. short demo,
4. key principles,
5. screenshot of Director Desk,
6. screenshot of Network Map,
7. screenshot of QA evidence,
8. architecture diagram,
9. local setup,
10. roadmap.

Architecture decisions should use ADR documents.

Important architecture must not exist only in conversation history.

---

# 79. Portfolio Visibility

Build observability features so GAN can demonstrate its own sophistication.

Examples:

- live production graph,
- agent hiring history,
- capability registry,
- real QA evidence,
- task provenance,
- local-vs-cloud model routing,
- external spend avoided,
- reconciliation events,
- dependency resolution,
- project decisions.

Avoid metrics that exist only to look impressive.

Every metric must correspond to actual system state.

---

# 80. Demo Narrative

The eventual portfolio demo should be understandable in under two minutes.

Suggested sequence:

1. Open Cosmic Meltdown in GAN Studio.
2. Show live production network.
3. Select a bad UI element.
4. Ask GAN to replace it.
5. Show GM decomposing task.
6. Show specialists activating.
7. Show actual generated/modified asset.
8. Show Godot implementation.
9. Show first QA rejection.
10. Show evidence.
11. Show automatic correction.
12. Show final game result.
13. Drill into event history.
14. Show that all work is attributable.
15. Show agent registry/model-routing settings.

The product should visibly demonstrate:

**This is not a mockup of an AI production system. It is operating the project.**

---

# 81. Definition of Done for First Public Alpha

Game Agent Network Alpha is complete when all of the following are true:

- GAN can initialize an existing Godot project.
- GAN Studio displays real project state.
- Codex authenticates through ChatGPT rather than an API key.
- GM can decompose a production request.
- Specialists can execute Codex tasks.
- Agents/tasks appear live in Network.
- User decisions appear in Decision Inbox.
- Direct external changes are registered or reconciled.
- Cosmic Meltdown UI vertical slice works end-to-end.
- QA uses real runtime evidence.
- User can drill from project status to raw evidence.
- Settings expose GM Authority and GM Proactivity.
- provider budget policy exists.
- uncapped paid providers cannot execute.
- event history survives restart.
- project state can be rebuilt from canonical project files/events.
- README/documentation is strong enough to use publicly as a portfolio piece.

---

# 82. Architectural Invariants

These rules must not be violated during implementation.

**Invariant 1:** The GM owns production authority.

**Invariant 2:** Agents are capability packages, not personalities.

**Invariant 3:** Tools are independent from agents.

**Invariant 4:** Project-specific model context never leaks across projects.

**Invariant 5:** User taste/judgment overrides automated evaluation.

**Invariant 6:** LLM self-evaluation is never the sole QA mechanism for subjective or visual quality.

**Invariant 7:** Paid providers without verified hard spending caps cannot execute.

**Invariant 8:** Direct project work must register with GAN or be reconciled afterward.

**Invariant 9:** Significant project state must not exist only inside model conversations.

**Invariant 10:** Global agents may be reused, project creative identity may not leak automatically.

**Invariant 11:** GAN core must remain engine-independent.

**Invariant 12:** UI exposes the same underlying truth at progressively deeper levels.

**Invariant 13:** Failed work must show progress or trigger a strategy change.

**Invariant 14:** After specialist intervention plus three further non-progress failures, escalate to Oren.

**Invariant 15:** Greenlight concepts may be reused; Greenlight domain assumptions/infrastructure are not inherited blindly.

---

# 83. First Built-in Agent Set

Keep the starting roster intentionally small.

Suggested minimum:

## GM Agent

Capabilities:

- intent interpretation,
- planning,
- capability selection,
- dependency management,
- escalation,
- integration decisions.

## Project Intelligence Specialist

Capabilities:

- repository analysis,
- project-context retrieval,
- decision retrieval,
- dependency analysis.

## UX Specialist

Capabilities:

- interaction analysis,
- UI behavior,
- usability heuristics,
- controller/navigation reasoning.

## Visual/UI Specialist

Capabilities:

- visual reference analysis,
- UI art direction,
- asset specification,
- generated-asset evaluation.

## Godot Implementer

Capabilities:

- Godot scenes/resources,
- UI implementation,
- import configuration,
- runtime execution.

## QA Specialist

Capabilities:

- test-plan generation,
- evidence selection,
- quality-gate execution,
- failure reporting.

## Local Model Expert

Capabilities:

- local model selection,
- hardware/resource analysis,
- local/cloud suitability assessment.

Do not create more agents until tasks demonstrate actual capability gaps.

---

# 84. UXGuardian Future Integration

Design the project-selection/context protocol so UXGuardian-style interaction can later become an input source.

Future target:

User Alt-clicks a UI element inside a supported game/editor context and enters:

> “Move this down and replace this icon; it doesn't match the rest of the HUD.”

GAN receives:

- selected entity/node,
- scene,
- coordinates,
- screenshot,
- project identifier,
- instruction.

This should create a normal GAN task.

Do not tightly couple initial GAN architecture to UXGuardian.

---

# 85. Security Model

Default worker sandbox should use minimum sufficient access.

Separate permissions:

- read project,
- write task workspace,
- execute local commands,
- network,
- modify global files,
- install dependencies,
- access secrets,
- merge Git,
- execute arbitrary discovered code.

Full-access execution should never be the unexamined default.

Audit permission escalation.

---

# 86. Error Handling

Failures must be first-class state.

Do not hide errors behind generic:

> “Something went wrong.”

Capture:

- stage,
- worker,
- task,
- tool,
- attempted action,
- structured error,
- relevant logs,
- retryability,
- suggested recovery.

Surface high-level message first with expandable detail.

---

# 87. Performance Requirements

Studio should remain responsive while workers run.

Long-running tasks must never block frontend request threads.

Network Map must remain usable as project complexity grows.

Use:

- pagination/virtualization where appropriate,
- React Flow performance best practices,
- incremental event subscriptions,
- indexed SQLite queries,
- background projection rebuilding.

Do not pre-optimize for thousands of simultaneous workers.

---

# 88. Accessibility

Studio itself must support:

- keyboard navigation,
- visible focus,
- screen-reader semantics where practical,
- sufficient contrast,
- reduced-motion preference,
- scalable text.

Portfolio quality includes accessibility.

---

# 89. Naming

Public product name:

**Game Agent Network**

Avoid using bare `GAN` in package names where it could be confused with Generative Adversarial Networks.

Use:

- `gameagent`
- `@gameagent/...`
- `.gameagent`

---

# 90. Implementation Discipline for Codex

When implementing this PRD:

1. Do not silently change architectural decisions.
2. If an implementation detail is underspecified and reversible, choose a sensible professional default and document it.
3. If a choice threatens an architectural invariant, stop and surface the conflict.
4. Prefer vertical working slices over broad stubs.
5. Do not scaffold dozens of unused agents.
6. Do not use mock data after the corresponding real backend capability exists.
7. Every phase requires tests.
8. Keep the project runnable after each milestone.
9. Create ADRs for significant architectural decisions.
10. Update this PRD only through explicit documented changes.

---

# 91. Initial Codex Assignment

Start with **Phase -1 and Phase 0 only.**

Do not attempt to implement the full system in one pass.

First:

1. inspect the repository,
2. inspect Greenlight Studio if its source is available,
3. produce `docs/GREENLIGHT_HARVEST.md`,
4. produce final proposed monorepo structure,
5. create core domain schemas,
6. create architectural invariants as tests where possible,
7. create ADRs for:
   - event-sourced project history,
   - SQLite projections,
   - Python daemon,
   - Codex authenticated worker bridge,
   - GM-centric orchestration,
   - capability-based agents,
   - QA evidence model,
   - provider hard-cap enforcement,
8. scaffold the monorepo,
9. make all tests pass,
10. stop and report what was built before beginning Phase 1.

Do not build decorative frontend screens yet unless required to validate the shared UI package/design-system foundation.

---

# 92. Final Product Principle

The target experience is:

> The human expresses intent and judgment.

> The GM understands what production work that intent implies.

> GAN assembles the necessary expertise.

> Specialists operate real tools against the real project.

> QA verifies the work using actual evidence.

> GAN integrates successful results and remembers what happened.

> When the network lacks the required expertise, it expands itself.

The user should increasingly need to know **what they want**, not every technical step required to create it.