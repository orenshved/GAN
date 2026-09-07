# Game Agent Network contributor instructions

- Phase 3 is complete and explicitly authorized after Phase 2 verification. Stop before Phase 4.
- Read the PRD, `docs/GREENLIGHT_HARVEST.md`, architecture and decision records.
- Do not edit the PRD without an explicit documented change request.
- Pydantic models own contracts. Run `pnpm protocol:generate` after changes;
  never hand-edit generated JSON Schema or TypeScript.
- Run `pnpm check`. Keep shared fixtures and invariant coverage current.
- Core must not import adapters, UI, engine SDKs or provider SDKs.
- Global definitions contain no project identity or conversation history.
- Node.js local tooling; use dotenv for configuration. Do not hardcode secrets or ports.
- Error responses use `{ error: "snake_case_label", detail: err.message }`.
- Ask before creating a new file if a relevant file may already exist.
- Never commit unless explicitly asked. If asked, include
  `Co-Authored-By: Codex Sonnet 4.6 <noreply@anthropic.com>`.
- Register meaningful project work before editing with `gameagent task start`;
  otherwise detect and reconcile it with `gameagent reconcile`.
- Every completed phase handoff must include a verified, clickable Chrome preview
  URL and leave the local preview running for the user.
