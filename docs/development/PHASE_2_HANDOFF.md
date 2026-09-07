# Phase 2 handoff

## Delivered

| Area           | Result                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | The daemon detects the existing Codex account, accepts only `chatgpt`, exposes browser login, and clears model API-key variables in the worker process.             |
| Threads        | Studio starts a persistent Codex thread per worker and resumes the same thread only for its original project, task and resolved working directory.                  |
| Isolation      | Phase 2 workers run in `read-only` sandbox mode with approvals denied. The task remains `PROPOSED`; analysis cannot claim production completion.                    |
| Results        | Codex output is constrained by the `WorkerResult` Pydantic schema. Ready, running, completed, failed and interrupted records are canonical `worker.updated` events. |
| Recovery       | A daemon restart converts an orphaned running record to interrupted. The operator can explicitly resume its persistent thread from Studio.                          |
| Studio         | Workers shows account readiness, task controls, current state, thread identity, structured findings and next steps.                                                 |

## Live acceptance

Verified on Windows on 2026-09-07 against `C:\AI local projects\Test game`:

| Check                | Evidence                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ChatGPT auth         | `/worker-account` returned `ready` with account type `chatgpt`.                                                                                     |
| No API key           | The bridge launches Codex with `OPENAI_API_KEY` and `CODEX_API_KEY` cleared and rejects API-key account sessions.                                   |
| Persistent resume    | Worker `worker-5975ba37-f764-40f9-b048-cb038f0de30d` retained thread `01a07a04-81db-7c83-bc01-da4cf7ef00ec` across daemon restarts and later turns. |
| Structured ingestion | The final result contains validated `summary`, `findings` and `next_steps`; the project event cursor advanced to 9.                                 |
| Phase boundary       | The linked task remained `PROPOSED`. The test directory still contained no entries outside `.gameagent`.                                            |
| Browser              | Workers rendered the completed result with no framework overlay or browser console errors.                                                          |

The first live attempt exposed an SDK-bundled Codex runtime that was older than
the account's selected model. The adapter now prefers the installed Codex binary
and retains the pinned SDK runtime as a fallback.

## Verification

- 109 Python tests pass.
- 43 Node protocol tests pass.
- Ruff, ESLint, mypy, TypeScript, generated-schema drift and builds pass.
- Worker tests cover structured completion, resume, restart recovery, interrupt,
  immutable project/task/thread binding and ChatGPT-only admission.

Run `pnpm check` from the repository root. For manual review, run `pnpm dev`, open
the printed Studio URL and select **Workers**.

## Phase boundary

Phase 3 has not started. There is no filesystem watcher, change registration,
reconciliation inbox or write-capable worker task. Phase 2 only performs and
records read-only analysis.
