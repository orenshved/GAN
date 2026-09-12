# Codex to Claude

## OBJECTIVE

Audit the four existing GAN Expertise Packs as professional knowledge-engineering artifacts and prepare compact, source-backed successor candidates plus discriminating benchmark scenarios.

## WHAT CHANGED

Codex implemented the pack schema/registry, immutable governance, provenance/freshness, FTS routing, bounded four-plane packets, Pack Builder, separate candidate/evaluator auditions, lifecycle, maintenance reports, and Studio inspection. Software gates pass; professional qualification is not claimed.

## FILES/PATHS

- Read first: `.ai/PROJECT_STATE.md`, `.ai/AGENT_RULES.md`, `.ai/KNOWN_ISSUES.md`, `docs/AI_WORK_SPLIT.md`.
- Run: `node scripts/ai-index.js` if stale, `node scripts/ai-audit.js`, then `node scripts/ai-doctor.js --task "Audit the four existing Expertise Packs and design professional benchmark scenarios"`.
- Owned content: `expertise/builtin/game-ux-core/`, `expertise/builtin/game-engineering-core/`, `expertise/builtin/game-qa-core/`, `expertise/builtin/godot-ui-engineering/`, and agreed expertise benchmark fixtures.
- Contract reference: `services/daemon/gameagent/models/contracts.py` (`KnowledgeSource`, `KnowledgeMethod`, `ExpertiseKnowledgeItem`, `ExpertisePack`).

## DECISIONS MADE

- Existing `1.0.0` manifests are immutable once installed. Corrections require new versions.
- Drafts and heuristic model auditions are not human/professional proof.
- Knowledge is not project evidence; sources, methods, and uncertainty must remain explicit.
- Quality matters more than completing the pack count.

## CONTRACTS THE OTHER SIDE MUST RESPECT

- Do not edit Pydantic/runtime architecture or generated schema/TypeScript.
- Do not copy project identity, history, private taste, or copyrighted full text into global packs.
- Every item and method must reference declared sources; every pack needs at least one method and evaluation ID.
- Use authoritative sources, explicit licenses, applicable capabilities, and honest freshness classes.
- Create candidate successor versions; do not mark them active or reviewed.

## BLOCKERS

- Claude Code is not installed locally. Oren must install/authenticate it or run this exact handoff in Claude Code.
- A benchmark fixture location may need Codex confirmation if no existing path is suitable.

## QUESTIONS

- Do the current schemas adequately represent checklists, playbooks, anti-patterns, and evidence expectations, or is one narrow contract extension needed?
- Which current claims are generic, unsupported, stale, or professionally misleading?

## NEXT ACTION

Produce an audit table for the four packs, then implement only the smallest coherent successor-pack batch and benchmark scenarios. Record runtime/schema requests in `.ai/handoffs/claude-to-codex.md`. Do not mass-produce the ten missing packs in this first assignment.

## CODEX RESPONSE — 2026-09-10

### Benchmark scenarios

- Accepted canonical source layout: `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml`.
- Accepted fields: `schema_version`, `benchmark_id`, `pack_id`, `applies_to_versions`,
  `capability_ids`, `scenario`, `discriminates`,
  `expected_specialist_findings`, `expected_uncertainty`,
  `acceptable_source_ids`, and `scoring_notes`.
- Add explicit `schema_version: 1` to each fixture. The contract currently
  defaults it for compatibility, but source-controlled fixtures should state it.
- Codex validated all 10 proposed files for directory/file identity, evaluation
  ID, version, source reference, and scenario length. Strict Pydantic validation
  currently passes 4 and rejects 6 because an unquoted colon inside a YAML list
  item is parsed as an object instead of a string. Quote the affected complete
  list item in:
  - `game-engineering-core/engineering-boundary-contract.yaml` (`Correct placement:`)
  - `game-engineering-core/engineering-method-contract.yaml` (`Correct order:`)
  - `game-qa-core/qa-independence-contract.yaml` (`Gate result:`)
  - `game-qa-core/qa-method-contract.yaml` (`Gate result:`)
  - `game-ux-core/ux-method-contract.yaml` (`Required before sign-off:`)
  - `godot-ui-engineering/godot-ui-focus-traversal.yaml` (`The dead end ... cause:`)
- `PackAutomatedAuditionCommand` now carries only the pack reference and
  `benchmark_id`. The runner loads `scenario` from the canonical fixture and
  maps `expected_specialist_findings` into the independent evaluator rubric.
  The remaining rubric fields also belong in that evaluator input, not the
  baseline or enriched specialist prompt.
- Codex added the Pydantic benchmark-scenario contract and runner lookup on the
  runtime branch. The repository coverage check will land when the fixture tree
  is merged so it does not duplicate Claude-owned files. Pydantic remains the
  contract owner; generated schema/TypeScript comes from
  `pnpm protocol:generate`.
- `expertise/candidates/` is accepted as source-controlled draft staging.
  Runtime publication must still pass the manifest through `propose_pack`; files
  in that directory are never installed or routed directly.

### Godot capture tool

- `godot-runtime-capture` is not a registered tool ID and must not be used.
- The canonical existing engine-adapter tool ID is `godot.cli`. Change the
  candidate's `required_tool_ids` to `[godot.cli]`.
- Codex registered `godot.cli` in the runtime tool catalog with the existing
  `RuntimeCaptureCommand` → `RuntimeCaptureResult` contract and its real
  project-write/command-execution permissions.
- Current runtime support produces a tool-generated PNG through the Godot adapter
  and `/runtime-capture`; it does not record video and it is not yet an arbitrary
  scene-capture system. Keep claims and evidence requirements to runtime capture
  rather than runtime recording until a recording contract is implemented.

These decisions unblock the Claude-owned candidate after the six YAML strings
are quoted. Keep `godot-ui-engineering@1.1.0` in `draft` until the corrected
fixtures are merged and its normal auditions and human review are complete.

## CODEX INTEGRATION RESPONSE — 2026-09-11

### Integrated content

- Merged the accepted `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml`
  fixture tree, benchmark README, expertise audit, and
  `expertise/candidates/godot-ui-engineering/1.1.2/pack.yaml` into
  `codex/platform-runtime`.
- The initial staged 1.1.0 and 1.1.1 drafts remain immutable and unreviewed.
  Independent source review clarified that the cited rendered
  `classes/class_control.html` artifact should be recorded as CC BY 3.0, while
  its underlying generated class-reference sources are MIT-derived. The
  corrected successor is 1.1.2; it remains `state: draft` and nothing has been
  promoted.
- Staged the source-controlled candidate through the governed `pack-candidate`
  API so it can be auditioned without bypassing lifecycle controls.

### Repository and policy decisions

- Yes: repository parity now checks directory/pack identity, filename/evaluation
  identity, version applicability, complete evaluation coverage,
  `capability_ids ⊆ pack.capability_ids`, and
  `acceptable_source_ids ⊆ pack.sources`.
- Yes: the written freshness rule is now canonical in
  `docs/decisions/0012-canonical-knowledge-fabric-storage.md`. The effective
  `fresh_until` is the earlier of the next expected upstream publication and
  the freshness-class ceiling; moving `/stable/` documentation also requires
  target-series and project-version verification.
- Candidate ingestion remains the existing governed Studio/API path for now.
  Do not add a `propose_pack` CLI entry point during K1. Revisit only if K2/K3
  demonstrates that repeated manual ingestion is operationally costly.

### Runtime hardening found during auditions

- Added the long-running audition timeout to both the Studio client and proxy.
- Prevented a Windows temporary-directory cleanup race from converting a
  completed Codex app-server run into a failed audition.
- Candidate expertise is now scoped to each benchmark's declared capabilities
  and acceptable source IDs.
- The evaluator receives the exact supplied-expertise payload, and free-text
  concerns no longer zero a score unless deterministic provenance/source checks
  fail.
- Human qualification considers the latest receipt per benchmark while keeping
  failed historical attempts auditable.

### Latest automated audition receipts for corrected 1.1.2

| Benchmark                         | Baseline | Candidate | Receipt                    |
| --------------------------------- | -------: | --------: | -------------------------- |
| `godot-ui-method-contract`        |     0.72 |      0.97 | `ece2ccdf507c9c7f49dfb313` |
| `godot-ui-version-freshness`      |     0.78 |      0.94 | `f6f66813ba515a1cc8cf7fda` |
| `godot-ui-focus-traversal`        |     0.72 |      0.90 | `cccf19712988be4438beb437` |
| `godot-ui-theme-provenance-check` |     0.72 |      0.82 | `f4a4cf96fd542f668494b65a` |

All four receipts target the corrected 1.1.2 digest
`0d0d74dbbbbab808736111e5e042cc2b19dc64c9e6adb7106745bcb21f60f979`,
beat their baselines, and clear the automated 0.80 candidate threshold. The
previous 1.1.1 receipts passed the automated threshold but remain tied to the
superseded digest. Earlier 1.1.0, 1.1.1, and failed runner attempts remain in
the audit trail.

The evaluator retained three non-blocking concerns for human review: the
freshness response did not state the complete current-document fallback rule;
the focus response explicitly checked `ui_right` rather than enumerating every
directional `ui_*` action; and the theme response recommended validation but did
not itself perform the required runtime Theme-change capture. The candidate
manifest does specify all four directional actions and runtime Theme-change
capture, so these remain audition-output caveats rather than missing pack
requirements.

### Remaining gate

Codex verified the official-source claims, corrected the rendered-document
license description in 1.1.2, and completed the corrected digest's four
auditions. The Studio now presents 1.1.2 as `Awaiting review`. Oren's explicit
human decision must cover provenance, privacy, licensing, and contradictions.
Keep 1.1.0, 1.1.1, and 1.1.2 in `draft` until that decision; only 1.1.2 is the
current publication candidate. Claude may continue the K1 external-source
research pass and K2 after reading the files from the Codex worktree, not its
own stale branch.
