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
import { detectDemoMode } from './middleware/demoMode.js';
import { openApiSpec } from './openapi.js';
import websocketService from './services/websocketService.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('SERVER');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = express();
const PORT = process.env.PORT || config.server.port;
const HOST = process.env.HOST || config.server.host;

// API version
const API_VERSION = '2.0.0';

// Create an HTTPS agent that accepts self-signed certificates
// Note: Currently unused as hueClient handles its own agent, kept for potential future use
const _httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API Documentation (Swagger UI)
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Hue Control API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

// Demo mode detection (before v1 routes)
app.use('/api/v1', detectDemoMode);

// Mount v1 API routes
app.use('/api/v1', v1Routes);

// Discovery endpoint (no bridge IP needed)
app.get('/api/discovery', async (req, res) => {
  try {
    logger.info('Discovery request');
    const response = await axios.get(config.hue.discoveryEndpoint);
    logger.info('Discovery complete', { bridgeCount: response.data.length });
    res.json(response.data);
  } catch (error) {
    logger.error('Discovery error', { error: error.message });
    res.status(500).json({
      error: 'Discovery failed',
      message: error.message,
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
      'auth-pairing',
      'session-auth',
      'websocket',
      'demo-mode',
      'settings',
      'weather',
    ],
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
  logger.info('Server started', { host: HOST, port: PORT, websocket: '/api/v1/ws' });
});

// Initialize WebSocket server
websocketService.initialize(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing HTTP server');
  websocketService.shutdown();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
