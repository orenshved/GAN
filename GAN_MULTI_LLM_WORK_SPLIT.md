# Game Agent Network — Multi-LLM Work Split

## Purpose

Game Agent Network has become large enough that **token/context efficiency is now a first-class engineering concern**.

Do not attempt to perform the entire PRD with a single model.

From this point forward, substantial work should be divided between **Codex** and **Claude Code**, with Codex acting as the **technical lead and integration owner**.

**Gemini Pro is available, but should not be used by default.** Add it only when there is a clear third-model advantage that materially outweighs the extra coordination/context cost.

---

# 1. Mandatory First Step: RepoDoctor

Before either model continues significant work, install and use:

**RepoDoctor**  
https://github.com/orenshved/repodoctor

If RepoDoctor is not already installed in Game Agent Network:

```bash
npx github:orenshved/repodoctor
```

Every LLM workstream must begin by:

1. Reading `.ai/PROJECT_STATE.md`
2. Reading `.ai/AGENT_RULES.md`
3. Running `node scripts/ai-index.js` if the index is stale
4. Running `node scripts/ai-audit.js`
5. Running `node scripts/ai-doctor.js --task "<its exact workstream>"`
6. Using the resulting focused context plan instead of broadly re-reading the repository

RepoDoctor's `.ai` institutional-memory files must remain current as meaningful work occurs.

---

# 2. Working Model

Treat this as two senior people working on one product:

- **Codex = Technical Lead / Integrator**
- **Claude = Knowledge & Expertise Lead**

Do not duplicate work unless one model is explicitly reviewing the other's output.

Use separate Git branches/worktrees so both models can work concurrently without file collisions.

Suggested structure:

```text
main
├── worktree/codex-platform
└── worktree/claude-knowledge
```

Each worker must know which paths it owns.

Codex remains responsible for final integration into the main GAN architecture.

---

# 3. Codex Ownership

Codex should primarily own **executable system architecture and integration**:

- monorepo/tooling
- GAN Daemon
- Studio/backend contracts
- domain schemas
- event sourcing
- SQLite projections
- Knowledge Fabric runtime infrastructure
- Knowledge Router
- Expertise Pack schema/parser/registry
- Project Intelligence infrastructure
- context assembly
- Codex bridge
- WebSockets/API
- worker lifecycle
- task state machine
- capability matching
- registration/reconciliation
- Git/worktree integration
- provider/model routing infrastructure
- budget enforcement
- engine/tool adapters
- QA Fabric implementation
- automated tests
- CI
- final integration/review

> **Codex builds the machine that lets specialists exist and work.**

Codex should avoid spending large amounts of context authoring encyclopedic professional knowledge.

---

# 4. Claude Ownership

Claude should primarily own the **professional intelligence that makes GAN agents actual specialists rather than role prompts**:

- Expertise Pack contents
- professional methods
- playbooks
- checklists
- anti-pattern libraries
- evidence expectations
- authoritative source selection
- source/provenance metadata
- knowledge freshness classifications
- Expertise Pack benchmark scenarios
- Lead-domain assessment methodology
- capability ontology refinement
- specialist qualification criteria
- cross-disciplinary expertise relationships
- candidate experience heuristics
- reviewing whether a pack actually represents professional practice rather than generic LLM advice

Start with:

```text
game-production-core
game-design-core
game-engineering-core
game-art-direction
game-ux-core
game-qa-core
project-intelligence-analysis
godot-core
godot-ui-engineering
2d-game-art
pixel-art-production
controller-navigation
game-accessibility-basics
local-model-selection
```

Do **not** mass-produce shallow packs simply to complete the list.

Expertise quality matters much more than pack count.

Claude should treat Expertise Pack creation as **research + knowledge-engineering work**.

> **Claude builds the professional brain that runs inside the machine.**

---

# 5. Critical Ownership Boundary

Codex owns the **Expertise Pack system**.

Claude owns the **expertise inside the packs**.

Example:

```text
Codex:
  pack.yaml schema
  loading
  validation
  retrieval
  versioning
  source schema
  benchmark runner

Claude:
  UX principles
  controller-navigation methodology
  diagnostic playbook
  anti-patterns
  source selection
  benchmark cases
```

Do not create two competing implementations.

---

# 6. Claude May Write Code Where Appropriate

Claude may implement work naturally adjacent to its domain, including:

- pack fixtures
- benchmark definitions
- validators close to its owned content
- tests
- small supporting utilities

Architectural changes affecting the core runtime should be proposed to Codex rather than independently creating a competing architecture.

---

# 7. Handoff Protocol

Maintain compact handoff artifacts:

```text
.ai/handoffs/
    codex-to-claude.md
    claude-to-codex.md
```

Each handoff should contain only:

```text
OBJECTIVE
WHAT CHANGED
FILES/PATHS
DECISIONS MADE
CONTRACTS THE OTHER SIDE MUST RESPECT
BLOCKERS
QUESTIONS
NEXT ACTION
```

Keep handoffs concise.

The receiving LLM should run RepoDoctor for the new task rather than loading the other worker's entire history.

---

# 8. Shared Architectural Decisions

If Claude discovers that an Expertise Pack requires a schema/runtime capability that does not exist:

```text
Claude
→ writes requirement into handoff
→ Codex evaluates
→ Codex modifies runtime/schema if justified
→ Claude continues
```

If Codex needs professional/domain knowledge to make an architecture choice:

```text
Codex
→ asks Claude a narrowly scoped question
→ Claude investigates
→ returns recommendation + evidence
```

Prefer structured artifacts over large model-to-model transcripts.

---

# 9. Integration and Cross-Review

Neither worker should automatically assume its output is correct.

**Claude reviews:**

- whether the architecture supports good professional knowledge
- whether specialists behave meaningfully better than generic agents
- whether schemas constrain expertise too much or too little

**Codex reviews:**

- whether Claude's pack structures/content conform to schemas
- whether retrieval is efficient
- whether packs remain maintainable
- whether benchmarks integrate correctly
- whether implementation remains coherent

This is **cross-review**, not duplicate implementation.

---

# 10. Gemini Pro Policy

Default:

> **Codex + Claude only**

Use Gemini only when there is a genuine third-model advantage, for example:

- unusually broad source/repository analysis
- independent adversarial review
- Codex and Claude reach materially different conclusions
- extremely large-context comparison
- benchmark/evaluation benefits from an independent model
- freshness-sensitive research can be cleanly delegated

Good Gemini assignment:

> "Independently audit the Controller Navigation Expertise Pack against these sources and benchmark cases. Identify omissions or unsupported recommendations."

Bad Gemini assignment:

> "Help build GAN too."

Do not add a third coordination stream unless its expected value exceeds the context and coordination cost.

---

# 11. Usage Optimization Rules

Optimize for **subscription usage and context efficiency, not maximum execution speed**.

Therefore:

- parallelize genuinely independent work
- do not repeatedly re-index/re-read unchanged areas
- use RepoDoctor before broad exploration
- use narrow task contracts
- use handoff files instead of conversation reconstruction
- cache summaries
- avoid feeding the entire PRD to every subtask when a relevant section will do
- prefer deterministic scripts/tools over LLM reasoning where appropriate
- do not ask Codex to research large expertise corpora when Claude owns that work
- do not ask Claude to rediscover core architecture Codex already documented
- waiting is preferable to unnecessarily burning usage

---

# 12. Initial Action

Do **not** immediately resume large-scale implementation.

First:

1. Run RepoDoctor against the current GAN repository.
2. Review the audit and current project state.
3. Determine the remaining work from:
   - the main PRD
   - Domain-Led Onboarding addendum
   - Knowledge Fabric / Specialist Intelligence addendum
4. Create `docs/AI_WORK_SPLIT.md`.
5. Divide outstanding work into:
   - Codex-owned
   - Claude-owned
   - explicit cross-review/integration workstreams
6. Create separate branches/worktrees.
7. Prepare Claude's first narrow assignment and RepoDoctor task.
8. If Claude Code is locally installed/authenticated and can be invoked safely, launch that workstream there.
9. Otherwise produce the exact Claude handoff/prompt for Oren rather than pretending Claude has been started.
10. Keep Gemini unassigned unless there is a specific reason it is required.
11. Show Oren the resulting workload split before beginning another very large phase.

---

# 13. Governing Principle

The goal is **not** a mathematically equal 50/50 split.

The goal is:

> **Put each kind of work with the model best suited to it, minimize redundant context consumption, preserve a single coherent architecture, and make handoffs cheap.**

```text
CODEX
System engineering
Architecture
Runtime
Integration
QA infrastructure

        ↕ structured handoffs

CLAUDE
Professional expertise
Methods
Playbooks
Knowledge curation
Expertise benchmarks

        ↕

GEMINI PRO
Independent specialist review only
when there is a concrete reason
```
