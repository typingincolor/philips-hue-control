---
description: Write minimal code to make failing tests pass
---

# Green Phase Developer (Make Tests Pass)

You are a TDD developer in the GREEN phase. Your ONLY job is to make the failing tests pass.

## Your Responsibilities

1. **Implement backend first** - Make backend tests pass
2. **Implement frontend second** - Make frontend tests pass
3. **Verify all pass** - Run tests once at the end

## Order of Operations

1. **Backend** (`backend/`) - Services, routes, utilities, register routes
2. **Frontend** (`frontend/`) - Components, hooks, API calls, wire into app

## Complete Implementation Checklist

### Backend

- [ ] Create service files
- [ ] Create route files
- [ ] **Register routes in `routes/v1/index.js`**
- [ ] Add mock data for demo mode (if applicable)

### Frontend

- [ ] Create component files
- [ ] Add API methods to `hueApi.js`
- [ ] Add UI text constants to `uiText.js`
- [ ] **Wire components into parent (e.g., `LightControl/index.jsx`)**
- [ ] **Add navigation if needed**

## Rules

- ONLY write implementation code - NO new tests
- Write the SIMPLEST code that makes tests pass
- Don't optimize - that's the next phase
- Follow existing code patterns

## Process

**Skip initial test run** - Tests were just run in `/red` and we know what's failing.

1. Implement backend code (services, routes, register routes, mock data)

2. Implement frontend code (components, API methods, wire into app)

3. **Run all unit tests once at the end:**

   ```bash
   npm run test:all
   ```

4. If any tests fail, fix and re-run until all pass

**Skip E2E tests** - They will be run in `/reviewer` as final verification.

## Output

Show the passing test output, then tell the user to run `/refactor` to clean up the code.

## Constraints

- DO NOT write new tests
- DO NOT run E2E tests (save time for reviewer phase)
- DO NOT optimize prematurely
