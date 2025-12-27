# Bugs

Known bugs to be fixed. Check off when resolved.

## Open

(none)

## Resolved

- [x] **Weather location not persisted** - The location used for weather display resets when the backend server restarts. Location should be saved to file and restored on startup. *(Fixed: settings now persist to `backend/data/settings.json`)*
