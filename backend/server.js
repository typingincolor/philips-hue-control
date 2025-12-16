import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = express();
const PORT = process.env.PORT || config.server.port;
const HOST = process.env.HOST || config.server.host;

// Create an HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint for Hue Bridge requests
app.all(/^\/api\/hue\/(.*)/, async (req, res) => {
  try {
    // Extract the bridge IP from query parameters
    const bridgeIp = req.query.bridgeIp;

    if (!bridgeIp) {
      console.error('[PROXY] Missing bridgeIp parameter');
      return res.status(400).json({ error: 'bridgeIp query parameter is required' });
    }

    // Get the path after /api/hue/
    const huePath = req.path.replace('/api/hue/', '');

    // Construct the full Hue Bridge URL (use HTTPS as bridges redirect HTTP to HTTPS)
    const hueUrl = `https://${bridgeIp}/${huePath}`;

    console.log(`[PROXY] ${req.method} ${hueUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`[PROXY] Body:`, JSON.stringify(req.body));
    }

    // Prepare axios config
    const axiosConfig = {
      method: req.method,
      url: hueUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      httpsAgent: httpsAgent,
      validateStatus: () => true // Accept all status codes
    };

    // Add data for POST, PUT, PATCH requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      axiosConfig.data = req.body;
      console.log(`[PROXY] Sending body:`, JSON.stringify(req.body));
    }

    // Make request to Hue Bridge
    console.log(`[PROXY] Sending request to bridge...`);
    const response = await axios(axiosConfig);
    console.log(`[PROXY] Response status: ${response.status}`);
    console.log(`[PROXY] Response data:`, JSON.stringify(response.data).substring(0, 200));

    // Send response back to client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    console.error('[PROXY] Stack:', error.stack);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Discovery endpoint (no bridge IP needed)
app.get('/api/discovery', async (req, res) => {
  try {
    console.log('[PROXY] Discovery request');
    const response = await axios.get(config.hue.discoveryEndpoint);
    console.log(`[PROXY] Found ${response.data.length} bridges`);
    res.json(response.data);
  } catch (error) {
    console.error('[PROXY] Discovery error:', error.message);
    res.status(500).json({
      error: 'Discovery failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Config endpoint - expose configuration to frontend
app.get('/api/config', (req, res) => {
  res.json({
    hue: config.hue,
    // Only expose safe config values to frontend
  });
});

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, 'public');
app.use(express.static(frontendBuildPath));

// SPA fallback: serve index.html for all other routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Philips Hue Control Server                            ║
║  Running on http://${HOST}:${PORT}                        ║
║                                                        ║
║  Access from other devices using your machine's IP:    ║
║  http://<your-local-ip>:${PORT}                          ║
║                                                        ║
║  API proxy and frontend served on same port            ║
╚════════════════════════════════════════════════════════╝
  `);
});
