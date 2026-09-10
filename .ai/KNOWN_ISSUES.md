# Known Issues

## Open Issues

### Knowledge Fabric: initial professional baseline is incomplete

**Status:** open  
**Severity:** high  
**Affected paths:** `expertise/builtin/`, `agents/builtin/roster.json`, Knowledge catalog UI  
**Symptoms:** Four of fourteen initial packs exist. Ten remain missing, and the existing seeds lack a completed professional benchmark/portfolio qualification program.  
**Current approach:** Claude owns source-backed content and benchmarks; Codex owns schema, loaders, governance, and integration.  
**Next:** Execute the narrow Claude pack workstream after the workload split is reviewed.

### Knowledge Fabric: remaining runtime acceptance gaps

**Status:** open  
**Severity:** medium  
**Affected paths:** `services/daemon/gameagent/`, `apps/studio/`, acceptance tests  
**Symptoms:** Exact worker model/tool/QA composition receipts, evidence-bound failure postmortems, importable pack CLI, richer contradiction/source maintenance, and the complete portfolio acceptance suite remain.  
**Next:** Codex implements these as separate verified slices.

### Dependencies: Starlette test-client deprecations

**Status:** open  
**Severity:** low  
**Symptoms:** The passing daemon suite emits two upstream deprecation warnings involving Starlette/httpx compatibility aliases.  
**Next:** Address during dependency maintenance; no current behavior failure.

## Resolved Issues

### 2026-09-10 — Smoke tests hard-coded the old roster size

**Root cause:** Browser assertions expected six agents after onboarding added five Leads.  
**Fix:** Derive all/available network and registry counts from daemon responses.

### 2026-09-10 — RepoDoctor CommonJS scripts failed repository ESLint

**Root cause:** Vendored RepoDoctor utilities use CommonJS while project ESLint treats JavaScript as ESM/TypeScript.  
**Fix:** Exclude only `scripts/ai-*.js` and `scripts/lib/*.js`; RepoDoctor remains independently executable.

## Fragile Areas

- Generated protocol output is large and must only change through Pydantic generation.
- Built-in pack versions are immutable after installation; update sources through a new reviewed version.
- Recruitment replay pins expertise once auditioning begins.
- Worker resume must preserve the original specialist, packet, and project context.

---

_Last updated: 2026-09-10_
