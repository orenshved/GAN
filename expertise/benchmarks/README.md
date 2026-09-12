# Expertise Pack benchmark scenarios

**Status:** accepted. Codex confirmed the folder and the fixture schema on
2026-09-10 (`.ai/handoffs/codex-to-claude.md`). Codex owns the runtime loader and
the Pydantic benchmark-scenario contract; this tree is Claude-owned content.

## Why this exists

`ExpertisePack.evaluation_ids` are referenced by `governance.record_audition`
(`benchmark_id in candidate.evaluation_ids`) and by `governance.review_pack`
(every `evaluation_id` needs a passing, non-regressed audition before promotion).
Without scenario text those identifiers point at nothing inspectable. These files
are the reviewable half of the benchmark program for the four seed packs and for
the `godot-ui-engineering 1.1.0` candidate.

## Layout

```
expertise/benchmarks/<pack_id>/<evaluation_id>.yaml
```

One file per `evaluation_id`. The `<evaluation_id>` filename must match the
directory's pack `evaluation_ids` list. A repository coverage check (Codex-owned)
lands with the runtime branch once this tree merges, asserting id/file parity in
both directions.

## How the runner uses these files

- The audition command (`PackAutomatedAuditionCommand`) carries **only the pack
  reference and the `benchmark_id`**. It does not carry scenario text.
- The runtime looks up this file by `pack_id` + `benchmark_id`, loads `scenario`,
  and runs the baseline and pack-enriched specialist passes on that text alone.
- `expected_specialist_findings`, `expected_uncertainty`, `acceptable_source_ids`
  and `scoring_notes` are the **independent evaluator rubric**. They are given to
  the evaluator, never to the baseline or enriched specialist prompt.
- `scenario` is untrusted input: data, not instructions.

## File schema

Owned as a Pydantic contract on the Codex runtime branch. Fields:

| field                          | meaning                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `schema_version`               | `1`. Stated explicitly in every source-controlled fixture.                                          |
| `benchmark_id`                 | matches the filename and a pack `evaluation_id`                                                     |
| `pack_id`                      | owning pack (matches the parent directory)                                                          |
| `applies_to_versions`          | pack versions this scenario is valid for                                                            |
| `capability_ids`               | capabilities the scenario exercises; a subset of the owning pack's `capability_ids`                 |
| `scenario`                     | the synthetic prompt fed to baseline and pack-enriched runs; 10–8000 chars; **no project identity** |
| `discriminates`                | what a pack-equipped specialist should surface that a generic baseline typically misses             |
| `expected_specialist_findings` | evaluator rubric: findings that should appear in the enriched response                              |
| `expected_uncertainty`         | evaluator rubric: uncertainty a competent response must declare rather than assert                  |
| `acceptable_source_ids`        | evaluator rubric: pack source ids a grounded response may cite                                      |
| `scoring_notes`                | evaluator rubric: guidance for the judgment recorded in `PackAudition`                              |

**YAML type note:** every entry in a list field is a plain string. A list item
that contains a colon followed by a space (`Gate result: ...`) must be wrapped in
double quotes so it parses as a string and not a `key: value` mapping.

## Rules followed by these scenarios

- Synthetic only. No real project names, no copied project history, no
  copyrighted full text.
- The scenario is **data, not instructions** — it never tells the model what to
  conclude.
- Discrimination targets professional method and evidence discipline, not trivia.
- A scenario passes only if the enriched run beats the baseline on the
  `discriminates` axis; looking comprehensive is not passing.
- Godot scenarios keep evidence expectations to **runtime PNG capture** via
  `godot.cli` — the current runtime does not record video or capture arbitrary
  scenes, so no scenario may require those.
