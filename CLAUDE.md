## Context Governor (repodoctor)

This project uses [repodoctor](https://github.com/orenshved/repodoctor) for AI context management.

**Every session must start with:**

1. Read `.ai/PROJECT_STATE.md` — current state of the project
2. Read `.ai/AGENT_RULES.md` — behavioral rules for this project
3. Run `node scripts/ai-doctor.js --task "<describe your task>"` — get a focused context plan

**After every session:**
Update `.ai/WORKING_HISTORY.md`, `.ai/KNOWN_ISSUES.md`, `.ai/NEXT_BEST_ACTIONS.md`.

**Scripts:**

```bash
node scripts/ai-index.js              # rebuild context index after structural changes
node scripts/ai-audit.js              # find token waste and bloat
node scripts/ai-doctor.js --task "…"  # get context plan before starting a task
```

**Retrieval priority:** `.ai/` files → ai-doctor → codebase-memory-mcp → Serena → direct reads
