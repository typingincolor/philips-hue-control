# UX Specification: Spotify Tab

## User Story

As a home user with Spotify Premium and multiple speakers, I want to control music playback from my home control dashboard so that I can easily play playlists on specific speakers without switching apps.

## UI Components

### 1. Spotify Tab in Bottom Navigation

**Location:** `frontend/src/components/Dashboard/BottomNav.jsx`

**Visual:**
- Music note icon (size 36px to match other nav icons)
- Label: "Spotify"
- Positioned after Home tab, before room tabs
- Only visible when Spotify is connected

**States:**
- Active: Highlighted background (matches existing active tab style)
- Inactive: Default nav tab style

---

### 2. SpotifyView (Main Container)

**Location:** `frontend/src/components/Spotify/SpotifyView.jsx`

**Layout (top to bottom):**
```
+------------------------------------------+
| [Playlist Dropdown                    v] |  <- 48px height
+------------------------------------------+
| Now Playing                              |
| [Album Art] Track Name                   |  <- 80px height
|            Artist Name                   |
+------------------------------------------+
| [<<]  [Play/Pause]  [>>]  [Shuffle]     |  <- 56px height
+------------------------------------------+
| Speakers                                 |
| +--------------------------------------+ |
| | [x] Office           [=====o=====]  | |  <- 52px each
| | [ ] Living Room      [=====o=====]  | |
| | [x] Kitchen          [=====o=====]  | |
| +--------------------------------------+ |
+------------------------------------------+
```

**States:**
- **Loading:** Spinner with "Loading Spotify..."
- **Not Connected:** Show SpotifyLogin component
- **Connected:** Show full player UI
- **Error:** Error message with retry button

---

### 3. SpotifyLogin

**Location:** `frontend/src/components/Spotify/SpotifyLogin.jsx`

**Visual:**
- Centered card with Spotify logo
- "Connect to Spotify" button (green, Spotify brand color #1DB954)
- Brief explanation text

**Behavior:**
- Button click redirects to Spotify OAuth
- After OAuth, redirects back to app with code
- App exchanges code for tokens

---

### 4. PlaylistSelector

**Location:** `frontend/src/components/Spotify/PlaylistSelector.jsx`

**Visual:**
- Dropdown select element
- Full width
- Shows playlist name and track count
- Playlist image as prefix (24x24px)

**States:**
- **Loading:** "Loading playlists..."
- **Empty:** "No playlists found"
- **Loaded:** List of user's playlists

---

### 5. NowPlaying

**Location:** `frontend/src/components/Spotify/NowPlaying.jsx`

**Visual:**
- Album art thumbnail (60x60px, rounded corners)
- Track name (bold, truncate with ellipsis)
- Artist name (secondary color, truncate with ellipsis)
- Progress bar showing playback position

**States:**
- **Nothing playing:** "No track playing" with muted styling
- **Playing:** Full track info with animated progress
- **Paused:** Track info with static progress

---

### 6. TransportControls

**Location:** `frontend/src/components/Spotify/TransportControls.jsx`

**Visual:**
- Horizontal button row, centered
- Buttons: Previous, Play/Pause, Next, Shuffle
- Minimum touch target: 44x44px each
- Play/Pause is larger (52x52px)

**States:**
- **Play button disabled:** When no speakers selected (greyed out)
- **Shuffle active:** Highlighted accent color
- **Loading:** Button shows spinner during API call

---

### 7. SpeakerList

**Location:** `frontend/src/components/Spotify/SpeakerList.jsx`

**Visual:**
- Section header "Speakers"
- Scrollable list if many speakers
- Each speaker is a SpeakerCard

---

### 8. SpeakerCard

**Location:** `frontend/src/components/Spotify/SpeakerCard.jsx`

**Visual:**
```
+------------------------------------------+
| [x] Office                 [====o====]   |
+------------------------------------------+
```

**Elements:**
- Checkbox (on/off toggle) - 44x44px touch target
- Speaker name
- Volume slider (range 0-100)
- Device type icon (speaker, phone, computer)

**States:**
- **Checked:** Speaker will receive playback
- **Unchecked:** Speaker excluded from playback
- **Active:** Currently playing (subtle glow/highlight)
- **Offline:** Greyed out, disabled

---

## User Flows

### Flow 1: Connect to Spotify

1. User navigates to Settings
2. User enables Spotify toggle
3. App shows "Connect to Spotify" button
4. User clicks button
5. Browser redirects to Spotify OAuth
6. User authorizes app
7. Browser redirects back to app
8. App exchanges code for tokens
9. Spotify tab appears in bottom nav
10. User can now use Spotify features

### Flow 2: Play a Playlist

1. User taps Spotify tab
2. User sees playlist dropdown and speaker list
3. User selects a playlist from dropdown
4. User checks desired speakers (at least one)
5. User taps Play button
6. Playback starts on all checked speakers
7. Now Playing shows current track
8. Progress bar updates

### Flow 3: Control Playback

1. User sees Now Playing with current track
2. User taps Next to skip track
3. Track changes, Now Playing updates
4. User taps Shuffle to enable shuffle mode
5. Shuffle button highlights
6. User adjusts volume slider on a speaker
7. Volume changes on that speaker only

### Flow 4: Multi-Speaker Playback

1. User checks multiple speakers (Office, Kitchen)
2. User taps Play
3. Spotify API called to group speakers
4. Playback starts on all selected speakers
5. Volume can be adjusted per-speaker

---

## Visual Specifications

### Colors (CSS Variables)

```css
/* Spotify brand */
--spotify-green: #1DB954;
--spotify-green-hover: #1ED760;
--spotify-black: #191414;

/* Use existing dark theme variables */
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--bg-card: #2d2d2d;
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--accent-primary: #f59e0b;
```

### Typography

- Playlist name: 16px, font-weight 500
- Track name: 16px, font-weight 600
- Artist name: 14px, font-weight 400, secondary color
- Speaker name: 14px, font-weight 500
- Section headers: 12px, uppercase, text-secondary

### Spacing

- Section padding: 16px
- Between sections: 12px
- Card padding: 12px
- Between controls: 8px

### Icons

- Nav icon: Music note (36px)
- Previous: Chevron double left (24px)
- Play/Pause: Play/Pause circle (32px)
- Next: Chevron double right (24px)
- Shuffle: Shuffle icon (24px)
- Speaker types: Speaker, Smartphone, Computer (20px)

---

## Platform-Specific Behavior

### Raspberry Pi 7" (800x480)

- Compact layout, no horizontal scrolling
- Speaker list scrolls vertically if needed
- All touch targets minimum 44px
- Reduced padding (12px instead of 16px)
- Smaller album art (48x48px)

### iPhone 14+ (390x844)

- Full-height layout
- Speaker list takes remaining space
- Touch targets 44px minimum
- Standard padding (16px)
- Album art 60x60px

### iPad (820x1180)

- Centered content, max-width 600px
- Larger touch targets (48px)
- More generous padding (20px)
- Album art 80x80px

---

## Accessibility Requirements

### Keyboard Navigation

- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys to adjust sliders
- Escape to close any modals

### ARIA Labels

```jsx
<button aria-label="Previous track">
<button aria-label="Play" or aria-label="Pause">
<button aria-label="Next track">
<button aria-label="Toggle shuffle" aria-pressed={shuffleEnabled}>
<input type="checkbox" aria-label="Enable playback on Office speaker">
<input type="range" aria-label="Volume for Office speaker" aria-valuemin="0" aria-valuemax="100">
```

### Focus Management

- Focus visible on all interactive elements
- Focus trap in modals
- Return focus after actions

### Screen Reader

- Announce track changes
- Announce play/pause state
- Announce shuffle toggle state

---

## Edge Cases

### Empty States

- **No playlists:** "No playlists found. Create playlists in Spotify app."
- **No speakers:** "No speakers available. Make sure Spotify is open on a device."
- **Not connected:** Show login prompt

### Error States

- **API error:** "Failed to load. Tap to retry."
- **Playback error:** "Couldn't start playback. Try selecting a different device."
- **Token expired:** Auto-refresh, show error if refresh fails

### Loading States

- **Initial load:** Full-screen spinner
- **Playlist load:** Dropdown shows "Loading..."
- **Playback action:** Button shows spinner
- **Volume change:** Debounced, no loading indicator

### Boundary Conditions

- **Long playlist name:** Truncate with ellipsis
- **Long track name:** Truncate with ellipsis
- **Many speakers (10+):** Scrollable list with max-height
- **Offline speaker:** Show as disabled, cannot select

---

## Component File Summary

### New Files

```
frontend/src/components/Spotify/
  SpotifyView.jsx        - Main container
  SpotifyView.test.jsx   - Unit tests
  SpotifyLogin.jsx       - OAuth login prompt
  SpotifyLogin.test.jsx
  PlaylistSelector.jsx   - Playlist dropdown
  PlaylistSelector.test.jsx
  NowPlaying.jsx         - Current track display
  NowPlaying.test.jsx
  TransportControls.jsx  - Play/pause/skip/shuffle
  TransportControls.test.jsx
  SpeakerList.jsx        - Speaker container
  SpeakerList.test.jsx
  SpeakerCard.jsx        - Individual speaker
  SpeakerCard.test.jsx
  SpotifyView.css        - Component styles
  index.js               - Barrel export
```

### Modified Files

```
frontend/src/components/Dashboard/BottomNav.jsx  - Add Spotify tab
frontend/src/components/Dashboard/index.jsx     - Add Spotify route
frontend/src/components/Dashboard/Icons.jsx     - Add Music icon
frontend/src/constants/uiText.js                - Add Spotify strings
```

---

## Handoff

Run `/red` to begin writing unit tests for these components.
