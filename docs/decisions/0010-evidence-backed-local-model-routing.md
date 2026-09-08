# ADR 0010: Evidence-backed local model routing

Status: accepted and implemented in Phase 8.

## Context

GAN must choose an execution path without equating an agent capability with one
model, blindly preferring local inference, or silently reaching a paid provider.
Machine capacity and installed models change independently of project history,
while task-specific benchmark and routing decisions must remain attributable.

## Decision

The Local Model Expert reads live workstation hardware and a configured loopback
Ollama endpoint. Inventory records CPU, RAM, graphics memory, installed model
digest, stored size, parameter and quantization labels, context limit, modalities,
tool support and memory fit. Live inventory is machine state, not project truth.

Representative benchmark results are project/task-scoped canonical events. Each
benchmark pins model digest, task capability contract, prompt digest, token counts,
latency, structured-output score and a content-addressed response artifact. The
Ollama adapter records whether structured output arrived through the response or
thinking channel. Failed attempts remain history and cannot qualify a model.

The router compares deterministic tools, locally benchmarked Ollama models,
authenticated Codex, paid providers and waiting for Codex. A local model is viable
only when its current digest fits available memory and has a passing benchmark for
the task. Each candidate records expected quality, confidence, runtime, external
cost, cost avoided and rationale. The selected candidate must be marked viable.

Paid-provider execution is not implemented in Phase 8. The paid candidate is
explicitly unavailable until Phase 9 provides verified provider-side cap admission
and an upper-bound cost. The router cannot bypass the existing hard-cap invariant.

## Consequences

Studio can explain why GAN selected local Ollama or authenticated Codex using real
machine and task evidence. Model updates invalidate prior local qualification by
digest mismatch. Offline or unconfigured Ollama state fails closed without
blocking Codex. Machine inventory stays reusable without copying project identity
or creative context into global definitions.

## Validation

Tests cover model capability inventory, memory fit, content-addressed benchmark
artifacts, canonical replay, local preference after a passing task benchmark,
Codex fallback without local evidence, and refusal to select a non-viable route.
The browser smoke covers the unavailable-local fallback without requiring Ollama.
A live Windows acceptance run records both failed and passing `qwen3-vl:8b`
benchmarks and an explainable local routing decision.
