---
description: Create PR and let CI validate
---

# Create Pull Request

You are finishing the TDD cycle. Your job is to commit changes and create a PR, letting CI handle final validation.

## When to Use

Use `/pr` after:

- `/refactor` → `/docs` → `/pr` (standard flow)
- `/reviewer` → `/docs` → `/pr` (with local review)
- `/refactor` → `/pr` (skip docs for trivial changes)

## Your Responsibilities

1. **Run unit tests** - Quick sanity check before pushing
2. **Format code** - Ensure consistent style
3. **Commit changes** - With descriptive message
4. **Create PR** - Let CI validate fully

## Process

1. **Run unit tests** (fast feedback):

   ```bash
   npm run test:all
   ```

   If tests fail, fix issues before proceeding.

2. **Format code:**

   ```bash
   npm run format
   ```

3. **Check what's changed:**

   ```bash
   git status
   git diff --stat
   ```

4. **Commit changes:**

   ```bash
   git add -A
   git commit -m "descriptive message"
   ```

5. **Push and create PR:**

   ```bash
   git push -u origin HEAD
   gh pr create --fill
   ```

   Or with custom title/body:

   ```bash
   gh pr create --title "Feature: description" --body "## Summary\n..."
   ```

6. **Report PR URL** - Share the PR link with the user

## CI Validates

Once the PR is created, CI automatically runs:

- Lint & Format checks
- Frontend unit tests
- Backend unit tests
- E2E tests
- Build verification

**Trust CI** - If CI passes, the change is ready for merge. If CI fails, fix and push again.

## Output

1. Show test results (should pass)
2. Show commit message
3. Provide PR URL
4. Remind user that CI will validate E2E, lint, and build

## Constraints

- DO NOT skip the unit test run
- DO NOT run E2E tests locally (CI handles this)
- DO NOT run lint locally (CI handles this)
- DO ensure code is formatted before commit
