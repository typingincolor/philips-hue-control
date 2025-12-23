import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import v1Routes from './routes/v1/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi.js';
import websocketService from './services/websocketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = express();
const PORT = process.env.PORT || config.server.port;
const HOST = process.env.HOST || config.server.host;

// API version
const API_VERSION = '1.0.0';

// Create an HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API Documentation (Swagger UI)
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Hue Control API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Mount v1 API routes
app.use('/api/v1', v1Routes);

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

    // Forward hue-application-key header for API v2 support
    if (req.headers['hue-application-key']) {
      axiosConfig.headers['hue-application-key'] = req.headers['hue-application-key'];
      console.log('[PROXY] Using v2 API with application key');
    }

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

// Health check endpoint (updated with version info)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hue API server is running',
    version: API_VERSION,
    docs: '/api/v1/docs',
    capabilities: [
      'dashboard',
      'motion-zones',
      'light-control',
      'scene-activation',
      'session-auth',
      'websocket',
      'legacy-proxy'
    ]
  });
});

// Alias at /api/health
app.get('/api/health', (req, res) => {
  res.redirect('/health');
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

// Error handlers (must be after all routes)
// 404 handler for API routes
app.use('/api', notFoundHandler);

// Global error handler
app.use(errorHandler);

// SPA fallback: serve index.html for all other routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Philips Hue Control Server                            ║
║  Running on http://${HOST}:${PORT}                        ║
║                                                        ║
║  Access from other devices using your machine's IP:    ║
║  http://<your-local-ip>:${PORT}                          ║
║                                                        ║
║  API proxy and frontend served on same port            ║
║  WebSocket support enabled at /api/v1/ws               ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Initialize WebSocket server
websocketService.initialize(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  websocketService.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
  });
});
