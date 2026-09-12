# Seed Expertise Pack audit (K1)

**Date:** 2026-09-10
**Author:** Claude (professional-knowledge stream)
**Scope:** the four installed seed packs at `expertise/builtin/*/pack.yaml`, version `1.0.0`.
**Basis:** `ExpertisePack` / `KnowledgeSource` / `KnowledgeMethod` / `ExpertiseKnowledgeItem`
in `services/daemon/gameagent/models/contracts.py`; loader and governance rules in
`services/daemon/gameagent/knowledge.py`; addendum sections 8–11 and 29.

All four packs are valid against the contract and load cleanly. This audit is about
**professional adequacy**, not schema conformance. Nothing here claims the packs are
human- or professionally qualified — they are not.

**Update 2026-09-10 (post Codex cross-review):** benchmark folder + fixture schema
accepted; all 10 fixtures now declare `schema_version: 1` and the six colon-bearing
list items are quoted as strings; the `godot-ui-engineering 1.1.2` candidate's
`required_tool_ids` is now `[godot.cli]`. The candidate stays `state: draft` —
not installed, promoted, reviewed, activated, merged, committed, or pushed.

---

## 1. Audit table

| Pack                          | Sources                                                                                                                                     | Methods / Items | Provenance                                                                                                                                                                                                   | Capability honesty                                                                                                                                                                                                                                                         | Freshness                                                                                                                                                                                    | Main professional gap                                                                                                                                                                                                                         | Verdict                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `game-ux-core` 1.0.0          | WCAG 2.2 (W3C, `primary_standard`, real URL, licence correct) + `gan-ux-evidence-policy` (internal `gan://`)                                | 2 / 3           | Half-external. WCAG is web-scoped; no game-specific UX authority (e.g. game accessibility guidance, platform UX guidance, practitioner literature).                                                          | **Over-claims.** Lists `usability_analysis, interaction_design, controller_navigation, accessibility_ux, onboarding_ux`; substantively supports evidence-discipline + navigation review only. `interaction_design` and `onboarding_ux` have no dedicated method or source. | WCAG `fresh_until` 2027-09-09 is reasonable for a stable Recommendation.                                                                                                                     | It is an **evidence-discipline pack wearing a UX label**. The three items all restate "structure is not proof". Sound, but thin as UX practice.                                                                                               | Keep philosophy; new version must add a game-specific authoritative source and real interaction/onboarding method content, or narrow `capability_ids`. |
| `game-engineering-core` 1.0.0 | `gan-engineering-invariants` + `gan-evidence-contract` — **both internal `gan://`, `authority: curated_practice`, `source_type: standard`** | 2 / 3           | **Circular.** Every method and item is backed only by GAN's own policy docs. No external engineering authority at all. `source_type: standard` overstates internal policy (the enum has `project_document`). | Lists `ui_engineering, gameplay_engineering, tooling, build_engineering, dependency_analysis`; the two methods cover change-planning and boundary review generically. `gameplay_engineering` unsupported.                                                                  | All `stable`; defensible for the internal invariants, but there is nothing version-sensitive because there are no engine/language sources.                                                   | Presents GAN-internal opinion as generalised engineering knowledge. The heuristics ("contract-first", "vertical slice", "structural inspection is bounded") are genuinely good, but unsourced beyond GAN.                                     | Weakest on provenance. New version must cite at least one reputable external engineering source and reclassify the internal docs honestly.             |
| `game-qa-core` 1.0.0          | `gan-qa-policy` — **single internal `gan://` source**                                                                                       | 1 / 3           | Circular and mono-source. No external testing/QA authority (glossary, testing standard, practitioner text).                                                                                                  | Lists `functional_testing, automated_testing, ux_testing, visual_regression, accessibility_qa`; one method (`claim-evidence-matrix`) and three items serve all five. `visual_regression` and `accessibility_qa` have no dedicated content.                                 | `stable`; fine for the policy, but no volatile knowledge is represented.                                                                                                                     | Philosophically the strongest pack — claim-specific evidence and independence are real professional practice — but it is one method and one source stretched over five capabilities.                                                          | Keep the model; new version needs a second method (independence / evaluator eligibility as its own procedure) and an external QA source.               |
| `godot-ui-engineering` 1.0.0  | 2 real Godot docs pages, `official_documentation`, `CC BY 3.0`, `version_sensitive`, `fresh_until` 2027-03-09                               | 1 / 2           | **Best-sourced pack** — genuine external authoritative docs with correct licence.                                                                                                                            | Lists `ui_engineering, controller_navigation, accessibility_ux, godot_development`; one method and two items. `accessibility_ux` is asserted but Godot's assistive-technology support is limited/version-dependent and unaddressed.                                        | `version_sensitive` is right, but the source URLs use `/en/stable/` (a moving pointer) and **no target Godot version is stated anywhere**. `fresh_until` ~6 months is acceptable given that. | Under-built: 1 method / 2 items for a named engine pack. No focus-navigation specifics (`focus_neighbor_*`, `ui_*` InputMap actions), no theme/skinning content, no `required_tool_ids` despite an evidence requirement of "runtime capture". | Strongest base, smallest body. Best candidate for the first successor version.                                                                         |

### Cross-cutting findings

1. **Circular provenance (packs 2 and 3, half of pack 1).** Three of four packs rest wholly or mostly on GAN's own `gan://` policy docs. Addendum §11 lists the acceptable source classes (engine/platform docs, standards, reputable books, GDC, postmortems, OSS docs); the internal-only packs use none of them. `source_type: standard` for an internal policy doc is misleading — `project_document` is the honest enum value.
2. **Capability over-claim (all four).** Each pack lists 4–5 `capability_ids` but supplies method/item coverage for ~2. Retrieval routes on capability (`KnowledgeRouter`), so the unearned capabilities pollute knowledge packets with generic content and inflate apparent specialist coverage. Every `capability_id` should have at least one method **or** item that is specific to it.
3. **No `required_tool_ids` anywhere**, though several `evidence_requirements` demand "runtime capture" — which needs a tool. The schema supports `required_tool_ids`; no pack uses it.
4. **`evaluation_ids` point at nothing inspectable.** `record_audition` requires `benchmark_id in candidate.evaluation_ids` and `review_pack` requires a passing, non-regressed audition per `evaluation_id`, but there is **no scenario text in the repo**. The benchmark program was half-defined: identifiers existed, the discriminating scenarios did not. Addressed by `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml` — layout and fixture schema **accepted by Codex 2026-09-10**; the runtime loader and a Pydantic fixture contract are Codex-owned; an id/file parity check lands with the runtime branch on merge.
5. **Freshness horizons are uniform (~6–12 months) regardless of volatility.** Defensible today, but there is no stated policy tying `fresh_until` to `freshness_class` and source cadence. Worth a short written rule before the pack count grows.
6. **Immutability respected.** All four are `state: active` with `reviewed_at` set. Corrections must ship as new versions in `state: draft` (per `.ai/DECISIONS.md` and `governance.propose_pack`, which rejects anything not `draft` / already-published).

---

## 2. Answers to the handoff questions

### Q1 — Do the schemas adequately represent checklists, playbooks, anti-patterns, and evidence expectations, or is one narrow contract extension needed?

**Adequate for this batch. No contract extension requested.**

| Concept               | Representation today                                                                                                                         | Adequate?                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Playbook              | `KnowledgeMethod` — ordered `steps` + `purpose` + `evidence_requirements` + `source_ids`                                                     | Yes. A playbook is an ordered procedure; that is exactly `KnowledgeMethod`.                         |
| Checklist             | Either a `KnowledgeMethod` whose `steps` are check items, or discrete `standard` / `professional_knowledge` items                            | Works, mildly overloaded. A checklist reads as a method with imperative steps. Acceptable.          |
| Anti-pattern          | `ExpertiseKnowledgeItem.kind == "anti_pattern"`                                                                                              | Yes. Already used by three of the four packs.                                                       |
| Evidence expectations | `KnowledgeMethod.evidence_requirements` (per method) + item semantics + the QA gate contracts (`QAGateDefinition`, `Evidence`, `Evaluation`) | Yes, and per-method is better than a loose pack-level map because expectations differ by procedure. |

**Optional, non-blocking, future only:** if checklists/playbooks ever need to be first-class _retrieval_ targets (ranked and surfaced distinctly in a packet), the smallest possible change is adding `"checklist"` and `"playbook"` to the `ExpertiseKnowledgeItem.kind` `Literal` — additive, no data migration, one `pnpm protocol:generate`. Not needed now and not requested; methods carry both today.

### Q2 — Which current claims are generic, unsupported, stale, or professionally misleading?

- **Generic:** every `game-engineering-core` and `game-qa-core` item. They are correct but are broad practice statements ("prefer a vertical slice", "evidence must fit the claim") with `confidence` up to 0.99 and no external grounding. Fine as heuristics; over-confident as sourced professional knowledge.
- **Unsupported (circular):** all `game-engineering-core` sources; the sole `game-qa-core` source; `gan-ux-evidence-policy`. Internal `gan://` policy cited as authoritative professional knowledge.
- **Stale risk:** `godot-ui-engineering` sources pin to `/en/stable/` with no target version — the moving pointer means the pack silently follows whatever Godot "stable" is, which is precisely what `version_sensitive` is meant to prevent.
- **Professionally misleading:**
  - `source_type: standard` on internal GAN policy docs (packs 2 and 3). Should be `project_document`.
  - `game-ux-core` and `godot-ui-engineering` advertising `accessibility_ux` / `onboarding_ux` / `interaction_design` capabilities with no method or item specific to them — a consumer routing on those capabilities gets generic filler and an inflated sense of coverage.
  - `godot-ui-engineering` implying accessibility support can be reasoned about from Control structure, when Godot's AT integration is limited and version-specific.

None of this makes the packs unsafe — the evidence-discipline content is genuinely good and correctly cautious. The issue is breadth claimed vs. depth delivered, and internal opinion dressed as external standard.

---

## 3. What this change delivers

- **Audit table + question answers** (this file).
- **One successor candidate:** `expertise/candidates/godot-ui-engineering/1.1.2/pack.yaml` — `state: draft`, `supersedes_version: 1.0.0`, **not** installed or reviewed. Version 1.1.2 supersedes the staged 1.1.0 and 1.1.1 drafts after source review clarified that the cited rendered `classes/class_control.html` artifact should be recorded as CC BY 3.0, while its underlying generated class-reference sources are MIT-derived. Chosen because every content fix is verifiable from official Godot documentation already cited by 1.0.0, with no new unverifiable sources:
  - explicit Godot 4.x target and version-sensitivity called out in `description` and items;
  - two added official Godot sources (GUI navigation; GUI skinning), same publisher/authority/licence as the existing two;
  - `required_tool_ids: [godot.cli]` — the canonical engine-adapter tool id confirmed by Codex 2026-09-10; it produces runtime PNG capture via the Godot adapter and `/runtime-capture`. It does **not** record video or capture arbitrary scenes, so the pack's evidence requirements stay scoped to PNG capture at discrete steps;
  - added methods for focus/gamepad navigation and Theme consistency;
  - added items on cross-container focus neighbours, `ui_*` joypad bindings, the assistive-technology limitation, and Theme provenance;
  - two added `evaluation_ids` with scenarios.
- **First benchmark scenario set:** `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml` — 10 discriminating synthetic scenarios covering every `evaluation_id` of the four seed packs plus the two new `godot-ui-engineering 1.1.x` ids. Layout and fixture schema **accepted by Codex 2026-09-10**; each fixture now carries explicit `schema_version: 1`. The runner receives only the pack reference and `benchmark_id`; the runtime loads the canonical `scenario` and maps the remaining fields into the independent evaluator rubric.

## 4. Not done here (deliberately)

- No successor for `game-ux-core`, `game-engineering-core`, `game-qa-core`. Their fixes require external sources (game accessibility guidance; a reputable engineering reference; a QA/testing standard) that need a proper research pass, not invented citations. Documented above; queued in `.ai/NEXT_BEST_ACTIONS.md`.
- No new packs from the ten missing baseline slice (`game-production-core`, etc.). Out of scope for this first assignment per the handoff.
- No edits to `expertise/builtin/*` — the `1.0.0` manifests are immutable.
