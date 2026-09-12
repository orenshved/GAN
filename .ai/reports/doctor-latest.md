# Context Plan

<!-- generated 2026-09-10 for task: "Implement Phase 12 desktop packaging while preserving daemon authority and headless operation" -->

## Task

> Implement Phase 12 desktop packaging while preserving daemon authority and headless operation

**Type:** feature
**Domains:** auth
**Branch:** codex/platform-runtime

## Known Related Issues

> Check these before you start. They may save you from repeating a failed approach.

- **Affected paths:** `services/daemon/gameagent/`, `apps/studio/`, acceptance tests
- **Next:** Codex implements these as separate verified slices.
- **Symptoms:** The passing daemon suite emits two upstream deprecation warnings involving Starlette/httpx compatibility aliases.
- **Fix:** Derive all/available network and registry counts from daemon responses.
- **Root cause:** Vendored RepoDoctor utilities use CommonJS while project ESLint treats JavaScript as ESM/TypeScript.

## Recently Changed Files

- `.ai/reports/token-audit-latest.md`

## Recommended Starting Files

> Read these first. Ranked by relevance to the task.

| File                                            | Tokens | Relevance |
| ----------------------------------------------- | ------ | --------- |
| `apps/studio/app/api/daemon/[...path]/route.ts` | ~871   | medium    |
| `docs/decisions/0003-python-daemon.md`          | ~397   | medium    |
| `docs/development/PHASE_0_HANDOFF.md`           | ~835   | medium    |
| `docs/development/PHASE_10_HANDOFF.md`          | ~651   | medium    |
| `docs/development/PHASE_11_HANDOFF.md`          | ~557   | medium    |
| `docs/development/PHASE_1_HANDOFF.md`           | ~976   | medium    |
| `docs/development/PHASE_2_HANDOFF.md`           | ~1.1k  | medium    |
| `docs/development/PHASE_3_HANDOFF.md`           | ~633   | medium    |

## Recommended Tools

- **codebase-memory-mcp** — Trace dependencies and module relationships without reading full files
- **Serena** — Find symbol references, rename safely, edit only affected code
- **Serena** — Find all auth-related symbol references before making security changes
- **.ai/ files** — Pre-summarized project state — read before anything else

## Do NOT Read

- `Logo.psd` — 1.1M tokens — too large
- `packages/protocol/schema/protocol.schema.json` — 83.2k tokens — too large
- `apps/studio/app/studio.tsx` — 42.9k tokens — too large
- `services/daemon/gameagent/projects.py` — 34.7k tokens — too large
- `packages/protocol/src/generated.ts` — 34.6k tokens — too large
- `pnpm-lock.yaml` — generated

## Token Budget

| Approach                | Est. Tokens   |
| ----------------------- | ------------- |
| Naive (read all source) | ~462.1k       |
| Recommended path        | ~7.6k         |
| Savings                 | ~454.5k (98%) |

## Recommended Workflow

1. Read `.ai/PROJECT_STATE.md` — understand current state
2. Read `.ai/KNOWN_ISSUES.md` — check for related prior failures
3. Read `.ai/DECISIONS.md` — auth/security decisions matter here
4. Use codebase-memory-mcp to trace module dependencies
5. Use Serena to find exact symbol references
6. Read only the recommended files above
7. After task: update `.ai/WORKING_HISTORY.md` and `.ai/KNOWN_ISSUES.md`

---

_Regenerate: `node scripts/ai-doctor.js --task "Implement Phase 12 desktop packaging while preserving daemon authority and headless operation"`_
