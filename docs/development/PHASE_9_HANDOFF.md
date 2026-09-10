# Phase 9 handoff

Phase 9 is complete. Phase 11 has not started.

## Delivered

- Canonical provider registry with active, disabled and disabled-uncapped states.
- Current provider-side cap proof with amount, method, verification time, expiry
  and content digest; application accounting is never accepted as cap proof.
- Windows Credential Manager abstraction with write-only API handling and no secret
  values in contracts, events, logs, responses or SQLite.
- Single paid-provider gateway with adapter-owned upper-bound estimation.
- Atomic aggregate monthly reservations under the project writer lock.
- Automatic admission below 100 cents and exact human approval at 100 cents or more.
- Durable settled, released, in-flight and uncertain reservation states, idempotent
  retries, conservative timeout handling and calendar-month rollover.
- Environment-configurable OpenAI-compatible adapter without environment secrets.
- Studio Providers workspace for cap, credential, adapter, budget, approval and
  reservation visibility.

## Acceptance evidence

`services/daemon/tests/test_providers.py` proves that an uncapped provider cannot
reach its adapter, 99 cents can run automatically, 100 cents requires exact scoped
approval, concurrent callers cannot exceed the $25 aggregate budget, a new month
gets an independent ledger, retries do not duplicate provider calls, ambiguous
outcomes retain their full reservation after restart, and credential text never
appears in project storage or API output.

The full repository acceptance command is `pnpm check`. The verified local Studio
preview is served through the configured dotenv ports and remains running for the
Director handoff.

## Boundary for the next phase

Do not begin Phase 11 without explicit approval. Additional provider adapters must
implement the same estimate-before-reserve interface and may not read credentials
outside the gateway.
