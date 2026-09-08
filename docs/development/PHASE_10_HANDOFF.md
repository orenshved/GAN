# Phase 10 handoff

Phase 10 was intentionally implemented before Phase 7 so the QA fabric can rely
on an explicit evaluator trust lifecycle.

## Delivered

| Capability            | Operating result                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gap detection         | A plan assignment with no complete roster match becomes a typed, project-scoped capability gap; unknown ontology IDs fail closed.                           |
| Roster search         | The recruiter searches built-in and globally recruited definitions, then records adjacent same-family agents.                                               |
| Candidate composition | A minimum capability package is composed without project memory, creative identity, or production authority.                                                |
| Tool discovery        | Installed tools are filtered against capability relevance and task permission limits; unavailable, approval-required, and forbidden states remain explicit. |
| Sandbox audition      | Separate authenticated Codex candidate and reviewer turns run read-only with network, installation, and project mutation denied.                            |
| Probation             | Passing all seven rubric dimensions admits the candidate as probationary with advisory QA authority; failed auditions stay rejected.                        |
| Global registry       | Recruited definitions persist outside project history and become available to future projects. Project recruitment transitions remain canonical events.     |
| Studio                | The Agents screen shows gaps, recruitment history, tool admission, audition scorecards, lifecycle, QA role, and the global roster.                          |

## QA boundary

Recruitment changes who can advise on QA, not what constitutes proof. A
probationary evaluator cannot independently establish a project gate pass.
Evidence classes, gate requirements, human waivers, and Director rejection remain
authoritative. Phase 7 has not started.

## Verification

- `pnpm check`
- Automatic-GM acceptance: unavailable `compatibility_testing` produces an
  auditioned probationary specialist and the replayed task becomes ready.
- Studio ↔ daemon smoke covers the Agents screen and global roster.

## Preview

`http://127.0.0.1:4242/` — select **GAN → Agents**.
