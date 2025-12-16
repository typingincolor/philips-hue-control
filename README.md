# Philips Hue Light Control

A modern React web application for controlling Philips Hue lights locally. Features a responsive card-based interface with visual light controls, room organization, and scene management. Built with a separated frontend/backend architecture for easy deployment across multiple machines.

## Features

- **Visual Light Control**: Toggle lights with color-coded bulb buttons (green=on, red=off)
- **Room Organization**: Lights automatically grouped by room with horizontal card layout
- **Scene Management**: Select and activate scenes for each room
- **Master Controls**: Turn all lights in a room on/off with one button
- **Auto-Refresh**: Light states automatically refresh every 30 seconds
- **Responsive Design**: 4 cards on large screens, 3 on medium, 1 on small
- **Dynamic Sizing**: Buttons scale based on viewport width while maintaining readability
- **Bridge Discovery**: Automatically find your Hue Bridge or enter IP manually
- **Easy Authentication**: Simple guided flow with link button authentication
- **Persistent Credentials**: Bridge IP and username saved in browser localStorage
- **CORS Solution**: Built-in proxy server handles CORS and HTTPS certificate issues
- **Multi-Machine Support**: Access from any device on your network
- **Centralized Configuration**: All settings managed through config.json

## Prerequisites

- **Philips Hue Bridge** (v1 or v2) with lights configured
- **Node.js** (v16 or higher)
- Server machine on the **same local network** as your bridge
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

Run both frontend and backend servers with hot reload:

```bash
npm run dev
```

This starts:
- **Frontend** on http://localhost:5173 (React dev server with hot reload)
- **Backend** on http://localhost:3001 (API proxy server)

Open your browser to http://localhost:5173

### 3. Production Deployment

Build and start the production server:

```bash
npm run deploy
```

Or step by step:

```bash
npm run build              # Build frontend
npm run build:backend      # Copy frontend to backend
npm run start              # Start production server
```

The server runs on http://0.0.0.0:3001 and serves both the API and frontend.

### 4. Access from Other Devices

Once the server is running, access it from any device on your network:

```
http://192.168.68.86:3001
```

Replace `192.168.68.86` with your server's local IP address.

To find your server's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 5. Initial Setup

1. **Discover or Enter Bridge IP**: Use auto-discovery or manually enter your bridge's IP address
2. **Press Link Button**: Press the physical button on top of your Hue Bridge
3. **Authenticate**: Click "Create Username" within 30 seconds
4. **Control Your Lights**: View and control all your lights organized by room

## Architecture

### Monorepo Structure

The app is organized as a monorepo with separate frontend and backend workspaces:

```
philips-hue-connector/
├── config.json                 # Centralized configuration
├── package.json                # Root workspace manager
├── frontend/                   # React frontend workspace
│   ├── package.json
│   ├── vite.config.js         # Vite config (reads config.json)
│   ├── index.html
│   ├── dist/                  # Build output (gitignored)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── BridgeDiscovery.jsx
│       │   ├── Authentication.jsx
│       │   └── ConnectionTest.jsx
│       ├── services/
│       │   └── hueApi.js      # API client (uses relative URLs)
│       └── hooks/
│           └── useHueBridge.js
└── backend/                    # Express backend workspace
    ├── package.json
    ├── server.js              # Express server (API + static files)
    ├── scripts/
    │   └── copy-frontend.js   # Build script
    └── public/                # Served frontend (gitignored)
```

### Configuration File

All hostnames, IPs, and ports are centralized in `config.json`:

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "corsEnabled": true
  },
  "hue": {
    "discoveryEndpoint": "https://discovery.meethue.com/"
  },
  "development": {
    "frontendPort": 5173,
    "backendPort": 3001
  }
}
```

**Benefits:**
- Single source of truth for configuration
- Easy to modify without code changes
- Backend exposes `/api/config` endpoint for frontend access
- Can be overridden by environment variables

### How It Works

**Development Mode:**
- Frontend: Vite dev server on port 5173 with hot reload
- Backend: Express server on port 3001
- Vite proxies `/api/*` requests to backend automatically

**Production Mode:**
- Backend serves both API and frontend on single port (3001)
- Frontend uses relative URLs (same origin = no CORS issues)
- Access from any machine using server's IP address

**CORS Solution:**
The Philips Hue Bridge doesn't send CORS headers and uses self-signed HTTPS certificates. The backend server:
- Forwards all API requests to your bridge
- Adds proper CORS headers for browser access
- Accepts the bridge's self-signed SSL certificate
- Listens on all network interfaces (0.0.0.0)

**No browser extensions or workarounds needed!**

### Technology Stack

- **React 18** - UI framework with hooks
- **Vite 6** - Fast build tool and dev server
- **Express 5** - Backend server for CORS and static files
- **Axios** - HTTP client with HTTPS agent support
- **Philips Hue API v1** - Local bridge communication
- **localStorage** - Credential persistence
- **CSS Grid & Flexbox** - Responsive card layout
- **CSS Custom Properties** - Dynamic sizing with clamp()
- **npm workspaces** - Monorepo management

## Available Scripts

### Root Scripts (run from project root)

#### `npm run dev`
Starts both frontend and backend in development mode with hot reload

#### `npm run build`
Builds the frontend for production (output: `frontend/dist/`)

#### `npm run build:backend`
Copies frontend build to backend/public/ directory

#### `npm run start`
Starts the production server (backend serves API + frontend)

#### `npm run deploy`
Full deployment: builds frontend, copies to backend, starts server

### Workspace Scripts

#### `npm run dev:frontend`
Starts only the frontend dev server

#### `npm run dev:backend`
Starts only the backend server

## UI Features

### Responsive Card Layout

- **Large screens (>1200px)**: 4 cards per row
- **Medium screens (768px-1200px)**: 3 cards per row
- **Small screens (<768px)**: 1 card full width

### Dynamic Button Sizing

Buttons scale with viewport width:
- **Minimum**: 60px (maintains usability on small screens)
- **Maximum**: 80px (prevents oversized buttons on large displays)
- **Icons**: Scale to 90% of button size
- **Cards**: Always fit at least 5 buttons horizontally (4 on large screens)

### Visual Feedback

- **Green buttons**: Lights are on
- **Red buttons**: Lights are off
- **Loading indicators**: Show when toggling lights or activating scenes
- **Unreachable lights**: Warning indicator displayed
- **Hover effects**: Cards and buttons have subtle animations

## Finding Your Bridge IP

If auto-discovery doesn't work, find your bridge IP:

### Method 1: Philips Hue App
1. Open the Philips Hue app
2. Go to **Settings** → **My Hue System** → **Bridge**
3. Note the IP address

### Method 2: Router Admin Panel
1. Log into your router's admin interface
2. Look for connected devices or DHCP clients
3. Find "Philips Hue Bridge"

### Method 3: Discovery Website
Visit: https://discovery.meethue.com/

## API Reference

This app uses the **Philips Hue Local API v1**:

### Endpoints Used

- `GET https://discovery.meethue.com/` - Discover bridges on network
- `POST http://{bridge-ip}/api` - Create new user (requires link button)
- `GET http://{bridge-ip}/api/{username}/lights` - Get all lights
- `GET http://{bridge-ip}/api/{username}/groups` - Get rooms/zones
- `GET http://{bridge-ip}/api/{username}/scenes` - Get scenes
- `PUT http://{bridge-ip}/api/{username}/lights/{id}/state` - Control light
- `PUT http://{bridge-ip}/api/{username}/groups/{id}/action` - Activate scene
- `GET http://{bridge-ip}/api/config` - Get bridge config (unauthenticated)

### Backend Endpoints

- `GET /api/config` - Get safe configuration values
- `GET /api/discovery` - Proxy to Hue discovery service
- `GET /api/health` - Health check endpoint
- `ALL /api/hue/*` - Proxy all Hue Bridge API requests

### Official Documentation

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Getting Started Guide](https://developers.meethue.com/develop/get-started-2/)
- [API Reference](https://developers.meethue.com/develop/hue-api/)

## Deployment Guide

### Single Server Deployment (Recommended)

1. **Build the application:**
   ```bash
   npm run build
   npm run build:backend
   ```

2. **Start the server:**
   ```bash
   npm run start
   ```

3. **Access from any device:**
   ```
   http://<server-ip>:3001
   ```

### Configuration

Edit `config.json` to customize:
- Server port (default: 3001)
- Server host (default: 0.0.0.0 for all interfaces)
- Development ports
- Hue discovery endpoint

Environment variables override config.json:
```bash
PORT=8080 npm run start
```

### Network Requirements

- **Backend server** must be on the same local network as the Hue Bridge
- **Client devices** can be on any network that can reach the server
- **Firewall**: Ensure port 3001 (or your configured port) is accessible

## Troubleshooting

### "Could not discover bridges"
- Ensure your device is on the same network as your Hue Bridge
- Try entering the IP address manually
- Check that your bridge is powered on and connected to your network

### "Could not connect to proxy server"
- Make sure the backend server is running
- Check that nothing else is using the configured port
- Verify http://localhost:3001/api/health returns "ok"

### "Link button not pressed"
- Press the physical button on the bridge
- You have 30 seconds to click "Create Username"
- Try again if you missed the window

### Connection times out
- Verify the bridge IP address is correct
- Ensure server and bridge are on the same network
- Check firewall settings
- Try restarting the bridge

### No lights showing up
- Ensure lights are paired with your bridge in the Hue app
- Check that lights are powered on
- Verify your credentials are correct
- Try refreshing the lights list

### Lights not responding
- Check that lights are powered on and reachable
- Unreachable lights show a warning icon (⚠️)
- Some lights may take a moment to respond
- Try toggling again if the first attempt fails

### "PathError: Missing parameter name" (Express 5)
- This has been fixed in v0.2.0
- Ensure you're using the latest version
- The wildcard route now uses `app.use()` instead of `app.get('*')`

## Security Notes

- Your bridge username is stored in browser localStorage
- The username acts as an API key - keep it secure
- Clear browser data to remove saved credentials
- The app communicates only with your local bridge
- The backend accepts self-signed certificates (required for Hue Bridge)
- No data is sent to external servers
- CORS is open by default (configure in config.json if needed)

## Version History

### v0.2.0 (Current)
- **Separated frontend and backend** into monorepo structure
- **Added config.json** for centralized configuration
- **Multi-machine support** - access from any device on network
- **Single deployment** - backend serves both API and frontend
- **Express 5 compatibility** - fixed wildcard route pattern
- Backend listens on 0.0.0.0 (all network interfaces)
- Frontend uses relative URLs (no hardcoded localhost)
- Vite proxy for seamless development workflow

### v0.1.0
- Initial release with full light control features
- Responsive card-based UI
- Bridge discovery and authentication
- Room organization and scene management

## Contributing

This project demonstrates modern React patterns, monorepo architecture, and responsive design. Feel free to fork and modify for your needs.

## License

MIT

## Acknowledgments

- Built with React, Vite, and Express
- Uses the Philips Hue Local API v1
- Responsive design with CSS Grid and Flexbox
- Dynamic sizing with CSS clamp() function

## Support

For issues related to:
- **This app**: Check the troubleshooting section above
- **Philips Hue Bridge**: Visit [Philips Hue Support](https://www.philips-hue.com/support)
- **Hue API**: Check the [Philips Hue Developer Portal](https://developers.meethue.com/)

---

**Built with ❤️ for the smart home community**
