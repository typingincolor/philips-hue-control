# Testing Documentation

## Overview

This project uses **Vitest** for unit testing and **Stryker** for mutation testing to ensure code quality and test effectiveness.

## Test Setup

### Testing Stack

- **Test Runner**: Vitest 4.0.16 (Vite-native, faster than Jest)
- **React Testing**: @testing-library/react 16.3.1
- **DOM Assertions**: @testing-library/jest-dom 6.9.1
- **Mutation Testing**: Stryker Mutator 9.4.0
- **Coverage Provider**: Vitest V8

### Configuration Files

- `vitest.config.js` - Vitest configuration
- `stryker.conf.json` - Mutation testing configuration
- `src/test/setup.js` - Global test setup

## Running Tests

### Unit Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Mutation Tests

```bash
# Run mutation testing
npm run test:mutation
```

View mutation report: `open reports/mutation/html/index.html`

## Test Coverage

### Unit Test Results (411 frontend + 660 backend = 1071 tests)

#### Frontend (411 tests)

- **Hooks**: useSession (23), useSettings (18), useWeather (10), useWebSocket (19), useLocation (14), useHive (19)
- **Services**: hueApi (41)
- **Components**: App (7), MotionZones (8), DashboardSummary (5), SceneSelector (8), SettingsPage (38), BottomNav (5), WeatherDisplay (11), WeatherTooltip (11), HiveView (18), LightControl/index (29), index.zones (9), index.hive (17)
- **Context**: DemoModeContext (8)
- **Utils**: validation (8)
- **Integration**: integration.test.jsx (12)

#### Backend (660 tests)

Business logic tests including colorConversion (49), roomService, zoneService, automationService (16), sessionManager (53), websocketService (31), settingsService (43), and more.

## Mutation Testing Results

### Summary

- **Total Mutants**: ~1300
- **Mutation Score**: 53% (above 50% threshold)
- **Threshold**: 50% (minimum to pass)

### Mutation Score by Category

**Hooks** - Variable mutation scores

- useSession, useWebSocket have good coverage
- useHueBridge has lower coverage due to async complexity

**Components** - Generally good coverage

- LightTile, RoomContent, ZonesView well-tested
- Some UI components have lower scores

**Services** - Good coverage

- hueApi.js well-tested with mocks

**Utilities** - High coverage

- validation.js ~94% mutation score

### Notable Survived Mutants

Some mutants survive because they don't produce observable differences:

1. **Async Logic** (useHueBridge.js, useWebSocket.js)
   - Complex async state transitions
   - Race conditions difficult to test deterministically

2. **UI State Changes** (components)
   - Visual-only changes that don't affect behavior
   - CSS class toggling without functional impact

3. **Error Handling Paths** (hueApi.js)
   - Error branches that require specific failure conditions
   - Network timeout scenarios

## Test Quality Metrics

### What Makes These Tests Effective

1. **Comprehensive Edge Cases**
   - Null/undefined handling
   - Empty arrays/objects
   - Boundary values (0, 255, min/max)
   - Missing optional fields

2. **Realistic Data**
   - Uses actual Hue API v2 data structures
   - Tests real-world color coordinates
   - Validates production scenarios

3. **Mutation Resistance**
   - 73% mutation score (above 50% threshold)
   - Tests catch most logic errors
   - Mathematical code has expected survivors

4. **Fast Execution**
   - 1071 tests run in <5 seconds
   - Mutation testing completes in ~15 minutes
   - Enables rapid development cycles

## Test Organization

### Test Files Mirror Source Structure

```
src/
├── utils/
│   └── validation.test.js
├── hooks/
│   ├── useSession.test.js
│   ├── useSettings.test.js
│   ├── useWeather.test.jsx
│   └── useWebSocket.test.js
├── services/
│   └── hueApi.test.js
├── components/
│   ├── App.test.jsx
│   ├── MotionZones.test.jsx
│   └── LightControl/
│       ├── DashboardSummary.test.jsx
│       ├── SceneSelector.test.jsx
│       ├── SettingsPage.test.jsx
│       ├── WeatherDisplay.test.jsx
│       ├── index.test.jsx
│       └── index.zones.test.jsx
├── integration.test.jsx
└── test/
    └── setup.js                    ← Global setup (includes hook mocks)
```

## Adding New Tests

### For Utilities (Pure Functions)

```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourFile';

describe('yourFile', () => {
  describe('yourFunction', () => {
    it('should handle normal case', () => {
      expect(yourFunction('input')).toBe('expected');
    });

    it('should handle edge case', () => {
      expect(yourFunction(null)).toBe(defaultValue);
    });
  });
});
```

### For Components

```javascript
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />);
    expect(screen.getByText('expected')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the function returns
   - Don't test internal implementation details

2. **Use Descriptive Test Names**
   - Good: "should return null when light is off"
   - Bad: "test1"

3. **One Assertion Per Concept**
   - Each test should verify one specific behavior
   - Multiple assertions are OK if testing related properties

4. **Test Edge Cases**
   - Null/undefined
   - Empty collections
   - Boundary values
   - Missing required fields

5. **Keep Tests Fast**
   - Use pure functions when possible
   - Mock external dependencies
   - Avoid setTimeout/delays

## Continuous Integration

Tests should run on:

- Pre-commit hook (optional)
- Pull request creation
- Before deployment

### Recommended CI Commands

```bash
npm run test:run        # Fast unit tests
npm run test:coverage   # Generate coverage report
npm run test:mutation   # Weekly/before major releases
```

## Mutation Testing Insights

### What is Mutation Testing?

Mutation testing validates test quality by introducing small changes (mutations) to your code and checking if tests fail. If tests still pass after a mutation, it means the tests didn't catch the bug.

### Common Mutation Types

1. **Arithmetic Operators**: + ↔ -, × ↔ /
2. **Equality Operators**: < ↔ <=, == ↔ !=
3. **Conditional Expressions**: if(true) ↔ if(false)
4. **Block Statements**: Remove or empty code blocks
5. **Method Calls**: max() ↔ min()

### Improving Mutation Score

If mutation score is low:

1. Add tests for uncovered edge cases
2. Test boundary conditions more thoroughly
3. Add assertions for error states
4. Test negative cases (what shouldn't happen)

### When to Accept Survivors

Some mutations are OK to survive:

- Mathematical precision (floating-point edge cases)
- Defensive code that can't be triggered
- Performance optimizations
- Code that only affects logging/debugging

## Coverage Goals

- **Unit Test Coverage**: 100% of utilities
- **Mutation Score**: >50% (passing), >80% (excellent)
- **Critical Paths**: 100% coverage (authentication, API calls)

## Future Testing Improvements

### Pending Test Coverage

- [x] Custom hooks (useHueBridge, useSession, useSettings, useWeather, useWebSocket)
- [x] React components (with Testing Library)
- [x] Integration tests (API → UI flow)
- [x] E2E tests (Playwright)

## E2E Testing

### Setup

E2E tests use **Playwright** with automatic server management. Tests run on **isolated ports** to avoid conflicts with dev servers:

| Server   | Dev Port | E2E Port |
| -------- | -------- | -------- |
| Frontend | 5173     | 5174     |
| Backend  | 3001     | 3002     |

Playwright automatically starts and stops both servers for each test run.

```bash
# Run E2E tests (auto-starts servers on ports 5174/3002)
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed
```

### Test Files (217 tests)

```
e2e/
├── auth.spec.ts            # Authentication flow
├── automations.spec.ts     # Automation triggering
├── demo-mode.spec.ts       # Dashboard tests in demo mode
├── discovery.spec.ts       # Bridge discovery flow
├── hive.spec.ts            # Hive heating integration
├── responsive-layout.spec.ts # Responsive design tests
├── session.spec.ts         # Session persistence
├── spacing-layout.spec.ts  # Layout spacing tests
└── weather-settings.spec.ts # Weather settings
```

### Demo Mode Testing

All E2E tests use `?demo=true` URL parameter:

- No real Hue Bridge required
- Deterministic mock data
- Fast execution
- Works in CI/CD

### Configuration

See `playwright.config.ts` for:

- Base URL: `http://localhost:5174` (isolated E2E port)
- Backend: `http://localhost:3002/api/health` (isolated E2E port)
- Browser: Chromium only (for speed)
- Screenshots on failure
- Trace on first retry
- Auto server management with 2-minute timeout

### Potential Enhancements

- Visual regression testing for color rendering
- Performance benchmarks for color conversion
- Snapshot tests for component output
- Contract tests for Hue API responses

## Troubleshooting

### Tests Failing After Refactor

1. Check if API/data structures changed
2. Update test expectations
3. Run `npm run test:ui` for interactive debugging

### Mutation Testing Takes Too Long

1. Reduce mutant count with `mutate` config
2. Run only on changed files
3. Use `--incremental` flag

### Coverage Not Updating

1. Clear coverage cache: `rm -rf coverage/`
2. Re-run: `npm run test:coverage`
3. Check `vitest.config.js` coverage settings

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com/react)
- [Stryker Mutator](https://stryker-mutator.io)
- [Mutation Testing Guide](https://stryker-mutator.io/docs/mutation-testing-elements/introduction)
