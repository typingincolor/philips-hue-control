# Bugs

Known bugs to be fixed. Check off when resolved.

## Open

- [ ] **Flaky E2E test: "should preserve selected room tab across page refresh"** - Test in `frontend/e2e/settings-page.spec.ts:276` intermittently fails. Expected "Kitchen" but received "Living Room" after page refresh. Likely a race condition where room order isn't deterministic after reload, or localStorage persistence timing issue.

## Recently Fixed

- [x] **Real mode shows Bridge Connector instead of Settings** - Fresh browser visit without demo mode should show Settings page, not Bridge Connector. _(Fixed: When session restoration fails, now clears bridge IP and goes to settings instead of authentication)_

- [x] **Home tab has no active indicator in bottom nav** - After logging into Hive, the Home tab appears but has no visual indicator when selected. _(Fixed: Added useEffect to auto-switch selectedId from 'hive' to 'home' when homeDevices becomes available)_

- [x] **Reconnecting spinner shows for extended time** - Selecting Home tab causes "Reconnecting..." spinner to show indefinitely. _(Fixed: Added 10-second timeout to clear reconnecting state if reconnection takes too long)_

## Resolved

- [x] **Settings page Hive toggle state inconsistent** - Hive Heating toggle shows as OFF but displays a green connected indicator next to it. _(Fixed: Added useEffect in Dashboard to sync settings.services.hive.enabled with hiveConnected state)_

- [x] **Hive tokens not persisting/refreshing correctly** - After refreshing the Hive tab, shows "no devices found" message. _(Fixed: Now stores username during 2FA verification via hiveCredentialsManager.setUsername())_

- [x] **Hive connection state incorrect after server restart** - After restarting the dev server, the Settings page shows Hive as connected when it isn't. \_(Fixed: getConnectionStatus() now validates by attempting token refresh instead of optimistically reporting connected)

- [x] **Weather location not persisted** - The location used for weather display resets when the backend server restarts. Location should be saved to file and restored on startup. _(Fixed: settings now persist to `backend/data/settings.json`)_
- [x] **Hive username/password fields not styled** - Fields in settings page were missing CSS styles. _(Fixed: added `.settings-hive-input` and `.settings-hive-btn` styles to App.css)_
- [x] **Hive panel cards not styled** - Thermostat and schedule cards were missing CSS styles. _(Fixed: added `.hive-view`, `.hive-thermostat`, `.hive-schedule-*` styles to App.css)_
- [x] **Missing credentials error when pasting** - Browser email validation on username input interfered with pasted values. _(Fixed: changed input type from `email` to `text` with `autoComplete="email"`)_
- [x] **Hive login "missing_credentials" error** - Session token was not being passed to Hive API endpoints, causing 401 errors. _(Fixed: added `token` parameter to all Hive API functions in `hueApi.js` and `useHive.js`)_
