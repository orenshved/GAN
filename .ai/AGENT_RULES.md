# Agent Rules

## Session Start Protocol

1. Read `.ai/PROJECT_STATE.md`.
2. Read `.ai/AGENT_RULES.md`.
3. Read `.ai/KNOWN_ISSUES.md` for affected areas.
4. Use `.ai/CONTEXT_INDEX.md` for structure.
5. Run `node scripts/ai-index.js` when the index is stale.
6. Run `node scripts/ai-audit.js`.
7. Run `node scripts/ai-doctor.js --task "<exact workstream>"`.
8. Follow the focused plan instead of broadly rereading the repository.

## Ownership

- Codex owns runtime architecture, contracts, daemon, Studio integration, event sourcing, routing, QA infrastructure, automated tests, CI, and final integration.
- Claude owns professional Expertise Pack contents, sources, methods, playbooks, checklists, anti-patterns, benchmark scenarios, and qualification criteria.
- Do not duplicate implementations. Use `.ai/handoffs/` for boundary requests.
- Gemini remains unassigned unless a concrete independent-review advantage is documented.

## Repository Constraints

- Pydantic models own contracts. Run `pnpm protocol:generate`; never hand-edit generated schema or TypeScript.
- Core cannot import adapters, UI, engine SDKs, or provider SDKs.
- Global definitions cannot contain project identity or conversation history.
- Project events are canonical; SQLite, FTS, and Studio state are rebuildable projections.
- Use dotenv configuration. Do not hard-code secrets or ports.
- Error responses are `{ error: "snake_case_label", detail: err.message }`.
- Register meaningful work with `gameagent task start`; reconcile unregistered work without hiding history.
- Preserve the original PRD. Addenda change behavior only when explicitly authorized.
- Do not begin Phase 12 without Director approval.

## Editing and Validation

- Use targeted reads; never read generated protocol files, lockfiles, build output, binaries, or large assets unless the exact task requires them.
- Use `apply_patch` for source edits and the repository formatter for mechanical formatting.
- Run `pnpm check` before integration. This covers formatting, lint, schema drift, type checks, tests, builds, and browser smoke.
- Keep Knowledge Fabric claims evidence-separated: expertise is not project evidence, heuristic review is not human approval, and correlation is not causation.
- Do not mark the Knowledge Fabric addendum complete while baseline packs or professional qualification evidence remain outstanding.

## Commits

- Commit only when explicitly authorized.
- Include `Co-Authored-By: Codex Sonnet 4.6 <noreply@anthropic.com>`.
- Use separate branches/worktrees for concurrent Codex and Claude work.

## Session End Protocol

- Update `.ai/WORKING_HISTORY.md`, `.ai/KNOWN_ISSUES.md`, `.ai/NEXT_BEST_ACTIONS.md`, and `.ai/PROJECT_STATE.md` when state changes.
- Update the relevant compact handoff.
- Run `node scripts/ai-index.js --quiet`.

---

_Last updated: 2026-09-10_
