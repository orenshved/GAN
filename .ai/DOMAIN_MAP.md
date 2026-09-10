# Domain Map

## Domains

### Contracts and Protocol

**Purpose:** Cross-language truth and validation.
**Entry points:** `services/daemon/gameagent/models/contracts.py`, `services/daemon/gameagent/models/api.py`
**Generated outputs:** `packages/protocol/schema/protocol.schema.json`, `packages/protocol/src/generated.ts`
**Rule:** Generate with `pnpm protocol:generate`; never edit outputs directly.

### Project State and Orchestration

**Purpose:** Commands, canonical history, replay, GM plans, task state, and reconciliation.
**Entry points:** `services/daemon/gameagent/projects.py`, `services/daemon/gameagent/gm.py`
**Do not confuse with:** Studio queries, which are projections of this state.

### Knowledge Fabric

**Purpose:** Expertise registry, provenance, freshness, search, routing, research, experience, Pack Builder, and governance.
**Entry points:** `services/daemon/gameagent/knowledge.py`, `docs/decisions/0012-canonical-knowledge-fabric-storage.md`
**Content:** `expertise/builtin/`
**Boundary:** Codex owns the machinery; Claude owns professional pack content.

### Agents and Recruitment

**Purpose:** Global agent definitions, capability matching, composition diagnosis, auditions, and probation.
**Entry points:** `agents/builtin/roster.json`, `services/daemon/gameagent/recruiter.py`, `services/daemon/gameagent/codex_bridge.py`

### Project Intelligence and Onboarding

**Purpose:** Repository indexing, bounded context, project fingerprinting, and independent Lead assessments.
**Entry points:** `services/daemon/gameagent/intelligence.py`, `services/daemon/gameagent/intake.py`

### QA and Production Domains

**Purpose:** Evidence classes, gates, reports, waivers, and structural discipline audits.
**Entry points:** `services/daemon/gameagent/qa.py`, `services/daemon/gameagent/production_domains.py`

### Models and Providers

**Purpose:** Local hardware/model inspection, benchmarked routing, provider caps, budgets, and paid execution.
**Entry points:** `services/daemon/gameagent/local_models.py`, `services/daemon/gameagent/providers.py`

### Studio

**Purpose:** Director Desk, production network, Project Intelligence, Knowledge, Learning, QA, models, providers, agents, and disciplines.
**Entry points:** `apps/studio/app/studio.tsx`, `apps/studio/app/network.tsx`, `apps/studio/app/studio.css`

### Verification and Tooling

**Purpose:** Generated contracts, static checks, tests, builds, browser smoke, and focused context.
**Entry points:** `package.json`, `scripts/smoke.mjs`, `scripts/ai-doctor.js`
**Acceptance:** `pnpm check`

---

_Last updated: 2026-09-10_
