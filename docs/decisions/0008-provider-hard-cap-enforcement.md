# ADR 0008: Provider-side hard caps plus application budget

Status: accepted for foundation. Real provider execution: Phase 9.

## Context

Application accounting alone cannot prevent unbounded upstream bills. GAN must
never invoke a paid provider without a verified provider-side hard cap/bounded wallet.

## Decision

Represent provider billing mode independently of models/agents. Paid admission
requires ACTIVE state, verified provider-side bound, proof locator/digest, method,
amount and a valid verification interval. Missing/expired proof fails closed;
future activation derives DISABLED_UNCAPPED when verification is absent.
Manual provider-console verification is permitted, but an application-only budget
is not an eligible verification method. Providers with no bounded option stay disabled.

Default aggregate external budget is USD 2,500 cents/month. Reserve upper-bound
cost before invocation; include outstanding reservations. Automatic actions must
cost less than 100 cents. At 100 cents and above, obtain scoped human approval.
Approval cannot bypass provider caps or the configured monthly budget. Unknown,
negative or fractional-cent estimates are refused. Local and authenticated Codex
subscription paths must have zero external transaction cost.

Phase 9 requires one unavoidable execution gateway: validate current proof,
atomically reserve against the aggregate ledger, invoke, reconcile actual spend,
record events, and release/retain reservations conservatively on timeout. Restart
must preserve reservations; retries use idempotency keys. Month rollover and
concurrent calls require integration tests. OS credential storage resolves secrets;
credentials never belong in protocol records, events, logs or SQLite.

## Alternatives and consequences

Soft application limits cannot constrain provider-side billing and are rejected.
Blind user approval is insufficient. Verification expiry may temporarily reduce
availability; reverify rather than silently weakening the rule. Exact provider
proof expiry policy is adapter-specific and must be documented when implemented.

## Validation

Pure tests cover uncapped/disabled/expired/future verification, invalid costs,
99/100-cent boundary, exhausted aggregate budget, outstanding reservations and
approval non-bypass. There is no paid invocation path or atomic ledger in Phase 0.
