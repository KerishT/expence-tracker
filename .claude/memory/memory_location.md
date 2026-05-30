---
name: memory-location
description: "Where to store project memory — inside the repo at .claude/memory/, not the global ~/.claude path"
metadata:
  type: feedback
---

For this project, store all memory files inside the repository at `.claude/memory/`, NOT in the global `~/.claude/projects/.../memory/` path (instructed 2026-05-30).

**Why:** User wants memory notes visible in the repo and tracked in git (committed, not gitignored).

**How to apply:**
- Write new memory files to `<repo>/.claude/memory/` and keep the index in `<repo>/.claude/memory/MEMORY.md`.
- Do NOT add `.claude/memory/` to `.gitignore` — these files are meant to be committed.
- Harness auto-loads MEMORY.md only from the global path, so this repo-local MEMORY.md is NOT auto-loaded; read it manually at the start of work on this project.
