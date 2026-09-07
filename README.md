# Game Agent Network

A local-first production orchestration foundation for turning human game direction
into accountable tasks, specialist work and inspectable evidence.

**Status: Phase 2 complete.** The local Studio now detects the signed-in ChatGPT
account, starts and resumes persistent read-only Codex threads, records structured
worker results in project history and shows worker state. Production orchestration
and engine changes begin in later phases.

## Architecture

```mermaid
flowchart TD
  Human[Director: intent and judgment] --> Studio[Studio: Next.js / React]
  Studio -->|Server-side bearer bridge| Daemon[Python daemon]
  Daemon --> GM[GM production authority: contracts only]
  GM --> Tasks[Capability-based task proposals]
  Tasks --> Workers[Authenticated Codex read-only analysis]
  Workers --> Evidence[Artifacts and QA evidence]
  Evidence --> GM
  Daemon --> History[Canonical project files and JSONL events]
  History --> SQLite[Rebuildable SQLite projections]
  SQLite --> Studio
```

Pydantic owns the contracts and generates JSON Schema and TypeScript. Project
events are canonical; SQLite and Studio state are rebuildable views.

| Principle                              | Foundation implementation                                        |
| -------------------------------------- | ---------------------------------------------------------------- |
| GM owns production authority           | Pure command/event admission and state-machine checks            |
| Agents are capability packages         | Versioned schemas, separate tools and project assignments        |
| Human judgment overrides scores        | Completion rejects human-rejected work                           |
| QA needs evidence                      | Scoped provenance, independent capture and human-evidence checks |
| No uncapped paid providers             | Fail-closed cap/budget admission rules                           |
| Project identity stays isolated        | Global definitions exclude context; thread scope validation      |
| Local project history remains portable | Durable rotated JSONL, replay and rebuildable SQLite             |

## Local setup (PowerShell)

Requires Node 24, pnpm 11.20.0 and Python 3.12+.

```powershell
python -m pip install uv==0.8.13
python -m uv sync --frozen --project services/daemon
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
Copy-Item .env.example .env
python -m uv run --project services/daemon gameagent init C:/path/to/your/game
pnpm check
pnpm dev
```

Set `GAMEAGENT_PROJECT_PATH` to that game repository and replace the token value
in `.env` with a random string of at least 32 characters. The URLs and ports also
come from `.env`. Open the localhost address printed by Studio. The worker bridge
reuses the Codex ChatGPT login and clears API-key environment variables. Set
`GAMEAGENT_CODEX_BIN` only when the current Codex executable is not on `PATH`.

`gameagent init` detects the repository and likely engine/rendering mode, records
documents, assets and Git HEAD, and lists important unknowns without an intake
questionnaire. Use `--profile path/to/project.yaml` only when an explicit Project
contract should replace the detected baseline.

## Development

| Command                  | Purpose                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `pnpm check`             | Format/lint/schema drift/types/tests/build plus Studio↔daemon Playwright smoke |
| `pnpm test`              | Cross-language contracts and Python constitution/boundary tests                |
| `pnpm protocol:generate` | Regenerate JSON Schema and TypeScript after model changes                      |
| `pnpm format`            | Format owned files; preserves the original PRD                                 |
| `pnpm build`             | Build all TS packages, Studio, Python wheel and source distribution            |
| `pnpm dev`               | Run the configured daemon and Studio together                                  |
| `gameagent status PATH`  | Replay canonical history and print the current project snapshot                |
| `gameagent rebuild PATH` | Recreate the SQLite projection from canonical events                           |

## Design records

- [Greenlight harvest](docs/GREENLIGHT_HARVEST.md)
- [Monorepo structure](docs/architecture/MONOREPO.md)
- [Domain vocabulary](docs/architecture/VOCABULARY.md)
- [Invariant coverage and runtime limits](docs/architecture/INVARIANTS.md)
- [Architectural decisions](docs/decisions/)
- [Phase 0 handoff](docs/development/PHASE_0_HANDOFF.md)
- [Phase 1 handoff](docs/development/PHASE_1_HANDOFF.md)
- [Phase 2 handoff](docs/development/PHASE_2_HANDOFF.md)

## Roadmap

| Phase  | Scope                                                            |
| ------ | ---------------------------------------------------------------- |
| -1 / 0 | Harvest, contracts, constitution, monorepo and CI                |
| 1      | Complete: project protocol, persistence, daemon and Studio shell |
| 2      | Complete: authenticated Codex worker bridge                      |
| 3–5    | Reconciliation, GM matching and project intelligence             |
| 6–7    | Cosmic Meltdown UI workflow and evidence-backed QA               |
| 8–10   | Local model routing, real budget gateway, specialist recruitment |
| 11–12  | Additional disciplines and desktop packaging                     |

The eventual public portfolio can host the Studio presentation layer separately.
The local daemon owns filesystem access and durable project state, so it is not a
Vercel Function. A hosted read-only demo transport can be added when it can show
clearly identified evidence without fabricating production state.
