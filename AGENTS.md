# Game Agent Network contributor instructions

- Phase 6 is explicitly authorized by the Director on 2026-09-07 after accepting Phase 5. Stop before Phase 7.
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

<!-- BEGIN GAME AGENT NETWORK -->

## Game Agent Network registration

When this repository is managed by GAN, register meaningful project work before editing:

```text
gameagent task start . --title "Short task title" --objective "Desired outcome"
gameagent task status .
gameagent task block . --task-id TASK_ID --detail "What is blocking progress"
gameagent task complete . --task-id TASK_ID --detail "What changed and why"
```

If meaningful work was performed without registration, run `gameagent reconcile .` and
provide an explanation. Never hide, delete, or silently rewrite GAN project history.
<!-- END GAME AGENT NETWORK -->
