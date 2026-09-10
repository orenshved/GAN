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
- Claude proposes runtime/schema/ontology requirements in `.ai/handoffs/claude-to-codex.md` before changing shared architecture.
- Codex does not author broad professional corpora; it may create minimal deterministic fixtures required to test machinery.
- Codex integrates Claude changes only after schema, provenance, isolation, benchmark, and full `pnpm check` review.
- Neither stream edits generated protocol artifacts directly.

## First assignments

1. **Codex:** C1, limited to composition receipts and failure postmortems.
2. **Claude:** K1, limited to auditing the four existing seed packs and producing proposed new versions plus benchmark scenarios.
3. **Cross-review:** Claude reports any missing schema/runtime capability; Codex evaluates and integrates justified changes.

Claude Code is not currently installed on this workstation. The exact launch prompt is in `.ai/handoffs/codex-to-claude.md`; do not pretend the stream is running.
