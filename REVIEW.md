# Review Suggestions

Non-blocking suggestions from code reviews. Address when convenient.

## Remove Token Threading (2025-12-27)

- [ ] Consider adding a session cleanup method that consolidates all session-related cleanup (clear token, reset state, etc.) in one place

## Hive Integration (2025-12-27)

- [ ] Consider adding key rotation capability for encryption keys in production use

## Hive Status & Motion Detection Fixes (2025-12-27)

**Review Status:** Clean - No issues found

Changes reviewed:

1. **Hive status transformation** - Fixed `isHeating` and `hotWater.isOn` to use `props.working` instead of non-existent `state.status`
2. **Motion detection** - Added support for `motion_area_configuration` to include motion sensors without MotionAware behaviors
3. **Test isolation** - Fixed `multiClient.test.js` to use isolated credentials file path

All changes follow existing patterns and include comprehensive test coverage.

## E2E Test Stability Fixes (2025-12-27)

**Review Status:** Approved - All 250 E2E tests pass

Changes reviewed:

1. **Backend reset endpoint** - Added `POST /api/v1/hive/reset-demo` endpoint for E2E test state management
2. **HiveService.resetDemo()** - New method to clear demo connection state without affecting real credentials
3. **E2E test helpers** - Simplified `ensureHiveDisconnected` to use API reset instead of UI-based disconnect
4. **Playwright config** - Set `workers: 1` to prevent race conditions with shared backend state
5. **Test robustness** - Added retry logic in `navigateToHiveLogin` for handling state race conditions

The root cause was that `_demoConnected` in HiveService is a singleton that persists across parallel E2E tests, causing state conflicts.
