# Bugs

Known bugs to be fixed. Check off when resolved.

## Open

- [ ] **Settings page Hive toggle state inconsistent** - Hive Heating toggle shows as OFF but displays a green connected indicator next to it. The toggle state and connection indicator are out of sync.

- [ ] **Hive tokens not persisting/refreshing correctly** - After refreshing the Hive tab, shows "no devices found" message. Hive authentication tokens may not be persisting or refreshing correctly between page loads.

- [ ] **Hive connection state incorrect after server restart** - After restarting the dev server, the Settings page shows Hive as connected (green indicator) even though it isn't. Related to bug #1 - state not being properly restored/validated on startup.

## Resolved

- [x] **Weather location not persisted** - The location used for weather display resets when the backend server restarts. Location should be saved to file and restored on startup. _(Fixed: settings now persist to `backend/data/settings.json`)_
- [x] **Hive username/password fields not styled** - Fields in settings page were missing CSS styles. _(Fixed: added `.settings-hive-input` and `.settings-hive-btn` styles to App.css)_
- [x] **Hive panel cards not styled** - Thermostat and schedule cards were missing CSS styles. _(Fixed: added `.hive-view`, `.hive-thermostat`, `.hive-schedule-*` styles to App.css)_
- [x] **Missing credentials error when pasting** - Browser email validation on username input interfered with pasted values. _(Fixed: changed input type from `email` to `text` with `autoComplete="email"`)_
- [x] **Hive login "missing_credentials" error** - Session token was not being passed to Hive API endpoints, causing 401 errors. _(Fixed: added `token` parameter to all Hive API functions in `hueApi.js` and `useHive.js`)_
