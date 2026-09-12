# K3 — engine/art/accessibility/model slice

**Date:** 2026-09-11
**Author:** Claude (professional-knowledge stream)
**Scope (per `docs/AI_WORK_SPLIT.md`):** `game-art-direction`, `godot-core`, `2d-game-art`, `pixel-art-production`, `controller-navigation`, `game-accessibility-basics`, `local-model-selection`. Outcome note in the work split: _"Research-backed candidates in small reviewable batches."_ — smaller batches than K1/K2, explicitly.

**K3 IS NOW COMPLETE — 7/7.** Delivered across five passes: `local-model-selection@1.0.0`, `game-art-direction@1.0.0`, `controller-navigation@1.0.0`, `game-accessibility-basics@1.0.0`, `godot-core@1.0.0`, `pixel-art-production@1.0.0`, and — this pass — `2d-game-art@1.0.0` (see §1g). All `state: draft`.

**Sourcing strategy update (2026-09-12):** `GAN_CLAUDE_RESEARCH_SOURCING_STRATEGY.md` replaced the written-standard-only sourcing model with a practitioner-evidence model for craft-heavy domains — GDC talks, shipped-title artist tutorials, and community discussion, tiered by authority and cross-checked, rather than requiring a WCAG/Scrum-Guide-style formal standard. `pixel-art-production` (§1f) and `2d-game-art` (§1g) were both built under this strategy — the two packs the earlier written-standard model genuinely couldn't source.

---

## 1. `local-model-selection@1.0.0`

**Candidate:** `expertise/candidates/local-model-selection/1.0.0/pack.yaml`

**Capability set:** `local_model_selection`, `resource_analysis` — copied exactly from the existing `local-model-expert` agent in `agents/builtin/roster.json`.

**Relationship to the runtime — deliberately not duplicated:** `services/daemon/gameagent/local_models.py` already has a deterministic scorer (`LocalModelExpert.recommend`) that computes `suitability_score` and `memory_tier` from hardware inventory and the Ollama catalog. This pack does not restate that logic. It supplies the professional judgment a deterministic score can't fully capture on its own: when to prefer a smaller-but-sufficient model over a larger one, how concurrency multiplies effective context/memory need, and when a task's precision sensitivity should override a quantization level chosen only for memory savings. Same relationship K1's `game-engineering-core` has to GAN's own contract-generation tooling — expertise layered on top of, not replacing, deterministic machinery.

**Sources:** two files from the `ollama/ollama` GitHub repository — `docs/faq.mdx` and `docs/gpu.mdx`. Chosen over the rendered `docs.ollama.com` site specifically because the **repository's LICENSE was fetched and verified directly**: MIT, explicitly covering "this software and associated documentation files." The docs site itself states no content license of its own, so citing the repo files instead removes that ambiguity rather than assuming the rendered site inherits the code license.

**Content:** 2 methods (`model-fit-review`, `quantization-tradeoff-review`), 4 items, 2 new benchmark fixtures:

- `model-selection-contract` — a task needing tool-calling, where a 70B model with no tool support (and almost no memory headroom) is proposed "because it's the biggest and smartest," over an 8B model that actually supports tools and fits comfortably.
- `quantization-tradeoff-contract` — a precision-sensitive code-review task where a q4_0 variant is proposed "because it downloaded faster," on a high-GQA-count architecture more susceptible to quantization precision loss, with headroom available to run the higher-precision q8_0 variant instead.

Every declared capability has real method/item coverage (checked programmatically).

## 1b. `game-art-direction@1.0.0` (2026-09-11, second K3 pass)

**Candidate:** `expertise/candidates/game-art-direction/1.0.0/pack.yaml`

**Capability set:** `art_direction`, `visual_development`, `asset_tracking`, `concept_art`, `ui_art` — copied exactly from the existing `art-lead` agent.

**Research — why this took a dedicated pass:** unlike UX/QA/engineering/production/design, there is no obvious open-licensed equivalent of WCAG/Scrum/MDA in art direction specifically. Checked, in order: GDC Vault talks (mostly paywalled behind GDC membership — some titles surfaced, e.g. _"Art Direction is Not Just Googling Images"_, but not accessibly licensed); OpenGameArt.org (covers licensed _assets_, not art-direction _methodology_ — wrong kind of resource); MIT OpenCourseWare's _Creating Video Games_ course, Session 14 "Aesthetics" (real, CC BY-NC-SA, but the publicly available page has no substantive transcript/notes to draw from responsibly — didn't want to write content and attribute it to a source whose actual content I couldn't verify). Landed on _Graphic Design and Print Production Fundamentals_ (Ken Jeffery, BCcampus/eCampusOntario, 2015): **CC BY 4.0, verified directly against the book's own copyright statement**, with a full, readable chapter (3: "Design Elements, Design Principles, and Compositional Organization") covering balance, contrast, emphasis, hierarchy, proportion, rhythm, and unity — substantive enough to responsibly ground content in.

**Honest gap stated in the pack itself:** this source is general graphic/print design, not games-specific — the same caveat WCAG got in `game-ux-core` ("no game-specific UX authority"). `asset_tracking` doesn't fit a design-principles textbook at all; it reuses the already-verified Scrum Guide source from `game-production-core` (pipeline-stage tracking with an explicit exit criterion is a production discipline, not an art-theory one — the same source, re-declared per-pack as the contract requires, not a new one).

**Content:** 2 methods (`art-consistency-review`, `art-pipeline-tracking-review`), 5 items, 2 new benchmark fixtures:

- `art-consistency-contract` — an enemy design approved as "polished and detailed" despite its palette, detail level, and silhouette all diverging from the rest of its set and out-competing the player character visually.
- `asset-pipeline-contract` — a "environment art is on track" status report that buries a hero prop stalled in blockout for three weeks (five times its expected two-day stage) with no owner.

Every declared capability has real method/item coverage (checked programmatically).

## 1c. `controller-navigation@1.0.0` (2026-09-11, third K3 pass)

**Candidate:** `expertise/candidates/controller-navigation/1.0.0/pack.yaml`

**No owning agent yet.** Meant as a specialized add-on other Leads combine with `game-ux-core`, per the addendum's own pack-dependency example (`console-ui-lead = game-ux-core + controller-navigation + accessibility-games + console-platform-patterns`).

**Capability set:** `controller_navigation`, `accessibility_ux` — narrower than the Lead-owned packs deliberately, matching the "compact, well-substantiated capability set" lesson from the K1 audit rather than stretching across many.

**Sources:** two specific Xbox Accessibility Guideline pages read in full — XAG 107 (Input) and XAG 112 (consistent UI navigation) — not just the guidelines index page already cited by `game-ux-core`. Same honest licensing note as `game-ux-core`: Microsoft Learn's Terms of Use grant personal/non-commercial use only, no open content license stated; cited for attribution, no guideline text reproduced.

**Content:** 2 methods (`multi-input-navigation-review`, `input-demand-review`), 4 items, 2 new benchmarks:

- `controller-input-demand-contract` — a rapid-mash boss mechanic where full control remapping is added and the accessibility request is closed, without addressing the underlying speed demand remapping can't fix.
- `controller-focus-order-contract` — a 3x3 grid menu made to loop at its edges "for consistency" with the game's other (linear) menus, when grids specifically should not loop.

Every declared capability has real method/item coverage (checked programmatically).

## 1d. `game-accessibility-basics@1.0.0` (2026-09-11, third K3 pass)

**Candidate:** `expertise/candidates/game-accessibility-basics/1.0.0/pack.yaml`

**No owning agent yet.** A foundational pack: the WCAG POUR taxonomy (Perceivable, Operable, Understandable, Robust) and conformance-level structure (A/AA/AAA), deliberately distinct from `game-ux-core` (evidence discipline + mechanic-scoped review) and `controller-navigation` (input specifics) — this teaches the underlying standards vocabulary those apply.

**Capability set:** `accessibility_ux`, `accessibility_qa` — usable by both UX design work and QA verification.

**Sources:** the existing `wcag-2-2` source (reused) plus two new WCAG "Understanding" pages read in full — the POUR-principles intro and the conformance-levels page — both W3C Document License, same verified mechanism as every other WCAG citation in this program.

**Content:** 2 methods (`pour-principle-classification`, `conformance-level-scoping`), 4 items, 2 new benchmarks:

- `accessibility-classification-contract` — a vague "pause menu isn't accessible" report closed by adding screen-reader narration, when the actual (later-revealed) complaint was a colorblind-unfriendly color-only button distinction — same POUR principle (Perceivable), different sub-issue, not actually fixed.
- `accessibility-conformance-contract` — an unscoped "fully WCAG AAA accessible" marketing claim, when WCAG's own guidance discourages project-wide AAA commitments.

Every declared capability has real method/item coverage (checked programmatically).

## 1e. `godot-core@1.0.0` (2026-09-11, third K3 pass)

**Candidate:** `expertise/candidates/godot-core/1.0.0/pack.yaml`

**Correction to §2's earlier note:** this pack did **not** need a new tool/schema conversation with Codex after all — it reuses the already-verified Godot docs licensing mechanism (CC BY 3.0, site-wide, confirmed for `docs.godotengine.org` in K1's `godot-ui-engineering`) and the already-registered `godot.cli` tool id. No owning agent requires it yet.

**Capability set:** `engine_architecture`, `gameplay_engineering`, `godot_development` — distinct from `godot-ui-engineering`, which covers Control layout and focus/gamepad navigation specifically; this pack covers general scene/node architecture.

**Sources:** three Godot official docs pages — _Nodes and Scenes_, _Signals_, and _Scene Organization_ (the last from Godot's own "Best Practices" section — arguably even more authoritative than a third-party book, since it's the engine's own recommended architecture, not an outside author's opinion applied to Godot).

**Content:** 2 methods (`scene-decoupling-review`, `signal-driven-communication-review`), 5 items, 2 new benchmarks:

- `godot-decoupling-contract` — a reusable "EnemySpawner" scene using a hard upward-and-sideways `get_node()` path, proposed for reuse in a differently structured level "since it already works."
- `godot-signal-contract` — a health bar UI polling the player's health every frame instead of the player emitting a signal on change, defended as fine because "no bugs reported."

Every declared capability has real method/item coverage (checked programmatically).

## 1f. `pixel-art-production@1.0.0` (2026-09-12, fourth K3 pass — practitioner-evidence sourcing)

**Candidate:** `expertise/candidates/pixel-art-production/1.0.0/pack.yaml`

**Why this pack could finally proceed:** `GAN_CLAUDE_RESEARCH_SOURCING_STRATEGY.md` explicitly names this pack and replaces the earlier written-standard-only sourcing model with a tiered practitioner-evidence model for craft domains that have no equivalent to WCAG or the Scrum Guide. Applied the strategy's Discover → Acquire → Extract methodology:

- **Discover:** searched for GDC talks on shipped pixel-art titles and for the specific "cluster theory" concept the strategy document itself uses as its worked distillation example (§12) — a deliberate signal about what this pack should contain.
- **Acquire — actual source material, not snippets:** found _"Animation Bootcamp: High Resolution Pixel Art and Animation"_, a 2018 GDC talk by Kyle Bunk (Firaxis Games, XCOM 2 expansion), freely posted on the official GDC YouTube channel (not the paywalled Vault). Two secondary write-ups of this same talk (gameanim.com, gamedeveloper.com) were checked first and had no substantive technical content — same dead end pattern as MIT OCW in `game-art-direction`. Rather than stop there, pulled the actual transcript: installed `yt-dlp` (via `pip install --user`, `ffmpeg` was already present) and ran the `watch` skill's caption-extraction path directly, then de-duplicated the rolling auto-caption VTT into clean text. This produced ~600 lines / ~22.5k characters of genuine, substantive spoken content — clusters, silhouette, spacing, smears, overlapping action, indexed palettes, banding vs. dithering, alpha export, sub-pixel motion illusion.
- **Cross-check:** found Pedro Medeiros ("Saint11"), a pixel artist credited on the shipped, commercially released games _Celeste_ and _TowerFall_ — verified via search, not assumed from a handle. His tutorial catalog on GitHub (`saint11/Saint11Tutorials`) states in its own README: **"released under a Creative Commons Attribution 4.0 International License"** — verified directly. Its topic list (Fundamentals, Silhouette, Shading, Subpixel animation) independently corroborates several of Kyle Bunk's points as established, professionally recognized curriculum topics, not one practitioner's idiosyncratic opinion — satisfying the strategy's cross-source verification requirement (§11) for the pack's central claims.
- **A Reddit cross-check was attempted and abandoned honestly:** searched for community discussion specifically corroborating the dithering-vs-banding-in-animation trade-off; no substantive Reddit thread surfaced. Per the strategy's own instruction not to fabricate consensus, this is noted as an open Tier D gap rather than papered over with a weak citation.

**Both sources carry an authority note plus verified credential**, per the strategy's Source Evidence Package (§8) — not just a URL. Neither source's actual text is reproduced anywhere in the pack; every item is original distilled wording, per §15.

**Content:** 3 methods (`pixel-cluster-silhouette-review`, `limited-frame-animation-review`, `indexed-palette-shading-review`), 8 items — denser than the other K3 packs, reflecting genuinely deeper two-source research rather than one written reference — and 3 new benchmarks:

- `pixel-cluster-contract` — scattered off-palette "detail" pixels with no clustering, approved as "a lot of detail."
- `pixel-animation-spacing-contract` — a perfectly even-timed walk cycle praised as "mathematically clean," when uniform spacing is exactly what produces a robotic look.
- `pixel-palette-contract` — an animated sprite's dithering "crawling" between frames, misattributed to dithering itself rather than to inconsistent per-frame dither alignment.

Every declared capability has real method/item coverage (checked programmatically).

## 1g. `2d-game-art@1.0.0` (2026-09-12, fifth K3 pass — practitioner-evidence sourcing, K3 complete)

**Candidate:** `expertise/candidates/2d-game-art/1.0.0/pack.yaml`

**Sourcing, following the same Discover → Acquire → Extract method as `pixel-art-production`:**

- **Discover:** searched the curated `awesome-gametalks` GitHub list (a pre-vetted index of GDC talks, useful precisely because it let me skip time wasted checking paywalled Vault-only titles one by one) for 2D-art-specific talks on shipped titles.
- **Acquire — actual transcript, not a summary:** _The Art of Child of Light_, a 2014 GDC talk by Patrick Plourde (creative director, Ubisoft Montreal, on the shipped, commercially released _Child of Light_), freely posted on the official GDC YouTube channel. Pulled the real transcript via the same `yt-dlp` path as `pixel-art-production` — ~930 lines / ~34k characters, the richest single source acquired in this program: the concept-art-to-in-game paint-over pipeline, target-render milestones, "beautiful but no visual identity" as a real failure mode, character iconography surviving redesign, and a genuine technical-art solution (compositing a limited 3D element into a 2D scene to get flowing hair without abandoning the 2D style).
- **Cross-check, contributing a genuinely different principle, not a restatement:** a second shipped title, _Guacamelee!_ (DrinkBox Studios). The GDC slide PDF for this one could not be read (a 14 MB, mostly-image slide deck; no PDF-page-rendering tool available in this environment), so a substantive interview article was used instead, credential-checked (Augusto Quijano, concept lead at DrinkBox, on the shipped game) — chosen specifically because it surfaces cultural authenticity via actual team background versus surface aesthetic borrowing, a topic the Child of Light source doesn't touch at all.

**Capability set:** `illustration`, `character_art` — no owning agent requires this pack yet.

**Content:** 2 methods (`concept-to-ingame-pipeline-review`, `character-iconography-consistency-review`), 7 items, 3 new benchmarks:

- `concept-pipeline-contract` — a "we did concept art for this, it's covered" claim where the concept and the shipped level had already drifted apart.
- `character-iconography-contract` — a sequel redesign changing every visual element while keeping only the name, framed as "the same character, modernized."
- `cultural-authenticity-contract` — a folklore-inspired visual identity built from a surface moodboard with no team member background or research behind it, praised as "authentic" for looking good.

Every declared capability has real method/item coverage (checked programmatically). No source text reproduced anywhere in the pack.

## 2. K3 scope: complete

All seven packs named in `docs/AI_WORK_SPLIT.md`'s K3 scope now have draft candidates. Nothing deferred.

## 3. Validation

Same method as every prior pass: base-Python `pydantic` against the real `ExpertisePack`/`ExpertisePackRegistry._validate` contract.

- All seven K3 candidates validate cleanly; every declared capability in each has real method-or-item coverage (checked programmatically, not eyeballed).
- Full benchmark sweep re-run across **all 33** fixtures now in this worktree (30 prior + 3 new): strict typing, identity, version/capability/source-subset checks, evaluation_id ↔ scenario parity — all pass.
- Three more leading-quote YAML defects caught in this pass's own new files before the sweep passed.
- `expertise/builtin/*` confirmed unchanged.
- Not run: `pnpm format:check` / full `pnpm check` — left for Codex integration, as with every prior pass.
- `yt-dlp` downloads and caption files were local and cleaned up after transcript extraction, same as `pixel-art-production`; the downloaded (unusable) Guacamelee PDF was also deleted rather than left in a temp directory.
- The `yt-dlp` install and downloaded video/caption files were local, session-scoped, and cleaned up after transcript extraction — nothing beyond the pack/benchmark YAML persists in the repo.
