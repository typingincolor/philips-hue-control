# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Philips Hue Light Control** web application built as a monorepo with separated frontend (React) and backend (Express) workspaces. The app controls Philips Hue lights locally through the Hue Bridge API, featuring **true color display** with mathematical color space conversion, **information-dense UI** with brightness indicators and room statistics, **responsive design** optimized for iPhone 14+ and iPad, room organization, scene management, and **MotionAware zone display** with real-time motion detection.

## Development Commands

### Start Development (Both Servers)
```bash
npm run dev
```
- Frontend runs on http://localhost:5173 (Vite dev server with hot reload)
- Backend runs on http://localhost:3001 (Express API proxy)
- **Always use port 5173 for development** - this is the Vite dev server with live reloading

### Run Only Frontend
```bash
npm run dev:frontend
```

### Run Only Backend
```bash
npm run dev:backend
```

### Testing
```bash
npm run test               # Run tests in watch mode
npm run test:ui            # Open Vitest UI
npm run test:run           # Run tests once (CI mode)
npm run test:coverage      # Generate coverage report
npm run test:mutation      # Run mutation testing
```

### Production Build & Deploy
```bash
npm run deploy
```
This runs: build → build:backend → start

Or step-by-step:
```bash
npm run build              # Build frontend to frontend/dist/
npm run build:backend      # Copy frontend build to backend/public/
npm run start              # Start production server on port 3001
```

## Architecture

### Monorepo Structure
- **Root**: Workspace manager with shared config
- **Frontend workspace**: React 18 + Vite 6
- **Backend workspace**: Express 5 server

### Key Architectural Patterns

#### 1. Centralized Configuration
All configuration lives in **`config.json`** at the project root:
- Server ports and host settings
- Hue API endpoints
- Development ports

Both frontend (vite.config.js) and backend (server.js) read from this file. Environment variables can override these values.

#### 2. API Proxy Pattern
The backend acts as a **CORS proxy** for the Hue Bridge:
- Hue Bridge doesn't send CORS headers and uses self-signed HTTPS certificates
- Backend forwards all `/api/hue/*` requests to the bridge with proper headers
- Backend accepts self-signed certificates via custom HTTPS agent
- Wildcard route: `app.all(/^\/api\/hue\/(.*)/, ...)`

**Important**: The proxy extracts bridge IP from query parameter `?bridgeIp={ip}` on every request, allowing the frontend to control which bridge to connect to without hardcoding.

#### 3. Relative URL Strategy
Frontend uses **empty string `PROXY_URL = ''`** in hueApi.js:
- Development: Vite proxy forwards `/api/*` to backend automatically
- Production: Same-origin requests (backend serves both API and frontend)
- **No hardcoded localhost** - works on any machine/network

#### 4. Dual-Mode Serving
**Development**: Separate frontend (Vite) and backend (Express) servers
**Production**: Backend serves both API and static frontend files from `backend/public/`

### Hue API Integration

This app uses **Philips Hue API v2** (CLIP API) exclusively for all operations. API v1 methods have been removed.

#### API v2 Architecture
- **Base path**: `/clip/v2/resource/{resource_type}`
- **Authentication**: `hue-application-key` header (not URL-based)
- **IDs**: UUIDs instead of numeric strings
- **Response format**: `{ errors: [], data: [...] }` array structure
- **Resource types**: light, room, device, scene, behavior_instance, convenience_area_motion

#### Key Endpoints Used
- `/clip/v2/resource/light` - Get/control all lights
- `/clip/v2/resource/room` - Get rooms with device children
- `/clip/v2/resource/device` - Get devices with light service references
- `/clip/v2/resource/scene` - Get/activate scenes
- `/clip/v2/resource/behavior_instance` - MotionAware zone configurations
- `/clip/v2/resource/convenience_area_motion` - Real-time motion detection

#### V2 Data Structures

**Light**:
```javascript
{
  id: "uuid",                          // UUID identifier
  on: { on: true },                    // Nested on state
  dimming: { brightness: 100.0 },      // Percentage, not 0-254
  metadata: { name: "Living Room 1" }  // Name in metadata
}
```

**Room Hierarchy** (room → device → light):
```javascript
{
  id: "room-uuid",
  metadata: { name: "Living Room" },
  children: [
    { rid: "device-uuid", rtype: "device" }  // References to devices
  ]
}
```

**Device** (contains light references):
```javascript
{
  id: "device-uuid",
  services: [
    { rid: "light-uuid", rtype: "light" }  // Light service references
  ]
}
```

**Critical Pattern**: To get lights in a room:
1. Fetch rooms, devices, and lights
2. Build device→lights map from device.services
3. Walk room.children to find device references
4. Map device UUIDs to their light UUIDs

Example v2 request:
```javascript
fetch('/api/hue/clip/v2/resource/light?bridgeIp={ip}', {
  headers: { 'hue-application-key': username }
})
```

### Component Architecture

#### Main Flow Components
1. **App.jsx**: Manages 3-step authentication flow
   - Step 1: BridgeDiscovery (find/enter bridge IP)
   - Step 2: Authentication (link button press)
   - Step 3: LightControl (main UI with lights)

2. **LightControl/index.jsx**: Main control interface
   - Fetches lights, rooms, devices, scenes on mount using v2 API
   - 30-second auto-refresh polling using `usePolling` hook
   - Builds room→device→light hierarchy from v2 data using `buildRoomHierarchy` utility
   - Groups lights by room in card layout
   - Integrates MotionZones component
   - Works natively with v2 data structures (no adapters)

3. **LightControl/RoomCard.jsx**: Room display component
   - Displays room name, status badges, and controls
   - Shows "{X} of {Y} on" count and average brightness
   - Renders SceneSelector and "All On/Off" button
   - Contains grid of LightButton components

4. **LightControl/LightButton.jsx**: Individual light control
   - Displays light color using `getLightColor` utility
   - Shows dynamic shadows using `getLightShadow` utility
   - Handles click events for toggling
   - Displays light name and current state

5. **LightControl/SceneSelector.jsx**: Scene dropdown
   - Renders scene options for the current room
   - Handles scene activation
   - Resets to placeholder after selection

6. **LightControl/DashboardSummary.jsx**: Statistics display
   - Shows total lights on, room count, scene count
   - Displays demo mode badge when active

7. **MotionZones.jsx**: MotionAware zone display
   - Polls every 30 seconds using `usePolling` hook
   - Fetches from **two v2 endpoints** and combines data using `parseMotionSensors` utility
   - Returns `null` if no MotionAware zones configured (auto-hide)
   - Shows green dot 🟢 (no motion) or red dot 🔴 (motion detected)

#### Data Flow
- **localStorage**: Persists bridgeIp and username across sessions (keys from `constants/storage.js`)
- **useHueBridge hook**: Manages bridge connection state
- **useHueApi hook**: Selects between real and mock API based on demo mode
- **useDemoMode hook**: Detects demo mode from URL parameters
- **usePolling hook**: Reusable interval-based polling with cleanup
- **hueApi service**: All API calls go through this service layer
- **Utilities**: Pure functions for data transformation (color, rooms, validation, motion sensors)
- **Constants**: Centralized configuration values (polling intervals, storage keys, colors, messages)

### CSS Architecture
- **Single CSS file**: `frontend/src/App.css` (no CSS modules)
- **Responsive grid**: CSS Grid with `repeat(auto-fill, minmax(440px, 1fr))`
- **Mobile optimization**: Reduced padding on iPhone 14+ (calc(100% - 16px) container width)
- **Dynamic sizing**: CSS `clamp()` for viewport-responsive buttons and icons
- **Modern design**: Tailwind-inspired color palette, layered shadows, cubic-bezier transitions
- **Component classes**: `.motion-zones`, `.room-group`, `.light-bulb-button`, `.lights-summary`, etc.

### UI Features & Patterns

#### Color Display System
Light buttons display actual bulb colors using mathematical color space conversions with **brightness-aware warm dim blending** for realistic visualization:

**Color Conversion Functions** (`utils/colorConversion.js`):
```javascript
// Convert Hue xy coordinates (CIE 1931) to RGB with brightness scaling
xyToRgb(x, y, brightness = 100) {
  // xy → XYZ → sRGB with gamma correction
  // Uses gamma curve: brightnessScale = (brightness / 100)^2.2
  // Returns { r, g, b } in 0-255 range scaled by brightness
}

// Convert color temperature (mirek) to RGB with brightness scaling
mirekToRgb(mirek, brightness = 100) {
  // mirek → Kelvin → RGB approximation
  // Applies linear brightness scaling to RGB components
  // Returns { r, g, b } in 0-255 range scaled by brightness
}

// Warm dim blending with race condition handling
getLightColor(light) {
  // Algorithm:
  // 1. Get actual color from xy or color_temperature
  // 2. Blend between warm candlelight (15%) and actual color (50%) using smoothstep
  // 3. Below 15%: Pure warm (255, 200, 130)
  // 4. 15-50%: Smooth S-curve transition
  // 5. Above 50%: Pure actual color
  //
  // Fallback for race conditions (missing color data during API loads):
  // - Blends between warm and neutral white (255, 245, 235)
  // - Prevents green flashing during scene transitions
  //
  // Returns CSS color string: "rgb(r, g, b)" or null
}

// Smart shadow system - colored glow only for bright lights
getLightShadow(light, lightColor) {
  // Brightness < 50%: Neutral gray shadow only
  // Brightness ≥ 50%: Colored glow with intensity scaling
  // Glow opacity scales from 20% (at 50%) to 60% (at 100%)
  // Returns CSS box-shadow string
}
```

**Warm Dim Blending Algorithm**:
- **DIM_START = 15%**: Pure warm candlelight color below this threshold
- **BRIGHT_START = 50%**: Pure actual color above this threshold
- **Transition zone (15-50%)**: Smoothstep curve `t²(3-2t)` for gradual blending
- **Warm color**: RGB(255, 200, 130) - mimics candlelight appearance
- **Rationale**: Human eyes perceive very dim colored lights as warm/yellowish regardless of actual color

**Race Condition Handling**:
- During scene transitions, Hue API may return light state before color properties load
- Fallback system uses neutral white RGB(255, 245, 235) with brightness-based blending
- Prevents green CSS fallback from appearing during data loads

**Dynamic Button Styling**:
- Inline styles override default CSS when color data available
- Background gradient uses blended color from `getLightColor()`
- Box-shadow determined by `getLightShadow()` based on brightness threshold
- Hover uses `filter: brightness(0.85)` for universal darkening
- Works with RGB colors, white temperatures, and handles missing data gracefully

#### Information Density Features

**Dashboard Summary** (LightControl.jsx):
```javascript
// Overall statistics at top of page
<div className="lights-summary">
  <div className="summary-stat">
    <span className="stat-value">{totalLightsOn}</span>
    <span className="stat-label">lights on</span>
  </div>
  {/* Room count and scene count stats */}
</div>
```

**Room Status System**:
```javascript
// Helper function calculates room statistics with race condition handling
getRoomLightStats(roomLights) {
  const lightsOnCount = roomLights.filter(light => light.on?.on).length;
  const totalLights = roomLights.length;

  // Calculate average brightness with fallback for missing data
  const lightsOn = roomLights.filter(light => light.on?.on);
  const averageBrightness = lightsOn.length > 0
    ? lightsOn.reduce((sum, light) => {
        const brightness = light.dimming?.brightness ?? 50; // 50% fallback
        return sum + brightness;
      }, 0) / lightsOn.length
    : 0;

  return { lightsOnCount, totalLights, averageBrightness };
}
```

**Race Condition Handling**:
- During scene transitions, `light.dimming?.brightness` may be temporarily undefined
- Fallback to 50% prevents brightness from dropping to 0 and causing flickering
- Visibility condition uses `lightsOnCount > 0` instead of `averageBrightness > 0` for stability

**Visual Elements**:
- **Status badges**: "{X} of {Y} on" for each room
- **Brightness badge**: Compact badge showing average room brightness percentage
  - Always visible for consistent layout alignment
  - Shows "—" placeholder when no lights are on
  - Blue styling (background: #eff6ff, text: #3b82f6)
  - Minimum width ensures consistent sizing
- **Per-light overlays**: Individual brightness percentages removed for cleaner design
- **Responsive overflow**: Ellipsis handling for long names

#### Responsive Design Strategy

**Breakpoints**:
- `max-width: 768px` - Mobile devices (reduced padding, smaller fonts)
- `min-width: 1800px` - Large screens (cap at 4 rooms per row)

**Mobile Optimizations**:
- Container: `calc(100% - 16px)` width, `8px` padding
- Header/footer: `12px` padding
- Button size: `clamp(60px, 4vw, 80px)` scales with viewport

**iPad Optimizations**:
- Buttons scale up to 82px on iPad Pro (1024px)
- Text labels increase to 100px max-width
- Logo scales with `clamp(60px, 15vw, 120px)`

**Layout Grid**:
- Room cards: `repeat(auto-fill, minmax(440px, 1fr))`
- Light buttons: `repeat(auto-fit, minmax(var(--button-size), 1fr))`
- Maximum 4 rooms per row via media query
- 5 light buttons per row when space allows

## Testing Infrastructure

### Test Organization

The project includes comprehensive testing with **127 unit tests** achieving a **73.25% mutation score**:

```
frontend/src/
├── utils/
│   ├── colorConversion.test.js     # 31 tests - xy/mirek to RGB, warm dim blending
│   ├── roomUtils.test.js           # 23 tests - Room hierarchy, scene filtering
│   ├── validation.test.js          # 8 tests - IP validation
│   └── motionSensors.test.js       # 13 tests - Motion data parsing
├── hooks/
│   ├── useDemoMode.test.js         # 9 tests - URL parameter parsing
│   ├── useHueApi.test.js           # 4 tests - API selection (real vs mock)
│   └── usePolling.test.js          # 10 tests - Interval polling with timers
└── components/LightControl/
    ├── DashboardSummary.test.jsx   # 5 tests - Statistics rendering
    ├── SceneSelector.test.jsx      # 11 tests - Scene dropdown interactions
    └── LightButton.test.jsx        # 13 tests - Light button rendering
```

### Testing Stack

- **Vitest 4.0** - Fast, Vite-native test runner with jsdom environment
- **@testing-library/react** - Component testing with user-centric queries
- **@testing-library/user-event** - Realistic user interaction simulation
- **Stryker Mutator 9.4** - Mutation testing to validate test effectiveness
- **Fake timers** - `vi.useFakeTimers()` for testing polling intervals

### Running Tests

**Watch mode** (auto-runs on changes):
```bash
npm run test
```

**Interactive UI** (visual test explorer):
```bash
npm run test:ui
```

**Coverage report**:
```bash
npm run test:coverage
# Opens frontend/coverage/index.html
```

**Mutation testing** (validates test quality):
```bash
npm run test:mutation
# Takes ~1 minute, opens frontend/reports/mutation/index.html
```

### Testing Patterns

#### Testing Utilities (Pure Functions)
```javascript
import { describe, it, expect } from 'vitest';
import { xyToRgb } from './colorConversion';

describe('colorConversion', () => {
  it('should convert red color correctly', () => {
    const result = xyToRgb(0.64, 0.33, 100);
    expect(result.r).toBeGreaterThan(result.b); // Red > Blue
    expect(result.r).toBeGreaterThan(result.g); // Red > Green
  });
});
```

#### Testing Hooks with Mocks
```javascript
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./useDemoMode', () => ({
  useDemoMode: vi.fn()
}));

it('should return hueApi when not in demo mode', () => {
  useDemoModeMock.mockReturnValue(false);
  const { result } = renderHook(() => useHueApi());
  expect(result.current).toBe(hueApi);
});
```

#### Testing Components with User Events
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should call onActivate when scene is selected', async () => {
  const user = userEvent.setup();
  const onActivate = vi.fn();
  render(<SceneSelector scenes={mockScenes} onActivate={onActivate} />);

  const select = screen.getByRole('combobox');
  await user.selectOptions(select, 'scene-2');

  expect(onActivate).toHaveBeenCalledWith('scene-2');
});
```

#### Testing Polling with Fake Timers
```javascript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should call callback at specified interval', () => {
  const callback = vi.fn();
  renderHook(() => usePolling(callback, 1000, true));

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(2);
});
```

### Mutation Testing Results

**73.25% mutation score** means tests successfully detect 73% of injected bugs. Key highlights:

- ✅ **Color conversion**: Tests verify RGB outputs, brightness scaling, edge cases
- ✅ **Room hierarchy**: Tests validate device→light mapping, deduplication, missing data
- ✅ **Validation**: Tests cover valid IPs, invalid formats, boundary values
- ✅ **Hooks**: Tests verify polling intervals, enable/disable toggling, cleanup
- ✅ **Components**: Tests verify rendering, user interactions, conditional logic

**Survived mutants** are primarily in:
- Complex mathematical operations (matrix transformations, gamma correction)
- Boundary conditions that don't change observable behavior
- Precise floating-point calculations

For detailed testing documentation, see `frontend/TESTING.md`.

## Important Implementation Notes

### When Adding New Features

1. **Backend changes**: Restart backend server manually (no hot reload)
2. **Frontend changes**: Hot reload works automatically in Vite dev server
3. **New API endpoints**: Add to hueApi.js service, proxy through backend if needed
4. **v2 API features**: Remember to forward `hue-application-key` header in backend

### Common Patterns

#### Building Room→Device→Light Hierarchy
**Critical implementation pattern** for v2 API room organization:

```javascript
// In LightControl.jsx
const getLightsByRoom = () => {
  if (!lights?.data || !rooms?.data || !devices?.data) return null;

  // Step 1: Build device → lights map from services
  const deviceToLights = {};
  devices.data.forEach(device => {
    const lightUuids = device.services
      ?.filter(s => s.rtype === 'light')
      .map(s => s.rid) || [];
    deviceToLights[device.id] = lightUuids;
  });

  const roomMap = {};

  // Step 2: Walk room → device → light hierarchy
  rooms.data.forEach(room => {
    const lightUuids = [];

    room.children?.forEach(child => {
      if (child.rtype === 'device') {
        // Get lights from this device
        const deviceLights = deviceToLights[child.rid] || [];
        lightUuids.push(...deviceLights);
      } else if (child.rtype === 'light') {
        // Direct light reference (rare)
        lightUuids.push(child.rid);
      }
    });

    if (lightUuids.length > 0) {
      roomMap[room.metadata?.name || 'Unknown Room'] = {
        roomUuid: room.id,
        lightUuids: [...new Set(lightUuids)], // Deduplicate
        lights: lightUuids.map(uuid => getLightByUuid(uuid)).filter(Boolean)
      };
    }
  });

  return roomMap;
};
```

**Why this is necessary**: V2 API uses an indirect relationship where rooms contain devices, and devices contain lights. You cannot get lights directly from a room.

#### Adding New Hue API v2 Resource
```javascript
// In hueApi.js
async getResource(bridgeIp, username, resourceType) {
  const url = `${PROXY_URL}/api/hue/clip/v2/resource/${resourceType}?bridgeIp=${bridgeIp}`;
  const response = await fetch(url, {
    headers: { 'hue-application-key': username }
  });
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].description);
  }
  return data; // Returns { errors: [], data: [...] }
}
```

#### Component Polling Pattern
```javascript
// Initial fetch
useEffect(() => {
  if (bridgeIp && username) {
    fetchData();
  }
}, [bridgeIp, username]);

// Polling with cleanup
useEffect(() => {
  if (!bridgeIp || !username) return;

  const intervalId = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds

  return () => clearInterval(intervalId);
}, [bridgeIp, username]);
```

### Debugging

#### Check Backend Server
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","message":"Proxy server is running"}
```

#### Check Proxy Logs
Backend logs all proxied requests:
```
[PROXY] GET https://{bridge-ip}/api/{username}/lights
[PROXY] Response status: 200
```

#### Common Issues
- **"Nothing showing in console"**: Check you're on port 5173 (Vite dev), not 3001 (backend)
- **Backend changes not applying**: Restart backend server manually
- **CORS errors**: Ensure backend proxy is running and forwarding requests
- **v2 API 401 errors**: Check `hue-application-key` header is being forwarded in backend/server.js (line 65-68)

### MotionAware Implementation Details

The MotionAware zones feature is **NOT** available through traditional motion sensors. Key facts:

1. **No `/motion` sensors**: Traditional `/api/{username}/sensors` endpoint returns empty for MotionAware
2. **v2 API only**: MotionAware uses `convenience_area_motion` resource type
3. **Two-step data fetch**:
   - Fetch `behavior_instance` to get zone names
   - Fetch `convenience_area_motion` to get motion status
   - Match them via `configuration.motion.motion_service.rid`
4. **Motion state**: `motion.motion` boolean (true = motion detected)
5. **Validity**: `motion.motion_valid` indicates if sensor is reachable

## File Structure

```
/
├── config.json                          # Single source of truth for all config
├── frontend/
│   ├── vitest.config.js                 # Test runner configuration
│   ├── stryker.conf.json                # Mutation testing configuration
│   ├── TESTING.md                       # Testing documentation
│   ├── src/
│   │   ├── App.jsx                      # 3-step flow controller
│   │   ├── App.css                      # All styles (single file)
│   │   ├── components/
│   │   │   ├── BridgeDiscovery.jsx      # Step 1: Find bridge
│   │   │   ├── Authentication.jsx       # Step 2: Link button auth
│   │   │   ├── MotionZones.jsx          # MotionAware display
│   │   │   └── LightControl/            # Main UI (refactored into components)
│   │   │       ├── index.jsx            # Main container (~275 lines, down from 636)
│   │   │       ├── RoomCard.jsx         # Room display with lights
│   │   │       ├── LightButton.jsx      # Individual light button
│   │   │       ├── SceneSelector.jsx    # Scene dropdown
│   │   │       └── DashboardSummary.jsx # Statistics summary
│   │   ├── utils/                       # Pure utility functions (all tested)
│   │   │   ├── colorConversion.js       # xy/mirek to RGB, warm dim blending
│   │   │   ├── roomUtils.js             # Room hierarchy building
│   │   │   ├── validation.js            # IP validation
│   │   │   └── motionSensors.js         # Motion data parsing
│   │   ├── constants/                   # Centralized constants
│   │   │   ├── polling.js               # Polling intervals
│   │   │   ├── storage.js               # localStorage keys
│   │   │   ├── colors.js                # Color configuration
│   │   │   ├── validation.js            # Validation constants
│   │   │   └── messages.js              # Error messages
│   │   ├── services/
│   │   │   ├── hueApi.js                # All API calls (v2 API only)
│   │   │   └── mockData.js              # Demo mode mock data
│   │   ├── hooks/                       # Custom React hooks (all tested)
│   │   │   ├── useHueBridge.js          # Bridge connection state
│   │   │   ├── useDemoMode.js           # Demo mode detection
│   │   │   ├── useHueApi.js             # API selection (real vs mock)
│   │   │   └── usePolling.js            # Reusable polling hook
│   │   └── test/
│   │       └── setup.js                 # Global test setup
│   └── vite.config.js                   # Reads config.json, sets up proxy
└── backend/
    ├── server.js                        # Express proxy + static file server
    └── scripts/
        └── copy-frontend.js             # Build script for deployment
```

## Network Architecture

### Development
- Frontend: localhost:5173 (accessible only on dev machine)
- Backend: 0.0.0.0:3001 (accessible from network)
- Vite proxies `/api/*` to backend

### Production
- Single server: 0.0.0.0:3001 (accessible from entire network)
- Serves both API and static files
- Access from any device: `http://{server-ip}:3001`

**Critical**: Backend must be on same local network as Hue Bridge, but clients can connect from anywhere that can reach the backend server.
