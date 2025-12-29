/**
 * V2 Services Routes
 * Unified API for all service plugins
 */

import express from 'express';
import ServiceRegistry from '../../services/ServiceRegistry.js';
import { detectDemoMode } from '../../middleware/demoMode.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('V2_SERVICES');
const router = express.Router();

// Apply demo mode detection to all routes
router.use(detectDemoMode);

/**
 * GET /api/v2/services
 * List all available services with metadata
 */
router.get('/', (req, res) => {
  const services = ServiceRegistry.getAllMetadata();
  res.json({ services });
});

/**
 * GET /api/v2/services/:id
 * Get service info and connection status
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const plugin = ServiceRegistry.get(id, demoMode);

    if (!plugin) {
      return res.status(404).json({ error: `Service '${id}' not found` });
    }

    const metadata = plugin.getMetadata();
    const connectionStatus = await plugin.getConnectionStatus(demoMode);

    res.json({
      ...metadata,
      connected: connectionStatus.connected,
      ...connectionStatus,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/services/:id/connect
 * Connect to a service
 */
router.post('/:id/connect', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const plugin = ServiceRegistry.get(id, demoMode);

    if (!plugin) {
      return res.status(404).json({ error: `Service '${id}' not found` });
    }

    logger.debug('Connecting to service', { id, demoMode });

    const result = await plugin.connect(req.body);

    // Handle various response types
    if (result.requires2fa) {
      return res.json({
        requires2fa: true,
        session: result.session,
      });
    }

    if (result.requiresPairing) {
      return res.json({ requiresPairing: true });
    }

    if (!result.success && result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    logger.error('Connect error', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * POST /api/v2/services/:id/disconnect
 * Disconnect from a service
 */
router.post('/:id/disconnect', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const plugin = ServiceRegistry.get(id, demoMode);

    if (!plugin) {
      return res.status(404).json({ error: `Service '${id}' not found` });
    }

    await plugin.disconnect();

    res.json({ success: true });
  } catch (error) {
    logger.error('Disconnect error', { id: req.params.id, error: error.message });
    next(error);
  }
});

/**
 * GET /api/v2/services/:id/status
 * Get service status/data
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoMode = req.demoMode || false;
    const plugin = ServiceRegistry.get(id, demoMode);

    if (!plugin) {
      return res.status(404).json({ error: `Service '${id}' not found` });
    }

    // Check if connected
    if (!plugin.isConnected()) {
      return res.status(401).json({ error: 'Not connected' });
    }

    const status = await plugin.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Status error', { id: req.params.id, error: error.message });
    // Return 401 for connection errors
    if (error.message && error.message.includes('Not connected')) {
      return res.status(401).json({ error: 'Not connected' });
    }
    next(error);
  }
});

// Mount plugin-specific routes with dynamic plugin selection
for (const plugin of ServiceRegistry.getAll()) {
  const id = plugin.constructor.id;

  // Create wrapper that dynamically selects plugin based on demoMode
  router.use(`/${id}`, (req, res, next) => {
    const demoMode = req.demoMode || false;
    const selectedPlugin = ServiceRegistry.get(id, demoMode);

    if (!selectedPlugin) {
      return res.status(404).json({ error: `Service '${id}' not found` });
    }

    const pluginRouter = selectedPlugin.getRouter();
    if (pluginRouter) {
      pluginRouter(req, res, next);
    } else {
      next();
    }
  });
  logger.debug('Mounted dynamic plugin routes', { id });
}

export default router;
