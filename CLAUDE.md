# CLAUDE.md

## Project Overview

**Philips Hue Light Control** - React/Express monorepo for controlling Hue lights locally via the Hue Bridge API. Features true color display, responsive design, room/zone organization, scene management, MotionAware zones, and Socket.IO real-time updates.

**Architecture:** Backend handles all business logic, exposing a v1 REST API with WebSocket. Frontend is a thin presentation layer consuming pre-computed data.

## Quick Start

```bash
npm run dev              # Start both servers (frontend:5173, backend:3001)
npm run test:all         # Run all unit tests (frontend + backend)
npm run test:e2e         # E2E tests (auto-starts servers on ports 5174/3002)
npm run deploy           # Build and start production
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

## Frontend Structure

**Main Flow:** App.jsx (auth) → LightControl/index.jsx → TopToolbar + BottomNav + MainPanel

**Key Hooks:** `useHueBridge` (connection), `useWebSocket` (real-time), `useSettings` (preferences), `useHive` (Hive heating)

**UI Text:** All user-facing text in `constants/uiText.js` - tests use these constants.

## API Endpoints

| Method  | Endpoint                          | Purpose                |
| ------- | --------------------------------- | ---------------------- |
| POST    | `/api/v1/auth/connect`            | Connect to bridge      |
| GET     | `/api/v1/dashboard`               | Full dashboard data    |
| PUT     | `/api/v1/lights/:id`              | Update light state     |
| PUT     | `/api/v1/rooms/:id/lights`        | Update all room lights |
| PUT     | `/api/v1/zones/:id/lights`        | Update all zone lights |
| POST    | `/api/v1/scenes/:id/activate`     | Activate scene         |
| GET     | `/api/v1/automations`             | List automations       |
| POST    | `/api/v1/automations/:id/trigger` | Trigger automation     |
| GET/PUT | `/api/v1/settings`                | User settings          |
| GET     | `/api/v1/weather`                 | Weather data           |
| POST    | `/api/v1/hive/connect`            | Connect to Hive (→2FA) |
| POST    | `/api/v1/hive/verify-2fa`         | Verify SMS 2FA code    |
| POST    | `/api/v1/hive/disconnect`         | Disconnect from Hive   |
| GET     | `/api/v1/hive/connection`         | Hive connection status |
| GET     | `/api/v1/hive/status`             | Hive thermostat status |
| GET     | `/api/v1/hive/schedules`          | Hive heating schedules |

**WebSocket:** Connect to `/api/v1/ws`, auth with `{ sessionToken }` or `{ demoMode: true }`

**API Docs:** `http://localhost:3001/api/v1/docs/` (Swagger UI, requires trailing slash)

## Rate Limiting

API endpoints are rate limited per IP address. Demo mode bypasses limits.

| Endpoint         | Limit               |
| ---------------- | ------------------- |
| `/api/v1/*`      | 100 requests/minute |
| `/api/discovery` | 10 requests/minute  |

Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` (when limited)

## Testing

See `frontend/TESTING.md` for detailed documentation.

```bash
npm run test:all          # All unit tests
npm run test:e2e          # E2E tests
npm run test:mutation:all # Mutation testing
```

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/routes/v1/`
2. Add to `backend/routes/v1/index.js`
3. Add frontend method in `frontend/src/services/hueApi.js`

### Adding a New Component

1. Create in `frontend/src/components/`
2. Add UI text to `frontend/src/constants/uiText.js`
3. Add tests in same directory

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
