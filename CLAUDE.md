# CLAUDE.md

## Project Overview

**Philips Hue Light Control** - React/Express monorepo for controlling Hue lights locally via the Hue Bridge API. Features true color display, responsive design (iPhone 14+, iPad, Raspberry Pi 7"), room/zone organization, scene management, MotionAware zones, and WebSocket real-time updates.

**Architecture:** Backend handles all business logic, exposing a v1 REST API with WebSocket. Frontend is a thin presentation layer consuming pre-computed data.

## Quick Start

```bash
npm run dev              # Start both servers (frontend:5173, backend:3001)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run test             # Unit tests (watch mode)
npm run test:run         # Unit tests (CI)
npm run test:e2e         # E2E tests (auto-starts servers on ports 5174/3002)
npm run deploy           # Build and start production
```

**Demo Mode:** `http://localhost:5173/?demo=true` - Works without real Hue Bridge

## Key Architecture

### Monorepo Structure

- **Root:** Workspace manager, `config.json` (ports, settings)
- **Frontend:** React 18 + Vite 6 (`frontend/`)
- **Backend:** Express 5 (`backend/`)

### API Proxy Pattern

Backend proxies Hue Bridge requests (CORS + self-signed cert handling):

- Frontend: `/api/*` → Backend → Hue Bridge
- Bridge IP via query param: `?bridgeIp={ip}`
- Auth via header: `hue-application-key: {username}`

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
- WebSocket auth: `{ type: 'auth', demoMode: true }`

**Key files:**

- `backend/middleware/demoMode.js` - Detects header
- `backend/services/mockData.js` - Demo data
- `backend/services/mockHueClient.js` - Mock Hue client

## Backend Services

| Service               | Purpose                     |
| --------------------- | --------------------------- |
| `hueClient.js`        | Real Hue Bridge client      |
| `mockHueClient.js`    | Mock client for demo        |
| `hueClientFactory.js` | Returns real or mock client |
| `dashboardService.js` | Dashboard data aggregation  |
| `roomService.js`      | Room hierarchy building     |
| `zoneService.js`      | Zone hierarchy building     |
| `motionService.js`    | Motion zone handling        |
| `statsService.js`     | Statistics calculation      |
| `sessionManager.js`   | Session token management    |
| `settingsService.js`  | Per-session settings        |
| `weatherService.js`   | Weather API (Open-Meteo)    |
| `websocketService.js` | Real-time updates           |

## Frontend Components

### Main Flow

1. **App.jsx** - 3-step auth flow: Discovery → Authentication → LightControl
2. **LightControl/index.jsx** - Main UI container
3. **TopToolbar.jsx** - Header with motion dots, stats, weather, logout
4. **BottomNav.jsx** - Room tabs (drag-scrollable)
5. **MainPanel.jsx** - Content switcher (room/zones)
6. **RoomContent.jsx** - Light tiles grid
7. **LightTile.jsx** - Large light button with brightness fill
8. **SceneDrawer.jsx** - Slide-out scene selector
9. **ZonesView.jsx** - All zones list

### Data Flow

- **localStorage:** Bridge IP, username persistence
- **useHueBridge:** Bridge connection state
- **useDemoMode:** URL param detection
- **useWebSocket:** Real-time updates with reconnection
- **hueApi:** API calls with demo mode header

### UI Text Constants

All user-facing text centralized in `constants/uiText.js`. Tests use these constants to prevent brittleness.

## CSS Architecture

Single file: `frontend/src/App.css` (dark theme only)

**Key variables:**

- `--bg-primary: #1a1a1a`, `--bg-secondary: #2d2d2d`
- `--accent-primary: #f59e0b` (amber)
- `--text-primary: #ffffff`, `--text-secondary: #a0a0a0`

**Layout:** Fixed top toolbar + bottom nav, main panel between them.

**Responsive breakpoints:**

- `max-width: 500px` - Phone (2×4 grid)
- `min-width: 600px` - Tablet/Pi (4×2 grid)

## Testing

See `frontend/TESTING.md` for detailed testing documentation.

### Test Suites

- **Backend:** 501 tests (services, middleware, utils)
- **Frontend:** 257 tests (hooks, components, integration)
- **E2E:** 158 tests (Playwright, demo mode)

### Running Tests

```bash
npm run test              # Watch mode
npm run test:run          # CI mode
npm run test:coverage     # Coverage report
npm run test:mutation     # Mutation testing (~1 min)
npm run test:e2e          # E2E tests (Playwright)
```

### E2E Test Ports

E2E tests run on isolated ports to avoid dev server conflicts:

- Frontend: 5174 (not 5173)
- Backend: 3002 (not 3001)

Playwright auto-starts and stops both servers.

## API Endpoints

### Auth

- `POST /api/v1/auth/connect` - Connect to bridge

### Dashboard

- `GET /api/v1/dashboard` - Full dashboard data

### Lights

- `PUT /api/v1/lights/:id` - Update light state

### Rooms

- `PUT /api/v1/rooms/:id/lights` - Update all room lights

### Zones

- `PUT /api/v1/zones/:id/lights` - Update all zone lights

### Scenes

- `POST /api/v1/scenes/:id/activate` - Activate scene

### Settings

- `GET /api/v1/settings` - Get settings
- `PUT /api/v1/settings` - Update settings
- `PUT /api/v1/settings/location` - Update location
- `DELETE /api/v1/settings/location` - Clear location

### Weather

- `GET /api/v1/weather` - Get weather for stored location

### WebSocket

- Connect: `/api/v1/ws`
- Auth: `{ type: 'auth', sessionToken, demoMode? }`
- Events: `initial_state`, `light_update`, `motion_update`

## Performance

- **Backend caching:** 5-minute TTL for static resources
- **WebSocket polling:** 15-second interval for dynamic data
- **Optimistic updates:** Immediate UI response
- **Brightness minimum:** 5% when on (prevents 0% artifacts)
- **WebSocket reconnection:** Exponential backoff (1s→16s, 5 attempts)

## File Structure

```
/
├── config.json                    # Centralized config
├── CLAUDE.md                      # This file
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app + auth flow
│   │   ├── App.css               # All styles
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API services
│   │   ├── utils/                # Pure functions
│   │   └── constants/            # Config values
│   ├── e2e/                      # Playwright tests
│   ├── TESTING.md                # Test documentation
│   ├── playwright.config.ts      # E2E config
│   └── vite.config.js            # Vite config
└── backend/
    ├── server.js                 # Express server
    ├── middleware/               # Auth, demo mode
    ├── services/                 # Business logic
    ├── routes/v1/                # API routes
    ├── utils/                    # Utilities
    └── constants/                # Config values
```

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/routes/v1/`
2. Add to route aggregator `backend/routes/v1/index.js`
3. Add frontend method in `frontend/src/services/hueApi.js`

### Adding a New Component

1. Create in `frontend/src/components/`
2. Add UI text to `frontend/src/constants/uiText.js`
3. Add tests in same directory

### Debugging

```bash
curl http://localhost:3001/api/health  # Check backend
```

Backend logs all proxied requests. Check port 5173 for Vite dev server.

## Network

- **Development:** Frontend localhost:5173, Backend 0.0.0.0:3001
- **Production:** Single server 0.0.0.0:3001
- **Requirement:** Backend must be on same LAN as Hue Bridge

## MotionAware Zones

Uses v2 API only (not traditional `/sensors` endpoint):

1. Fetch `behavior_instance` for zone names
2. Fetch `convenience_area_motion` for motion status
3. Match via `configuration.motion.motion_service.rid`
