# GAN AI work split

Status: proposed for Director review after the 2026-09-10 verified checkpoint.

## Operating model

| Stream                   | Owner          | Branch                           | Owns                                                                                                                                 |
| ------------------------ | -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Platform/runtime         | Codex          | `codex/platform-runtime`         | Contracts, daemon, event sourcing, routing, worker lifecycle, Studio/API integration, QA infrastructure, tests, CI                   |
| Professional knowledge   | Claude         | `claude/professional-knowledge`  | Pack contents, authoritative sources, methods, playbooks, checklists, anti-patterns, benchmark scenarios, qualification criteria     |
| Integration/cross-review | Codex + Claude | Handoffs, then Codex integration | Contract requests, professional-quality review, schema conformance, retrieval efficiency, qualification evidence, acceptance stories |
| Independent review       | Unassigned     | None                             | Gemini only if a concrete adversarial/large-context review justifies a third stream                                                  |

## Current checkpoint

The runtime already supports immutable versioned packs, provenance/freshness, FTS retrieval, bounded four-plane packets, task research, Pack Builder/governance/auditions, observations and reviewed lessons, explicit knowledge blocking, baseline visibility, recruiter remediation diagnoses, performance summaries, and Studio drilldown. Four compact built-in packs exist.

Passing `pnpm check` proves software integrity, not professional qualification. The Knowledge Fabric addendum remains incomplete.

## Codex workstream

### C1 — Reproducible worker composition and failure learning

**Owned paths:** `services/daemon/gameagent/models/`, `projects.py`, `codex_bridge.py`, `qa.py`, generated protocol, Studio worker/learning views, tests.  
**Outcome:** Historical work records exact known model route, allowed/used tools, agent, pack versions, packet/context identity, task, and QA requirements. Failed evaluations generate evidence-bound postmortems without asserting an unproven root cause.

### C2 — Knowledge maintenance and import operations

**Owned paths:** `knowledge.py`, daemon API/CLI, Studio Knowledge/Learning surfaces, tests.  
**Outcome:** Source integrity/freshness, contradictions, regressions, lifecycle and derived indexes have explicit reports and safe actions; pack install/update/inspect operations preserve immutability and trust gates.

### C3 — Lead Bench and Recruiter integration

**Owned paths:** agent/recruiter runtime, onboarding selection, task state, Studio network, tests.  
**Outcome:** GM selects only relevant Leads, distinguishes all six recruitment problems, reuses compatible agents, and never claims specialist qualification without packs/tools/evaluation.

### C4 — Acceptance and portfolio trace

**Owned paths:** deterministic fixtures, benchmark runner integration, Playwright smoke, Studio provenance drilldown, architecture docs.  
**Outcome:** Automated stories cover generic-vs-specialist, domain projection, freshness, new expertise, learning, isolation, regression, and end-to-end recommendation provenance.

## Claude workstream

### K1 — Audit the existing seed packs

**Owned paths:** `expertise/builtin/*/pack.yaml`, new benchmark fixtures under the agreed expertise benchmark path, Claude handoff.  
**Scope:** `game-ux-core`, `game-engineering-core`, `game-qa-core`, `godot-ui-engineering`.  
**Outcome:** Professional adequacy review, authoritative source selection, freshness/license corrections through new versions, useful methods/checklists/anti-patterns, and discriminating benchmark scenarios. Do not change runtime architecture.

### K2 — First missing baseline slice

**Scope:** `game-production-core`, `game-design-core`, `project-intelligence-analysis`.  
**Outcome:** Compact source-backed candidate packs and benchmarks. Do not mass-produce shallow manifests or label drafts trusted.

### K3 — Engine/art/accessibility/model slice

**Scope:** `game-art-direction`, `godot-core`, `2d-game-art`, `pixel-art-production`, `controller-navigation`, `game-accessibility-basics`, `local-model-selection`.  
**Outcome:** Research-backed candidates in small reviewable batches. Escalate schema/tool/ontology needs through the handoff before changing core runtime.

### K4 — Lead methodology and ontology review

**Owned paths:** pack-adjacent benchmark/fixture content and proposed ontology changes.  
**Outcome:** Domain assessment methods, qualification criteria, cross-disciplinary relationships, and evidence expectations that meaningfully outperform generic role prompts.  
**Status (2026-09-12):** Complete on Claude's side. Part A (ontology gate-wiring) and Part C (cross-disciplinary boundary-recognition benchmarks) done; Part B (a `related_capability_ids` schema field) and five new QA-gate proposals are with Codex. See `docs/K4_LEAD_METHODOLOGY_ONTOLOGY_REVIEW.md`.

### K5 — Game Marketing Lead

**Scope:** new agent `marketing-lead` over the existing, currently unowned `post_launch_commercial` capabilities `marketing_assets`, `trailers`, `screenshots`, `store_copy`.  
**Outcome:** Marketing asset and messaging review that stays anchored to real, shipped/shippable game content and the project's own established visual/narrative identity — distinct from art-lead (owns visual production itself, not marketing framing of it) and narrative-lead (owns canon and voice, not sales copy). New pack: `game-marketing-core`.  
**Status (2026-09-12):** Complete. `game-marketing-core@1.0.0` built — Derek Lieu's GDC trailer-editing talk (100+ shipped-title trailers) plus Valve's own Steamworks store-description documentation. 2 methods, 9 items, 2 benchmarks. `screenshots` is the thinnest capability (no dedicated source found this pass). Agent `marketing-lead` proposed to Codex, not created here.

### K6 — Head of Legal

**Scope:** new agent `legal-lead`. No existing ontology family fits (`ratings_compliance`/`accessibility_compliance` in `shipping` are process-compliance, not legal-review capabilities). **Requires a new `legal` capability family** (proposed: `contract_review`, `ip_licensing_review`, `platform_tos_compliance`, `content_rating_strategy`) — proposed to Codex, not created unilaterally.  
**Outcome:** Legal-risk flags surfaced before they become production blockers (licensing, IP clearance, platform ToS, ratings-submission strategy). Like art-lead's "creative quality requires human authority," this Lead's constraint must be explicit: findings are risk flags for a licensed attorney's review, never legal advice, never binding. New pack: `legal-compliance-core`.  
**Status (2026-09-12):** Complete for 3 of 4 proposed capabilities. `legal-compliance-core@1.0.0` built — Chris Reid (licensed NY attorney, dedicated game/tech law practice, prior IP litigation at Ropes & Gray) for `contract_review`/`ip_licensing_review`, and ESRB's own official ratings-process documentation for `content_rating_strategy`. 3 methods, 8 items, 2 benchmarks. `platform_tos_compliance` deliberately excluded from v1.0.0 — no genuine source content found covering actual platform partner/distribution agreements; a dedicated source is a candidate for a future version. Every method/item explicitly framed as risk-flagging for attorney review, never legal advice — grounded in the source's own opening disclaimer, not invented. Agent `legal-lead` and the `legal` capability family remain proposed to Codex, not created here.

### K7 — Publishing Lead (Steam)

**Scope:** new agent `publishing-lead` over the existing, currently unowned `shipping` capabilities `platform_certification`, `packaging`, `patching`, `deployment`, `release_management`, `store_assets`, plus `publishing_support` (`post_launch_commercial`).  
**Outcome:** Store-page setup, build/branch/depot management, review-guideline compliance, and launch-readiness discipline for a specific storefront, distinct from Legal (ToS/contract review) and Marketing (store copy/trailers). Platform-specific tooling knowledge (Steamworks) is a tool-specific layer on top of general shipping capabilities, the same pattern as `godot-core` on top of general engineering capabilities. New pack: `steam-publishing-core`.  
**Status (2026-09-12):** Complete — all 7 proposed capabilities covered. `steam-publishing-core@1.0.0` built from three sources: a GDC 2026 talk delivered by Valve's own Steam Business and Communications teams (Tom Giardino, Kaci Aitchison Boyle — uploaded 4 days before this pack was built, about as fresh as sourcing gets in this program), plus Valve's own Steamworks documentation on Builds and Depots. 3 methods, 8 items, 2 benchmarks. `platform_certification` is the thinnest capability — Steam has no formal certification gate like console platforms do, so coverage is honestly scoped to the documented default-branch promotion authorization requirement rather than implied to be a full cert process. Agent `publishing-lead` proposed to Codex, not created here.

### K8 — LiveOps Lead

**Scope:** new agent `liveops-lead` over the existing, currently unowned capabilities `live_operations` (`post_launch_commercial`) and `liveops_design` (`game_design`).  
**Outcome:** Live-event cadence, content-drop planning, and player-facing incident communication discipline for a continuously-operated shipped game, distinct from production-lead's pre-launch milestone focus. New pack: `liveops-core`.  
**Status (2026-09-12):** Complete. `liveops-core@1.0.0` built from two sources: Crystin Cox (17+ years, Director of Live Game Operations at Xbox Game Studios Publishing; founded ArenaNet's Commerce team for Guild Wars 2; led MapleStory LiveOps at Nexon America) for the maturity/iteration-loop model, and Chris Wilson (co-founder of Grinding Gear Games, creator of the decade-plus-sustained Path of Exile) for content-cadence and balance-timing discipline, presenting his own studio's documented growth history. 2 methods, 8 items, 2 benchmarks. First-pass validation clean, no YAML defects. Agent `liveops-lead` proposed to Codex, not created here.

### K9 — Monetization Director

**Scope:** new agent `monetization-director` over the existing, currently unowned capability `monetization` (`post_launch_commercial`), related to `economy_design`/`economy_analysis`.  
**Outcome:** Monetization-model and offer evaluation grounded in player-value and fairness evidence, not revenue-maximization heuristics alone; must not claim regulatory clearance on loot-box/gambling-adjacent mechanics on its own authority (defers to Legal). New pack: `monetization-core`.  
**Status (2026-09-12):** Complete. `monetization-core@1.0.0` built from two sources: Vladimir Krasilnikov's GDC 2019 talk (CPO at Pixonic, presenting the shipped, commercially successful War Robots' own documented revenue and community-response data, including a first-person account of a real monetization crisis where financial metrics stayed healthy while community trust and team morale took real damage) and Apple's own official App Store loot-box odds-disclosure guideline. 2 methods, 8 items, 2 benchmarks. `economy_design`/`economy_analysis` deliberately not declared — reserved for K11. Every method/item scoped as risk-flagging for player-value and fairness, with platform/jurisdiction compliance questions treated as Legal's domain, not resolved here. Agent `monetization-director` proposed to Codex, not created.

### K10 — Mobile Retention Lead

**Scope:** new agent `mobile-retention-lead` over the existing, currently unowned capability `retention_design` (`game_design`) plus `funnel_analysis`, `ab_testing`, `analytics` (`product_data`).  
**Outcome:** Retention/funnel diagnosis grounded in cohort data and A/B evidence, distinct from game-design-lead's broader `onboarding_design` — this Lead specifically owns post-launch retention measurement and mobile funnel optimization. New pack: `mobile-retention-core`.  
**Status (2026-09-12):** Complete — all 4 proposed capabilities covered. `mobile-retention-core@1.0.0` built from two exceptionally rich sources: Emily Greer (3x games co-founder/CEO — Kongregate, Double Loop Games) for retention/funnel/A-B-testing data-interpretation discipline (audience-mix confounding, subgroup masking, sample-size and power-curve statistics, cherry-picking, test-assignment bias, downstream-effect-aware evaluation), and Celia Hodent (PhD in psychology, former Director of UX at Epic Games on Fortnite) for cognitive-load-aware onboarding design, grounded in real UX-test footage with eye-tracking data. 3 methods, 8 items, 2 benchmarks. Agent `mobile-retention-lead` proposed to Codex, not created here.

### K11 — Game Economy Lead

**Scope:** new agent `game-economy-lead` over the existing, currently unowned capability `economy_design` (`game_design`) plus `economy_analysis`, `balance_simulation` (`product_data`).  
**Outcome:** In-game economy design (currency sinks/faucets, crafting/trading, inflation control) grounded in simulation-backed evidence, distinct from game-design-lead's general `balance_design` (combat/mechanics balance). New pack: `game-economy-core`.  
**Status (2026-09-12):** Complete, all 3 proposed capabilities covered. `game-economy-core@1.0.0` built from two sources: NetEase's own internal methodology for monitoring and intervening in the live economies of NetEase's shipped MMORPGs (Yongcheng Liu and Qinfang Ying, GDC 2020 Virtual Talk), covering `economy_analysis`/`balance_simulation` via sink/faucet flow monitoring and transaction-network anomaly detection; and Path of Exile co-creator Chris Wilson's own account of protecting one of the industry's most trade-driven online economies (independent YouTube, January 2026), covering `economy_design` via economic-integrity policy (disguised real-money trading, exploit response, customer-support restoration risk). 3 methods, 9 items, 2 benchmarks. Agent `game-economy-lead` proposed to Codex, not created here.

### K12 — Director of 3D (Blender)

**Scope:** new agent `3d-art-director` over the existing, currently unowned `art` capabilities `character_art`, `environment_art`, `prop_art`, `rigging`, `animation` — none of these are in art-lead's current capability set (`art_direction`, `visual_development`, `asset_tracking`, `concept_art`, `ui_art`), a real gap this stage closes.  
**Outcome:** 3D asset production discipline (topology, rigging readiness, animation pipeline), grounded in Blender-specific and general 3D-production practitioner sources — a tool-specific pack layered on general 3D-art capabilities, the same pattern as `godot-core`. New pack: `blender-3d-production-core`.  
**Status (2026-09-12):** Complete, all 5 proposed capabilities covered. `blender-3d-production-core@1.0.0` built from three sources: Embark Studios' own official account (blender.org User Stories, Daniel Bystedt) of adopting Blender studio-wide for the shipped THE FINALS and ARC Raiders, covering the Blender-specific production layer (non-destructive modifier workflow, custom mesh-attribute interop data, real-time viewport validation) across `character_art`/`environment_art`/`prop_art`; BioShock Infinite's own Lead Character Artist (Gavin Goulden, Irrational Games, GDC 2014) for shared-topology/rig production systems and iteration/readability discipline across `character_art`/`prop_art`/`rigging`; and a Blizzard Overwatch animator's own account (Matthew Boehm, GDC 2017) of first-person rig architecture and additive animation across `animation`/`rigging`. 4 methods, 11 items, 2 benchmarks. Agent `3d-art-director` proposed to Codex, not created here.

### K13 — Tech Art Lead

**Scope:** new agent `tech-art-lead` over the existing, currently unowned `art` capability `technical_art`.  
**Outcome:** The art/engineering bridge discipline — shader-authoring support for artists, rigging/animation tooling, performance-aware asset pipelines — distinct from both art-lead (visual authority) and engineering-lead (general engine code). New pack: `technical-art-core`.  
**Status (2026-09-12):** Complete, the single proposed capability covered. `technical-art-core@1.0.0` built from two sources: Steve Theodore's 2009 Game Developer article (Valve/Bungie technical art veteran, credited on the shipped Half-Life, Team Fortress, and Counter-Strike series), covering shader-authoring tiering and risk — tiered shader libraries, performance visibility at authoring time, real-condition preview, plain-language parameters; and Michael Malinowski's GDC 2020 talk (Senior Technical Artist, Creative Assembly), covering plugin-based tool and rigging pipeline architecture — encapsulated, versioned, metadata-agnostic tools that scale across multiple concurrent AAA projects without collapsing into unmaintainable monoliths. 2 methods, 8 items, 2 benchmarks. Fourth consecutive clean first-try validation pass. Agent `tech-art-lead` proposed to Codex, not created here.

### K14 — CISO

**Scope:** new agent `ciso`. No existing ontology family fits (`crash_analysis` in `product_data` is QA-flavored, not security-flavored). **Requires a new `security` capability family** (proposed: `security_review`, `data_protection`, `vulnerability_management`, `incident_response`, `access_control_review`) — proposed to Codex, not created unilaterally.  
**Outcome:** Security-risk identification for player-data handling, backend/network exposure, and third-party SDK/dependency risk. Same human-authority discipline as Legal: findings are risk flags, never a security clearance or certification. New pack: `security-core`.  
**Status (2026-09-12):** Complete, all 5 proposed capabilities covered, built using the proposed-but-not-yet-created `security` family capability ids (same precedent as K6's `legal-compliance-core` before Codex decided on that family). `security-core@1.0.0` built from three sources: the OWASP Game Security Framework v0.5.1 (an in-development, purpose-built verification standard for video games modeled on ASVS), covering security architecture/threat modeling and third-party/supply-chain vetting; Amazon GameLift's own official DDoS-resilience architecture guidance (Hok Peng Leung, Head of Software Development for Amazon GameLift), covering network attack resilience and incident monitoring; and a currently-serving gaming CISO's own account of the live threat landscape (Temi Adebambo, CISO for Microsoft Gaming, Xbox/Call of Duty/World of Warcraft, 500M+ users), covering player-data and access-control discipline. 3 methods, 12 items, 2 benchmarks. Fifth consecutive clean first-try validation pass. Agent `ciso` proposed to Codex, not created here — registration blocked on Codex's `security` family decision, same as K6's `legal-lead`.

### K15 — Director of Learning

**Scope:** new agent `learning-director`. Unlike K5–K14, this is not a game-development discipline — it is a meta-role governing how _other GAN agents_ learn, retain, and transfer knowledge. Two distinct parts:

- **Sourceable content (Claude builds):** a `learning-strategy-core` pack grounded in real instructional-design, knowledge-transfer, and mentorship/onboarding practitioner and research sources (deliberate-practice research, cognitive-load-aware instructional design, structured-onboarding practice — this program's own `game-production-core@1.1.1` already cites a directly relevant precedent: Sandercock's staged day/week/month onboarding structure).
- **Runtime mechanism (Codex's call, proposed not built here):** how "teaching" an agent actually happens at runtime — a temporary pack grant, a capability-escalation approval flow, a new mentorship event/contract type. This is the load-bearing half of the "VERY IMPORTANT" requirement below and cannot be delivered as pack content alone.

**Priority note:** K5–K15 are queued in the order given by the Director; no reordering has been applied. Each still needs the same sourcing discipline as K1–K3 (credentialed practitioner evidence, license verification, no invented consensus) before any pack is built.  
**Status (2026-09-12):** Sourceable half complete, all 3 proposed capabilities covered, built using the proposed-but-not-yet-created `agent_learning` family (same precedent as K6's `legal` and K14's `security`). `learning-strategy-core@1.0.0` built from three sources: a peer-reviewed systematized review of Cognitive Load Theory (Ghanbari, Haghani, Barekatain, and Jamali, 2020, CC BY-NC-SA 4.0), covering cognitive-load-aware instructional design — worked examples, split attention, the expertise reversal effect; a peer-reviewed critical review of the deliberate-practice literature (Hambrick, Macnamara, and Oswald, 2020, CC BY), covering an honest, evidence-weighted account of what structured practice actually explains about expertise (roughly 14-40% of variance, not the whole story) rather than the popularized overstated version; and Jenn Sandercock's own account of staged new-hire onboarding (Lead Producer, shipped Return to Monkey Island), deliberately reused from `game-production-core@1.1.1` where this exact precedent was flagged as directly relevant, with every item newly and independently distilled for the agent-onboarding question rather than copied from that pack's production-plan framing. 3 methods, 11 items, 2 benchmarks. Sixth consecutive clean first-try validation pass. Agent `learning-director` proposed to Codex, not created here. **The runtime "how does teaching actually happen" mechanism remains entirely Codex's call**, not built here, per this section's own scope split above — this is the load-bearing half of the boundary-escalation protocol and the reason K15 could not be fully closed out by Claude alone. This completes the sourceable side of the entire K5-K15 expansion.

## Proposal: agent boundary-awareness and learning-escalation protocol (2026-09-12, Director directive)

Director instruction, verbatim intent: _if an agent lacks knowledge required for a task and has no one to delegate to, it must stop, raise a flag the human Director sees, and ask: "Do you want me to learn this, or should we create a new subagent to work under me/alongside me and have the Director of Learning teach them what they need?"_

This is not a request to build new machinery from nothing. `services/daemon/gameagent/models/contracts.py` already defines `CapabilityGap` (tracks missing capabilities per task) and a well-designed `RecruitmentDiagnosis` (six recruitment problems — `no_agent`, `missing_expertise_pack`, `missing_tool`, `stale_knowledge`, `performance_failure`, `model_insufficient` — each mapped to an action), computed in `recruiter.py`. Checked directly: **neither contract has a consumer anywhere else in `services/daemon/gameagent/`.** The gap-detection and diagnosis machinery exists; nothing surfaces it to the Director as a decision point, and nothing stops an agent from proceeding without the knowledge a diagnosis would have flagged.

This is also a direct runtime analog of a discipline this program already enforces at the evidence layer: `game-qa-core`'s own `qa-missing-is-visible` item — _"Inconclusive or absent evidence blocks the affected claim unless the Director records an explicit scoped waiver."_ The Director's request is the same principle one layer up: missing **capability**, not just missing **evidence**, should block and stay visible until the Director acts, not silently degrade into an under-qualified answer.

Proposed (Codex's call on implementation):

1. When an agent's own diagnosis surfaces a capability gap with no existing agent to delegate to (i.e. `RecruitmentDiagnosis.problem in {"no_agent", "missing_expertise_pack"}` and no compatible agent/pack exists to reuse), the task must block — not auto-proceed to `create_agent` — until the Director responds.
2. The Director-facing prompt should offer exactly the two options requested: **(a) build/attach the missing expertise pack now** (fast path for a small, well-scoped gap), or **(b) spin up a new subagent under or alongside the current one, taught by the Director of Learning** (for a gap large enough to warrant a standing specialist). This maps naturally onto `RecruitmentDiagnosis.action` values `attach_or_build_pack` and `create_agent`, but today both actions appear to fire without this checkpoint.
3. `K15`'s "Director of Learning" is the natural owner of option (b)'s teaching step once it exists, and its runtime mechanism (how it actually transfers knowledge to a new or existing agent) is the same open design question as K15's second bullet above — these two proposals should be designed together, not separately.

Claude's role in this: author the qualification methodology and pack content K15 needs, and (already done) the K4 Part B `related_capability_ids` proposal that lets an agent know _which_ other agent to delegate to before concluding no one can help. The escalation surface itself, the blocking behavior, and the Director-of-Learning teaching mechanism are Codex/runtime work.

## Cross-review gates

| Gate           | Claude reviews                                                 | Codex reviews                                                 | Integration condition                                    |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| Pack candidate | Professional specificity, sources, methods, unsupported claims | Contract validity, isolation, IDs, freshness, maintainability | Draft loads without entering trusted routing             |
| Qualification  | Benchmark relevance and expected professional findings         | Runner isolation, evidence class, regression policy           | All declared evaluations have inspectable receipts       |
| Retrieval      | Whether selected excerpts support real specialist reasoning    | Ranking, budget, provenance, project isolation                | Packet is bounded and source-complete                    |
| Studio trace   | Whether explanation reflects professional practice             | Exact persisted composition/evidence links                    | Recommendation can be traced without overstating proof   |
| Promotion      | Generalization/privacy limits                                  | Immutable version/lifecycle and replay                        | Human review remains required for trust/global promotion |

## Path boundaries

- Claude may edit `expertise/builtin/` and agreed expertise benchmark/fixture content.
- Claude proposes runtime/schema/ontology requirements in `HANDOFF_TO_CODEX.md` (repo root) before changing shared architecture.
- Codex does not author broad professional corpora; it may create minimal deterministic fixtures required to test machinery.
- Codex integrates Claude changes only after schema, provenance, isolation, benchmark, and full `pnpm check` review.
- Neither stream edits generated protocol artifacts directly.

## First assignments

1. **Codex:** C1, limited to composition receipts and failure postmortems.
2. **Claude:** K1, limited to auditing the four existing seed packs and producing proposed new versions plus benchmark scenarios.
3. **Cross-review:** Claude reports any missing schema/runtime capability; Codex evaluates and integrates justified changes.

Claude Code is not currently installed on this workstation. The exact launch prompt is in `.ai/handoffs/codex-to-claude.md`; do not pretend the stream is running.
