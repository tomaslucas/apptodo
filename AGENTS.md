# Agent Instructions

This project uses **bd** (beads) for issue tracking with prefix **apptodo**. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show apptodo-<id>       # View issue details (e.g., apptodo-1, apptodo-2)
bd update apptodo-<id> --status in_progress  # Claim work
bd close apptodo-<id>      # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

# Python & Package Management

## ⚡ CRITICAL: UV is MANDATORY

This project uses **UV** for ALL Python and dependency management.

**DO NOT use:**
- ❌ `pip install`
- ❌ `python -m venv`
- ❌ Manual `venv` activation
- ❌ `requirements.txt` for dependency specification

**DO use:**
- ✅ `uv sync --python 3.12` - Synchronize dependencies
- ✅ `uv add <package>` - Add new dependency
- ✅ `pyproject.toml` - Define dependencies
- ✅ `uv.lock` - Lock exact versions

## Setup

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Python 3.12
uv python install 3.12

# Sync backend dependencies
cd app/backend && uv sync --python 3.12
source .venv/bin/activate

# Sync frontend dependencies (uses Bun, not UV)
cd app/frontend && bun install
```

## Files

- `pyproject.toml` - Source of truth for dependencies
- `uv.lock` - Generated lock file (commit to git)
- `.python-version` - Specifies Python 3.12 (for UV)
- `requirements.txt` - Auto-generated backup (do NOT edit manually)

## Reference

- PLAN.md Section 0: Tools and Configuration
- PLAN.md Section 9: Initialization and Setup
- SETUP.md: Quick start guide

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
