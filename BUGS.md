# Bugs

Known bugs to be fixed. Check off when resolved.

## Open

[ ] When the frontend is reconnecting, you should not be able to click any of the buttons. They should appear as inactive. They should reactivate once reconnected to the backend.
[ ] The project level npm package needs tidying up, the only task should be things like the run dev, deploy and production tasks. FE and BE specifics should be in the individual directories.

## Resolved

- [x] **Weather location not persisted** - The location used for weather display resets when the backend server restarts. Location should be saved to file and restored on startup. _(Fixed: settings now persist to `backend/data/settings.json`)_
