# ADR 0004: Authenticated Codex Python worker bridge

Status: accepted and implemented in Phase 2.

## Context

The primary worker path must use the user's ChatGPT/Codex session, without
requiring an OpenAI API key or substituting metered API billing.

## Decision

Use the official `openai-codex` Python SDK behind a daemon-owned adapter. Official
documentation inspected on 2026-09-06 describes a stable Python SDK controlling
the local app-server over JSON-RPC, including an async client and pinned CLI runtime:
https://developers.openai.com/codex/sdk . The app-server integration surface covers
account/login, thread lifecycle, approvals and streamed events:
https://developers.openai.com/codex/app-server .

The Phase 2 adapter verifies account state, browser login, existing-session reuse,
thread start/resume, structured output and supported interrupt/steer operations
against `openai-codex` 0.147.0. It uses the current Codex executable when available
because its model compatibility can advance ahead of the SDK-bundled runtime.
No credential scraping or home-directory token copying. Thread identifiers and
assignment metadata live in canonical project history. A thread is bound to one
project; global agents never hold its memory.

Worker access starts read-only and may receive task-workspace access according
to contract permissions. Resolve/contain paths against the selected project/task
workspace before invoking the SDK. Unsupported operations surface an explicit
capability error, never a false success or silent API-provider fallback.

## Alternatives and consequences

Raw CLI parsing and a custom JSON-RPC client add maintenance burden. TypeScript
SDK is an alternative only if a documented Python limitation requires an ADR
change; no reason to introduce a second process bridge now. Session quotas and
account availability are first-class worker states, not paid fallback triggers.

## Validation

Phase 0 tests assignment project/version/capability/permission/thread isolation.
Phase 2 ran an actual structured task in `C:\AI local projects\Test game` with a
ChatGPT account and API-key variables cleared, then resumed its stable thread after
daemon restarts. Tests cover restart recovery, cancellation, immutable bindings,
cross-worker refusal and API-key-account rejection.
