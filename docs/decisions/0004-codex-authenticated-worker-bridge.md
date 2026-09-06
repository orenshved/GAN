# ADR 0004: Authenticated Codex Python worker bridge

Status: accepted architecture; live integration and dependency installation deferred to Phase 2.

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

Phase 2 verifies account state, browser/device login, existing-session reuse,
thread start/resume, structured output and supported interrupt/steer operations
against the pinned SDK release. No credential scraping or home-directory token
copying. Store thread identifiers and assignment metadata in canonical project
history. A thread is bound to one project; global agents never hold its memory.

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
Phase 2 must run an actual task in a test repository without an API key, resume
it after restart and test cancellation and cross-project refusal. No real Codex
task or login was performed during this foundation build.
