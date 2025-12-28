# Manual Test Checklist

This document contains manual test procedures for complex flows that are difficult to automate reliably.

## Hive Integration Tests

### Prerequisites

- Application running in demo mode: `http://localhost:5173/?demo=true`
- Fresh browser session (clear cookies/storage if needed)

---

### Test 1: Initial Login with 2FA

**Purpose:** Verify the complete Hive login flow with SMS 2FA verification

**Steps:**

1. Open the application in demo mode
2. Click the Settings button (gear icon)
3. In the Hive section, click "Use the Hive tab to connect"
4. Verify login form appears with:
   - "Connect to Hive" title
   - Email input field
   - Password input field
   - Connect button
5. Enter credentials:
   - Email: `demo@hive.com`
   - Password: `demo`
6. Click "Connect"
7. Verify 2FA form appears with:
   - "Verify Your Identity" title
   - Code input field (should be focused)
   - Verify button
   - "Back to login" link
8. Enter code: `123456`
9. Click "Verify"

**Expected Result:**

- Thermostat display appears showing 19.5°
- Heating status indicator shows as active
- Hot water status indicator visible
- Schedule list shows "Morning Warmup", "Hot Water AM", "Evening Boost"
- Hive tab appears in bottom navigation

---

### Test 2: Invalid Credentials

**Purpose:** Verify error handling for incorrect login credentials

**Steps:**

1. Navigate to Hive login form (via Settings → Hive link)
2. Enter invalid credentials:
   - Email: `wrong@email.com`
   - Password: `wrongpassword`
3. Click "Connect"

**Expected Result:**

- Error message appears
- Login form remains visible (not replaced by 2FA)
- User can retry with different credentials

---

### Test 3: Invalid 2FA Code

**Purpose:** Verify error handling for incorrect 2FA codes

**Steps:**

1. Complete valid login (demo@hive.com / demo)
2. When 2FA form appears, enter invalid code: `000000`
3. Click "Verify"

**Expected Result:**

- Error message appears
- 2FA form remains visible
- User can retry with correct code

---

### Test 4: 2FA Cancellation

**Purpose:** Verify user can cancel 2FA and return to login

**Steps:**

1. Complete valid login to reach 2FA form
2. Click "Back to login" link

**Expected Result:**

- Login form appears
- Email field preserves the previously entered email (demo@hive.com)
- Password field is empty
- No error messages displayed

---

### Test 5: Clear Error on Input

**Purpose:** Verify errors are cleared when user starts typing

**Steps:**

1. Navigate to Hive login form
2. Enter invalid credentials and submit
3. Verify error message appears
4. Start typing in email field

**Expected Result:**

- Error message disappears as soon as user starts typing

---

### Test 6: Disconnect Flow

**Purpose:** Verify Hive disconnect removes access correctly

**Steps:**

1. Connect to Hive (complete full login + 2FA flow)
2. Verify Hive tab is visible in bottom navigation
3. Click Settings button
4. Click "Disconnect" button in Hive section
5. Close Settings (press Escape or click outside)

**Expected Result:**

- Hive tab disappears from bottom navigation
- Settings shows "Use the Hive tab to connect" link again
- Navigating back to Settings confirms disconnected state

---

### Test 7: Keyboard Navigation

**Purpose:** Verify Hive tab is keyboard accessible

**Steps:**

1. Connect to Hive
2. Press Tab repeatedly to navigate through the interface
3. Continue until Hive tab is focused
4. Press Enter

**Expected Result:**

- Hive tab receives focus during tab navigation
- Pressing Enter activates the tab and shows Hive view

---

### Test 8: Form Keyboard Submission

**Purpose:** Verify login form can be submitted with Enter key

**Steps:**

1. Navigate to Hive login form
2. Fill in email and password fields
3. Press Enter key (without clicking Connect button)

**Expected Result:**

- Form submits
- 2FA form appears (same as clicking Connect)

---

## Responsive Display Tests

### Test 9: Raspberry Pi Display (800x480)

**Purpose:** Verify Hive view fits on compact Raspberry Pi display

**Setup:** Resize browser to 800x480 or use DevTools device emulation

**Steps:**

1. Connect to Hive in demo mode
2. Navigate to Hive tab
3. Observe layout

**Expected Result:**

- Hive view fully visible within viewport
- Thermostat display visible
- Status indicators (heating, hot water) visible
- No overlap with top toolbar
- No overlap with bottom navigation
- No horizontal scrollbar

---

### Test 10: iPhone 14+ (390x844)

**Purpose:** Verify Hive view works on mobile devices

**Setup:** Resize browser to 390x844 or use DevTools device emulation

**Steps:**

1. Connect to Hive in demo mode
2. Navigate to Hive tab
3. Check login form display (disconnect first if needed)

**Expected Result:**

- Login form inputs are full-width (allowing for padding)
- Buttons are at least 44px tall (tappable)
- All elements have adequate spacing from screen edges

---

### Test 11: iPad (820x1180)

**Purpose:** Verify Hive view works on tablet devices

**Setup:** Resize browser to 820x1180 or use DevTools device emulation

**Steps:**

1. Connect to Hive in demo mode
2. Navigate to Hive tab
3. Check login form display

**Expected Result:**

- Login form is centered on screen
- Form has margins on both sides (not edge-to-edge)
- Thermostat display properly centered

---

## Accessibility Tests

### Test 12: Screen Reader Error Announcements

**Purpose:** Verify errors are announced to screen readers

**Steps:**

1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to Hive login form
3. Submit with invalid credentials

**Expected Result:**

- Error message is announced by screen reader
- Error element has `aria-live="polite"` attribute

---

### Test 13: Focus Management on 2FA Transition

**Purpose:** Verify focus moves to 2FA input when form transitions

**Steps:**

1. Navigate to Hive login form
2. Submit valid credentials
3. Observe where focus lands when 2FA form appears

**Expected Result:**

- Focus automatically moves to the 2FA code input field
- User can immediately start typing the code

---

## Test Execution Log

| Test | Date | Tester | Result | Notes |
| ---- | ---- | ------ | ------ | ----- |
| 1    |      |        |        |       |
| 2    |      |        |        |       |
| 3    |      |        |        |       |
| 4    |      |        |        |       |
| 5    |      |        |        |       |
| 6    |      |        |        |       |
| 7    |      |        |        |       |
| 8    |      |        |        |       |
| 9    |      |        |        |       |
| 10   |      |        |        |       |
| 11   |      |        |        |       |
| 12   |      |        |        |       |
| 13   |      |        |        |       |
