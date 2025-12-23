# Architecture Update - Backend API Refactoring (v2.0.0)

## Overview

As of v2.0.0, business logic has been moved from frontend to backend, exposing a simplified v1 REST API with WebSocket support that pre-computes colors, shadows, and statistics. The legacy `/api/hue/*` proxy has been completely removed in favor of controlled v1 endpoints.

## Backend API (v1)

### Philosophy
- **Resource-oriented** REST API with clear endpoints
- **Pre-computed** data - colors, shadows, and stats calculated server-side
- **Single-call efficiency** - dashboard endpoint replaces 4-6 API calls
- **Extensible** - easy to add new aggregations and transformations

### Key Endpoints

#### `GET /api/v1/dashboard`
Unified endpoint returning all dashboard data in one call.

**Query Parameters:**
- `bridgeIp` (required) - Bridge IP address
- `username` (required) - Hue API username

**Response:**
```json
{
  "summary": {
    "totalLights": 12,
    "lightsOn": 5,
    "roomCount": 4,
    "sceneCount": 8
  },
  "rooms": [
    {
      "id": "room-uuid",
      "name": "Living Room",
      "stats": {
        "lightsOnCount": 2,
        "totalLights": 4,
        "averageBrightness": 75.5
      },
      "lights": [
        {
          "id": "light-uuid",
          "name": "Living Room 1",
          "on": true,
          "brightness": 80,
          "color": "rgb(255, 180, 120)",  // Pre-computed!
          "shadow": "0 0 20px rgba(255, 180, 120, 0.4)",  // Pre-computed!
          "colorSource": "xy"
        }
      ],
      "scenes": [
        { "id": "scene-uuid", "name": "Bright" }
      ]
    }
  ]
}
```

**Backend Processing:**
1. Fetches lights, rooms, devices, scenes in parallel from Hue Bridge
2. Builds room hierarchy (3-way join: room → device → light)
3. Converts xy/mirek to RGB with brightness-aware warm dim blending
4. Generates smart shadows (colored glow only for bright lights)
5. Calculates room statistics (lights on, average brightness)
6. Returns ready-to-render data

#### `GET /api/v1/motion-zones`
Returns parsed MotionAware zones with motion status.

**Response:**
```json
{
  "zones": [
    {
      "id": "zone-uuid",
      "name": "Hallway MotionAware",
      "motionDetected": false,
      "enabled": true,
      "reachable": true
    }
  ]
}
```

#### `PUT /api/v1/lights/:id`
Update individual light, returns updated light with pre-computed color.

#### `PUT /api/v1/rooms/:id/lights`
Bulk update all lights in a room.

#### `POST /api/v1/scenes/:id/activate`
Activate scene, returns affected lights with pre-computed colors.

#### `WebSocket /api/v1/ws`
Real-time dashboard updates via WebSocket connection.

**Connection Flow:**
1. Client connects to `ws://localhost:3001/api/v1/ws`
2. Client sends authentication:
   ```json
   {
     "type": "auth",
     "bridgeIp": "192.168.1.100",
     "username": "hue-username"
   }
   ```
3. Server sends initial state:
   ```json
   {
     "type": "initial_state",
     "data": { /* full dashboard object */ }
   }
   ```
4. Server pushes updates when state changes:
   ```json
   {
     "type": "state_update",
     "changes": [
       {
         "type": "light",
         "data": { /* updated light */ },
         "roomId": "room-uuid"
       }
     ]
   }
   ```

**Benefits:**
- Eliminates polling overhead (no more 30-second intervals)
- Instant updates when lights change (5-second polling on backend)
- All connected clients see changes simultaneously
- Automatic reconnection with exponential backoff
- Disabled in demo mode

### Authentication

Three methods supported (in order of preference):

1. **Session Token** (recommended):
   ```
   POST /api/v1/auth/session
   Authorization: Bearer <token>
   ```

2. **Headers**:
   ```
   X-Bridge-IP: 192.168.1.100
   X-Hue-Username: abc123
   ```

3. **Query Parameters** (legacy):
   ```
   ?bridgeIp=192.168.1.100&username=abc123
   ```

## Frontend Architecture Changes

### Before (v0.4.x)
- 4-6 API calls per page load
- Complex 3-way joins in frontend
- Color conversion calculations on every render
- Manual room statistics calculations
- 75 unit tests for business logic

### After (v0.5.0)
- **1 initial API call** (WebSocket initial state)
- **Real-time updates** via WebSocket (no polling)
- Zero frontend data transformation
- Pre-computed colors and shadows from backend
- Pre-computed statistics from backend
- **91 tests total**: 16 component tests, 23 hook tests, 52 integration tests

### Data Flow

**Old Pattern:**
```javascript
const [lights, rooms, devices, scenes] = await Promise.all([...4 calls]);
const lightsByRoom = buildRoomHierarchy(lights, rooms, devices);
const color = getLightColor(light);  // Complex calculations
const shadow = getLightShadow(light, color);
```

**New Pattern:**
```javascript
// WebSocket provides initial state and real-time updates
const { dashboard, isConnected } = useWebSocket(bridgeIp, username);
// Use dashboard.rooms, dashboard.summary directly
// Colors and shadows pre-computed!
// Updates pushed automatically when lights change!
```

## Backend Services

### Service Layer
- **hueClient.js** - Low-level Hue Bridge API wrapper
- **roomService.js** - Room hierarchy building, scene filtering, stats
- **motionService.js** - Motion sensor parsing
- **colorService.js** - Color conversions (xy/mirek → RGB, warm dim blending, shadow generation)
- **statsService.js** - Dashboard statistics calculations
- **sessionManager.js** - Session token management
- **websocketService.js** - Real-time WebSocket connection management, state change detection, broadcasting

### Testing
- **99 backend tests** (81% coverage)
- **62.13% mutation score**
- Stryker mutation testing configured

## Migration Benefits

### Performance
- **67-83% fewer API calls** (1 initial vs 4-6 on every load)
- **No polling overhead** - WebSocket pushes updates only when needed
- **Network overhead reduced** by 3× (fewer round trips)
- **Real-time updates** - 5-second backend polling vs 30-second frontend polling
- **~1,323 lines of code removed** from frontend

### Maintainability
- Business logic centralized in backend
- Frontend focuses on UI rendering only
- Backend unit tests for transformations
- Clear API contracts with OpenAPI docs

### Extensibility
- Easy to add new endpoints
- Can add server-side caching
- **WebSocket support implemented** for real-time updates
- Can add API versioning

## Color Display System

Light buttons display actual bulb colors using mathematical color space conversions with **brightness-aware warm dim blending**, now computed server-side:

**Backend Color Service** (`backend/services/colorService.js`):
```javascript
// Convert Hue xy coordinates (CIE 1931) to RGB
xyToRgb(x, y, brightness)

// Convert color temperature (mirek) to RGB
mirekToRgb(mirek, brightness)

// Warm dim blending with race condition handling
enrichLight(light) {
  // Algorithm:
  // 1. Get actual color from xy or color_temperature
  // 2. Blend between warm candlelight (15%) and actual color (50%)
  // 3. Generate smart shadow (colored glow only for bright lights)
  // Returns light with added: color, shadow, colorSource
}
```

**Frontend** (`LightButton.jsx`):
```javascript
// Just use pre-computed values!
<button style={{
  backgroundColor: light.color,  // Already computed
  boxShadow: light.shadow       // Already computed
}} />
```

## API Documentation

Interactive API docs available at: `http://localhost:3001/api/v1/docs`

Generated using Swagger UI from OpenAPI 3.0 specification.
