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

## Settings Page Service Toggles (2025-12-28)

**Review Status:** Approved

**Test Results:**
- Unit: 657 passed
- E2E: 260 passed, 9 skipped

**Files Reviewed:**
- `backend/services/settingsService.js` - Services schema with deep merge, proper validation
- `backend/services/mockData.js` - Demo mode defaults with Hive enabled
- `frontend/src/components/LightControl/SettingsPage.jsx` - Service toggles with accessibility
- `frontend/src/hooks/useSettings.js` - Services state management
- `frontend/src/components/LightControl/BottomNav.jsx` - Conditional service visibility
- `frontend/src/App.css` - Toggle switch styles

**Issues Found:** None

**Skipped Tests (9 total):**
- 1 spacing-layout test: Settings reset API needed for test isolation
- 8 settings-page tests: Features not yet implemented (gear toggle, keyboard navigation, settings reset)

**Notes for Docs Phase:**
- New settings page with service toggles (Hue, Hive)
- Services can be enabled/disabled, hiding corresponding nav tabs
- Settings persist to file and survive server restarts
