# Architecture Review

This document summarizes the findings from a comprehensive architecture review of the Hue Light Control application.

> **Note:** This review was conducted on 2025-12-28. Items marked with ✅ have been implemented.

## Changes Implemented

The following changes were made based on this review:

1. ✅ **Renamed LightControl to Dashboard** - Component and directory renamed to better reflect its scope
2. ✅ **Converted Hive E2E tests to manual tests** - Complex 2FA flows moved to `docs/MANUAL_TESTS.md`
3. ✅ **Deleted hive.spec.ts and hive-2fa.spec.ts** - Replaced with manual test procedures

---

## 1. V1 API Removal Status

### Finding: V1 API Is NOT Fully Removed

The frontend still extensively uses V1 API endpoints via `hueApi.js`:

| Endpoint                  | Location          | Purpose           |
| ------------------------- | ----------------- | ----------------- |
| `/v1/auth/pair`           | hueApi.js:112     | Bridge pairing    |
| `/v1/auth/connect`        | hueApi.js:121     | Bridge connection |
| `/v1/auth/bridge-status`  | hueApi.js:136     | Check credentials |
| `/v1/auth/session`        | hueApi.js:147     | Create session    |
| `/v1/auth/refresh`        | hueApi.js:178     | Refresh session   |
| `/v1/auth/disconnect`     | hueApi.js:183     | Disconnect        |
| `/v1/dashboard`           | hueApi.js:156     | Dashboard data    |
| `/v1/motion-zones`        | hueApi.js:159     | Motion zones      |
| `/v1/lights/:id`          | hueApi.js:163     | Light control     |
| `/v1/rooms/:id/lights`    | hueApi.js:167     | Room control      |
| `/v1/zones/:id/lights`    | hueApi.js:171     | Zone control      |
| `/v1/scenes/:id/activate` | hueApi.js:175     | Scene activation  |
| `/v1/settings`            | hueApi.js:186-193 | Settings CRUD     |
| `/v1/weather`             | hueApi.js:196     | Weather data      |
| `/v1/automations`         | hueApi.js:199-211 | Automations       |
| `/v1/hive/*`              | hueApi.js:217-256 | Hive integration  |

### Backend V1 Routes Still Present

13 route files in `backend/routes/v1/`:

- auth.js, automations.js, dashboard.js, hive.js, lights.js
- motionZones.js, rooms.js, scenes.js, settings.js, stats.js
- weather.js, zones.js, index.js

### Recommendation

Complete V1 deprecation is a significant undertaking. Options:

1. **Gradual Migration**: Continue using V1 endpoints while adding V2 equivalents
2. **Full Migration**: Rewrite hueApi.js to use servicesApi.js + homeAdapter.js patterns

The `homeAdapter.js` provides a good pattern - it already uses V2 Home API and transforms responses for backward compatibility.

---

## 2. LightControl Component Naming ✅ IMPLEMENTED

### Finding: LightControl Is Broader Than Lights

The `Dashboard` directory (formerly `LightControl`) contains 32 components managing:

- Lights, Rooms, Zones (original purpose)
- Weather display and tooltips
- Hive thermostat and schedules
- Home-level devices
- Settings page
- Automations
- Navigation (TopToolbar, BottomNav)

### Components in LightControl

| Component                               | Domain       |
| --------------------------------------- | ------------ |
| LightTile.jsx                           | Lights       |
| RoomContent.jsx                         | Lights       |
| ZonesView.jsx                           | Lights       |
| SceneSelector.jsx, SceneDrawer.jsx      | Lights       |
| WeatherDisplay.jsx, WeatherTooltip.jsx  | Weather      |
| HiveView.jsx                            | Hive heating |
| HomeView.jsx                            | Home devices |
| AutomationsView.jsx, AutomationCard.jsx | Automations  |
| SettingsPage.jsx                        | Settings     |
| TopToolbar.jsx, BottomNav.jsx           | Navigation   |
| DashboardSummary.jsx                    | Summary      |

### ✅ Implemented

Renamed `LightControl` to `Dashboard`:

- Directory: `frontend/src/components/Dashboard/`
- Component export: `Dashboard` (was `LightControl`)
- All imports updated in App.jsx, App.test.jsx, and test files
- Logger already used 'Dashboard' name

**Optional future reorganization:**

```
components/
  Dashboard/
    index.jsx (main orchestrator)
    TopToolbar.jsx
    BottomNav.jsx
  Lights/
    LightTile.jsx
    RoomContent.jsx
    ZonesView.jsx
    SceneSelector.jsx
  Weather/
    WeatherDisplay.jsx
    WeatherTooltip.jsx
  Hive/
    HiveView.jsx
  Home/
    HomeView.jsx
  Automations/
    AutomationsView.jsx
    AutomationCard.jsx
  Settings/
    SettingsPage.jsx
```

---

## 3. API Design Analysis

### Finding: Good V2 Pattern, Inconsistent Usage

**Good patterns in place:**

- `servicesApi.js` - Clean generic service API with unified endpoints
- `homeAdapter.js` - Transforms V2 responses to legacy format
- ServicePlugin pattern on backend

**Issues:**

1. **Service-specific functions in servicesApi.js** (lines 117-158):
   - `pairHue()` - Hue-specific
   - `verifyHive2fa()` - Hive-specific
   - `getHiveSchedules()` - Hive-specific

2. **Dual exports in hueApi.js**:
   - Functions exported individually AND added to hueApi object
   - `connectHive`, `verifyHive2fa`, etc. exported twice

3. **Mixed API patterns**:
   - hueApi.js uses axios with interceptors
   - servicesApi.js uses plain fetch
   - homeAdapter.js uses its own fetch wrapper

### Recommendation

1. Move service-specific functions from servicesApi.js to service-specific files or use generic patterns
2. Standardize on one HTTP pattern (axios or fetch)
3. Ensure all V2 API calls go through servicesApi.js or homeApi.js

---

## 4. Service-Specific Information Leakage

### Finding: Some Leakage Present

**Frontend has Hive-specific knowledge:**

| Location           | Hive-specific code            |
| ------------------ | ----------------------------- |
| servicesApi.js:138 | `verifyHive2fa()` function    |
| servicesApi.js:152 | `getHiveSchedules()` function |
| homeAdapter.js:157 | Hive status transformation    |
| useHive.js         | Entire hook is Hive-specific  |
| HiveView.jsx       | Component is service-specific |

**Good abstraction:**

- HomeView.jsx checks `d.source === 'hive'` - reasonable boundary
- ServicePlugin pattern abstracts backend implementation
- Settings uses generic `services.hive.enabled` pattern

### Recommendation

The current level of Hive-specific code is acceptable for a single additional service. If adding more services:

1. Create generic `ServiceView` component
2. Use plugin registry pattern on frontend
3. Keep service-specific views as plugins

---

## 5. Service Implementation Isolation

### Finding: Good Isolation on Backend

**Backend isolation is excellent:**

| Layer    | Hive-specific                      | Generic            |
| -------- | ---------------------------------- | ------------------ |
| Routes   | hive.js                            | services.js        |
| Services | hiveService.js, hiveAuthService.js | ServicePlugin.js   |
| Plugins  | HivePlugin.js                      | ServiceRegistry.js |

All Hive implementation details are contained in:

- `backend/services/hiveService.js`
- `backend/services/hiveAuthService.js`
- `backend/services/hiveCredentialsManager.js`
- `backend/services/plugins/HivePlugin.js`
- `backend/routes/v1/hive.js`

### Recommendation

Backend service isolation is well-designed. No changes needed.

---

## 6. Naming Conventions Review

### Finding: Inconsistent Naming (Partially Resolved)

| Issue                        | Example                             | Status                                   |
| ---------------------------- | ----------------------------------- | ---------------------------------------- |
| V1/V2 mixing                 | `activateSceneV1` in homeAdapter.js | Pending - Remove V1 suffix when migrated |
| Component/directory mismatch | `Dashboard/` now matches scope      | ✅ Resolved                              |
| Logger name mismatch         | Logger now matches component name   | ✅ Resolved                              |
| Hive tab label               | "Hive" (brand name) in navigation   | Pending - Consider "Heating"             |

---

## 7. E2E Tests for Manual Testing ✅ IMPLEMENTED

### Converted to Manual Testing

The following E2E tests were converted to manual test procedures in `docs/MANUAL_TESTS.md`:

#### 7.1 Hive 2FA Authentication Flow (hive-2fa.spec.ts)

**Test: Full 2FA Login Flow**

- Enter credentials → See 2FA form → Enter code → See thermostat
- Involves timing-sensitive transitions and SMS simulation
- 8 related tests in "Login Flow - 2FA Required" describe block

**Test: 2FA Code Verification**

- Invalid code handling, valid code success, back navigation
- Focus preservation on 2FA input
- 6 tests in "2FA Code Verification" describe block

#### 7.2 Hive Integration State Management (hive.spec.ts)

**Test: Connect → Disconnect → Reconnect cycle**

- Tests spanning multiple describe blocks
- Involves settings page, navigation, and state persistence
- "should hide Hive tab after disconnect" and related

#### 7.3 Recommended Manual Test Checklist

```markdown
## Manual Test Checklist: Hive Integration

### Prerequisites

- Demo mode enabled (?demo=true)
- Hive service enabled in settings

### Test 1: Initial Login with 2FA

1. Open Settings → Click "Use the Hive tab to connect"
2. Enter demo@hive.com / demo → Click Connect
3. Verify 2FA form appears with focus on code input
4. Enter 123456 → Click Verify
5. Expected: Thermostat display with 19.5° and schedule list

### Test 2: Invalid Credentials

1. Navigate to Hive login form
2. Enter wrong@email.com / wrongpassword
3. Expected: Error message appears, form remains visible

### Test 3: Invalid 2FA Code

1. Complete valid login → See 2FA form
2. Enter 000000 → Click Verify
3. Expected: Error message, can retry

### Test 4: 2FA Cancellation

1. Complete valid login → See 2FA form
2. Click "Back to login"
3. Expected: Login form with preserved email

### Test 5: Disconnect Flow

1. With Hive connected, open Settings
2. Click Disconnect button
3. Expected: Hive tab disappears, Settings shows "Use the Hive tab to connect"

### Test 6: Responsive Display

1. Test on 800x480 (Raspberry Pi) viewport
2. Test on 390x844 (iPhone 14+) viewport
3. Expected: All elements visible, no overlap with toolbar/nav
```

### Tests to KEEP Automated

| Test File                 | Reason to Keep                        |
| ------------------------- | ------------------------------------- |
| auth.spec.ts              | Critical path, simple flow            |
| session.spec.ts           | Session management is foundational    |
| demo-mode.spec.ts         | Demo mode is critical for development |
| settings-page.spec.ts     | Settings are frequently changed       |
| responsive-layout.spec.ts | Regression protection                 |
| spacing-layout.spec.ts    | Visual consistency                    |
| automations.spec.ts       | Core feature                          |
| weather-settings.spec.ts  | Core feature                          |
| discovery.spec.ts         | Foundational for bridge connection    |

---

## 8. Summary of Recommendations

### ✅ Completed

1. ~~**Rename LightControl to Dashboard**~~ - Done
2. ~~**Convert complex E2E tests to manual**~~ - Done

### High Priority (Remaining)

3. **Complete V1 to V2 migration** - hueApi.js still uses V1 endpoints

### Medium Priority

4. **Standardize HTTP patterns** - Choose axios or fetch, not both
5. **Move Hive-specific functions** - servicesApi.js should be generic

### Low Priority / Future

6. **Reorganize component structure** - Optional, for maintainability
7. **Update naming conventions** - activateSceneV1 → activateScene

---

## 9. E2E Test Changes ✅ COMPLETED

### Removed (converted to manual tests)

- [x] `hive-2fa.spec.ts` - 30+ tests, complex 2FA flow → `docs/MANUAL_TESTS.md`
- [x] `hive.spec.ts` - Multi-step state management → `docs/MANUAL_TESTS.md`

### Kept Automated

- auth.spec.ts - Critical path, simple flow
- session.spec.ts - Session management is foundational
- demo-mode.spec.ts - Demo mode is critical for development
- settings-page.spec.ts - Settings are frequently changed
- responsive-layout.spec.ts - Regression protection
- spacing-layout.spec.ts - Visual consistency
- automations.spec.ts - Core feature
- weather-settings.spec.ts - Core feature
- discovery.spec.ts - Foundational for bridge connection
- timeout-config.spec.ts - Configuration testing
