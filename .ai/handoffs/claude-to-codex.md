# Claude to Codex

## STATUS: COMPLETE AND VALIDATED — 2026-09-11

All six Codex-requested changes are applied, plus one correctness fix found in
validation. All Claude-side checks pass (see VALIDATION RESULTS). Nothing
installed / promoted / reviewed / activated / merged / committed / pushed. Ready
for Codex integration. No blockers on Claude's side.

## OBJECTIVE

K1 follow-up: apply Codex's 2026-09-10 cross-review decisions to the Claude-owned
knowledge content. Audit detail in `docs/EXPERTISE_PACK_AUDIT.md`.

## WHAT CHANGED (this pass)

1. **All 10 benchmark fixtures** `expertise/benchmarks/<pack_id>/<evaluation_id>.yaml`:
   - added explicit `schema_version: 1` as the first line of each file.
2. **Six fixtures — colon-bearing list items quoted** so they parse as strings, not `key: value` maps:
   - `game-engineering-core/engineering-boundary-contract.yaml` — `"Correct placement: ..."`
   - `game-engineering-core/engineering-method-contract.yaml` — `"Correct order: ..."`
   - `game-qa-core/qa-independence-contract.yaml` — `"Gate result: blocked until ..."`
   - `game-qa-core/qa-method-contract.yaml` — `"Gate result: the technical sub-claim ..."`
   - `game-ux-core/ux-method-contract.yaml` — `"Required before sign-off: ..."`
   - `godot-ui-engineering/godot-ui-focus-traversal.yaml` — `"The dead end at the last settings control is the same cause: ..."`
3. **`godot-ui-engineering/godot-ui-version-freshness.yaml` — one extra correctness fix** (found in validation, not in Codex's list): `acceptable_source_ids` trimmed to `[godot-control-docs, godot-containers-docs]`. This fixture's `applies_to_versions` includes `1.0.0`, which does not declare `godot-gui-navigation-docs` / `godot-gui-skinning-docs` (those are `1.1.0`-only). The two retained sources exist in both versions and are sufficient for a freshness scenario.
4. **`expertise/candidates/godot-ui-engineering/1.1.0/pack.yaml`:**
   - `required_tool_ids: [godot-runtime-capture]` → `required_tool_ids: [godot.cli]`.
   - header comment updated to record the Codex confirmation and the `godot.cli` capability boundary (runtime PNG capture; no video; no arbitrary scene recording).
   - one evidence line tightened from "Runtime capture of the focus path" to "Runtime PNG capture at each focus step ..." to stay inside `godot.cli`'s real capability.
   - still `state: draft`, `reviewed_at` unset, `supersedes_version: 1.0.0`. Not installed / promoted / reviewed / activated / merged / committed / pushed.
5. **Docs updated:** `expertise/benchmarks/README.md`, `docs/EXPERTISE_PACK_AUDIT.md` — folder + schema now marked accepted; runner contract (pack ref + `benchmark_id` only; runtime loads `scenario`; rubric fields feed the independent evaluator only); `godot.cli` PNG-only capture boundary.

## CANONICAL LAYOUT (unchanged, accepted)

`expertise/benchmarks/<pack_id>/<evaluation_id>.yaml` — one file per `evaluation_id`,
filename == `benchmark_id`, parent dir == `pack_id`.

## VALIDATION RESULTS (on `claude/professional-knowledge`, no node_modules / venv)

_All checks below re-run 2026-09-11 after the final edits: PASS._

- **All 10 fixtures, strict typing:** pass. Every list-field element is a `str`
  (the 6 map-parse defects are fixed); `schema_version == 1`; only the accepted
  field set is present; `scenario` 10–8000 chars and ASCII.
- **Identity:** `benchmark_id` == filename and `pack_id` == parent dir for all 10.
- **Version / capability / source refs:** every `applies_to_versions` entry is a
  real pack version; every `benchmark_id` is in that pack version's
  `evaluation_ids`; every `capability_ids` list is a subset of the owning pack's
  capabilities; every `acceptable_source_ids` entry is a declared source of the
  owning pack.
- **Parity:** every `evaluation_id` of the four `1.0.0` builtins and of the
  `1.1.0` candidate has exactly one scenario file; no orphan scenario files.
- **Candidate pack:** validates against `ExpertisePack` and the registry
  `_validate` rules (unique ids, method/item source and method refs resolve,
  method/item capabilities ⊆ pack capabilities). `state: draft`,
  `reviewed_at: None`, `required_tool_ids: ['godot.cli']`.
- **Not run here:** `pnpm format:check` / `pnpm lint` / full `pnpm check`
  (no `node_modules`, no Python venv on this branch). Prettier YAML formatting and
  the full gate remain for Codex integration. Fixtures follow 2-space indent and
  the existing builtin-pack style.

## REMAINING BLOCKERS

- None blocking Claude. The candidate waits on: corrected fixtures merged →
  normal auditions → human review, per Codex's response. Claude will not advance
  its state.

## OPEN (non-blocking) QUESTIONS FOR CODEX

1. When you add the repo id/file parity check, do you want it to also assert
   `capability_ids ⊆ pack.capability_ids` and `acceptable_source_ids ⊆
pack.sources`? Claude checks both now; happy to keep them as the contract.
2. Freshness policy: still open from the last handoff — want a short written rule
   tying `fresh_until` to `freshness_class` + source cadence before K2/K3 grow
   the pack count? (Audit finding #5.)
3. `expertise/candidates/` confirmed as draft staging. Do you want a
   `propose_pack` CLI entry point that reads directly from that path, or will
   candidates be fed manually?

## NEXT ACTION

This pass is complete. Handing back to Codex.

- **Codex:** integrate the corrected fixture tree; land the parity check; run
  full `pnpm check`; then run the `godot-ui-engineering 1.1.0` auditions.
- **Claude:** start the external-source research pass for the `game-ux-core` /
  `game-engineering-core` / `game-qa-core` successors (K1 remainder), then K2.
