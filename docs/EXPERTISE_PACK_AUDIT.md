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
list items are quoted as strings; the `godot-ui-engineering 1.1.0` candidate's
`required_tool_ids` is now `[godot.cli]`. The candidate stays `state: draft` —
not installed, promoted, reviewed, activated, merged, committed, or pushed.

**Update 2026-09-11 (Codex integration + K1 remainder complete):** Codex merged the
fixture tree and integrated the Godot candidate on `codex/platform-runtime`
(`codex-platform` worktree). Independent source review there found the cited
rendered `class_control.html` page should be recorded as CC BY 3.0 — not MIT,
which is the license of the Godot engine _source_ repo the docs are generated
from — and superseded the draft as `godot-ui-engineering@1.1.2`. Claude verified
this directly against the Codex-worktree file: all four sources correctly carry
`license: CC BY 3.0`; no new issue found; **not touched, per instruction.**
Codex completed all four automated auditions for 1.1.2 against the corrected
digest; every candidate score beat its baseline and cleared the automated
threshold. The Studio presents 1.1.2 as awaiting human review. The 1.1.0/1.1.1
receipts remain historical and do not qualify 1.1.2.

Claude then completed the K1 remainder on this worktree (`claude/professional-knowledge`,
still uncommitted): draft `1.1.0` successors for all three remaining seed packs
— `game-ux-core`, `game-engineering-core`, `game-qa-core` — each adding exactly
one new, license-verified external source and one new discriminating benchmark
scenario. Detail in §5–§7 below. All four seed packs now have a draft successor
somewhere in the two worktrees; none are installed, reviewed, or promoted.

**Update 2026-09-11 (K2 started):** K1 is complete. K2 (the first missing
baseline slice) is underway: `game-production-core@1.0.0` and
`game-design-core@1.0.0` are new draft candidates, each capability-matched to
an existing agent in `agents/builtin/roster.json` and grounded in one
license-verified external source (the Scrum Guide, CC BY-SA 4.0; the MDA
framework paper, cited under standard copyright — no open license found).
Full detail, including the honestly-scoped thin capabilities and the deferred
third K2 pack, is in `docs/K2_BASELINE_PACKS.md` rather than duplicated here,
since K2 packs are new, not audited successors of an installed version.

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
- **One successor candidate:** `expertise/candidates/godot-ui-engineering/1.1.0/pack.yaml` — `state: draft`, `supersedes_version: 1.0.0`, **not** installed or reviewed. Chosen because it is the pack where every fix is verifiable from official Godot documentation already cited by 1.0.0, with no new unverifiable sources:
  - explicit Godot 4.x target and version-sensitivity called out in `description` and items;
  - two added official Godot sources (GUI navigation; GUI skinning), same publisher/authority/licence as the existing two;
  - `required_tool_ids: [godot.cli]` — the canonical engine-adapter tool id confirmed by Codex 2026-09-10; it produces runtime PNG capture via the Godot adapter and `/runtime-capture`. It does **not** record video or capture arbitrary scenes, so the pack's evidence requirements stay scoped to PNG capture at discrete steps;
  - added methods for focus/gamepad navigation and Theme consistency;
  - added items on cross-container focus neighbours, `ui_*` joypad bindings, the assistive-technology limitation, and Theme provenance;
  - two added `evaluation_ids` with scenarios.
- **First benchmark scenario set:** `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml` — 10 discriminating synthetic scenarios covering every `evaluation_id` of the four seed packs plus the two new `godot-ui-engineering 1.1.0` ids. Layout and fixture schema **accepted by Codex 2026-09-10**; each fixture now carries explicit `schema_version: 1`. The runner receives only the pack reference and `benchmark_id`; the runtime loads the canonical `scenario` and maps the remaining fields into the independent evaluator rubric.

## 4. Not done here (deliberately)

- No new packs from the ten missing baseline slice (`game-production-core`, etc.). Out of scope for this first assignment per the handoff; K2.
- No edits to `expertise/builtin/*` — the `1.0.0` manifests are immutable.
- No edits to the Codex-integrated `godot-ui-engineering@1.1.2` — reviewed directly in the Codex worktree, no issue found.
- K1's four seed packs now all have draft successors (§5–§7 below). None are installed, reviewed, or promoted.

## 5. K1 remainder — `game-ux-core 1.1.0` (2026-09-11)

**Candidate:** `expertise/candidates/game-ux-core/1.1.0/pack.yaml` — `state: draft`, `supersedes_version: 1.0.0`, not installed or reviewed.

**New source:** Xbox Accessibility Guidelines (Microsoft, `learn.microsoft.com/en-us/xbox/accessibility/guidelines`), fetched and checked 2026-09-11. `source_type: official_documentation`, `authority: official_documentation`, `freshness_class: version_sensitive` (current published version 3.2, 2023-06-08; `fresh_until` set 12 months out).

**Licensing checked, not assumed:** Microsoft Learn's site-wide Terms of Use (`learn.microsoft.com/en-us/legal/termsofuse`, checked 2026-09-11) grant only personal/non-commercial use and state no open content license for this page — unlike some other Microsoft Learn doc sets, there is no CC BY statement here. The pack's `license` field records that restriction accurately instead of assuming an open license. No guideline text is reproduced anywhere in the pack; every method/item is original wording describing a professional practice, with the source cited for attribution and further reading — the same treatment a paywalled paper or book would get.

**What this fixes from the audit table:** `accessibility_ux`, `controller_navigation`, and `onboarding_ux` were claimed but under-supported in 1.0.0. Added:

- method `game-accessibility-scoping-review` — determine which accessibility guideline areas a game's actual mechanics require before claiming coverage, instead of a single pass/fail checkbox;
- items on mechanic-scoped accessibility coverage, input-remapping verification, and testable instruction/tutorial clarity;
- one new `evaluation_id` (`ux-accessibility-scoping`) with a discriminating scenario: a game claims "full accessibility support" from a remap screen and subtitles while a boss mechanic telegraphs two different attacks using color alone — a specialist must scope per-mechanic and catch the untested colorblind-signaling gap that remap/subtitles don't cover.
- also reclassified `gan-ux-evidence-policy`'s `source_type` from `standard` to `project_document`, applying finding #1/Q2 from this same audit to the pack's own internal source.

`interaction_design` remains backed only by the original `ux-task-flow-review` method (unchanged from 1.0.0) — still the pack's thinnest capability; a dedicated interaction-design source is a candidate for a future pass.

## 6. K1 remainder — `game-engineering-core 1.1.0` (2026-09-11)

**Candidate:** `expertise/candidates/game-engineering-core/1.1.0/pack.yaml` — `state: draft`, `supersedes_version: 1.0.0`.

**New source:** _Game Programming Patterns_ by Robert Nystrom (`gameprogrammingpatterns.com`), fetched and checked 2026-09-11. This was the pack's core provenance gap — 1.0.0 had **zero** external engineering authority, only GAN's own internal policy.

**Licensing checked, not assumed:** fetched the repository's actual `LICENSE` file (`github.com/munificent/game-programming-patterns`) rather than trusting a search summary. The book's prose (`.markdown`/`.html` files) is **CC BY-NC-ND 4.0** — NonCommercial, NoDerivatives; its code samples are MIT. Given ND, no prose is reproduced or paraphrased-as-derivative anywhere in the pack. The patterns cited (component composition, explicit game-loop ordering, service-locator trade-offs) are general, decades-old game/software patterns predating this book (Gang of Four and earlier) — every item is original wording describing the pattern, with the book cited as a reputable game-specific exposition and further-reading reference, the same treatment a citation of any copyrighted text gets.

**What this fixes from the audit table:** `gameplay_engineering` was listed as a capability with zero supporting content — the audit's sharpest finding for this pack. Added:

- method `game-architecture-pattern-review` — compare a subsystem's actual structure against a named pattern instead of judging architecture only against abstract "good practice";
- items on component-vs-inheritance composition, explicit game-loop update ordering, and the coupling risk of global service-locator access;
- one new `evaluation_id` (`engineering-pattern-contract`) with a discriminating scenario: a boss-enemy system hitting combinatorial subclass explosion (`FlyingShieldedRegeneratingBoss`) where a generic reviewer approves "just add two more subclasses" and a specialist names the inheritance-explosion problem and recommends component composition;
- reclassified both internal GAN sources' `source_type` from `standard` to `project_document` (applying finding #1/Q2 to this pack, same fix already made in `game-ux-core`).

`ui_engineering`, `tooling`, and `build_engineering` remain backed only by the original `engineering-change-plan`/`dependency-boundary-review` methods — sound per the audit, but still GAN-internal-only; a language/build-tooling-specific external source is a candidate for a future pass.

## 7. K1 remainder — `game-qa-core 1.1.0` (2026-09-11)

**Candidate:** `expertise/candidates/game-qa-core/1.1.0/pack.yaml` — `state: draft`, `supersedes_version: 1.0.0`.

**New source:** W3C's **WCAG Evaluation Methodology (WCAG-EM) 2.0** (`w3.org/TR/WCAG-EM/`), a W3C Group Note published 2026-07-23, fetched and checked 2026-09-11. `license: W3C Document License` — same license mechanism already verified for `wcag-2-2` in `game-ux-core`, so no new licensing risk. Chosen after two verification attempts on the ISTQB Glossary (`glossary.istqb.org`) failed to independently confirm its license — the site is JS-rendered and unreachable via static fetch, and a PDF mirror had a certificate error; rather than repeat the earlier mistake of trusting a search-engine summary's license claim, that source was dropped, not used on faith.

**What this fixes from the audit table:** 1.0.0 had one method and one internal source stretched across five capabilities, with `visual_regression` and `accessibility_qa` having no dedicated content. Added:

- method `wcag-em-scoped-evaluation` — a structured scope → disclosed sample → per-item evaluate → report methodology, generalized from WCAG-EM's accessibility-evaluation process to any claim-based QA task;
- items on claims being bounded by their declared scope, sampling needing disclosure, and aggregate pass/fail verdicts hiding per-item failures;
- one new `evaluation_id` (`qa-scoped-evaluation-contract`) with a discriminating scenario: a report claims "all menus pass visual regression" from 3-of-40 undisclosed sampling, with one sampled screenshot's minor diff buried inside an aggregate PASS — a specialist must reject the overreaching scope claim and separately surface the buried per-item discrepancy;
- reclassified `gan-qa-policy`'s `source_type` from `standard` to `project_document`, same fix as the other two packs.

`automated_testing` and `ux_testing` remain backed only by `claim-evidence-matrix` and GAN's internal policy — a dedicated automated-testing or playtesting-methodology source is a candidate for a future pass.

**Still queued:** K2 — the ten missing baseline packs, starting with `game-production-core` / `game-design-core` / `project-intelligence-analysis`.
