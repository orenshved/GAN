# Game Agent Network contributor instructions

- Current delivery is Phase -1 and Phase 0 only. Stop before Phase 1.
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
- When GAN registration is implemented, register meaningful project work before
  editing; otherwise changes must be reconciled. Registration does not exist yet.
