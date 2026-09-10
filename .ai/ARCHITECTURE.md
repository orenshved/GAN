# Architecture

## Stack

- pnpm/Turborepo TypeScript monorepo.
- Next.js 16/React Studio.
- Python/FastAPI daemon with Pydantic contracts.
- Canonical rotated JSONL project events and immutable global YAML/JSON knowledge records.
- Rebuildable SQLite project projections and FTS5 expertise index.
- Playwright end-to-end smoke; pytest and Node contract tests.

## Entry Points

- `apps/studio/app/page.tsx` — Studio entry.
- `apps/studio/app/studio.tsx` — primary Studio surface and API queries.
- `services/daemon/gameagent/api.py` — authenticated loopback API.
- `services/daemon/gameagent/cli.py` — `gameagent` CLI.
- `services/daemon/gameagent/projects.py` — canonical commands and replay.

## Module Map

```text
apps/studio/                       Director-facing UI and loopback proxy
packages/protocol/                 Generated cross-language contracts
services/daemon/gameagent/
  api.py                           API composition and background maintenance
  projects.py                      Project commands, events, replay, projections
  codex_bridge.py                  Authenticated GM/worker/audition turns
  knowledge.py                     Global packs, routing, research, governance
  intake.py                        Import reconnaissance and Lead onboarding
  recruiter.py                     Capability/composition diagnosis and auditions
  qa.py                            Evidence gates and reports
  local_models.py                  Hardware/model inventory and recommendations
  providers.py                     Paid-provider admission and execution
  production_domains.py            Read-only discipline inspection slices
agents/builtin/                    Global agent definitions
expertise/builtin/                 Compact global Expertise Pack manifests
```

## Data Flow

```text
Director → Studio → authenticated loopback API → command admission
→ canonical project event / immutable global record → replay/projection
→ Studio

Task + agent + Project Intelligence + Expertise + Research + Experience
→ Knowledge Router → bounded, pinned Knowledge Packet → worker → evidence → QA
```

## External Dependencies

| Service                     | Purpose                                       | Auth method                                      |
| --------------------------- | --------------------------------------------- | ------------------------------------------------ |
| ChatGPT/Codex               | GM, worker, pack-builder, and audition turns  | Existing Codex ChatGPT login                     |
| Ollama                      | Optional local model inventory and benchmarks | Loopback; no secret                              |
| Configured providers        | Optional paid generation                      | OS credential store plus verified provider cap   |
| Authoritative HTTPS sources | Explicit task-scoped research                 | Exact hostname allowlist; no ambient credentials |

## Known Constraints

- The daemon and Studio are local-first; the daemon API is loopback-only with a bearer token.
- Pydantic is the only contract authority.
- Global agent/knowledge stores must not receive project identity or history.
- Phase 12 packaging is paused.
- Professional expertise quality is a curated program, not inferred from passing code tests.

---

_Last updated: 2026-09-10_
