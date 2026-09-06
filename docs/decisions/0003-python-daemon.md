# ADR 0003: Python daemon with generated cross-language contracts

Status: accepted for foundation.

## Context

The daemon coordinates Codex and local AI/media tooling while Studio uses React.
Separate handwritten Python and TypeScript domain schemas would drift.

## Decision

Target Python 3.12+, Pydantic and asyncio. Phase 1 introduces FastAPI REST and
WebSocket boundaries; background work must not block request handling. Keep
domain models and pure admission functions independent of API/ORM/SDK imports.

Pydantic owns version-one wire shape. Deterministically export JSON Schema 2020-12
and generate TypeScript declarations into `@gameagent/protocol`. AJV validates
incoming wire shape in JavaScript. State-dependent authorization remains Python
owned and cannot be inferred from successful AJV validation. Both runtimes consume
the same acceptance/rejection fixtures; CI detects generated artifact drift.

## Alternatives and consequences

A Node-only service would avoid a language boundary but conflicts with the chosen
daemon ecosystem. Independent Zod/Pydantic schemas create two authorities.
Generation adds a build step, but all JS consumers can use committed artifacts
without Python at runtime. Node/dotenv remains the cross-platform tooling layer.
Locked uv dependencies and package build checks are part of the monorepo.

## Validation

Python lint/type/unit checks, shared contract fixtures, TypeScript typechecks,
schema drift check and Python wheel/sdist builds. Network lifecycle and database
integration tests begin when Phase 1 introduces those capabilities.
