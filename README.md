# Philips Hue Bridge Connector

A simple React web application to verify connectivity with the Philips Hue Local Bridge API. This app guides you through discovering your bridge, authenticating, and testing the connection by fetching your lights.

## Features

- **Bridge Discovery**: Automatically find your Hue Bridge or enter the IP manually
- **Easy Authentication**: Simple guided flow for link button authentication
- **Connection Verification**: Test your connection and view all connected lights
- **Persistent Credentials**: Your bridge IP and username are saved in your browser
- **Clean UI**: Modern, responsive interface with step-by-step progress tracking

## Prerequisites

- **Philips Hue Bridge** (v1 or v2) with lights configured
- Device on the **same local network** as your bridge
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open the App

Open your browser and navigate to:
```
http://localhost:5173
```

### 4. Follow the On-Screen Steps

1. **Discover or Enter Bridge IP**: Use auto-discovery or manually enter your bridge's IP address
2. **Press Link Button**: Press the physical button on top of your Hue Bridge
3. **Authenticate**: Click "Create Username" within 30 seconds
4. **Test Connection**: View your connected lights to verify everything works

## How It Works

### Architecture

The app uses a three-step flow:

1. **Discovery** → Find your bridge's IP address
2. **Authentication** → Create an authenticated username
3. **Connected** → Test the connection and view lights

### Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Philips Hue API v1** - Local bridge communication
- **localStorage** - Credential persistence

### Key Files

- `src/services/hueApi.js` - API service layer for bridge communication
- `src/hooks/useHueBridge.js` - State management hook
- `src/components/BridgeDiscovery.jsx` - Bridge discovery UI
- `src/components/Authentication.jsx` - Authentication flow UI
- `src/components/ConnectionTest.jsx` - Connection testing UI
- `src/App.jsx` - Main application component

## Known Limitations

### CORS (Cross-Origin Resource Sharing)

The Philips Hue Bridge doesn't send CORS headers, which means browsers will block direct API requests from web applications. This is a security feature of modern browsers.

#### Workarounds for Development

**Option 1: Browser Extensions (Easiest)**

Install a CORS extension for your browser:
- **Chrome**: "Allow CORS: Access-Control-Allow-Origin" or "CORS Unblock"
- **Firefox**: "CORS Everywhere"
- **Safari**: Enable Develop menu → Disable Cross-Origin Restrictions

**Option 2: Direct Certificate Acceptance**

Visit your bridge directly in a new tab first:
```
http://[YOUR-BRIDGE-IP]/api/config
```

**Option 3: Production Solutions** (Future)

For production use, consider:
- Building a simple Node.js proxy server
- Creating an Electron desktop app (no CORS restrictions)
- Using React Native for a mobile app
- Deploying a backend service that proxies requests

## Finding Your Bridge IP

If auto-discovery doesn't work, you can find your bridge IP address in several ways:

### Method 1: Philips Hue App
1. Open the Philips Hue app on your phone
2. Go to **Settings** → **My Hue System** → **Bridge**
3. Look for the IP address listed

### Method 2: Router Admin Panel
1. Log into your router's admin interface
2. Look for connected devices or DHCP clients
3. Find "Philips Hue Bridge" in the list

### Method 3: Discovery Website
Visit: https://discovery.meethue.com/

## API Reference

This app uses the **Philips Hue Local API v1**:

### Endpoints Used

- `GET https://discovery.meethue.com/` - Discover bridges on network
- `POST http://{bridge-ip}/api` - Create new user (requires link button)
- `GET http://{bridge-ip}/api/{username}/lights` - Get all lights
- `GET http://{bridge-ip}/api/config` - Get bridge config (unauthenticated)

### Official Documentation

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Getting Started Guide](https://developers.meethue.com/develop/get-started-2/)
- [API Reference](https://developers.meethue.com/develop/hue-api/)

## Troubleshooting

### "Could not discover bridges"
- Ensure your device is on the same network as your Hue Bridge
- Try entering the IP address manually
- Check that your bridge is powered on and connected to your network

### "CORS Error" or "Browser security is blocking the request"
- Install a CORS browser extension (see CORS section above)
- Try visiting the bridge URL directly first
- Ensure you're using `http://` not `https://`

### "Link button not pressed"
- Make sure you pressed the physical button on the bridge
- You have 30 seconds after pressing to click "Create Username"
- Try again and ensure you press the button firmly

### Connection times out
- Verify the bridge IP address is correct
- Ensure your device and bridge are on the same network
- Check your firewall settings
- Try restarting the bridge

### No lights showing up
- Ensure lights are paired with your bridge in the Hue app
- Check that lights are powered on
- Verify your credentials are correct

## Project Structure

```
claude-test/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── README.md              # This file
├── .gitignore             # Git ignore rules
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app component
    ├── App.css            # Global styles
    ├── components/
    │   ├── BridgeDiscovery.jsx     # Bridge discovery component
    │   ├── Authentication.jsx      # Authentication component
    │   └── ConnectionTest.jsx      # Connection test component
    ├── services/
    │   └── hueApi.js               # Hue API service
    └── hooks/
        └── useHueBridge.js         # Bridge state management hook
```

## Available Scripts

### `npm run dev`
Starts the development server at http://localhost:5173

### `npm run build`
Builds the app for production to the `dist` folder

### `npm run preview`
Preview the production build locally

## Future Enhancements

This is a **verification app** focused on testing API connectivity. Potential future features:

### Light Control
- Toggle lights on/off
- Adjust brightness
- Change colors (for color-capable lights)
- Set color temperature

### Advanced Features
- Manage light groups
- Create and activate scenes
- Set up schedules and routines
- Entertainment mode for gaming/movies

### API v2 Support
- Server-Sent Events (SSE) for real-time updates
- Support for gradient lights
- Access to newer API features

### Better CORS Handling
- Electron desktop wrapper
- Backend proxy server
- Chrome extension
- React Native mobile app

## Contributing

This is a learning/demonstration project. Feel free to fork and modify for your needs.

## Security Notes

- Your bridge username is stored in browser localStorage
- The username acts as an API key - keep it secure
- Clear browser data to remove saved credentials
- The app only communicates with your local bridge (no external servers)

## License

MIT

## Acknowledgments

- Built with React and Vite
- Uses the Philips Hue Local API v1
- Inspired by the need for simple API verification tools

## Support

For issues related to:
- **This app**: Check the troubleshooting section above
- **Philips Hue Bridge**: Visit [Philips Hue Support](https://www.philips-hue.com/support)
- **Hue API**: Check the [Philips Hue Developer Portal](https://developers.meethue.com/)

---

**Note**: This application is for development and testing purposes. For production use, implement proper CORS handling via a backend proxy or native application wrapper.
