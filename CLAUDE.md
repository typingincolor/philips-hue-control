
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Home Control** - React/Express monorepo for smart home control. Integrates Philips Hue (lights, scenes, rooms, zones) and UK Hive (heating, hot water). Features true color display, responsive design, and Socket.IO real-time updates.

**Architecture:** Backend handles all business logic, exposing a V2 REST API with WebSocket. Frontend is a thin presentation layer consuming pre-computed data.

## UI Quality Standards (CRITICAL)

**Every frontend change MUST be visually verified before considering the task complete.**

### Mandatory Verification Process

1. **After ANY UI change**, take a screenshot using the browser tool
2. **Critically evaluate** what you see - don't assume it looks correct
3. **Check against this list** before declaring done:
   - [ ] Layout matches the requested design
   - [ ] No overlapping or cut-off text
   - [ ] Proper spacing and alignment (consistent margins/padding)
   - [ ] Colors are correct and have sufficient contrast
   - [ ] Interactive elements are visibly clickable (buttons look like buttons)
   - [ ] Responsive: check at mobile width (375px) if applicable
   - [ ] No console errors in browser dev tools
   - [ ] Loading/error states look intentional, not broken

### Common UI Bugs to Watch For

- **Text overflow:** Long names breaking layouts or getting cut off
- **Flexbox issues:** Items not aligning as expected, unexpected wrapping
- **Z-index problems:** Elements hidden behind others or overlays not working
- **Color issues:** Text unreadable against background, wrong theme colors
- **Spacing collapse:** Missing margins when elements are conditionally rendered
- **Icon sizing:** Icons too large/small relative to text
- **Touch targets:** Buttons/links too small on mobile (minimum 44x44px)
- **State mismatches:** UI not reflecting actual data state

### Definition of Done for UI Tasks

A UI task is NOT complete until:

1. Screenshot taken and visually inspected
2. All items on the checklist above pass
3. Tested with realistic data (not just empty or minimal states)
4. Edge cases considered (empty states, error states, loading states)
5. If it looks "off" or "not quite right" - investigate and fix it

### When in Doubt

- Take another screenshot after each fix
- Compare side-by-side with any mockups or descriptions provided
- Ask yourself: "Would I be proud to ship this?"
- If something seems wrong but you're not sure why, describe what you see

### Screenshot Requirements

When taking screenshots for verification:
- Capture the full component/page being worked on
- If responsive, capture at both desktop and mobile widths
- Include any hover/active states if relevant
- Capture error and loading states, not just success states

## Quick Start

```bash
npm run dev              # Start both servers (frontend:5173, backend:3001)
npm run test:all         # Run all unit tests (frontend + backend)
npm run test:e2e         # E2E tests (auto-starts servers on ports 5174/3002)
npm run deploy           # Build and start production
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run format:check     # Check formatting
```

**Demo Mode:** `http://localhost:5173/?demo=true` - Works without real Hue Bridge

## Key Architecture

### Monorepo Structure

- **Root:** Workspace manager, `config.yaml` (ports, settings)
- **Frontend:** React 18 + Vite 6 (`frontend/`)
- **Backend:** Express 5 (`backend/`)

### Authentication

Session-based with two modes:

- **Session Token:** `Authorization: Bearer <token>` header
- **Demo Mode:** `X-Demo-Mode: true` header (no bridge required)

### Dual-Mode Serving

- **Development:** Vite (5173) + Express (3001) separate
- **Production:** Express serves static files from `backend/public/`

## Hue API v2 (CLIP API)

Uses **v2 API exclusively** (`/clip/v2/resource/{type}`).

### Critical Pattern: Room→Device→Light Hierarchy

V2 API has indirect relationships. To get lights in a room:

1. Fetch rooms, devices, lights
2. Build device→lights map from `device.services`
3. Walk `room.children` to find device refs
4. Map device UUIDs to light UUIDs

```javascript
// room.children = [{ rid: "device-uuid", rtype: "device" }]
// device.services = [{ rid: "light-uuid", rtype: "light" }]
// Must traverse: room → device → light
```

### Key Resources

- `light` - Light state, color, brightness
- `room` - Contains device children
- `device` - Contains light service refs
- `scene` - Preset light configurations
- `behavior_instance` - MotionAware zone configs
- `convenience_area_motion` - Real-time motion status

## Demo Mode

Backend-based demo allows testing without Hue Bridge:

- URL param: `?demo=true`
- Header: `X-Demo-Mode: true` (auto-added by frontend)
- Socket.IO auth: `{ demoMode: true }`

**Key files:** `backend/middleware/demoMode.js`, `backend/services/mockData.js`, `backend/services/mockHueClient.js`

## Backend Services

| Service                             | Purpose                     |
| ----------------------------------- | --------------------------- |
| `hueClient.js`                      | Real Hue Bridge client      |
| `mockHueClient.js`                  | Mock client for demo        |
| `hueClientFactory.js`               | Returns real or mock client |
| `dashboardService.js`               | Dashboard data aggregation  |
| `roomService.js` / `zoneService.js` | Hierarchy building          |
| `motionService.js`                  | Motion zone handling        |
| `automationService.js`              | Smart scene automations     |
| `sessionManager.js`                 | Session token management    |
| `websocketService.js`               | Socket.IO real-time updates |
| `hiveService.js`                    | UK Hive heating integration |
| `hiveAuthService.js`                | Hive AWS Cognito auth + 2FA |
| `hiveCredentialsManager.js`         | Encrypted Hive credentials  |
| `homeService.js`                    | Unified Home aggregation    |
| `roomMappingService.js`             | Service room → Home room    |
| `deviceNormalizer.js`               | Device format normalization |
| `ServiceRegistry.js`                | Plugin registration         |
| `plugins/HuePlugin.js`              | Hue service plugin          |
| `plugins/HivePlugin.js`             | Hive service plugin         |

## Frontend Structure

**Main Flow:** App.jsx (auth) → LightControl/index.jsx → TopToolbar + BottomNav + MainPanel

**Key Hooks:** `useHueBridge` (connection), `useWebSocket` (real-time), `useSettings` (preferences), `useHive` (Hive heating)

**Key Services:**

- `apiUtils.js` - Shared `getHeaders()`, `handleResponse()` for V2 clients
- `authApi.js` - V2 Auth API client with session token management
- `settingsApi.js` - V2 Settings API client
- `weatherApi.js` - V2 Weather API client
- `automationsApi.js` - V2 Automations API client
- `homeApi.js` - V2 Home API client
- `homeAdapter.js` - Transforms V2 Home format to V1 Dashboard format
- `servicesApi.js` - V2 Services API client (Hue/Hive connection)

**UI Text:** All user-facing text in `constants/uiText.js` - tests use these constants.

## API Endpoints (V2)

### Authentication

| Method | Endpoint                       | Purpose                  |
| ------ | ------------------------------ | ------------------------ |
| POST   | `/api/v2/services/hue/pair`    | Pair with Hue bridge     |
| POST   | `/api/v2/services/hue/connect` | Connect with credentials |
| POST   | `/api/v2/auth/session`         | Create session           |
| POST   | `/api/v2/auth/refresh`         | Refresh session          |
| DELETE | `/api/v2/auth/session`         | Revoke session           |
| POST   | `/api/v2/auth/disconnect`      | Disconnect from bridge   |
| GET    | `/api/v2/auth/bridge-status`   | Check stored credentials |

### Dashboard & Controls

| Method | Endpoint                          | Purpose                |
| ------ | --------------------------------- | ---------------------- |
| GET    | `/api/v2/dashboard`               | Full dashboard data    |
| PUT    | `/api/v2/lights/:id`              | Update light state     |
| PUT    | `/api/v2/rooms/:id/lights`        | Update all room lights |
| PUT    | `/api/v2/zones/:id/lights`        | Update all zone lights |
| POST   | `/api/v2/scenes/:id/activate`     | Activate scene         |
| GET    | `/api/v2/automations`             | List automations       |
| POST   | `/api/v2/automations/:id/trigger` | Trigger automation     |
| GET    | `/api/v2/settings`                | Get settings           |
| PUT    | `/api/v2/settings`                | Update settings        |
| PUT    | `/api/v2/settings/location`       | Update location        |
| DELETE | `/api/v2/settings/location`       | Clear location         |
| GET    | `/api/v2/weather`                 | Weather data           |

### Services (Hive)

| Method | Endpoint                           | Purpose                |
| ------ | ---------------------------------- | ---------------------- |
| POST   | `/api/v2/services/hive/connect`    | Connect to Hive (→2FA) |
| POST   | `/api/v2/services/hive/verify-2fa` | Verify SMS 2FA code    |
| POST   | `/api/v2/services/hive/disconnect` | Disconnect from Hive   |
| GET    | `/api/v2/services/hive/connection` | Hive connection status |
| GET    | `/api/v2/services/hive/status`     | Hive thermostat status |
| GET    | `/api/v2/services/hive/schedules`  | Hive heating schedules |

**WebSocket:** Connect to `/api/v2/ws`, auth with `{ sessionToken }` or `{ demoMode: true }`

**API Docs:** `http://localhost:3001/api/v2/docs/` (Swagger UI, requires trailing slash)

## Rate Limiting

API endpoints are rate limited per IP address. Demo mode bypasses limits.

| Endpoint         | Limit               |
| ---------------- | ------------------- |
| `/api/v2/*`      | 100 requests/minute |
| `/api/discovery` | 10 requests/minute  |

Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` (when limited)

## Testing

```bash
npm run test:all          # All unit tests (frontend + backend)
npm run test:e2e          # E2E tests (auto-starts servers on ports 5174/3002)
npm run test:mutation:all # Mutation testing

# Run single test file
npm test --workspace=frontend -- src/hooks/useSession.test.js
npm test --workspace=backend -- test/services/roomService.test.js

# Run tests matching pattern
npm test --workspace=frontend -- -t "should handle"

# Watch mode (interactive)
npm test --workspace=frontend
npm test --workspace=backend
```

See `frontend/TESTING.md` for detailed testing documentation.

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/routes/v2/`
2. Register in `backend/routes/v2/index.js`
3. Create frontend client in `frontend/src/services/` using `apiUtils.js`

### Adding a New Component

1. Create in `frontend/src/components/`
2. Add UI text to `frontend/src/constants/uiText.js`
3. Add tests in same directory
4. **Take screenshot and verify visually before committing**

### Modifying Existing UI

1. Take a "before" screenshot for reference
2. Make changes incrementally
3. Take "after" screenshot and compare
4. Verify on mobile width (375px) if component is responsive
5. Check for regressions in related components

## Performance Notes

- **Backend caching:** 5-minute TTL for static resources
- **Socket.IO polling:** 15-second interval for dynamic data
- **Brightness minimum:** 5% when on (prevents 0% artifacts)

## Network Requirements

- **Development:** Frontend localhost:5173, Backend 0.0.0.0:3001
- **Production:** Single server 0.0.0.0:3001
- **Requirement:** Backend must be on same LAN as Hue Bridge

## MotionAware Zones

Uses v2 API only (not traditional `/sensors` endpoint):

1. Fetch `behavior_instance` for zone names
2. Fetch `convenience_area_motion` for motion status
3. Match via `configuration.motion.motion_service.rid`

## Design System Reference

When creating or modifying UI components, maintain consistency with existing patterns:

### Colors (from existing CSS)
- Primary actions: Emerald green (`#10b981`, `#059669`)
- Backgrounds: Neutral grays (`#f5f5f5`, `#e5e5e5`, `#1a1a1a` dark)
- Text: `#171717` (light mode), `#fafafa` (dark mode)
- Accents: Blue for links/info (`#3b82f6`)

### Spacing
- Card padding: `1rem` (16px)
- Grid gaps: `0.75rem` to `1rem`
- Button padding: `0.5rem 1rem`

### Typography
- Base size: 16px
- Small text: 0.875rem (14px)
- Headers: 1.25rem - 1.5rem
- Font: System font stack

### Component Patterns
- Cards: Rounded corners (`0.75rem`), subtle shadow
- Buttons: Rounded (`0.5rem`), clear hover states
- Icons: Sized relative to text (1em or 1.25em)
- Touch targets: Minimum 44x44px on mobile
