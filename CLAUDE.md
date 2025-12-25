# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Philips Hue Light Control** web application built as a monorepo with separated frontend (React) and backend (Express) workspaces. The app controls Philips Hue lights locally through the Hue Bridge API, featuring **true color display** with mathematical color space conversion, **information-dense UI** with brightness indicators and room statistics, **responsive design** optimized for iPhone 14+ and iPad, room organization, scene management, **MotionAware zone display** with real-time motion detection, and **WebSocket support** for live updates.

**Architecture (v1.0.0):** Business logic resides in the backend, exposing a simplified v1 REST API with WebSocket support. The backend pre-computes colors, shadows, and statistics while pushing real-time updates via WebSocket, reducing frontend complexity by ~1,300 lines, API calls by 67-83%, and eliminating polling overhead. The legacy proxy has been completely removed in favor of controlled v1 endpoints. See `ARCHITECTURE_UPDATE.md` for migration details.

**Performance Optimizations:**

- **Backend caching**: Static resources (rooms, devices, zones, scenes, behavior_instance) cached with 5-minute TTL
- **WebSocket polling**: 15-second interval for dynamic data (lights, motion status)
- **Optimistic updates**: Frontend updates UI immediately on user actions, syncs with backend asynchronously
- **Brightness minimum**: Lights display minimum 5% brightness when on (prevents 0% display artifacts)
- **WebSocket cleanup**: Automatic cleanup of orphaned polling intervals, heartbeat monitoring, and stale connection removal
- **WebSocket reconnection**: Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s) up to 5 attempts; dead connection detection via ping/pong (90s timeout)
- **Stats endpoint**: `/api/v1/stats/websocket` for debugging connection issues

**Connection Status Indicator:**

The TopToolbar displays real-time connection status with three states:
- **Green dot + "Connected"**: WebSocket active and healthy
- **Amber pulsing dot + "Reconnecting..."**: Connection lost, attempting to reconnect
- **Red dot + "Disconnected"**: All reconnection attempts failed

**Weather Forecast Feature:**

The TopToolbar displays current weather and a 5-day forecast using the Open-Meteo API:
- **Weather Display**: Shows weather icon + temperature + location name (e.g., "☀️ 22° London")
- **Weather Tooltip**: Appears on hover with current conditions, wind speed, and 5-day forecast
- **Settings Drawer**: Hamburger menu opens settings for location detection and unit toggle (C/F)
- **Location Detection**: Uses browser geolocation + Nominatim reverse geocoding for city names
- **Demo Mode**: Uses mock weather data when in demo mode

Key files:
- `frontend/src/hooks/useSettings.js` - Manages units preference (celsius/fahrenheit) with localStorage
- `frontend/src/hooks/useLocation.js` - Handles geolocation detection and persistence
- `frontend/src/hooks/useWeather.js` - Fetches weather data with 15-minute polling
- `frontend/src/services/weatherApi.js` - Open-Meteo SDK integration using FlatBuffers
- `frontend/src/constants/weather.js` - Weather codes, icons, and configuration
- `frontend/src/components/LightControl/WeatherDisplay.jsx` - Toolbar weather button
- `frontend/src/components/LightControl/WeatherTooltip.jsx` - Hover forecast panel
- `frontend/src/components/LightControl/SettingsDrawer.jsx` - Settings slide-out drawer

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
  headers: { 'hue-application-key': username },
});
```

### Component Architecture

#### Main Flow Components

1. **App.jsx**: Manages 3-step authentication flow
   - Step 1: BridgeDiscovery (find/enter bridge IP)
   - Step 2: Authentication (link button press)
   - Step 3: LightControl (main UI with lights)

2. **LightControl/index.jsx**: Main control interface
   - Navigation-based layout with bottom room tabs
   - Uses `selectedRoomId` state to show one room at a time
   - Integrates TopToolbar, MainPanel, and BottomNav components
   - Works natively with v2 data structures (no adapters)

3. **LightControl/TopToolbar.jsx**: Header bar
   - Motion zone indicators with colored dots
   - Dashboard stats (lights on, rooms, scenes)
   - Logout button

4. **LightControl/BottomNav.jsx**: Room navigation tabs
   - Horizontally scrollable room tabs with room-specific icons
   - Drag-to-scroll functionality via mouse events
   - Shows lights-on count badge per room
   - "Zones" tab for viewing all zones
   - Amber border-top accent

5. **LightControl/MainPanel.jsx**: Content container
   - Switches between RoomContent and ZonesView based on selection

6. **LightControl/RoomContent.jsx**: Room display
   - Grid of LightTile components (vertically centered between toolbar and nav)
   - Floating action button (FAB) to open SceneDrawer
   - No inline controls - scenes and toggle moved to drawer

7. **LightControl/SceneDrawer.jsx**: Slide-out drawer for scenes
   - Slides in from right edge (280px wide)
   - Lists all scenes with icons
   - All On/Off toggle button at bottom
   - Closes on overlay tap, close button, or Escape key

8. **LightControl/LightTile.jsx**: Large light button
   - Brightness displayed as fill height from bottom
   - Dynamic fill gradient based on light color
   - Text contrast via background pill (semi-transparent)
   - Amber border accent
   - Colored glow shadow for bright lights

9. **LightControl/ZonesView.jsx**: Zones list
   - Shows all zones with stats, scene selector, on/off toggle

10. **LightControl/Icons.jsx**: Lucide icon wrappers

- Uses `lucide-react` package for all icons
- Consistent `strokeWidth: 1.5` styling
- Room-specific icons: Sofa, DiningTable, Saucepan, Bed, DeskLamp, Shower, Car, Tree, Door
- Scene icons: Sunrise, Sunset, Moon, Sun, Palette, Heart, Focus, Tv, UtensilsCrossed, etc.
- `getSceneIcon(sceneName)` function maps scene names to appropriate icons

11. **LightControl/SceneSelector.jsx**: Scene icon buttons (used in ZonesView)
    - Renders icon buttons for each scene (not a dropdown)
    - Icons are matched to scene names via `getSceneIcon()`
    - Tooltips show scene name on hover
    - 44x44px touch-friendly buttons

12. **LightControl/DashboardSummary.jsx**: Statistics display
    - Shows total lights on, room count, scene count
    - Displays demo mode badge when active

13. **MotionZones.jsx**: Compact motion status bar
    - Inline bar format with pill-shaped zone badges
    - Returns `null` if no MotionAware zones configured (auto-hide)
    - Shows green dot (no motion) or red dot (motion detected)

#### Data Flow

- **localStorage**: Persists bridgeIp and username across sessions (keys from `constants/storage.js`)
- **useHueBridge hook**: Manages bridge connection state
- **useHueApi hook**: Selects between real and mock API based on demo mode
- **useDemoMode hook**: Detects demo mode from URL parameters
- **usePolling hook**: Reusable interval-based polling with cleanup
- **hueApi service**: All API calls go through this service layer
- **mockData service**: Demo mode mock data (10 rooms, 35 lights, 14 scenes, 7 zones, 4 motion zones)
- **Utilities**: Pure functions for data transformation (color, rooms, validation, motion sensors)
- **Constants**: Centralized configuration values (polling intervals, storage keys, colors, messages, UI text)

#### UI Text Constants

All user-facing text is centralized in **`constants/uiText.js`** via the `UI_TEXT` constant. This provides:

- **Consistency**: Single source of truth for all UI text
- **Maintainability**: Update text in one place, reflected everywhere
- **Test stability**: Tests use the same constants, preventing brittleness from text changes
- **Internationalization-ready**: Easy to extend for multi-language support

**Usage Pattern**:

```javascript
import { UI_TEXT } from '../constants/uiText';

// In component
<h1>{UI_TEXT.APP_TITLE}</h1>
<button>{UI_TEXT.BUTTON_DISCOVER_BRIDGE}</button>

// In tests
expect(screen.getByText(UI_TEXT.APP_TITLE)).toBeInTheDocument();
```

**Organization**: Constants are grouped by component/feature:

- App Header: `APP_TITLE`, `APP_SUBTITLE`
- BridgeDiscovery: `BRIDGE_DISCOVERY_TITLE`, `BUTTON_DISCOVER_BRIDGE`, etc.
- Authentication: `AUTH_MAIN_TITLE`, `AUTH_DESCRIPTION`, `BUTTON_I_PRESSED_BUTTON`, etc.
- LightControl: `LIGHT_CONTROL_TITLE`, `BUTTON_LOGOUT`, `STATUS_CONNECTED`, etc.
- DashboardSummary: `LABEL_LIGHTS_ON`, `LABEL_ROOMS`, `LABEL_SCENES`
- RoomCard: `BUTTON_ALL_ON`, `SELECT_SCENE_PLACEHOLDER`, `STATUS_LIGHTS_ON_FORMAT`
- MotionZones: `MOTION_ZONES_TITLE`, `MOTION_DETECTED`, `NO_MOTION`

**When to add new constants**: Any user-visible text should be added to `UI_TEXT` rather than hardcoded in components. This includes buttons, labels, headings, error messages, status text, and placeholders.

### CSS Architecture

- **Single CSS file**: `frontend/src/App.css` (no CSS modules)
- **Dark theme**: Always dark mode with CSS variables
  - `--bg-primary: #1a1a1a` - Main background
  - `--bg-secondary: #2d2d2d` - Cards/containers
  - `--accent-primary: #f59e0b` - Amber accent for borders and highlights
  - `--text-primary: #ffffff`, `--text-secondary: #a0a0a0`
- **Navigation layout**: Fixed bottom nav with room tabs, fixed top toolbar
- **Main panel**: Absolutely positioned between toolbar and nav for precise centering
- **Light tiles**: Large rounded squares with brightness fill effect
  - Fill height represents brightness percentage
  - Background pill for text contrast on mixed backgrounds
  - Colored glow shadows for bright lights (≥50%)
  - Vertically centered with equal spacing above and below
- **Responsive grid**: CSS Grid with CSS custom properties for dynamic sizing
  - `--tile-size` calculated from available viewport space
  - Device-specific layouts: iPad 4×2, iPhone 2×4, Raspberry Pi 4×2
  - Minimum 44px buttons, fill available space
- **Scene drawer**: Slide-out panel from right edge
  - 280px wide with dark overlay
  - Contains scene buttons and all on/off toggle
  - Floating action button (FAB) trigger in bottom-right
- **Amber borders**: Consistent accent on light tiles, scene selector, toggle buttons, bottom nav border-top
- **Mobile optimization**: iOS safe area handling for bottom nav
- **Component classes**: `.top-toolbar`, `.bottom-nav`, `.main-panel`, `.light-tile`, `.room-content`, `.zones-view`, `.scene-drawer`, `.scene-drawer-trigger`

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

**Target Devices**:

- **iPad** (1024×768): 4 columns × 2 rows of light tiles
- **iPhone 14+** (390×844): 2 columns × 4 rows of light tiles
- **Raspberry Pi 7"** (800×480): 4 columns × 2 rows of light tiles

**Button Sizing**:

- Minimum 44px for touch accessibility
- Calculated dynamically to fill available space
- Square aspect ratio maintained
- Vertically centered with equal spacing above and below

**Breakpoints**:

- `max-width: 500px` - Narrower gaps (12px)
- `min-width: 600px` - 4-column layout (iPad, Raspberry Pi)
- `max-height: 600px` - Compact mode for short screens (Raspberry Pi)

**Layout Approach**:

- Main panel absolutely positioned between fixed toolbar and nav
- CSS custom properties calculate tile size from viewport
- `--tile-size = min(height-constrained, width-constrained)`
- Grid uses explicit sizes: `repeat(cols, var(--tile-size))`

## Testing Infrastructure

### Test Organization

The project includes comprehensive testing with **665 tests total** (424 backend + 241 frontend):

**Backend Tests** (424 tests):

```
backend/test/
├── services/
│   ├── colorService.test.js        # 18 tests - Color conversions, warm dim, brightness min
│   ├── roomService.test.js         # 23 tests - Room hierarchy, stats
│   ├── motionService.test.js       # 13 tests - Motion sensor parsing
│   ├── statsService.test.js        # 10 tests - Dashboard statistics
│   ├── sessionManager.test.js      # 12 tests - Session + credential storage
│   ├── websocketService.test.js    # 13 tests - WebSocket service
│   └── zoneService.test.js         # 15 tests - Zone hierarchy, stats
├── middleware/
│   └── auth.test.js                # 13 tests - Credential extraction/storage
├── integration/
│   └── multiClient.test.js         # 10 tests - Multi-client credential sharing
├── utils/
│   └── (colorConversion, validation)  # Utility function tests
```

**Frontend Tests** (241 tests):

```
frontend/src/
├── utils/
│   └── validation.test.js          # 8 tests - IP validation
├── hooks/
│   ├── useDemoMode.test.js         # 9 tests - URL parameter parsing
│   ├── useHueApi.test.js           # 4 tests - API selection (real vs mock)
│   ├── usePolling.test.js          # 10 tests - Interval polling
│   ├── useSession.test.js          # 25 tests - Session management
│   └── useWebSocket.test.js        # 31 tests - WebSocket connection
├── services/
│   └── hueApi.test.js              # 15 tests - API service
├── components/
│   ├── App.test.jsx                # 4 tests - App component
│   ├── MotionZones.test.jsx        # 9 tests - Motion zone alerts
│   └── LightControl/
│       ├── DashboardSummary.test.jsx   # 5 tests - Statistics rendering
│       ├── SceneSelector.test.jsx      # 8 tests - Scene icon buttons
│       ├── LightButton.test.jsx        # 15 tests - Light button (uses pre-computed colors)
│       ├── RoomCard.test.jsx           # 16 tests - Room card (uses pre-computed stats)
│       ├── ZoneCard.test.jsx           # 14 tests - Zone bar (uses pre-computed stats)
│       └── index.zones.test.jsx        # 9 tests - Zone integration tests
├── integration.test.jsx            # 11 tests - Full integration tests
```

**Note:** Business logic tests (colorConversion, roomUtils, motionSensors) moved from frontend to backend as services.

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
  useDemoMode: vi.fn(),
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
  devices.data.forEach((device) => {
    const lightUuids = device.services?.filter((s) => s.rtype === 'light').map((s) => s.rid) || [];
    deviceToLights[device.id] = lightUuids;
  });

  const roomMap = {};

  // Step 2: Walk room → device → light hierarchy
  rooms.data.forEach((room) => {
    const lightUuids = [];

    room.children?.forEach((child) => {
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
        lights: lightUuids.map((uuid) => getLightByUuid(uuid)).filter(Boolean),
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
│   │   ├── App.css                      # All styles (dark theme, single file)
│   │   ├── components/
│   │   │   ├── BridgeDiscovery.jsx      # Step 1: Find bridge
│   │   │   ├── Authentication.jsx       # Step 2: Link button auth
│   │   │   ├── MotionZones.jsx          # MotionAware compact bar
│   │   │   └── LightControl/            # Main UI (navigation-based layout)
│   │   │       ├── index.jsx            # Main container with room selection
│   │   │       ├── TopToolbar.jsx       # Header: motion dots, stats, logout
│   │   │       ├── BottomNav.jsx        # Room tabs (drag-scrollable)
│   │   │       ├── MainPanel.jsx        # Content switcher (room/zones)
│   │   │       ├── RoomContent.jsx      # Light tiles grid for room
│   │   │       ├── SceneDrawer.jsx      # Slide-out drawer for scenes
│   │   │       ├── SettingsDrawer.jsx   # Weather settings drawer
│   │   │       ├── WeatherDisplay.jsx   # Toolbar weather button
│   │   │       ├── WeatherTooltip.jsx   # Hover forecast panel
│   │   │       ├── LightTile.jsx        # Large light button with fill
│   │   │       ├── ZonesView.jsx        # All zones list
│   │   │       ├── Icons.jsx            # Lucide + weather icons
│   │   │       ├── SceneSelector.jsx    # Scene dropdown
│   │   │       ├── DashboardSummary.jsx # Statistics summary
│   │   │       ├── RoomCard.jsx         # (legacy) Room card display
│   │   │       ├── ZoneCard.jsx         # (legacy) Zone card display
│   │   │       └── LightButton.jsx      # (legacy) Light button
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
│   │   │   ├── messages.js              # Error messages
│   │   │   ├── uiText.js                # UI text constants
│   │   │   └── weather.js               # Weather codes and config
│   │   ├── services/
│   │   │   ├── hueApi.js                # All API calls (v2 API only)
│   │   │   ├── mockData.js              # Demo mode mock data
│   │   │   ├── weatherApi.js            # Open-Meteo API integration
│   │   │   └── mockWeatherData.js       # Demo mode weather data
│   │   ├── hooks/                       # Custom React hooks (all tested)
│   │   │   ├── useHueBridge.js          # Bridge connection state
│   │   │   ├── useDemoMode.js           # Demo mode detection
│   │   │   ├── useHueApi.js             # API selection (real vs mock)
│   │   │   ├── usePolling.js            # Reusable polling hook
│   │   │   ├── useSettings.js           # Weather settings persistence
│   │   │   ├── useLocation.js           # Geolocation detection
│   │   │   └── useWeather.js            # Weather data fetching
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
