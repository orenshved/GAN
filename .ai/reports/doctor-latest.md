# Context Plan

<!-- generated 2026-09-10 for task: "Stabilize, verify, commit, and push the current Knowledge Fabric checkpoint without starting new scope" -->

## Task

> Stabilize, verify, commit, and push the current Knowledge Fabric checkpoint without starting new scope

**Type:** general
**Domains:** general
**Branch:** main

## Known Related Issues

> Check these before you start. They may save you from repeating a failed approach.

- Include: what the bug is, what was tried, what didn't work, what the current theory is. -->
- Read the "Current theory" to pick up where the last agent left off.
- **Current theory:** The session cookie is being set before the `returnTo` param is saved.
- <!-- List areas that are known to be brittle, even if not currently broken. -->

## Recently Changed Files

- `.env.example`
- `.gameagent/events/events-0001.jsonl`
- `.github/workflows/ci.yml`
- `README.md`
- `agents/builtin/roster.json`
- `apps/studio/app/api/daemon/[...path]/route.ts`
- `apps/studio/app/network.tsx`
- `apps/studio/app/studio.css`
- `apps/studio/app/studio.tsx`
- `docs/architecture/INVARIANTS.md`

## Recommended Starting Files

> Read these first. Ranked by relevance to the task.

| File                                                           | Tokens | Relevance |
| -------------------------------------------------------------- | ------ | --------- |
| `docs/decisions/0012-canonical-knowledge-fabric-storage.md`    | ~1.7k  | high      |
| `GAN_PRD_ADDENDUM_KNOWLEDGE_FABRIC_SPECIALIST_INTELLIGENCE.md` | ~14.9k | high      |
| `docs/decisions/0009-recruiter-trust-before-qa-fabric.md`      | ~552   | medium    |
| `services/daemon/gameagent/knowledge.py`                       | ~13.3k | medium    |
| `adapters/engines/godot/README.md`                             | ~136   | low       |
| `adapters/generation/comfyui/README.md`                        | ~42    | low       |
| `adapters/inference/ollama/README.md`                          | ~79    | low       |
| `adapters/source-control/git/README.md`                        | ~42    | low       |

## Recommended Tools

- **.ai/ files** — Pre-summarized project state — read before anything else

## Do NOT Read

- `Logo.psd` — 1.1M tokens — too large
- `packages/protocol/schema/protocol.schema.json` — 83.2k tokens — too large
- `apps/studio/tsconfig.tsbuildinfo` — 44.7k tokens — too large
- `apps/studio/app/studio.tsx` — 42.9k tokens — too large
- `services/daemon/gameagent/projects.py` — 34.7k tokens — too large
- `packages/protocol/src/generated.ts` — 34.6k tokens — too large
- `pnpm-lock.yaml` — generated
- `apps/studio/next-env.d.ts` — generated

## Token Budget

| Approach                | Est. Tokens   |
| ----------------------- | ------------- |
| Naive (read all source) | ~459.5k       |
| Recommended path        | ~31.6k        |
| Savings                 | ~427.9k (93%) |

## Recommended Workflow

1. Read `.ai/PROJECT_STATE.md` — understand current state
2. Read `.ai/KNOWN_ISSUES.md` — check for related prior failures
3. Use codebase-memory-mcp to trace module dependencies
4. Use Serena to find exact symbol references
5. Read only the recommended files above
6. After task: update `.ai/WORKING_HISTORY.md` and `.ai/KNOWN_ISSUES.md`

---

_Regenerate: `node scripts/ai-doctor.js --task "Stabilize, verify, commit, and push the current Knowledge Fabric checkpoint without starting new scope"`_
