# Game Agent Network — PRD Addendum

## Knowledge Fabric, Specialist Intelligence, Global Agent Bench & Continuous Learning

**Status:** Foundational addendum to the Game Agent Network PRD  
**Applies to:** Agent architecture, Project Intelligence, Recruiter, onboarding, expertise, model routing, QA, storage, Studio, global learning  
**Supersedes:** Any interpretation of GAN agents as primarily role prompts, static personalities, or model sessions with access only to project context.

---

# 1. Purpose

Game Agent Network must produce specialists that behave materially better than generic AI agents instructed to "act like" a designer, artist, engineer, producer, or other professional.

A specialist must not be defined primarily by a role prompt.

A GAN specialist should be constructed from:

> **Model + Project Intelligence + Discipline Intelligence + World Intelligence + Experience Intelligence + Methods + Tools + Permissions + Evidence Requirements + Evaluations**

The central objective of this addendum is to create a **Knowledge Fabric** that allows every Lead and Specialist to operate from:

1. what is true about the current project,
2. what competent professionals in that discipline know,
3. what is currently true in the external world,
4. what GAN has learned through validated production experience,
5. and the methods appropriate to the problem being solved.

The governing principle is:

> **Do not merely tell an agent what role it has. Give it the knowledge, methods, evidence, tools, constraints, and experience that make it qualified to perform that role.**

---

# 2. Core Specialist Model

Every specialist agent operates over four knowledge planes.

```text
                         TASK
                          │
                          ▼
                 SPECIALIST RUNTIME
                          │
                          ▼
                   KNOWLEDGE ROUTER
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
PROJECT INTELLIGENCE  DISCIPLINE INTELLIGENCE  WORLD INTELLIGENCE
        │                 │                 │
        └────────────┬────┴────┬────────────┘
                     ▼         ▼
              EXPERIENCE INTELLIGENCE
                     │
                     ▼
              METHODS / PLAYBOOKS
                     │
                     ▼
                    TOOLS
                     │
                     ▼
                  EVIDENCE
                     │
                     ▼
                     QA
```

A model is only one component of the specialist.

---

# 3. Knowledge Plane 1 — Project Intelligence

Project Intelligence answers:

> **What is true about this particular game/project?**

Examples include:

- project vision,
- game loop,
- engine,
- code architecture,
- active systems,
- platform targets,
- scenes,
- assets,
- style references,
- UI conventions,
- input methods,
- previous decisions,
- rejected ideas,
- technical constraints,
- current milestone,
- unresolved questions,
- build state,
- known bugs,
- runtime evidence,
- test history,
- production history,
- user feedback,
- agent findings,
- QA findings.

Project Intelligence is shared across GAN but retrieved differently for each specialist.

The UX Lead and Rendering Lead should not receive identical context packets.

The Knowledge Router must project the same underlying project truth through domain relevance.

---

# 4. Knowledge Plane 2 — Discipline Intelligence

Discipline Intelligence answers:

> **What would a strong real-world specialist in this domain know before seeing this specific project?**

Examples:

## UX

- focus management,
- gamepad navigation,
- menu hierarchy,
- information architecture,
- player feedback,
- affordances,
- touch target guidelines,
- accessibility,
- localization expansion,
- HUD information priority,
- onboarding,
- error prevention,
- usability testing methods.

## Engineering

- architecture patterns,
- profiling,
- debugging methodologies,
- concurrency,
- memory management,
- networking patterns,
- testing strategies,
- build pipelines,
- platform constraints,
- engine-specific best practices.

## Game Design

- system loops,
- reward structures,
- progression,
- balance,
- encounter design,
- difficulty curves,
- pacing,
- feedback,
- simulation methods,
- game feel,
- player motivation.

## Art

- composition,
- visual hierarchy,
- color,
- silhouette,
- readability,
- material language,
- shape language,
- animation principles,
- technical asset constraints,
- style consistency.

## Monetization / Product

- economy structures,
- sinks/sources,
- IAP architecture,
- offer design,
- pricing,
- segmentation,
- retention,
- lifecycle,
- ethical monetization considerations,
- experimentation,
- KPI relationships.

A discipline pack is not merely a document explaining broad principles.

It must include methods, patterns, anti-patterns, checklists, evidence expectations, and evaluation criteria.

---

# 5. Knowledge Plane 3 — World Intelligence

World Intelligence answers:

> **What is true outside this project right now?**

This plane is required whenever static model knowledge may be stale or insufficient.

Examples:

- current console certification rules,
- current Steam requirements,
- current Apple/Google policies,
- engine documentation,
- package versions,
- current hardware capabilities,
- SDK restrictions,
- current monetization policies,
- accessibility requirements,
- current local AI models,
- licensing,
- current API pricing,
- current technical compatibility,
- current platform services.

A specialist must be able to state:

> "My internal expertise is not sufficient because this requirement is freshness-sensitive."

The Knowledge Router should then trigger research against appropriate current sources.

---

# 6. Knowledge Plane 4 — Experience Intelligence

Experience Intelligence answers:

> **What has GAN learned from actually doing production work?**

Examples:

- a specific QA sequence repeatedly catches controller bugs,
- a certain local model is reliable for structured asset tagging,
- a particular ComfyUI workflow fails frequently on pixel UI,
- a Godot import strategy produced stable results across projects,
- a navigation pattern passed human playtesting repeatedly,
- a certain approach to image generation creates excessive cleanup,
- an agent performs well at UI implementation but poorly at visual composition.

Experience Intelligence must not become an uncontrolled pool of model-generated "lessons."

It must be evidence-backed, scoped, versioned, and promotable through defined confidence levels.

---

# 7. Knowledge Is Not Evidence

GAN must maintain a strict epistemic distinction between:

- professional knowledge,
- project fact,
- project inference,
- external fact,
- observed result,
- heuristic,
- hypothesis,
- human judgment,
- measured evidence.

Example output:

```text
KNOWN FROM PROJECT
P1–P4 use structurally identical panels.

MEASURED
Current active-player border differs from inactive state by 2px luminance only.

PROFESSIONAL HEURISTIC
Current interaction focus should remain visibly distinguishable.

INFERENCE
Weak focus distinction likely contributes to player confusion.

UNVALIDATED
No player study currently proves that confusion occurs.
```

Agents should be encouraged to reason at this level of clarity.

---

# 8. Expertise Packs

Discipline Intelligence must be packaged into structured, versioned **Expertise Packs**.

An Expertise Pack is a reusable body of professional capability that can be attached to agents.

Examples:

```text
game-ux-core
controller-navigation
mobile-ux
console-ux
pixel-art-production
3d-character-art
godot-ui-engineering
unreal-rendering
f2p-economy-design
liveops-event-design
networking-multiplayer
accessibility-games
```

Packs may depend on other packs.

Example:

```text
console-ui-lead
  ├── game-ux-core
  ├── controller-navigation
  ├── accessibility-games
  └── console-platform-patterns
```

---

# 9. Expertise Pack Contents

A complete Expertise Pack may include:

```text
expertise-packs/
  game-ux-core/
    pack.yaml
    knowledge/
    methods/
    playbooks/
    checklists/
    anti-patterns/
    standards/
    examples/
    benchmarks/
    evals/
    sources/
```

---

# 10. Expertise Pack Schema

Conceptual schema:

```yaml
expertise_pack:
  id:
  name:
  version:
  description:

capabilities:
  provides: []
  supports: []

dependencies:
  packs: []

knowledge:
  documents: []

methods:
  - id:
    purpose:
    required_inputs:
    outputs:

playbooks: []

checklists: []

anti_patterns: []

evidence_expectations: {}

source_policy:
  minimum_authority:
  freshness_rules:

benchmarks: []

evaluations: []

metadata:
  created_at:
  updated_at:
  created_by:
  status:
  confidence:
```

Exact implementation may differ, but these semantics must exist.

---

# 11. Expertise Sources

Expertise Packs may draw from:

- official engine documentation,
- official platform documentation,
- standards,
- accessibility standards,
- technical specifications,
- reputable books,
- peer-reviewed or serious research,
- GDC presentations,
- postmortems,
- public production documentation,
- open-source project documentation,
- reputable professional articles,
- internal GAN observations,
- human-curated lessons,
- validated GAN experience.

Sources must have metadata.

---

# 12. Source Provenance

Every imported source record must track:

```yaml
source:
  id:
  title:
  author:
  publisher:
  url_or_location:
  source_type:
  retrieved_at:
  published_at:
  authority_level:
  freshness_class:
  license_or_usage_note:
  applicable_capabilities: []
```

GAN must be able to answer:

> "Why does this specialist believe this?"

---

# 13. Freshness Classes

Knowledge must declare expected freshness.

## Stable

Examples:

- animation principles,
- fundamental UX heuristics,
- mathematical methods.

Refresh rarely.

## Slow-changing

Examples:

- engine architecture conventions,
- common design patterns.

Review periodically.

## Version-sensitive

Examples:

- engine APIs,
- SDK behavior,
- package compatibility.

Associate with version.

## Policy-sensitive

Examples:

- store rules,
- certification requirements,
- advertising requirements.

Require recent verification.

## Live

Examples:

- API pricing,
- available AI models,
- provider capabilities,
- current outages.

Research at task time or within a short TTL.

---

# 14. Methods, Not Just Facts

An expert is partly defined by how they approach problems.

Expertise Packs must therefore contain Methods.

Example UX method:

```text
USABILITY DIAGNOSIS

1. Determine intended player task.
2. Inspect current interaction path.
3. Identify information hierarchy.
4. Inspect input modality.
5. Capture runtime evidence.
6. Identify likely failure points.
7. Compare against project conventions.
8. Form hypotheses.
9. Propose minimum sufficient intervention.
10. Validate through appropriate QA.
```

Example performance method:

```text
PERFORMANCE INVESTIGATION

reproduce
→ establish baseline
→ profile
→ isolate bottleneck
→ form hypothesis
→ change one variable
→ benchmark
→ compare
→ retain/revert
```

Example balancing method:

```text
BALANCE INVESTIGATION

define intended outcome
→ inspect current parameters
→ collect telemetry/simulation
→ model relationships
→ identify outliers
→ modify
→ re-simulate
→ playtest
```

Methods must be callable/selectable by the specialist or GM.

---

# 15. Playbooks

Playbooks provide more specific task workflows.

Examples:

- `controller_navigation_audit`
- `new_mobile_f2p_economy_review`
- `godot_ui_asset_integration`
- `weapon_game_feel_pass`
- `boss_difficulty_review`
- `console_certification_readiness`
- `3d_character_asset_review`
- `liveops_event_postmortem`

Playbooks may invoke tools and QA gates.

---

# 16. Checklists

Checklists are deterministic or semi-deterministic safeguards.

Examples:

### Controller UI Checklist

- every interactive element reachable,
- visible focus state,
- no dead ends,
- back behavior consistent,
- modal traps prevented,
- repeat input handled,
- focus restored after modal close.

### Mobile UI Checklist

- touch target size,
- safe areas,
- device aspect ratios,
- notch/cutout behavior,
- gesture conflicts,
- orientation,
- text scale.

Checklists complement reasoning.

They must not replace context-specific judgment.

---

# 17. Anti-pattern Library

Expertise Packs should include known failure patterns.

Example:

```yaml
anti_pattern:
  id: hidden_focus
  domain: ux
  description:
  symptoms:
  risks:
  detection_methods:
  common_fixes:
```

This allows specialists to diagnose rather than only generate.

---

# 18. Expertise Pack Composition

Agents should not require one monolithic pack.

Packs must be composable.

Example:

```text
MOBILE F2P PRODUCT LEAD

game-product-core
+ mobile-product
+ f2p-economy
+ liveops-core
+ experimentation
```

Example:

```text
2D PIXEL UI LEAD

game-ux-core
+ ui-visual-design
+ pixel-art-production
+ controller-navigation
+ accessibility-games
```

---

# 19. Agent Definition Revision

Update the conceptual definition of an agent to:

```yaml
agent:
  id:
  name:
  version:

capabilities: []

expertise:
  required_packs: []
  optional_packs: []

methods:
  allowed: []

models:
  preferred:
  alternatives: []

tools:
  allowed: []

permissions: {}

context_policy:
  project_intelligence:
  world_intelligence:
  experience_intelligence:

evidence_policy: {}

evaluation:
  required: []

performance: {}
```

An agent without appropriate expertise packs may not claim the corresponding capability.

---

# 20. Specialist Runtime Context

Before significant work, the Knowledge Router assembles a context packet.

The context packet may include:

```text
TASK CONTRACT

PROJECT INTELLIGENCE
- exact project facts required
- relevant project decisions
- current evidence
- relevant assets
- previous failures

DISCIPLINE INTELLIGENCE
- relevant expertise sections
- methods
- playbook
- checklist
- anti-patterns

WORLD INTELLIGENCE
- only freshness-sensitive current information required

EXPERIENCE INTELLIGENCE
- validated relevant lessons
- agent performance information

OUTPUT CONTRACT

QA/EVIDENCE REQUIREMENTS
```

Do not send entire Expertise Packs to the model.

Retrieve only task-relevant sections.

---

# 21. Knowledge Router

Implement a Knowledge Router service responsible for determining what knowledge a worker receives.

Inputs:

- task contract,
- required capabilities,
- project ID,
- assigned agent,
- tools,
- current project state.

Outputs:

- structured context packet,
- source references,
- freshness flags,
- missing-knowledge flags.

The Knowledge Router must be domain-aware.

---

# 22. Retrieval Ranking

Retrieval should consider:

- capability relevance,
- task relevance,
- project entity relevance,
- source authority,
- freshness,
- prior usefulness,
- experience confidence,
- explicit Lead preferences.

Do not rank purely by embedding similarity.

---

# 23. World Research

When knowledge is missing or stale, agents may create a research requirement.

Flow:

```text
Specialist detects freshness/missing knowledge
        ↓
Research requirement
        ↓
Knowledge Router selects trusted source strategy
        ↓
Research
        ↓
Evidence/provenance recorded
        ↓
Task context updated
```

Current research should prefer authoritative primary sources where appropriate.

Research results may be cached using freshness policy.

---

# 24. Research Results Are Not Automatically Expertise

External research performed for one task does not automatically become permanent discipline knowledge.

It may become:

- temporary task context,
- project intelligence,
- candidate pack update,
- or world-intelligence cache.

Promotion requires an explicit process.

---

# 25. Expertise Pack Builder

Introduce a system-level specialist:

**Expertise Pack Builder**

Responsibilities:

- respond to missing expertise,
- locate existing relevant packs,
- compose packs,
- identify missing knowledge,
- initiate research,
- structure knowledge,
- create methods/checklists where justified,
- prepare benchmarks,
- version candidate packs.

The Pack Builder does not independently certify its own work.

---

# 26. Expertise Curator / Auditor

Introduce a second system-level specialist:

**Expertise Curator**

Responsibilities:

- inspect provenance,
- inspect source authority,
- detect contradictions,
- validate freshness metadata,
- detect unsupported claims,
- run pack benchmarks,
- reject weak packs,
- approve/promote packs.

Pack Builder and Curator should be logically separate responsibilities even if the same underlying model is used at different times.

---

# 27. How a New Agent Gets Expertise

When the Recruiter needs an agent for a capability not currently covered:

```text
CAPABILITY GAP
      ↓
Recruiter checks global agents
      ↓
Recruiter checks existing Expertise Packs
      ↓
Can agent be composed from current packs?
      │
   YES│                 NO
      ▼                  ▼
Compose candidate      Pack Builder
      │                  │
      │            Research / structure
      │                  │
      └────────────┬─────┘
                   ▼
              Candidate Agent
                   ↓
             Pack Curator
                   ↓
               Audition
                   ↓
          Pass / revise / reject
                   ↓
        Global Agent Registry
```

This is the normal method through which GAN expands professional capability.

---

# 28. Expertise Pack Audition

A new pack must be tested through realistic work.

Example:

Capability:

`f2p_economy_analysis`

Audition:

> Given this synthetic economy, identify inflation, progression blockage, exploitable loops, and likely monetization pressure points. Propose corrections and justify them with calculations/evidence.

Evaluation may include:

- factual correctness,
- method adherence,
- useful diagnosis,
- unsupported-confidence rate,
- ability to request missing evidence,
- output quality,
- QA performance.

A pack that cannot improve agent performance should not be promoted simply because it looks comprehensive.

---

# 29. Expertise Pack Benchmarks

Each important pack should gradually acquire benchmark tasks.

Benchmarks support:

- regression testing,
- model comparison,
- pack version comparison,
- new-agent auditions,
- local-model viability testing.

Example:

```text
game-ux-core benchmark suite

UX-001 controller dead-end
UX-002 unreadable hierarchy
UX-003 modal trap
UX-004 misleading affordance
UX-005 mobile touch conflict
```

---

# 30. Continuous Learning Principle

GAN should become more capable through use.

However:

> **Raw agent output must never directly rewrite global knowledge.**

Learning uses a staged evidence pipeline.

---

# 31. Learning Pipeline

```text
Production event
      ↓
Observation
      ↓
Outcome / QA / human feedback
      ↓
Candidate lesson
      ↓
Cross-task comparison
      ↓
Evidence accumulation
      ↓
Experience Distillation
      ↓
Validated heuristic
      ↓
Global Experience Intelligence
      ↓
Possible Expertise Pack update
```

---

# 32. Experience Observation

GAN records experience candidates when noteworthy events occur.

Examples:

- repeated failure,
- surprising success,
- human rejection,
- QA catching an issue missed by an agent,
- local model outperforming cloud model,
- methodology producing significantly better results,
- task requiring unusually many revisions,
- cross-project repeated issue.

Observation records are not universal truths.

---

# 33. Experience Schema

Conceptual:

```yaml
experience_observation:
  id:
  project_id:
  task_id:
  agent_id:
  capability:
  method:
  context_tags: []
  observation:
  outcome:
  evidence:
  human_feedback:
  confidence:
  candidate_scope:
```

---

# 34. Candidate Lesson States

Suggested lifecycle:

```text
OBSERVATION
   ↓
CANDIDATE
   ↓
REPEATED
   ↓
VALIDATED
   ↓
PROMOTED
```

Possible alternate states:

- rejected,
- superseded,
- project_only,
- expired.

---

# 35. Experience Distiller

Introduce a system-level specialist:

**Experience Distiller**

Responsibilities:

- review accumulated observations,
- identify repeated patterns,
- compare contexts,
- identify false generalization risk,
- propose candidate heuristics,
- define scope,
- attach evidence.

The Distiller must not promote its own lesson to trusted knowledge.

---

# 36. Experience Validation

Candidate global lessons require evidence.

Potential signals:

- repetition across tasks,
- repetition across projects,
- strong QA outcome,
- human approval,
- deterministic measurement,
- successful controlled comparison,
- benchmark improvement.

Confidence should increase through evidence rather than model certainty.

---

# 37. Scope of Learned Knowledge

Every lesson must define applicability.

Examples:

```text
GLOBAL
Controller focus must remain visible.

DOMAIN
Pixel-art UI image generation benefits from nearest-neighbor technical validation.

ENGINE
Godot Control nodes require X handling in this version.

PROJECT
Cosmic Meltdown player panels should have equal visual weight.

USER-TASTE
Oren prefers denser UI rather than large empty cards.
```

Project and user-taste lessons must not automatically become global professional rules.

---

# 38. Project-to-Global Promotion

Project experience may be promoted globally only after abstraction.

Bad:

> "Cosmic Meltdown blue buttons were good."

Possible generalized candidate:

> "In four-player local selection screens, equal panel structure plus distinct active-state emphasis repeatedly reduced navigation ambiguity."

Evidence and scope must remain attached.

---

# 39. Human Feedback Weight

Human acceptance/rejection is important evidence.

It is not automatically universal.

Example:

Oren rejects a specific UI because it feels too modern.

Record:

```text
project: Cosmic Meltdown
reason: conflicts with established 16-bit visual language
```

Do not automatically store:

> Modern UI is bad.

---

# 40. Failure Learning

Failure is one of GAN's most valuable learning sources.

After repeated failure, store:

- attempted strategy,
- why it failed,
- evidence,
- successful alternative if found,
- applicable context.

Future context assembly should retrieve relevant prior failures.

---

# 41. Postmortem Generation

Significant tasks may generate a compact production postmortem.

Examples:

- major feature,
- expensive failure,
- new agent hire,
- new tool integration,
- major QA escape,
- successful unusual workflow.

Postmortems feed Experience Intelligence.

---

# 42. Global Agent Bench

GAN should ship with a global **available-to-hire Lead Bench**.

These agents are definitions available to the GM.

They are not all active.

They should only receive project assignments when relevant.

---

# 43. Core Lead Bench

These are broad Leads the GM should consider for almost every substantial game project.

## Production Lead

Owns:

- planning,
- milestone risk,
- dependencies,
- scope,
- coordination,
- production health.

Core packs:

- game-production-core
- dependency-management
- scope-risk

---

## Game Design Lead

Owns:

- game loop,
- mechanics,
- systems,
- balance direction,
- player experience.

Core packs:

- game-design-core
- systems-design
- gameplay-analysis

---

## Engineering Lead

Owns:

- architecture,
- technical implementation,
- code health,
- builds,
- runtime constraints.

Core packs:

- game-engineering-core
- architecture
- debugging-testing

Engine packs are attached dynamically.

---

## Art Lead

Owns:

- visual language,
- asset consistency,
- visual production.

Core packs:

- game-art-direction
- visual-language
- asset-production

2D/3D packs attach dynamically.

---

## UX Lead

Owns:

- interaction,
- information hierarchy,
- menus,
- controls,
- usability,
- interface behavior.

Core packs:

- game-ux-core
- interaction-design
- accessibility-basics

---

## QA Lead

Owns:

- test strategy,
- evidence,
- regressions,
- release quality.

Core packs:

- game-qa-core
- evidence-design
- regression-strategy

---

## Audio Lead

Owns:

- music/SFX/dialogue direction,
- implementation,
- mix consistency.

Only activate if audio is relevant.

Core packs:

- game-audio-core
- interactive-audio

---

# 44. Conditional Lead Bench

These Leads become relevant based on project fingerprint.

## Narrative Lead

Triggers:

- meaningful story,
- dialogue,
- quests,
- branching narrative,
- lore.

Packs:

- narrative-design
- interactive-writing
- continuity

---

## Level / World Design Lead

Triggers:

- authored levels,
- exploration,
- open world,
- missions,
- spatial progression.

---

## Technical Art Lead

Triggers:

- 3D,
- complex rendering,
- shaders,
- procedural art,
- pipeline complexity,
- performance-heavy art.

---

## 2D Art Lead

Triggers:

- sprite-based production,
- illustration-heavy games,
- pixel art,
- 2D animation.

---

## 3D Art Lead

Triggers:

- 3D characters,
- props,
- environments,
- material-heavy production.

---

## Animation Lead

Triggers:

- substantial character/gameplay animation,
- rigs,
- mocap,
- cinematic animation.

---

## VFX Lead

Triggers:

- substantial real-time effects.

---

## Cinematics Lead

Triggers:

- cutscenes,
- scripted cameras,
- performance capture,
- cinematic pipeline.

---

## Multiplayer / Online Lead

Triggers:

- network multiplayer,
- matchmaking,
- replication,
- online state.

---

## Backend / Live Services Lead

Triggers:

- server backend,
- accounts,
- cloud persistence,
- inventories,
- live configuration,
- services.

---

## Security / Anti-Cheat Lead

Triggers:

- competitive online play,
- valuable economies,
- player trust/security concerns.

---

## Performance / Rendering Lead

Triggers:

- demanding 3D,
- strict hardware targets,
- performance problems,
- complex rendering.

---

## Tools / Pipeline Lead

Triggers:

- substantial custom pipeline,
- large content team,
- editor extensions,
- automation needs.

---

## Platform / Build / Release Lead

Triggers:

- shipping intent,
- multiple target platforms,
- CI/CD,
- packaging complexity.

---

## Mobile Platform Lead

Triggers:

- iOS,
- Android,
- mobile hardware,
- touch input,
- device fragmentation.

---

## PC Platform Lead

Triggers:

- PC-first release,
- scalable hardware,
- keyboard/mouse,
- graphics settings,
- storefront/platform requirements.

---

## Console Platform Lead

Triggers:

- PlayStation,
- Xbox,
- Nintendo platforms,
- certification,
- controller-first UX,
- platform-specific constraints.

---

## Web Platform Lead

Triggers:

- browser deployment,
- WebGL/WebGPU,
- browser storage,
- web performance constraints.

---

## XR Lead

Triggers:

- VR,
- AR,
- MR,
- spatial input,
- comfort constraints.

---

# 45. Product / F2P / Commercial Lead Bench

## Product Lead

Triggers:

- KPI-driven product,
- F2P,
- live service,
- long-term engagement.

---

## Economy / Monetization Lead

Triggers:

- virtual currency,
- MTX,
- IAP,
- stores,
- offers,
- subscriptions,
- battle passes,
- rewarded ads.

Core packs:

- game-economy
- monetization
- ethical-monetization
- pricing

---

## LiveOps Lead

Triggers:

- events,
- seasons,
- rotating content,
- live configuration,
- engagement calendar.

---

## Data / Analytics Lead

Triggers:

- telemetry,
- funnels,
- experiments,
- live balancing,
- KPI decisions.

---

## Growth / User Acquisition Lead

Triggers:

- mobile F2P,
- paid acquisition,
- creative optimization,
- install funnels.

This role is optional for development-only projects.

---

# 46. Research / Player Validation Lead Bench

## User Research / Playtest Lead

Triggers:

- subjective UX/gameplay validation,
- player comprehension,
- fun,
- usability,
- onboarding,
- major design questions.

This Lead is strategically important because GAN must not pretend that LLM evaluation proves human experience.

---

## Accessibility Lead

Triggers:

- any project with meaningful player-facing UI/input,
- console certification,
- explicit accessibility target.

May remain a secondary reviewer on smaller projects.

---

# 47. Shipping / Operations Lead Bench

## Localization Lead

Triggers:

- multiple languages,
- text-heavy production,
- global release.

---

## Certification / Compliance Lead

Triggers:

- console,
- regulated platform,
- ratings,
- privacy,
- platform policy requirements.

---

## Community / Player Support Lead

Triggers:

- live game,
- community operations,
- moderation,
- support.

---

# 48. AI Production Lead Bench

## Local Model Expert

Already required by main PRD.

Owns:

- local model suitability,
- hardware,
- benchmark history,
- cost avoidance,
- model routing advice.

---

## Generative AI / Content Pipeline Lead

Triggers:

- image generation,
- audio generation,
- procedural AI production,
- large AI-assisted content pipeline.

This is not the same as Local Model Expert.

---

# 49. GM's First Roster Decision

When a project is imported, the GM's first meaningful production decision is:

> **Which Leads should inspect this project?**

The GM must not activate the entire global bench.

---

# 50. Project Fingerprint

GM reconnaissance produces a Project Fingerprint.

Conceptual:

```yaml
project_fingerprint:
  digital: true
  engine: godot
  rendering: 2d
  art_mode:
    - pixel_art
  platforms:
    - pc
  multiplayer:
    type: local
  monetization:
    type: premium_or_unknown
  live_service: false
  narrative_weight: low
  ui_weight: high
  online_backend: false
  production_stage: prototype
```

---

# 51. Roster Selection Rules

Roster selection should use:

- project fingerprint,
- detected repository structure,
- current production stage,
- active user objective,
- risk profile,
- confidence.

Start with the smallest useful Lead roster.

Example:

```text
2D LOCAL GODOT PROTOTYPE

Production Lead
Game Design Lead
Engineering Lead
2D Art Lead
UX Lead
QA Lead
```

Audio only if meaningful audio exists.

---

# 52. Conditional Roster Examples

## Mobile F2P

Likely:

```text
Production
Game Design
Engineering
Art
UX
QA
Product
Economy/Monetization
LiveOps
Data/Analytics
Mobile Platform
User Research
```

## 3D PC/Console Action Game

Likely:

```text
Production
Game Design
Engineering
Art
UX
QA
3D Art
Technical Art
Animation
Performance/Rendering
Platform/Release
Console Platform
Audio
User Research
```

Add Narrative/Cinematics where appropriate.

## Online Competitive Game

Likely additions:

```text
Multiplayer/Online
Backend/Live Services
Security/Anti-Cheat
Data
LiveOps
```

## Narrative Indie Game

Likely:

```text
Production
Game Design
Engineering
Art
UX
QA
Narrative
Audio
Localization
```

---

# 53. Lead Self-Relevance

A selected Lead may report:

`DOMAIN_NOT_RELEVANT`

during reconnaissance if evidence shows its domain is not materially involved.

This is not a failure.

The GM should remove it from the active onboarding roster.

---

# 54. Lead Referral

A Lead may recommend another Lead.

Example:

> Art Lead detects complex runtime shader constraints and recommends Technical Art Lead.

Referral goes to GM.

GM decides whether to activate.

---

# 55. New Lead Creation

If the project requires a Lead domain absent from the global bench:

1. GM creates capability gap.
2. Recruiter identifies required capabilities.
3. Expertise Pack Builder searches/composes domain expertise.
4. Candidate Lead is assembled.
5. Candidate performs `assess_project_domain` audition.
6. Candidate passes domain benchmark.
7. Candidate enters probation.
8. Lead becomes globally available.

---

# 56. Knowledge Storage Philosophy

GAN knowledge should not "just sit in Markdown."

It should also not depend on a proprietary knowledge app.

The architecture must separate:

> **canonical human-readable knowledge**  
> from  
> **derived machine indexes**

---

# 57. Storage Layers

Use four primary storage layers.

```text
1. PROJECT CANONICAL STORE
2. GLOBAL KNOWLEDGE REPOSITORY
3. DERIVED SEARCH / RUNTIME INDEXES
4. CONTENT-ADDRESSED BLOB STORE
```

---

# 58. Project Canonical Store

Lives in the game repository under:

```text
.gameagent/
```

Contains project-specific durable knowledge.

Example:

```text
.gameagent/
  project.yaml
  policy.yaml
  events/
  decisions/
  intelligence/
  assumptions/
  contracts/
  evaluations/
  manifests/
  references/
```

Suitable formats:

- Markdown for human-readable narrative knowledge,
- YAML for configuration/structured concepts,
- JSON/JSONL for event/schema-heavy data.

This remains Git-friendly.

---

# 59. Project Intelligence Folder

Suggested:

```text
.gameagent/intelligence/
  design/
  engineering/
  art/
  ux/
  narrative/
  audio/
  qa/
  production/
  product/
  platform/
```

Do not require a file per trivial fact.

The daemon may materialize useful summaries/views from event/project state.

---

# 60. Global Knowledge Repository

Expertise Packs and validated global experience must not live inside individual game repos.

Default conceptual location:

```text
~/.gameagent/knowledge/
```

or a configurable GAN home directory.

Structure:

```text
knowledge/
  expertise-packs/
  experience/
  sources/
  benchmarks/
  methods/
  pack-registry/
```

This repository should itself be versioned.

Recommended approach:

- initialize it as a Git repository,
- allow optional private remote sync,
- version Expertise Pack changes,
- tag releases,
- enable rollback.

---

# 61. Global Knowledge Must Not Leak Project IP

Raw project-specific data must not be copied into the global repository by default.

Only explicitly abstracted/promoted lessons belong there.

Example:

Allowed:

> "When controller focus disappears after modal close, restore focus to the invoking control."

Not allowed:

> "Cosmic Meltdown's Player 3 widget at res://ui/foo.tscn was broken."

Project details remain project-local.

---

# 62. Derived Runtime Database

Use GAN's existing local operational database for:

- metadata,
- indexes,
- relationships,
- current state,
- full-text indexes,
- source metadata,
- retrieval statistics,
- agent performance.

SQLite remains rebuildable.

It is not canonical knowledge storage.

---

# 63. Full-text Search

Use SQLite FTS5 or equivalent for:

- Markdown,
- YAML-normalized text,
- source summaries,
- methods,
- events,
- project facts.

Full-text search should remain available even if embeddings are unavailable.

---

# 64. Vector / Semantic Index

Add a pluggable vector-index abstraction.

Initial recommended local implementation:

- embedded local vector store such as LanceDB, or
- equivalent library that does not require remote infrastructure.

The exact technology may be decided through ADR during implementation.

Requirements:

- local-first,
- metadata filtering,
- rebuildable,
- content versioning,
- multimodal extension possible.

Do not make vector storage canonical.

---

# 65. Content-addressed Blob Store

Images, audio, videos, screenshots, embeddings source artifacts, and other large evidence should not be duplicated arbitrarily.

Use a local content-addressed store.

Conceptual:

```text
~/.gameagent/blobs/
  sha256/
    ab/
      abcd1234...
```

Metadata references blobs through hashes.

This supports:

- deduplication,
- provenance,
- immutable evidence,
- cross-project shared public sources.

Sensitive project blobs remain scoped/private through metadata and policy.

---

# 66. Research Cache

Fresh external research may use a cache.

Track:

- source,
- retrieval date,
- TTL,
- relevant capability,
- source hash,
- stale state.

Expired research should trigger refresh when task-critical.

---

# 67. Obsidian

Obsidian may be supported as an **optional human knowledge interface**.

Possible uses:

- browse Expertise Packs,
- inspect Project Intelligence,
- manually edit curated Markdown,
- view backlinks,
- add human notes.

However:

> **Obsidian must not be a GAN runtime dependency.**

GAN must work when Obsidian is not installed.

GAN's source of truth is the structured knowledge repository/files plus event history.

If an Obsidian vault is used, it should point at or mirror human-readable knowledge, not hide essential state in Obsidian-specific metadata.

---

# 68. Why Not Pure Markdown

Pure Markdown is insufficient for:

- structured confidence,
- provenance,
- freshness,
- event relationships,
- capability mapping,
- versioned schemas,
- search ranking,
- agent performance,
- evidence state,
- task links.

Markdown remains important for human readability.

Structured metadata must accompany it.

---

# 69. Why Not Database-only

Database-only knowledge is insufficient for:

- Git history,
- review,
- human editing,
- portability,
- portfolio inspection,
- reproducibility,
- project-owned truth.

Therefore GAN uses:

> files as canonical knowledge + database/indexes as derived acceleration.

---

# 70. Knowledge IDs

Every important knowledge item should have stable identity.

Examples:

- source IDs,
- method IDs,
- expertise pack IDs,
- heuristic IDs,
- assumption IDs,
- decision IDs.

References should not rely solely on filenames.

---

# 71. Knowledge Versioning

Expertise Packs use semantic or monotonic versions.

Agent assignments record exact pack versions.

Example:

```text
UX Lead
game-ux-core@1.8
controller-navigation@2.1
accessibility-games@1.3
```

This makes results reproducible.

---

# 72. Pack Upgrade Policy

A new Expertise Pack version does not silently change active work.

Default:

- new tasks use latest trusted version,
- active task keeps its assigned version,
- important major-version updates may trigger GM review,
- benchmark regressions block promotion.

---

# 73. Knowledge Deprecation

Knowledge can become stale, wrong, or superseded.

States:

- active,
- deprecated,
- superseded,
- disputed,
- expired.

Agents should not retrieve deprecated knowledge by default.

---

# 74. Contradiction Handling

If two sources disagree:

1. preserve both claims,
2. compare authority/freshness/context,
3. attempt resolution,
4. mark unresolved disagreement if necessary.

Do not silently collapse contradictions into one synthesized claim.

---

# 75. Knowledge Confidence

Confidence must derive from evidence, not prose style.

Signals may include:

- source authority,
- agreement across sources,
- deterministic validation,
- project evidence,
- human validation,
- repeated experience.

---

# 76. Professional Standards vs Taste

Expertise must distinguish:

- standards,
- best practices,
- heuristics,
- trends,
- project rules,
- user taste.

Example:

> visible keyboard focus = accessibility requirement/strong standard

versus:

> chunky UI borders = project visual preference.

---

# 77. Knowledge Write Permissions

Not every agent may edit Expertise Packs.

Workers may:

- cite,
- use,
- propose observations,
- propose candidate lessons.

Only approved Knowledge Fabric processes may:

- promote global lessons,
- update trusted packs,
- deprecate trusted knowledge.

---

# 78. Knowledge Governance Agents

System-level knowledge agents:

## Expertise Pack Builder

Creates/extends packs.

## Expertise Curator

Validates packs.

## Research Specialist

Performs freshness/current-world research.

## Experience Distiller

Finds patterns from production observations.

## Knowledge Maintainer

Runs scheduled maintenance such as:

- stale-source review,
- broken source detection,
- benchmark regression,
- deprecated version cleanup.

These are infrastructure agents rather than project Leads.

---

# 79. Continuous Improvement Loop

GAN should improve in three independent ways.

## Agent Performance Learning

Which agent/model/tool combination performs best.

## Expertise Learning

Which professional knowledge/methods improve outcomes.

## Project Learning

What is true/preferred within one project.

Do not merge these categories.

---

# 80. Model Performance Learning

Record model performance by task type.

Example:

```text
Qwen Local
asset tagging: excellent
complex UX diagnosis: mediocre

Codex
Godot implementation: excellent
bulk metadata tagging: unnecessarily expensive
```

This feeds Local Model Expert and Model Router.

---

# 81. Method Performance Learning

Track whether methods/playbooks correlate with better results.

Example:

```text
controller_navigation_audit@2

Tasks: 38
QA escape reduction: 41%
Average revision reduction: 0.8
```

Do not imply causal certainty without sufficient evidence.

---

# 82. Pack Performance Learning

Track Expertise Pack impact using benchmarks and production outcomes.

This allows:

- pack improvement,
- pack rollback,
- identifying useless knowledge,
- identifying missing domain coverage.

---

# 83. Automatic Learning Cadence

Do not require all learning to happen synchronously during user work.

GAN Daemon may run low-priority maintenance when idle:

- build retrieval indexes,
- summarize completed task evidence,
- generate candidate experience observations,
- run cheap local benchmarks,
- identify stale Expertise Pack sources.

No external paid calls without existing budget policy.

---

# 84. Background Learning Safety

Background learning must:

- respect budget,
- respect provider caps,
- avoid modifying active production state,
- avoid globally promoting lessons without validation,
- be interruptible,
- expose activity in Studio.

---

# 85. Studio — Specialist Intelligence Inspector

Every agent Inspector should expose its "qualification."

High level:

```text
UX LEAD

Capabilities
Game UX
Controller Navigation
HUD Design

Current Expertise
game-ux-core@1.8
controller-navigation@2.1
accessibility-games@1.3

Current Project Understanding
High confidence

Experience
42 related tasks
```

Expand:

- methods,
- key sources,
- pack versions,
- benchmarks,
- relevant experience.

Deeper:

- exact retrieved knowledge used for current task,
- source provenance,
- context packet.

---

# 86. Studio — Why This Recommendation?

Agent outputs should support an expandable:

**Why?**

Example:

```text
RECOMMENDATION
Use a persistent active-player border rather than hover-only emphasis.

Why?

Project evidence
- controller input supported
- no pointer hover on gamepad

UX expertise
- focus must remain visible
- active selection requires persistent state communication

Runtime evidence
- current state differs only by subtle color value

Confidence
High
```

This is a key portfolio feature.

---

# 87. Studio — Knowledge View

Add a Knowledge surface or section within Project Intelligence.

Tabs:

- Project
- Expertise
- Experience
- Current Research

Allow filtering by:

- domain,
- capability,
- source,
- confidence,
- freshness.

Do not expose an unstructured document dump.

---

# 88. Studio — Learning View

Show meaningful learning transparently.

Example:

```text
NEW CANDIDATE LESSON

Domain: Controller UX

Observation:
Three tasks required manual correction because
focus restoration after modal close was omitted.

Evidence:
3 projects
5 QA failures
2 human confirmations

Status:
Candidate

[Inspect]
```

Promotion is not necessarily a user decision unless policy requires it.

---

# 89. Specialist Output Contract

Significant specialist output should include:

- conclusion,
- recommendation,
- project evidence,
- professional reasoning,
- uncertainty,
- missing evidence,
- QA plan,
- sources when current research was used.

Avoid forcing this verbose structure into every UI-facing message.

Store structured details and present concise top-level summaries.

---

# 90. Domain-led Onboarding Integration

Update the Domain-Led Onboarding addendum.

When a Lead performs `assess_project_domain`, it must use:

- Project Intelligence available so far,
- its Expertise Packs,
- relevant World Intelligence,
- relevant validated Experience Intelligence.

This is how Leads should be capable of saying:

> "Cool, I get it."

or:

> "I need this right now."

with actual professional grounding.

---

# 91. Lead Domain Baseline

Before performing onboarding, a Lead must pass baseline qualification for its domain.

A generic uncatalogued LLM cannot be presented as:

> "Technical Art Lead"

without:

- capabilities,
- appropriate Expertise Packs,
- evaluation,
- at least baseline audition.

---

# 92. Onboarding Recommendation Quality

Leads should not merely report missing metadata.

They must interpret the project through professional priorities.

Example weak Lead output:

> "Target resolution not found."

Example specialist output:

> "The project currently scales 320×180 assets to a 640×360 viewport using nearest filtering. This is internally coherent, so I do not need target resolution clarified before UI work."

---

# 93. Recruiter Integration

Update Recruiter logic.

A capability gap may arise because:

1. no agent has the capability,
2. agent exists but lacks required Expertise Pack,
3. Expertise Pack exists but required tool is missing,
4. knowledge is stale,
5. agent repeatedly fails benchmark/task,
6. current model is insufficient.

Recruiter must diagnose which problem exists before creating a new agent.

---

# 94. Avoid Agent Explosion

Do not hire a new agent when the real need is:

- attach another pack,
- add a method,
- add a tool,
- change model,
- update knowledge.

Example:

Existing UX Lead needs `vr-spatial-ux`.

Prefer attaching a validated pack if the underlying capabilities are compatible.

Create a separate VR UX Lead only if meaningful specialization warrants it.

---

# 95. Specialist Composition Record

Every active worker assignment should record:

```text
Agent definition
+ pack versions
+ model
+ tools
+ context packet version
+ task
+ QA requirements
```

This allows exact investigation after success/failure.

---

# 96. Reproducibility

For an important historical task, GAN should be able to answer:

> Which agent, model, expertise, project state, method, and tools produced this result?

This is an explicit design requirement.

---

# 97. Intellectual Property / External Knowledge

Do not blindly copy full copyrighted professional books/articles into Expertise Packs.

Prefer:

- structured notes,
- distilled principles,
- source references,
- permitted documentation,
- small necessary excerpts where lawful/appropriate,
- original GAN playbooks derived from multiple sources.

Exact legal handling may vary by source.

Provenance must remain.

---

# 98. Public vs Private Expertise

Global knowledge may contain:

- public Expertise Packs,
- private user-created packs,
- organization-specific packs.

Architecture should support visibility scope later.

Do not make multiplayer/enterprise sharing a v1 blocker.

---

# 99. Importable Expertise Packs

Design packs to eventually support:

```bash
gameagent expertise install <pack>
gameagent expertise update
gameagent expertise inspect <pack>
```

Do not implement a public marketplace initially.

---

# 100. Initial Expertise Packs to Build

Do not build every possible pack immediately.

Phase 1 knowledge baseline should prioritize:

1. game-production-core
2. game-design-core
3. game-engineering-core
4. game-art-direction
5. game-ux-core
6. game-qa-core
7. project-intelligence-analysis
8. godot-core
9. godot-ui-engineering
10. 2d-game-art
11. pixel-art-production
12. controller-navigation
13. game-accessibility-basics
14. local-model-selection

These support the Cosmic Meltdown vertical slice and domain-led onboarding.

---

# 101. Second Expertise Wave

After vertical slice:

- game-audio-core
- narrative-design
- multiplayer-networking
- backend-live-services
- 3d-art-production
- technical-art-core
- animation-production
- performance-rendering
- mobile-platform
- console-platform
- product-f2p
- game-economy
- monetization
- liveops
- analytics
- user-research-playtesting
- localization
- certification-compliance

---

# 102. Expertise Pack Definition of Done

A trusted pack requires:

- structured manifest,
- capabilities,
- sources,
- at least one method/playbook,
- evidence expectations,
- freshness policy,
- evaluation suite,
- no unresolved critical provenance issues,
- successful benchmark/audition.

---

# 103. Knowledge Fabric Services

Add conceptual services:

```text
Knowledge Router
Expertise Registry
Source Registry
Research Cache
Experience Store
Experience Distiller
Pack Builder
Pack Curator
Vector Index
Full-text Index
Blob Store
```

These may initially live inside GAN Daemon rather than separate processes.

Do not microservice prematurely.

---

# 104. Suggested Repository Additions

Global Game Agent Network source repo:

```text
packages/
  knowledge-schema/
  expertise-schema/

services/daemon/gameagent/
  knowledge/
    router/
    expertise/
    research/
    experience/
    indexing/
    blobs/

expertise/
  builtin/

benchmarks/
  expertise/
```

Runtime global data:

```text
~/.gameagent/
  knowledge/
  state/
  indexes/
  blobs/
  cache/
```

---

# 105. Search API

Internal Knowledge API should support conceptual operations:

```text
get_project_context(task, domain)
get_expertise(capabilities, task)
get_current_world_knowledge(requirement)
get_relevant_experience(task, domain)
get_method(method_id)
get_checklist(checklist_id)
record_observation(...)
propose_candidate_lesson(...)
```

---

# 106. Knowledge Packet Size Policy

Expertise must not destroy context efficiency.

Context assembler should prioritize:

1. exact task facts,
2. relevant project decisions,
3. method/playbook,
4. highest-relevance expertise,
5. prior relevant failures,
6. current external facts.

Long documents should be retrieved by subsection.

---

# 107. Specialist Autonomy and Research

A specialist may request additional knowledge during work.

Example:

> Current Nintendo certification requirement is not in trusted fresh knowledge.

Agent should pause that subproblem and request research.

It should not hallucinate a requirement.

---

# 108. Knowledge Failure

Missing knowledge is a legitimate blocking state.

Task may become:

`BLOCKED_KNOWLEDGE`

GM then chooses:

- research,
- update pack,
- hire specialist,
- ask human,
- proceed with explicit assumption.

---

# 109. Confidence-driven Behavior

Low confidence should affect actions.

Example:

- low-confidence recommendation + high-impact change → escalate,
- low-confidence reversible prototype → experiment,
- low-confidence external requirement → research.

---

# 110. Expertise vs Authority

Having expertise does not grant authority.

Example:

Economy Lead may strongly recommend pricing changes.

GM/human authority policy still decides whether implementation proceeds.

---

# 111. Specialist Pushback

Expertise Packs should make agents capable of meaningful pushback.

Example:

User:

> "Add another confirmation dialog."

UX Lead:

> "I recommend against this. The action is reversible and the current flow already requires two confirmations. A third confirmation is likely to increase friction without protecting irreversible state."

The Lead must cite project and professional reasoning.

---

# 112. Learning From Pushback Outcomes

If the human overrides a Lead and results later validate or invalidate the Lead's concern, record outcome.

Do not treat human override as proof that the specialist was wrong.

---

# 113. Quality Gates for Knowledge-generated Recommendations

High-impact recommendations should require stronger grounding.

Examples:

- major economy change,
- architecture replacement,
- accessibility compliance,
- console certification.

Require authoritative/current sources or strong project evidence as appropriate.

---

# 114. Portfolio Requirement

Knowledge Fabric must be visible enough to demonstrate that GAN specialists are not superficial personas.

Portfolio demo should be able to show:

> UX Lead recommendation  
> → relevant Project Intelligence  
> → professional method  
> → actual sources  
> → runtime evidence  
> → QA outcome  
> → learned experience

This is a major differentiator.

---

# 115. Key Portfolio Story

GAN should credibly communicate:

> "A normal agent is given a role and a task.  
> GAN specialists are assembled from project state, curated professional expertise, current external knowledge, real tools, evidence requirements, and a continuously improving experience layer."

This concept should appear in architecture documentation and README.

---

# 116. Implementation Phases

## Knowledge Phase 0 — Schemas

Deliver:

- Expertise Pack schema,
- Source schema,
- Method schema,
- Experience schema,
- readiness integration,
- knowledge IDs,
- versioning.

## Knowledge Phase 1 — Built-in Packs

Create initial pack set required by Cosmic Meltdown.

Do not create enormous generic encyclopedias.

Prefer high-quality compact expertise with real methods.

## Knowledge Phase 2 — Router

Implement:

- Project Intelligence retrieval,
- Expertise retrieval,
- context packets,
- provenance.

## Knowledge Phase 3 — Lead Onboarding

Every initial Lead assessment must use Knowledge Fabric.

Acceptance:

UX and Engineering Leads inspect the same project but receive meaningfully different relevant expertise/context.

## Knowledge Phase 4 — Experience Capture

Record:

- outcomes,
- failures,
- QA,
- human feedback,
- agent/model/tool composition.

No automatic promotion yet.

## Knowledge Phase 5 — Experience Distillation

Create candidate lessons and validation workflow.

## Knowledge Phase 6 — Recruiter Pack Creation

Capability gap can generate a new Expertise Pack candidate.

## Knowledge Phase 7 — Continuous Maintenance

Freshness, benchmark regressions, pack updates, stale knowledge.

---

# 117. Acceptance Tests

## Test A — Generic Agent vs Specialist

Give a generic model and GAN UX Lead the same UI task.

GAN specialist must demonstrate use of:

- relevant project facts,
- UX method,
- evidence,
- explicit uncertainty.

## Test B — Domain Projection

Engineering and Art Leads assess the same repo.

They must receive different context packets appropriate to their domains.

## Test C — Freshness

Give Platform Lead a freshness-sensitive requirement with expired knowledge.

It must request current research rather than trust stale pack data.

## Test D — New Expertise

Request a capability without an existing pack.

Recruiter must trigger pack construction/validation before claiming expertise.

## Test E — Learning

Repeat a measurable failure pattern across multiple tasks.

GAN should create a candidate experience lesson.

It must not immediately become global trusted knowledge.

## Test F — Project Isolation

A project-specific aesthetic preference must not appear as a professional rule in another project.

## Test G — Pack Regression

Introduce a new pack version that performs worse on benchmarks.

Promotion must fail or warn according to policy.

## Test H — Provenance

From a specialist recommendation in Studio, user must be able to drill down to the knowledge/evidence that informed it.

---

# 118. New Architectural Invariants

Add these invariants to the main PRD.

### Invariant 17 — Specialists Require Expertise

> A role label or system prompt alone does not qualify an agent as a specialist. Specialist capability must be backed by appropriate Expertise Packs, tools/methods, and evaluation.

### Invariant 18 — Four Knowledge Planes

> Significant specialist work must be able to draw independently from Project Intelligence, Discipline Intelligence, World Intelligence, and Experience Intelligence.

### Invariant 19 — Learning Is Evidence-gated

> Raw agent output may create observations or candidate lessons, but cannot directly rewrite trusted global expertise.

### Invariant 20 — Canonical vs Derived Storage

> Canonical knowledge must remain portable and versioned. Runtime databases, embeddings, and search indexes are derived and rebuildable.

### Invariant 21 — Project Knowledge Isolation

> Project-specific creative identity, confidential context, and taste must not silently become global professional knowledge.

### Invariant 22 — Expertise Has Provenance

> Trusted expertise must be inspectable by source, version, freshness, and applicable capability.

### Invariant 23 — Methods Matter

> Expertise Packs must contain methods/playbooks/evidence expectations where appropriate, not merely reference text.

### Invariant 24 — Missing Knowledge Must Be Explicit

> Agents must be allowed to declare missing or stale knowledge rather than fabricate confidence.

---

# 119. Integration With Existing PRD Agent Hiring

Replace the simple concept:

> "Recruiter composes a new system prompt and tools."

with:

> "Recruiter diagnoses the missing capability, identifies or builds the required Expertise Packs, composes a candidate specialist from expertise + model + tools + methods + policies, audits the pack, auditions the agent, and only then promotes the specialist."

---

# 120. Integration With Domain-led Onboarding Addendum

The GM's onboarding sequence becomes:

```text
Import
  ↓
Reconnaissance
  ↓
Project Fingerprint
  ↓
GM chooses initial Lead roster
  ↓
Knowledge Fabric assembles each Lead's expertise
  ↓
Leads independently assess domains
  ↓
GM reconciles
  ↓
Human resolves true blockers
  ↓
Active project
```

This addendum is the knowledge architecture supporting that behavior.

---

# 121. Initial Codex Assignment for This Addendum

Do **not** attempt to fill GAN with broad professional knowledge immediately.

First implementation assignment:

1. add Expertise Pack, Source, Method, Experience and Knowledge Packet schemas;
2. create ADR for canonical Knowledge Fabric storage;
3. create global GAN knowledge directory abstraction;
4. implement pack registry;
5. implement source provenance/freshness metadata;
6. implement Knowledge Router interface;
7. create three small high-quality packs:
   - `game-ux-core`,
   - `game-engineering-core`,
   - `game-qa-core`;
8. create one domain-specific extension:
   - `godot-ui-engineering`;
9. make UX Lead and Engineering Lead use different retrieved expertise during a fixture onboarding;
10. expose used pack versions and retrieved knowledge in the Agent Inspector;
11. write tests proving project-specific knowledge does not enter the global knowledge store automatically;
12. stop and report before implementing Experience Distillation or automatic Pack Builder research.

---

# 122. Final Principle

A GAN specialist should not feel like:

> "ChatGPT was told to pretend to be a Lead UX Designer."

It should feel like:

> "This production worker understands this specific project, has access to a curated body of UX expertise, knows professional diagnostic methods, can retrieve current platform information when required, remembers validated lessons from previous work, operates real tools, and must prove its conclusions through evidence."

That difference is foundational to Game Agent Network.
