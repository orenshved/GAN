# Game Agent Network — Claude Research & Sourcing Strategy

## Purpose

This document defines the preferred research and source-acquisition strategy for Claude when building or extending GAN Expertise Packs, especially in craft-heavy domains where the best professional knowledge is not concentrated in formal documentation.

This strategy is intended to replace an overly narrow sourcing model that relies only on obvious freely licensed written references.

For domains such as:

- `2d-game-art`
- `pixel-art-production`
- `game-art-direction`
- animation craft
- game UX
- audio production
- level design
- technical art
- live production practices

the most useful professional knowledge often exists across:

- YouTube talks/tutorials
- GDC presentations
- studio postmortems
- artist breakdowns
- practitioner blogs
- Reddit discussions
- tool documentation
- open-source production examples
- community troubleshooting threads

GAN should use those sources deliberately and govern them carefully rather than excluding them.

---

# 1. Core Principle

Do not confuse:

> **"easy to cite"**

with:

> **"professionally useful."**

A 40-minute breakdown by an experienced shipped-title pixel artist may contain more actionable craft knowledge than a large collection of generic written material.

The goal is not to maximize formal-looking sources.

The goal is to build Expertise Packs that make GAN specialists **materially better at their jobs**.

---

# 2. Two Layers: Access vs Research Method

Keep these concepts separate.

## Agent Reach = Access Layer

Agent Reach should be the default routing/access layer for acquiring material from supported web platforms.

Its job is to answer:

> **"How do I reliably reach and acquire this source?"**

Examples:

- YouTube
- Reddit
- GitHub
- ordinary web pages
- other supported platforms

Claude should not repeatedly reinvent platform-specific scraping/access logic when Agent Reach can provide or route access.

## Greenlight Methodology = Research Method

Greenlight's sourcing pipeline remains the governing research method:

```text
DISCOVER
   ↓
ACQUIRE
   ↓
EXTRACT
   ↓
SCORE
   ↓
DISTILL
   ↓
VERIFY
   ↓
CANONIZE
```

Agent Reach does **not** replace this methodology.

It makes the acquisition layer more robust.

The valuable Greenlight idea is:

> Find credible material, acquire the actual source, preserve provenance, extract claims, compare across sources, distill useful professional knowledge, and only then promote it.

---

# 3. Recommended Acquisition Architecture

Use:

```text
Claude / Research Specialist
          │
          ▼
      Agent Reach
   access + routing layer
          │
    ┌─────┼──────────────┐
    ▼     ▼              ▼
 YouTube Reddit      Web / GitHub / etc.
    │     │
    │     ├─ current/live discussion
    │     │      ↓
    │     │   Agent Reach route
    │     │
    │     └─ archival/full-thread need
    │            ↓
    │       Arctic Shift preferred
    │
    └─ transcript/metadata acquisition
           ↓
         yt-dlp
```

The exact underlying tool may change over time.

Claude should care about the **capability**, not hard-code assumptions about one forever-stable backend.

---

# 4. YouTube Strategy

YouTube is a first-class professional knowledge source when used carefully.

Prefer:

- GDC talks
- talks from shipped-title developers
- established professional artists/designers/engineers
- serious craft educators
- studio channels
- postmortems
- technical demonstrations
- workflow breakdowns

Do not reason from:

- title alone
- thumbnail
- search snippet
- recommendation text

Acquire actual source material whenever possible:

- title
- channel/author
- URL
- publish date
- description
- transcript/subtitles
- relevant timestamps
- other available metadata

The transcript is the evidence base.

---

# 5. Reddit Strategy

Reddit should be treated as **practitioner evidence**, not authoritative documentation.

Relevant communities may include:

- r/PixelArt
- r/gamedev
- engine-specific subreddits
- art/animation communities
- technical communities
- monetization/live-ops communities
- UX communities

Reddit is particularly useful for:

- recurring production pain points
- hidden workflow problems
- tool-specific edge cases
- practitioner disagreements
- failure modes
- practical shortcuts
- "what actually happens in production"
- comparative tool experience

Do not turn a single Reddit comment into a professional rule.

---

# 6. Arctic Shift Role

Keep direct Arctic Shift support as a secondary Reddit path.

Prefer it when the task benefits from:

- archival threads
- older discussions
- full comment trees
- reproducible acquisition
- comment metadata
- historical community knowledge

This is useful because GAN often cares about durable craft knowledge rather than only current discussion.

---

# 7. Source Credibility Tiers

Every source should be classified by authority.

## Tier A — Authoritative

Examples:

- official engine documentation
- official platform documentation
- standards
- official tool docs
- certification rules

Use for:

- requirements
- technical facts
- APIs
- version-sensitive behavior
- compliance

## Tier B — Established Professional

Examples:

- GDC speaker
- shipped-title developer
- experienced artist/designer with verifiable work
- studio postmortem
- respected professional educator

Use heavily for:

- craft methodology
- production workflow
- professional heuristics
- tradeoffs
- best practices

## Tier C — Demonstrated Practitioner

Examples:

- practitioner with clear evidence of real work
- detailed portfolio breakdown
- serious tutorial backed by production examples

Useful for:

- workflow
- technique
- failure modes
- practical implementation advice

## Tier D — Repeated Community Consensus

Examples:

- multiple independent practitioners describing the same problem or approach

Useful for:

- recurring patterns
- known tool pain points
- common anti-patterns
- practical consensus

Must still be treated as heuristic evidence.

## Tier E — Anecdote

Examples:

- one Reddit comment
- isolated forum opinion
- unsupported personal claim

Useful for:

- discovery
- edge-case warning
- candidate hypothesis

Do not canonize from Tier E alone.

---

# 8. Source Evidence Package

Every acquired source used materially in an Expertise Pack should preserve a compact evidence package.

Conceptually:

```yaml
source:
  id:
  title:
  author_or_channel:
  url:
  platform:
  published_at:
  retrieved_at:
  authority_tier:
  source_type:
  license_or_usage_note:
  applicable_capabilities: []

acquisition:
  method:
  transcript_available:
  comments_available:
  acquisition_notes:

evidence:
  extracted_sections:
    - location_or_timestamp:
      summary:
      supported_claims: []
```

Do not require this exact schema if GAN already has a compatible source model.

Preserve the semantics.

---

# 9. Discover → Acquire → Extract

## Discover

Search broadly enough to find:

- formal sources
- practitioner sources
- competing methods
- strong disagreement
- high-value workflows

Do not stop after finding the first acceptable source.

## Acquire

Acquire the actual source material.

Examples:

- YouTube transcript
- full Reddit thread/comments
- article
- documentation
- GitHub README/docs
- postmortem

Search snippets are discovery aids, not evidence.

## Extract

Extract only claims relevant to the Expertise Pack.

Examples:

- principle
- workflow step
- failure mode
- technical rule
- tradeoff
- evidence expectation
- useful example

Avoid dumping entire transcripts into pack content.

---

# 10. Score Sources

Source scoring should consider:

- professional authority
- relevance
- specificity
- evidence quality
- production applicability
- freshness where relevant
- independence from other sources

Do not score solely by popularity.

A niche technical breakdown can be more valuable than a viral video.

---

# 11. Cross-source Verification

Important craft claims should be compared across independent sources where possible.

Example:

```text
CLAIM
Maintain consistent pixel density across related assets.

Evidence:
- professional tutorial
- shipped-game art breakdown
- multiple practitioner discussions
- technical engine guidance

Result:
Strong professional heuristic
```

Versus:

```text
CLAIM
Pixel characters should never use outlines.

Evidence:
- two community comments

Result:
Style preference / contested practice
```

Preserve disagreement.

Do not invent false consensus.

---

# 12. Distillation Format

Expertise Pack content should be actionable.

A useful distilled entry may look like:

```text
PRINCIPLE
Use coherent pixel clusters to describe form.

WHY
Cluster coherence improves readability and prevents noisy detail.

METHOD
1. Establish silhouette.
2. Define major value groups.
3. Build clusters.
4. Add selective detail.
5. Inspect at native scale.

COMMON FAILURE
Using isolated single pixels as uncontrolled texture/detail.

TRADEOFF
Intentional dithering or noisy material treatment may require exceptions.

EVIDENCE
- Source A
- Source B
- Practitioner discussion C

CONFIDENCE
High
```

The goal is to create expertise an agent can **apply**, not merely information it can quote.

---

# 13. Pack Content Targets

For craft-heavy packs, aim to extract:

- core principles
- repeatable workflows
- methods
- checklists
- anti-patterns
- failure modes
- tradeoffs
- tool-specific constraints
- technical implementation requirements
- review criteria
- evidence expectations
- contested practices
- examples
- benchmark ideas

Avoid generic statements.

Bad:

> "Keep your pixel art readable."

Better:

> "Evaluate readability at native resolution and silhouette scale before adding interior detail."

---

# 14. Subjectivity Handling

Craft domains contain real disagreement.

Do not flatten stylistic variation into fake objective rules.

Classify guidance as:

- requirement
- strong professional principle
- common heuristic
- context-dependent technique
- stylistic preference
- contested practice
- anecdotal observation

---

# 15. Licensing and Copyright

Research sources do not need to be copied wholesale into GAN.

Expertise Packs should usually contain:

- original distilled notes
- derived methods
- concise summaries
- structured principles
- source references
- provenance

Do not copy large copyrighted transcripts, articles, or books into the knowledge repository.

Preserve source links/metadata so claims remain auditable.

---

# 16. Canonization Policy

Research output must not immediately become trusted Expertise Pack knowledge.

Lifecycle:

```text
RESEARCHED
    ↓
CANDIDATE KNOWLEDGE
    ↓
CURATOR REVIEW
    ↓
BENCHMARK / AUDITION
    ↓
VALIDATED
    ↓
CANONIZED
```

Research may improve a candidate pack.

It does not bypass:

- provenance review
- licensing review
- contradiction review
- benchmark/audition
- normal GAN Expertise Pack validation

---

# 17. Benchmark Against Actual Agent Performance

A source-rich pack is not automatically a good pack.

The real question is:

> **Does this expertise make the specialist better?**

Where practical:

1. run baseline agent without the new pack
2. run candidate agent with the pack
3. evaluate both against the same benchmark
4. inspect:
   - diagnosis quality
   - technical accuracy
   - methodology
   - unsupported claims
   - quality of requested evidence
   - output usefulness

Promote only when expertise adds measurable value.

---

# 18. Agent Reach Failure Policy

Agent Reach is an access router, not a single point of truth.

If a route fails:

1. diagnose route health
2. try supported fallback
3. use direct acquisition tool if appropriate
4. record acquisition method
5. continue research

Do not abandon a domain merely because one access path fails.

---

# 19. When to Use Direct Tools Instead

Use direct acquisition where it is clearly superior.

Examples:

## YouTube

Direct `yt-dlp` may be appropriate when exact transcript acquisition is needed.

## Reddit

Direct Arctic Shift may be appropriate for archival/full-thread reconstruction.

## GitHub

Direct repository/docs access may be more appropriate than generic web extraction.

Agent Reach should simplify routing, not prohibit better direct tools.

---

# 20. Research Cost Discipline

Do not turn every Expertise Pack into a massive web-research project.

Use a stopping rule.

Stop when:

- key methods are well-supported
- important disagreements are understood
- major anti-patterns are covered
- benchmark design is possible
- additional sources are producing mostly redundant information

Prefer:

> 10–20 high-value sources

over:

> 100 shallow sources

when the smaller set provides sufficient coverage.

---

# 21. Recommended Strategy for the Deferred Packs

Apply this strategy specifically to:

- `2d-game-art`
- `pixel-art-production`

Suggested source mix:

## 2D Game Art

- professional 2D game art talks
- shipped-game visual breakdowns
- composition/readability resources
- sprite/background production workflows
- engine/tool constraints
- studio postmortems
- strong practitioner discussions

## Pixel Art Production

- shipped pixel-art game artists
- reputable pixel-art educators
- Aseprite/tool documentation
- GDC/art talks
- sprite animation breakdowns
- palette workflow
- cluster theory
- readability
- pixel density
- scaling/filtering
- animation timing
- export/import workflow
- repeated practitioner issues from Reddit/community sources

Do not require the domain to have a large formal literature base.

---

# 22. Claude's Immediate Task

For the remaining deferred packs:

1. use Agent Reach as the default source discovery/acquisition router;
2. reuse Greenlight's governed sourcing methodology;
3. retain direct Arctic Shift as a Reddit archival/full-thread option;
4. retain direct `yt-dlp` acquisition where useful for YouTube transcripts;
5. collect a compact high-quality source set;
6. classify every source by authority tier;
7. acquire actual source material, not search snippets;
8. extract principles/methods/workflows/anti-patterns;
9. cross-check important claims;
10. preserve disagreement and subjectivity;
11. build candidate Expertise Packs;
12. attach provenance;
13. update benchmark scenarios;
14. run normal pack validation/audition;
15. keep packs in candidate/draft state until normal GAN promotion criteria pass.

---

# 23. What Not to Do

Do not:

- defer a craft domain merely because formal literature is sparse
- treat YouTube as automatically low quality
- treat Reddit as authoritative
- rely on search snippets as evidence
- copy full transcripts into packs
- canonize one practitioner's preference
- fabricate consensus
- hide contradictory guidance
- mass-collect sources without extracting usable methods
- promote research output without normal GAN validation

---

# 24. Final Principle

The research system should be sophisticated enough to understand:

> **A formal source can be authoritative but practically shallow.**

and:

> **A practitioner source can be informal but professionally valuable.**

GAN's job is not to prefer one category blindly.

Its job is to:

> **find useful professional knowledge, understand the authority of the source, preserve provenance, cross-check important claims, distill actionable expertise, and validate that the expertise actually improves specialist performance.**

Agent Reach improves how Claude reaches the material.

Greenlight's methodology determines how that material becomes knowledge.
