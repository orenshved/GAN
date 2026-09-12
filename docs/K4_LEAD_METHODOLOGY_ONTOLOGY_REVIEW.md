# K4 — Lead methodology and ontology review

**Date:** 2026-09-12
**Author:** Claude (professional-knowledge stream)
**Scope per `docs/AI_WORK_SPLIT.md`:** _"Owned paths: pack-adjacent benchmark/fixture content and proposed ontology changes. Outcome: Domain assessment methods, qualification criteria, cross-disciplinary relationships, and evidence expectations that meaningfully outperform generic role prompts."_

Unlike K1–K3, K4 came with no explicit scope list — no named packs, no fixed batch. Before writing anything, this document establishes what is actually missing, so K4 proceeds the same way the retrospective audit did: diagnose first, then execute the highest-value, lowest-risk piece, then queue the rest.

## What "generic role prompts" means concretely here

`capabilities/ontology/initial.json` defines 130 capabilities across 11 families (`direction_production`, `game_design`, `narrative`, `ux`, `art`, `engineering`, `audio`, `qa`, `product_data`, `shipping`, `post_launch_commercial`). Before this pass, **every single one of the 130 entries was a pure boilerplate stub**, verified programmatically:

- `required_inputs` — always exactly `["task_contract"]`
- `expected_outputs` — always exactly `["task_deliverables"]`
- `evaluation_requirements` — always exactly `["contract_compliance"]`
- `description` — always just the `capability_id` with underscores replaced by spaces (0 of 130 had a real description)

This means the ontology currently cannot distinguish `shader_engineering` from `customer_support`, or `art_direction` from `documentation` — every capability carries an identical, contentless qualification requirement. That is the literal generic-role-prompt problem K4's outcome statement is naming.

## Finding: the runtime already has real gates the ontology never wired up

`services/daemon/gameagent/qa.py` defines a `GATES` catalog of **11 already-implemented, discipline-specific evidence gates**, each with a real `claim` type (`technical` / `visual` / `subjective`), `required_evidence_classes`, and `allowed_producer_types` — deliberately scoped to what that gate can and cannot prove (e.g. `art_asset_integrity`: _"checks image signatures and measurable metadata without claiming aesthetic quality"_; `gameplay_source_integrity`: _"without claiming behavioral correctness or fun"_). `recruiter.py:240` confirms `Capability.evaluation_requirements` flows directly into a task's `required_evaluations` at recruitment time — this is live-wired, not decorative.

None of the 130 capabilities referenced anything beyond `contract_compliance`. The qualification infrastructure existed; the ontology simply never used it. This is the same class of gap as the `applies_to_versions` per-version parity bug found earlier in this program: real machinery, silently unwired.

## What this pass did (Part A — executed)

Rewrote `evaluation_requirements` for all 130 capabilities in `capabilities/ontology/initial.json`, mapping each capability to the real gate(s) that honestly apply, using two grounding principles:

1. **Only assign a gate whose own `claim` type and description genuinely fit the capability.** No forced fits — e.g., `engineering_smoke` (a build/tool gate) was not applied to pure planning capabilities just to avoid a short list.
2. **Where a Lead agent's own written constraint already asserts a human/creative-judgment requirement, mirror it into `evaluation_requirements` via `human_judgment` or `ux_heuristic_review`.** This directly reuses judgment already authored into `agents/builtin/roster.json` rather than inventing new policy:
   - art-lead: _"Creative quality and taste require human authority"_ → `art_direction`, `cinematics` get `human_judgment` alongside `art_asset_integrity`/`visual_reference_review`.
   - narrative-lead: _"Creative choices and story approval remain human decisions"_ → every narrative capability gets `human_judgment` alongside `narrative_source_integrity`.
   - audio-lead: _"Do not claim mix quality without measured or human listening evidence"_ → `audio_direction`, `mixing`, `mastering` get `human_judgment` alongside `audio_asset_integrity`.
   - game-design-lead: _"Never present model taste as player evidence or human creative judgment"_ → `game_direction`/`creative_direction`/`product_strategy` get `human_judgment`.

Result: **120 of 130 capabilities** now carry a real, discipline-appropriate evidence requirement instead of the placeholder alone. The change is purely additive — every capability keeps `contract_compliance` and only gains gates on top of it; nothing was removed. Verified programmatically (see Validation below).

The remaining **10 capabilities legitimately have no honestly-applicable gate today** — see "Genuine gaps" below. These were deliberately left on `contract_compliance` alone rather than force-fit, consistent with this program's standing rule against inventing coverage that isn't real.

## Genuine gaps found (not fixed — proposed to Codex)

No dedicated gate exists today for:

- **Pure production-tracking capabilities**: `production_planning`, `milestone_planning`, `dependency_management`, `scope_management`, `risk_management`, `documentation`, `asset_tracking`. These need something like a `production_evidence` gate (deterministic evidence: a milestone tracker, a dependency graph artifact, a risk register — the kind of evidence `game-production-core`'s own methods already ask for, but with no gate to enforce it at the QA layer).
- **Post-launch community/support capabilities**: `community_support`, `publishing_support`, `customer_support`. These are almost entirely human/qualitative and currently have zero evidence infrastructure — not even a `human_judgment`-style gate scoped to them.
- **Compliance capabilities** (`ratings_compliance`, `accessibility_compliance`) inherited `engineering_smoke` from their `shipping` family default, which is an honest partial fit (build-verifiable) but does not cover the compliance judgment itself — a `compliance_review` gate would be a better fit.
- **Accessibility measurement** (`accessibility_ux`, `accessibility_qa`) got `ux_heuristic_review`, which is honest but coarse — the accessibility packs already built this session (`game-accessibility-basics`, `controller-navigation`) reference concrete evidence types (contrast measurement, focus-traversal capture, AT behavior capture) that have no matching gate yet. A dedicated `accessibility_measurement` gate would let those packs' own evidence requirements actually be enforced.
- **Data/analytics capabilities** (`telemetry_design`, `analytics`, `experimentation`, `economy_analysis`, `balance_simulation`, `funnel_analysis`, `ab_testing`, `crash_analysis`) were mapped to `engineering_smoke` as the closest available technical gate, but a dedicated `data_pipeline_integrity` gate would fit better than reusing an engineering-flavored one.

These are proposed to Codex via `HANDOFF_TO_CODEX.md` (repo root) as candidate new gates, not implemented here — gate definitions live in `services/daemon/gameagent/qa.py`, which is Codex-owned runtime.

## Part B — cross-disciplinary relationships (proposed, not implemented)

The `Capability` contract (`services/daemon/gameagent/models/contracts.py:136`) has **no field at all** for relationships between capabilities or between the Leads that own them. There is currently no way to express, in schema, that `balance_design` (game-design-lead) is downstream of `balance_testing`/`balance_simulation` (qa-specialist / product-data), or that `art_direction` (art-lead) sets the frame `concept_art`/`ui_art`/`environment_art` should be checked against.

This is a genuine schema gap, not something addable via pack/benchmark content alone, and it lives in a file this stream does not own. Proposed to Codex:

- Add an optional field to `Capability`, e.g. `related_capability_ids: list[Identifier] = []`, expressing "a claim on this capability is more reliable when corroborated by evidence from these capabilities" — deliberately _not_ a hard dependency, since Leads must still work when only their own domain's evidence is available.
- A worked starter set, drawn only from capabilities this program has real pack-backed expertise on (not invented for the other ~100 capabilities without evidence to back a claim):
  - `balance_design` → `balance_testing`, `balance_simulation`
  - `production_planning` → `dependency_management`, `risk_management`
  - `art_direction` → `concept_art`, `visual_development`, `ui_art`
  - `mechanics_design` → `onboarding_design` (per this program's own `game-design-core` item: early mechanics must produce a legible dynamic before layering complexity — an onboarding concern)
  - `functional_testing` → `automated_testing`, `regression_testing`

Full relationship data for the other ~100 capabilities is deliberately not proposed here — this program does not have pack-backed evidence for most of them, and inventing cross-disciplinary claims without evidence would repeat exactly the mistake this program has spent four retrospective passes correcting (asserting authority the sourcing doesn't support).

## Part C — cross-disciplinary boundary benchmarks (executed)

A benchmark _type_ that didn't exist anywhere in this program before this pass: every existing benchmark tests "generic vs. specialist depth within one domain" (e.g., does the enriched run catch what a shallow reviewer misses). None tested whether a Lead **recognizes when a claim crosses into another Lead's domain** and defers/escalates rather than answering outside its lane — a distinct and valuable qualification dimension implied by "cross-disciplinary relationships" in K4's outcome statement.

This fit the existing benchmark schema without any change: each scenario is filed under the Lead whose domain is being _tested for restraint_, using that pack's own `pack_id` and `capability_ids`. Three fixtures were added, one per Lead, each a patch-version bump (`1.x.0` → `1.x.1`) on an existing draft, consistent with the `godot-ui-engineering@1.1.0→1.1.2` precedent for small in-family additions that don't introduce a new source:

- **`game-production-core@1.1.1`** — `production-cross-discipline-evidence-contract`: a milestone status report bundles a real production claim (Definition of Done, impediments) with unverified art and engineering reassurances ("looks great," "netcode is solid"). Tests whether production-lead separates its own evidence from claims it has no authority to confirm. One new item added (`production-claims-need-owning-disciplines-evidence`), grounded in the Scrum Guide's own accountability structure — a corollary of the already-cited source, not a new claim.
- **`game-art-direction@1.1.1`** — `art-balance-claim-boundary-contract`: an art status update infers a difficulty claim ("the encounter should feel appropriately hard now") from a genuinely well-evidenced visual improvement (a clearer telegraph animation). Tests whether art-lead scopes its claim to what visual evidence supports and declines to confirm the gameplay-feel claim. One new item added (`art-claims-scoped-to-visual-evidence`), grounded in Macdonald's talk framing the art director's authority as scoped to the visual design rule set, not gameplay outcomes.
- **`game-qa-core@1.2.1`** — `qa-balance-evidence-boundary-contract`: a QA report treats a passing automated test suite as proof an economy is "well balanced." Tests whether qa-specialist separates the technical claim (tests pass) from the balance claim (a different evidence class entirely). **No new item needed** — the pack's existing `qa-claim-specific` and `qa-model-not-ground-truth` items already state this discipline in general form; this benchmark is the first to test it against a specifically cross-disciplinary claim rather than a same-domain one.

All three new items are grounded in sources the pack already cited and reviewed — no new external research was introduced for Part C, consistent with this program's rule against inventing content without evidence.

## Validation

- All 130 capabilities re-validated against `Capability` (`services/daemon/gameagent/models/contracts.py`) after the Part A change — passes.
- Programmatically confirmed the Part A change touched only `evaluation_requirements`, and only additively (every capability's original gates are a subset of its new gates; nothing removed, no other field touched).
- Part A diff reviewed for size/cleanliness: 120 focused single-line changes (one per affected capability), not a wholesale reformat — matches this program's own "small reviewable batches" convention.
- Part C: full pack/benchmark validation sweep (contract validation, cross-reference resolution, full capability coverage, strict per-pack-version parity) re-run after the three new fixtures and their pack version bumps: **25 pack versions / 14 packs / 46 fixtures**, all passing. Two leading-quote YAML defects caught and fixed in `production-cross-discipline-evidence-contract.yaml` before the sweep passed — the same recurring failure mode as every practitioner-sourced pack this program.
- Not run: `pnpm check` / pytest (this worktree has no venv/node_modules, consistent with every prior pass this session). Codex should re-verify in an environment with the daemon's dependencies installed.
- `expertise/builtin/*`: untouched by this pass (K4 touched `capabilities/ontology/initial.json` and three draft candidate packs' benchmark/item content only).

## Status

- [x] **Part A — wire the ontology to the runtime's existing gate catalog.** Done. 120/130 capabilities updated; 10 legitimately left on baseline pending new gates.
- [ ] **Part B — cross-disciplinary relationship schema field.** Proposed to Codex via handoff; not implemented (schema change, Codex-owned file).
- [x] **Part C — cross-disciplinary boundary-recognition benchmarks.** Done. Three new fixtures across `game-production-core@1.1.1`, `game-art-direction@1.1.1`, `game-qa-core@1.2.1`.
- [ ] **New gate proposals** (`production_evidence`, `compliance_review`, `accessibility_measurement`, `data_pipeline_integrity`, a support/community evidence class). Proposed to Codex; not implemented (Codex-owned `qa.py`).

**K4 is now fully executed on this stream's side.** What remains queued is entirely on Codex: the Part B schema proposal and the five new-gate proposals. No further Claude-side K4 work is blocked on anything.
