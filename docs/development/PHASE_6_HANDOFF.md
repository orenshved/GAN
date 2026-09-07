# Phase 6 handoff

Phase 6 completes the first Cosmic Meltdown UI vertical slice without beginning
the generalized QA fabric owned by Phase 7.

## Delivered

| Stage        | Operating result                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspect      | The Godot adapter finds a nested `project.godot`, reads version/main scene, inventories four real `OptionButton` nodes, and returns imported UI references with hashes.                                    |
| Understand   | The registered Cosmic Meltdown task and Project Intelligence remain project-scoped; the selected node path is explicit in the run record.                                                                  |
| Design/reuse | The game reuses its existing quick-match frame palette and pixel-art constraints; no unrelated asset was generated.                                                                                        |
| Implement    | `UiAtlas` applies one centralized popup panel, hover, type, spacing, outline and radio-icon treatment to every styled `OptionButton`.                                                                      |
| Run/capture  | The adapter builds the C# project, launches Godot 4.7 through its real main scene, advances mapped `ui_accept` until the selected control is visible, opens the popup, and captures the viewport.          |
| Evaluate     | Tool-produced measured runtime evidence and a visual `runtime_ui_capture` evaluation are appended to canonical project history. The evaluator explicitly leaves subjective style approval to the Director. |
| Present      | Studio Production shows adapter/version/node/reference counts, the captured image, dimensions, provenance, rationale and raw evidence record.                                                              |

## Verified result

- Cosmic Meltdown `scripts/verify.ps1`: all content, tool, solution, simulation,
  game-profile, runner, Godot boot, Windows export and exported-game boot checks passed.
- Runtime screenshot: 3840×2160 PNG with the selected Quick Match players popup open.
- GAN daemon: strict typing and 133 tests pass.
- Studio: Next 16 typecheck/build pass; Chrome exercised the runtime-capture button
  and rendered the new evidence after the event cursor advanced.
- Full repository gate: `pnpm check` passes.

## Boundaries retained

- Core contracts and replay do not import Godot or its SDK.
- Large runtime artifacts remain project-local; history stores immutable locators,
  digests, dimensions, producer, origin, task and project scope.
- Evidence serving is confined to `.gameagent/evidence` and rejects digest drift.
- A deterministic runtime capture pass is not a subjective visual approval.
- Phase 7 has not started; multi-class QA orchestration, comparative baselines,
  human-review commands and reusable gate policies remain future work.

## Preview

`http://127.0.0.1:4242/` — select **Cosmic Meltdown → Production**.
