# Phase 8 handoff — Local Model Expert and Model Router

Phase 8 is complete. Phase 9 has not started.

## Delivered

- Live cross-platform hardware inventory with Windows CPU/RAM/GPU enrichment and
  NVIDIA memory measurement.
- Configured loopback Ollama adapter with health, version, installed-model metadata,
  structured generation and separate discovery/benchmark timeouts.
- Model inventory covering digest/version identity, stored size, parameter size,
  quantization, context, modalities, tool support and available-memory fit.
- Project/task-scoped canonical benchmark events with content-addressed response
  artifacts, contract score, latency, token counts and response-channel provenance.
- Explainable routing records comparing deterministic, local Ollama, authenticated
  Codex, paid-provider and wait paths.
- Local qualification requires a passing benchmark for the exact task and current
  model digest. Missing evidence selects Codex or waiting instead.
- Paid-provider routing remains unavailable until Phase 9 hard-cap admission exists.
- Studio Models workspace for inventory, benchmark history, candidate comparison,
  selected-route rationale and external-cost visibility.

## Live acceptance

On the configured workstation GAN observed 31.0 GB usable RAM, an NVIDIA GeForce
RTX 4070 SUPER with 12.0 GB VRAM, and four installed Ollama models. For Cosmic
Meltdown's dropdown task, `qwen3-vl:8b` produced two preserved failed attempts and
then passed the representative structured-output contract at 100% in 29.5 seconds.
The router selected local Ollama and recorded why, while also showing authenticated
Codex as viable and paid execution as unavailable.

## Verification

- Python lint and strict mypy: passed.
- Daemon tests: 155 passed.
- Cross-language protocol tests: 58 passed.
- Next.js typecheck and production build: passed.
- Playwright Studio↔daemon smoke includes model routing with Ollama unavailable.
- Full `pnpm check`: passed.

## Boundary

Phase 8 records recommendations and local execution benchmarks only. It does not
store provider secrets, reserve money, invoke paid providers, or weaken the verified
hard-cap requirement. Those execution controls belong to Phase 9.
