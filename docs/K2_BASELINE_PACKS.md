# K2 — first missing baseline slice

**Date:** 2026-09-11
**Author:** Claude (professional-knowledge stream)
**Scope (per `docs/AI_WORK_SPLIT.md`):** `game-production-core`, `game-design-core`, `project-intelligence-analysis`.
**K2 IS NOW COMPLETE — 3/3.** `game-production-core@1.0.0` and `game-design-core@1.0.0` were delivered in the first pass; `project-intelligence-analysis@1.0.0` was completed 2026-09-12 under the broader sourcing strategy — see §3.

Unlike K1, these are **new** packs, not successors to an installed version — there is nothing to supersede, so each starts at `1.0.0` with no `supersedes_version`.

---

## 1. `game-production-core@1.0.0`

**Candidate:** `expertise/candidates/game-production-core/1.0.0/pack.yaml`

**Capability set chosen deliberately, not invented:** `production_planning`, `milestone_planning`, `scope_management`, `risk_management`, `dependency_management` — this is the _exact_ capability list already declared by the existing `production-lead` agent in `agents/builtin/roster.json`, which currently has `required_expertise_pack_ids: ["game-production-core"]` pointing at a pack that didn't exist. Building to match a real consuming agent, rather than an invented capability set, is the same discipline the K1 audit asked of the seed packs.

**Source:** _The Scrum Guide_ (Ken Schwaber & Jeff Sutherland, November 2020 revision), `scrumguides.org`. License verified live by fetching the page directly: **CC BY-SA 4.0**, explicitly stated on the page. Confirmed this is still the current official revision (checked 2026-09-11) despite an anticipated newer one — `fresh_until` is set conservatively (6 months) rather than treated as evergreen, and the pack description flags the revision-cadence risk explicitly.

**Honest capability scoping:** Scrum substantiates `production_planning`, `milestone_planning`, `scope_management`, and `risk_management` well — it has explicit, well-known mechanisms for each (Sprint Backlog and Definition of Done; fixed-length increments; backlog refinement; retrospectives and impediment tracking). `dependency_management` is deliberately the **thinnest** capability: Scrum is written for a single cross-functional team and does not address multi-team/cross-discipline dependency _scheduling_. It does cover impediment _surfacing_ (Daily Scrum, Scrum Master's impediment-removal responsibility), so one item substantiates that narrower slice honestly rather than claiming full dependency-management coverage. A dedicated cross-team coordination source (e.g. Scrum-of-Scrums / SAFe-adjacent material) is flagged as a candidate for a future version.

**Content:** 2 methods (`sprint-scoped-production-planning`, `risk-and-impediment-review`), 4 items, 2 benchmark scenarios:

- `production-planning-contract` — a "Beta ships in 6 weeks" announcement with no Definition of Done, where a new co-op mode gets silently added mid-announcement with no date adjustment.
- `production-risk-contract` — a "risk log is up to date" claim resting on a single three-week-old, unowned, never-re-inspected entry.

Every declared capability has real method/item coverage (checked programmatically, not just asserted).

## 2. `game-design-core@1.0.0`

**Candidate:** `expertise/candidates/game-design-core/1.0.0/pack.yaml`

**Capability set:** `mechanics_design`, `systems_design`, `balance_design`, `game_direction`, `onboarding_design` — again the exact set already declared by `game-design-lead` in `agents/builtin/roster.json`.

**Source:** _MDA: A Formal Approach to Game Design and Game Research_ (Hunicke, LeBlanc, Zubek — AAAI Workshop Papers, 2004). This is the foundational, widely-cited Mechanics-Dynamics-Aesthetics framework.

**Licensing checked, not assumed — and here the honest answer is "no open license found":** checked both the AAAI page and the authors' own hosting page for the PDF. Neither states an open license. Rather than skip the source (as was done for the ISTQB Glossary in K1, where the license status was genuinely unknown) or wrongly assume an open license, the pack records the correct default: standard academic copyright applies, and the source is cited for attribution/reference only, with no text reproduced anywhere in the pack. This is the same treatment given to Nystrom's _Game Programming Patterns_ in K1 (CC BY-NC-ND) — cite, don't reproduce, regardless of how restrictive the license turns out to be.

**Honest capability scoping:** `onboarding_design` is deliberately the thinnest capability — MDA is a general design-analysis framework, not an onboarding-specific one. One item connects MDA's legibility concept (a mechanic's dynamics should be apparent to the player) to early-game onboarding without overclaiming a dedicated onboarding methodology. A dedicated onboarding/tutorial-design source is flagged as a future-version candidate.

**Content:** 2 methods (`mda-lens-decomposition-review`, `balance-change-evidence-plan`), 5 items, 2 benchmark scenarios:

- `design-mechanics-contract` — a "double the Longsword's damage so it feels more powerful" proposal with no named dynamic or aesthetic target.
- `design-balance-contract` — a "rebalanced for better pacing" patch note based on "gut feel," with no target metric or validation plan.

## 3. `project-intelligence-analysis@1.0.0` (2026-09-12 — K2 completed, revisited under the broader sourcing strategy)

**Originally deferred** in the first K2 pass. Reasoning at the time:

- The `project-intelligence` agent in `agents/builtin/roster.json` has `required_expertise_pack_ids: null` — nothing currently depends on this pack existing, unlike the other two.
- Its declared capabilities (`project_analysis`, `dependency_analysis`) aren't external-professional-domain knowledge the way UX/QA/engineering/production/design are — they're about _analyzing this specific project's own artifacts_, closer to what GAN's own `ProjectIntelligence`/`InitializationReport`/`WorkspaceFingerprint` contracts already formalize.
- A quick search under the old written-standard-only sourcing model turned up nothing verifiable.

**Why it could proceed now:** the user asked to revisit deferred work under `GAN_CLAUDE_RESEARCH_SOURCING_STRATEGY.md`'s broader model. A codebase-analysis craft has practitioner literature even without a formal standard: found Nicolas Carlo — founder of the Software Crafters Montreal community, author of a published legacy-code resource, and an established speaker with dozens of talks specifically on this topic (verified via search, not assumed) — whose site `understandlegacycode.com` has two dedicated, substantive articles: _Hotspots Analysis_ (prioritizing refactoring by complexity crossed with git-history churn) and _Dependency Graphs_ (finding circular dependencies and over-connected modules). Both read in full, not summarized from a snippet.

**Cross-verification, done honestly:** the dependency-graphs article names "the Mikado Method" as a technique for incremental restructuring. Confirmed via search that this is an independently published methodology (Ellnestam & Brolund, Manning Publications) by different authors, not Carlo's own invented term — real, external grounding for the technique. Its actual chapter content was not read, so it is named in the pack as context, not cited as a separate source.

**Content:** 2 methods (`hotspot-prioritization-review`, `dependency-graph-comprehension-review`), 6 items, 2 new benchmarks:

- `hotspot-prioritization-contract` — a week spent deep-diving the single most complex (but untouched-in-two-years) file, while the frequently-changed core game-state file gets no attention, praised as "tackled the hardest file first."
- `dependency-graph-contract` — a three-module circular dependency invisible file-by-file, only visible once the graph is assembled, dismissed because "each file's imports look reasonable on their own."

Every declared capability has real method/item coverage (checked programmatically). No source text reproduced.

**K2 is now complete — all three packs delivered.**

## 4. Validation

Same method as every prior pass: base-Python `pydantic` against the real `ExpertisePack`/`ExpertisePackRegistry._validate` contract (no `node_modules`/venv on this branch).

- All three K2 candidates validate cleanly: unique ids, method/item source and method refs resolve, every declared `capability_id` has real method-or-item coverage (checked, not assumed).
- Full benchmark sweep re-run across **all 35** fixtures now in this worktree: strict typing, identity, version/capability/source-subset checks, and evaluation_id ↔ scenario parity — all pass.
- Two more leading-quote YAML defects caught in `project-intelligence-analysis`'s own new benchmark files before the sweep passed — the same recurring failure signature seen across every practitioner-sourced pack, caught the same way: re-parsing, not grepping.
- `expertise/builtin/*` confirmed unchanged.
- Not run: `pnpm format:check` / full `pnpm check` — left for Codex integration, as with every prior pass.
