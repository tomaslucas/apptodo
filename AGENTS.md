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