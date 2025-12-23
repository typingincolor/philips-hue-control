import express from 'express';
import websocketService from '../../services/websocketService.js';

const router = express.Router();

/**
 * GET /api/v1/stats/websocket
 * Get WebSocket connection statistics for debugging
 */
router.get('/websocket', (req, res) => {
  const stats = websocketService.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

export default router;
