# Phase -1 / Phase 0 handoff

## Delivered

- Inspected the original PRD and otherwise empty workspace; preserved the PRD.
- Inspected Greenlight at the pinned revision in the harvest, before scaffolding.
- Documented final package ownership, domain vocabulary and all 15 invariants.
- Added the eight requested ADRs with decisions, alternatives, consequences and tests.
- Created pnpm/Turborepo workspaces, strict TypeScript, Next 16/React 19 UI
  foundation, and an installable Python 3.12+ package with uv lockfile.
- Added canonical capability, agent, assignment, tool, engine-adapter, project,
  task, policy, event, knowledge, decision, provider, evidence and evaluation contracts.
- Generated JSON Schema and TypeScript with drift detection and shared fixtures.
- Included the complete section 15 capability ontology; no executable specialist roster.
- Added pure authority, isolation, permissions, QA, budget and recovery guards.
- Added Windows/Linux GitHub Actions and local format/lint/type/test/build/smoke commands.
- Initialized local Git on `main`; foundation publication targets
  https://github.com/orenshved/GAN .

## Scope boundary

Phase 1 has not started. No daemon API, SQLite persistence, event writer, CLI init,
watcher, worker authentication, orchestration, provider calls, engine execution,
production screens, or fabricated project state. The Studio page only validates
the shared UI package and evidence vocabulary.

Schema validation does not verify file existence, actor identity, model competence
or provider-side settings. Pure guards specify future command admission; their
runtime integration is mapped explicitly in `docs/architecture/INVARIANTS.md`.

## Verification

Local result on 2026-09-06: `pnpm check` passed on Windows with Node 24.14.0,
pnpm 11.20.0 and Python 3.14.3. **132 tests passed: 89 Python and 43 Node.**
Formatting, ESLint/Ruff, mypy, TypeScript, generated-schema drift checks,
all 10 workspace builds, Python wheel/sdist and production HTTP smoke passed.

Run `pnpm check` from the repository root. It checks formatting, JS/Python lint,
generated contract drift, TS/Python types, shared schema fixtures, semantic
invariants, boundary tests, all workspace builds, and the production HTTP smoke.
The original PRD is excluded from formatting. The smoke starts a local production
server on an OS-selected port and stops it afterward.

The Python 3.12 baseline is also exercised by the CI matrix. The initial machine
has Python 3.14, so local version results should be distinguished from CI results.
Browser interaction/E2E tests start with the real Studio shell in Phase 1; current
smoke validates HTTP-rendered foundation content only.

## Repository hosting follow-up

The foundation remote is https://github.com/orenshved/GAN . Protect `main` with
required `foundation (ubuntu-latest)` and
`foundation (windows-latest)` checks after a remote is connected and CI runs.
Branch protection is not represented as already enabled.

## Next assignment, only when requested

Phase 1: event append/replay semantics, SQLite WAL projections and migrations,
project initialization/loading, FastAPI REST/WebSocket service and Studio shell
using real backend state. Start with restart/replay acceptance tests and wire
the constitution guards into authenticated command boundaries as those arrive.
