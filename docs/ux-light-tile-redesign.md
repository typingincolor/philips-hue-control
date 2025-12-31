# UX Specification: Light Tile Redesign

## User Story

As a home control user, I want to see scenes and lights as uniform tiles in a grid layout so I can quickly scan and control my room lighting with minimal interaction. The design prioritizes touch-friendly operation on wall-mounted displays while scaling appropriately to mobile and tablet devices.

## Overview

Replace the current room view (lights grid + floating scene drawer button) with a two-row tile layout:

1. **Row 1 - Scene Tiles**: All On/Off button followed by scene tiles
2. **Row 2 - Light Tiles**: Individual light controls with color temperature slider

All tiles are the same size. Grid is left-aligned and responsive to screen width.

---

## UI Components

### 1. RoomContent (Modified)

**Location**: `frontend/src/components/Dashboard/RoomContent.jsx`

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│ [All Off] [Scene1] [Scene2] [Scene3] [Scene4] ...       │  ← Row 1: Scene tiles
│                                                         │
│ [Light1] [Light2] [Light3] [Light4] [Light5] ...        │  ← Row 2: Light tiles
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Changes**:

- Remove SceneDrawer component and floating trigger button
- Add scene tiles row above light tiles row
- Both rows use same tile size and grid layout

**States**:

- **Loading**: Skeleton tiles (pulsing placeholders)
- **Empty (no lights)**: Current empty state message
- **Normal**: Scene row + Light row

---

### 2. SceneTile (New Component)

**Location**: `frontend/src/components/Dashboard/SceneTile.jsx`

**Visual Description**:

```
┌─────────────────┐
│                 │
│     [Icon]      │   ← Scene-specific icon (24px)
│                 │
│   Scene Name    │   ← Text label, centered
└─────────────────┘
```

**Elements**:

- Scene-specific icon (uses existing `SceneIcon` component)
- Scene name (truncated with ellipsis if too long)
- Subtle border/background to define tile boundaries

**States**:

- **Default**: Dark background, muted text
- **Hover**: Slight brightness increase
- **Active/Pressed**: Visual feedback (scale down slightly)
- **Activating**: Spinner replaces icon

**Interaction**: Tap to activate scene

---

### 3. AllOnOffTile (New Component)

**Location**: `frontend/src/components/Dashboard/AllOnOffTile.jsx`

**Visual Description**:

```
┌─────────────────┐
│                 │
│   [Sun/Moon]    │   ← Sun when off, Moon when on
│                 │
│   All On/Off    │   ← Dynamic label
└─────────────────┘
```

**Elements**:

- Icon: Sun (when lights are off) / Moon (when lights are on)
- Label: "All On" / "All Off" based on current state
- **Distinct accent background** to differentiate from scene tiles

**States**:

- **Lights Off**: Blue/accent background, Sun icon, "All On" label
- **Lights On**: Orange/warm background, Moon icon, "All Off" label
- **Toggling**: Spinner replaces icon

**Interaction**: Tap to toggle all lights in room

---

### 4. LightTile (Modified)

**Location**: `frontend/src/components/Dashboard/LightTile.jsx`

**Visual Description**:

```
┌─────────────────┐
│                 │
│   [Lightbulb]   │   ← Bulb icon, colored by light color
│                 │
│ ──────●──────── │   ← Color temperature slider (warm ↔ cool)
│                 │
│   Light Name    │   ← Text label
└─────────────────┘
```

**Elements**:

- Lightbulb icon (filled when on, outline when off)
- **Tile background color** reflects light's current color & brightness
- Color temperature slider (horizontal, warm-to-cool)
- Light name label (truncated with ellipsis if needed)

**Color Behavior**:

- Background color = light's RGB color at light's brightness level
- When off: Dark/neutral background
- Brightness affects color saturation/intensity of background

**Slider**:

- Range: Warm white (2700K) ↔ Cool white (6500K)
- Visual: Gradient from orange-yellow to blue-white
- Updates light in real-time on change (debounced)
- Only visible when light is on

**States**:

- **Off**: Dark background, outline bulb icon, no slider
- **On**: Colored background, filled bulb icon, slider visible
- **Toggling**: Spinner replaces bulb icon
- **Adjusting**: Slider thumb active

**Interaction**:

- **Tap** (not on slider): Toggle light on/off
- **Slider drag**: Adjust color temperature

---

## User Flow

### Viewing a Room

1. User taps room in bottom navigation
2. System displays two-row grid:
   - Row 1: All On/Off tile + scene tiles
   - Row 2: Light tiles showing current states
3. Tiles reflect real-time light states (color, brightness)

### Activating a Scene

1. User sees scene tiles in first row
2. User taps desired scene tile
3. Tile shows spinner during activation
4. Lights update to scene configuration
5. Light tiles update to reflect new states

### Toggling All Lights

1. User sees All On/Off tile (first position, row 1)
2. User taps tile
3. Tile shows spinner
4. All lights toggle on/off
5. Light tiles update, All On/Off tile updates label/icon

### Controlling Individual Light

1. User sees light tile with current color/state
2. **To toggle**: User taps tile (not on slider)
3. **To adjust temperature**: User drags slider (when light is on)
4. Light updates in real-time

---

## Visual Specifications

### Tile Sizing

| Platform         | Tiles Across | Tile Size | Gap  |
| ---------------- | ------------ | --------- | ---- |
| RPi (800px)      | 10           | ~72px     | 8px  |
| Phone (390px)    | 2            | ~180px    | 12px |
| Tablet (820px)   | 10           | ~74px     | 8px  |
| Desktop (1280px) | 12-15        | ~80px     | 10px |

**Calculation**: `tile_width = (container_width - (gaps * (tiles - 1))) / tiles`

### Layout

- Grid alignment: **top-left** (not centered)
- Row 1 (scenes): Wraps if more tiles than fit
- Row 2 (lights): Wraps if more tiles than fit
- Gap between rows: 16px

### Colors

Use existing CSS variables:

- `--bg-card`: Tile default background
- `--text-primary`: Tile labels
- `--text-secondary`: Secondary text
- `--accent-primary`: All On/Off tile accent
- Light colors: From backend `light.color` property

**All On/Off Tile Accents**:

- Lights off state: `rgba(59, 130, 246, 0.3)` (blue tint)
- Lights on state: `rgba(251, 146, 60, 0.3)` (orange tint)

### Typography

- Tile labels: 0.75rem (12px), centered
- Truncation: `text-overflow: ellipsis` with `max-width: 100%`

### Icons

- Scene icons: 24px (existing SceneIcon component)
- Light bulb: 32px
- All On/Off: 24px (Sun/Moon icons)

### Slider

- Height: 4px track, 16px thumb
- Track gradient: `linear-gradient(to right, #ffb347, #ffffff, #87ceeb)`
- Thumb: White circle with subtle shadow

---

## Platform-Specific Behavior

### Raspberry Pi (800x480, Touch)

- **10 tiles across** in both rows
- Tile size: ~72px square
- Touch targets meet 44px minimum (entire tile is tappable)
- Slider thumb: 20px for easier touch
- No hover states (touch only)

### iPhone 14+ (390x844, Touch)

- **2 tiles across** (portrait)
- Tile size: ~180px square
- Larger text (0.875rem) for readability
- Slider thumb: 24px
- Vertical scrolling for many lights

### iPad (820x1180, Touch)

- **10 tiles across** (landscape), **5 tiles** (portrait)
- Tile size: ~74-150px depending on orientation
- Both orientations supported
- Slider thumb: 20px

---

## Accessibility Requirements

### Keyboard Navigation

- Tab through tiles in reading order (row 1, then row 2)
- Enter/Space to activate scene or toggle light
- Arrow keys to adjust slider (when focused)

### ARIA Labels

```jsx
// Scene tile
<button aria-label="Activate scene: Relax">

// All On/Off tile
<button aria-label="Turn all lights off" aria-pressed="true">

// Light tile
<button aria-label="Toggle Desk Lamp, currently on at 75% brightness">

// Slider
<input type="range" aria-label="Color temperature for Desk Lamp"
       aria-valuemin="2700" aria-valuemax="6500" aria-valuenow="4000">
```

### Focus Management

- Visible focus ring on all interactive elements
- Focus returns to toggle button after scene activation
- Slider receives focus separately from tile button

### Screen Reader

- Announce light state changes
- Announce scene activation completion
- Slider value announced on change

---

## Edge Cases

### Empty States

- **No lights**: Show existing "No lights in this room" message
- **No scenes**: Show only All On/Off tile in row 1

### Boundary Conditions

- **Many scenes** (>10): Rows wrap to next line
- **Long names**: Truncate with ellipsis, full name in title/tooltip
- **Rapid toggling**: Debounce, show spinner during pending state
- **Offline light**: Show disabled state, muted colors

### Error States

- **Toggle failed**: Brief error indicator on tile, then restore previous state
- **Scene activation failed**: Tile shows error state briefly

### Loading States

- **Initial load**: Skeleton tiles matching expected count
- **Toggling**: Spinner icon on affected tile(s)
- **Scene activating**: Spinner on scene tile

---

## Migration Notes

### Removed Components

- `SceneDrawer.jsx` - No longer needed (scenes are tiles now)
- Scene drawer CSS classes

### Modified Components

- `RoomContent.jsx` - New two-row layout
- `LightTile.jsx` - Add slider, adjust sizing

### New Components

- `SceneTile.jsx` - Scene tile component
- `AllOnOffTile.jsx` - All on/off toggle tile

---

## Handoff

Run `/red` to begin writing unit tests for these components.
