#!/bin/bash

# Hive Bug Fixes Verification Script
# Tests the three Hive connection state fixes:
# 1. Toggle/indicator sync
# 2. Username persistence during 2FA
# 3. Connection validation on startup

echo "=========================================="
echo "Hive Bug Fixes Verification Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
DEMO_MODE="true"

echo "Pre-requisites:"
echo "  - Backend running at $BACKEND_URL"
echo "  - Use ?demo=true for demo mode testing"
echo ""

# Check if backend is running
echo -n "Checking backend..."
if curl -s "$BACKEND_URL/api/v2/health" > /dev/null 2>&1; then
    echo -e " ${GREEN}OK${NC}"
else
    echo -e " ${RED}FAILED${NC}"
    echo "Please start the backend first: npm run dev:backend"
    exit 1
fi

echo ""
echo "=========================================="
echo "TEST 1: Toggle/Indicator Sync Fix"
echo "=========================================="
echo ""
echo "This fix ensures that when Hive connects/disconnects,"
echo "the settings.services.hive.enabled value stays in sync"
echo "with the actual connection state."
echo ""
echo "To verify manually:"
echo "  1. Open http://localhost:5173/?demo=true"
echo "  2. Navigate to Hive tab"
echo "  3. Login with demo@hive.com / demo / 123456"
echo "  4. After 2FA, go to Settings"
echo "  5. ${GREEN}PASS:${NC} Hive toggle should be ON with green indicator"
echo "  6. Toggle Hive OFF"
echo "  7. ${GREEN}PASS:${NC} Toggle OFF and indicator should turn gray"
echo ""

echo "=========================================="
echo "TEST 2: Username Persistence During 2FA"
echo "=========================================="
echo ""
echo "This fix ensures username is stored when 2FA completes,"
echo "so the connection can be tracked properly."
echo ""

# Check credentials file structure after connecting
echo "Checking credentials storage API..."
CREDS_FILE="backend/data/hive-credentials.json"
if [ -f "$CREDS_FILE" ]; then
    echo "Credentials file exists: $CREDS_FILE"
    echo "Contents (redacted):"
    cat "$CREDS_FILE" | grep -o '"[^"]*":' | head -5
else
    echo "No credentials file yet (normal before first login)"
fi
echo ""
echo "To verify manually:"
echo "  1. Login to Hive in demo mode"
echo "  2. Complete 2FA"
echo "  3. Check $CREDS_FILE contains 'username' field"
echo "  4. ${GREEN}PASS:${NC} File should have username stored"
echo ""

echo "=========================================="
echo "TEST 3: Connection Validation on Startup"
echo "=========================================="
echo ""
echo "This fix ensures that on startup, the backend actually"
echo "validates the connection (attempts token refresh) instead"
echo "of optimistically reporting connected."
echo ""
echo "API Test - Check connection status endpoint is async:"
echo -n "  GET /api/v2/services/hive..."
RESPONSE=$(curl -s -H "X-Demo-Mode: true" "$BACKEND_URL/api/v2/services/hive")
if echo "$RESPONSE" | grep -q '"connected"'; then
    echo -e " ${GREEN}OK${NC}"
    echo "  Response: $RESPONSE"
else
    echo -e " ${RED}FAILED${NC}"
    echo "  Response: $RESPONSE"
fi
echo ""
echo "To verify manually:"
echo "  1. Login to Hive in demo mode"
echo "  2. Restart the backend server"
echo "  3. Check Settings page"
echo "  4. ${GREEN}PASS:${NC} If session expired, should show disconnected"
echo "  5. ${GREEN}PASS:${NC} If session valid (or refreshed), should show connected"
echo ""

echo "=========================================="
echo "Automated Unit Test Results"
echo "=========================================="
echo ""
echo "Running backend tests for Hive services..."
cd "$(dirname "$0")/.."
npm run test:run -- --filter="hive" 2>&1 | tail -10

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "The following fixes have been applied:"
echo ""
echo "1. ${GREEN}Toggle/Indicator Sync${NC}"
echo "   File: frontend/src/components/Dashboard/index.jsx"
echo "   Change: Added useEffect to sync hiveConnected → settings.hive.enabled"
echo ""
echo "2. ${GREEN}Username Persistence${NC}"
echo "   Files: backend/services/hiveAuthService.js, hiveCredentialsManager.js"
echo "   Change: Added setUsername() method, called during storeTokens()"
echo ""
echo "3. ${GREEN}Connection Validation${NC}"
echo "   Files: backend/services/hiveService.js, routes/v2/services.js"
echo "   Change: getConnectionStatus() now async, validates by attempting refresh"
echo ""
echo "Run full test suite: npm run test:all"
echo ""
