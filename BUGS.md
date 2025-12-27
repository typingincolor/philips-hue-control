# Bugs

Known bugs to be fixed. Check off when resolved.

## Open

[ ] When the frontend is reconnecting, you should not be able to click any of the buttons. They should appear as inactive. They should reactivate once reconnected to the backend.
[ ] The project level npm package needs tidying up, the only task should be things like the run dev, deploy and production tasks. FE and BE specifics should be in the individual directories.

## Resolved

- [x] **Weather location not persisted** - The location used for weather display resets when the backend server restarts. Location should be saved to file and restored on startup. _(Fixed: settings now persist to `backend/data/settings.json`)_
- [x] **Hive username/password fields not styled** - Fields in settings drawer were missing CSS styles. _(Fixed: added `.settings-hive-input` and `.settings-hive-btn` styles to App.css)_
- [x] **Hive panel cards not styled** - Thermostat and schedule cards were missing CSS styles. _(Fixed: added `.hive-view`, `.hive-thermostat`, `.hive-schedule-*` styles to App.css)_
- [x] **Missing credentials error when pasting** - Browser email validation on username input interfered with pasted values. _(Fixed: changed input type from `email` to `text` with `autoComplete="email"`)_
- [x] **Hive login "missing_credentials" error** - Session token was not being passed to Hive API endpoints, causing 401 errors. _(Fixed: added `token` parameter to all Hive API functions in `hueApi.js` and `useHive.js`)_
