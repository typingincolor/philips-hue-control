import { WebSocketServer } from 'ws';
import dashboardService from './dashboardService.js';
import sessionManager from './sessionManager.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from './mockData.js';
import {
  WEBSOCKET_POLL_INTERVAL_MS,
  WEBSOCKET_HEARTBEAT_INTERVAL_MS,
  WEBSOCKET_CLEANUP_INTERVAL_MS,
} from '../constants/timings.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('WEBSOCKET');

/**
 * WebSocket Service for real-time updates
 * Manages WebSocket connections and polls Hue Bridge for state changes
 */
class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // bridgeIp → Set<WebSocket>
    this.pollingIntervals = new Map(); // bridgeIp → intervalId
    this.stateCache = new Map(); // bridgeIp → lastKnownState
    this.pollInterval = WEBSOCKET_POLL_INTERVAL_MS;
  }

  /**
   * Get current connection statistics for debugging
   */
  getStats() {
    const stats = {
      totalClients: this.wss?.clients?.size || 0,
      bridges: {},
      pollingIntervals: this.pollingIntervals.size,
      stateCaches: this.stateCache.size,
    };

    for (const [bridgeIp, connections] of this.connections) {
      stats.bridges[bridgeIp] = {
        connections: connections.size,
        hasPolling: this.pollingIntervals.has(bridgeIp),
        hasCache: this.stateCache.has(bridgeIp),
      };
    }

    return stats;
  }

  /**
   * Log current connection statistics
   */
  logStats(context = '') {
    const stats = this.getStats();
    logger.debug('Stats', {
      context,
      totalClients: stats.totalClients,
      bridgeCount: Object.keys(stats.bridges).length,
      pollingIntervals: stats.pollingIntervals,
      bridges: stats.bridges,
    });
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/v1/ws',
    });

    this.wss.on('connection', (ws) => {
      logger.info('New client connected');

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        logger.error('Connection error', { error: error.message });
      });
    });

    // Heartbeat check - terminates dead connections
    this.heartbeatInterval = setInterval(() => {
      let terminated = 0;
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.warn('Terminating unresponsive client', { bridgeIp: ws.bridgeIp || 'unknown' });
          this.handleDisconnect(ws); // Clean up before terminating
          ws.terminate();
          terminated++;
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
      if (terminated > 0) {
        this.logStats('after heartbeat cleanup');
      }
    }, WEBSOCKET_HEARTBEAT_INTERVAL_MS);

    // Periodic cleanup check - catches any orphaned resources
    this.cleanupInterval = setInterval(() => {
      this.cleanupOrphanedResources();
    }, WEBSOCKET_CLEANUP_INTERVAL_MS);

    logger.info('Server initialized', { path: '/api/v1/ws' });
  }

  /**
   * Clean up orphaned polling intervals and stale connections
   */
  cleanupOrphanedResources() {
    let cleaned = false;

    // Check for polling intervals without active connections
    for (const [bridgeIp, intervalId] of this.pollingIntervals) {
      const connections = this.connections.get(bridgeIp);
      if (!connections || connections.size === 0) {
        logger.debug('Cleaning up orphaned polling interval', { bridgeIp });
        clearInterval(intervalId);
        this.pollingIntervals.delete(bridgeIp);
        this.stateCache.delete(bridgeIp);
        this.connections.delete(bridgeIp);
        cleaned = true;
      }
    }

    // Check for stale connections (not in OPEN state)
    for (const [bridgeIp, connections] of this.connections) {
      const staleConnections = [];
      connections.forEach((ws) => {
        if (ws.readyState !== 1) {
          // Not OPEN
          staleConnections.push(ws);
        }
      });

      for (const ws of staleConnections) {
        logger.debug('Removing stale connection', { bridgeIp, readyState: ws.readyState });
        connections.delete(ws);
        cleaned = true;
      }

      // If no connections left, stop polling
      if (connections.size === 0 && this.pollingIntervals.has(bridgeIp)) {
        logger.debug('No active connections, stopping polling', { bridgeIp });
        this.stopPolling(bridgeIp);
        this.connections.delete(bridgeIp);
        this.stateCache.delete(bridgeIp);
        cleaned = true;
      }
    }

    if (cleaned) {
      this.logStats('after cleanup');
    }
  }

  /**
   * Handle incoming messages from clients
   */
  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'auth') {
        await this.handleAuth(ws, data);
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      logger.error('Message handling error', { error: error.message });
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
        })
      );
    }
  }

  /**
   * Handle client authentication
   * Supports session token and demo mode
   */
  async handleAuth(ws, data) {
    let bridgeIp, username;

    // Demo mode (no credentials needed)
    if (data.demoMode === true) {
      bridgeIp = DEMO_BRIDGE_IP;
      username = DEMO_USERNAME;
      ws.authMethod = 'demo';
      ws.demoMode = true;
      logger.info('Client authenticated via demo mode');
    }
    // Session token
    else if (data.sessionToken) {
      const session = sessionManager.getSession(data.sessionToken);

      if (!session) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid or expired session token',
          })
        );
        return;
      }

      bridgeIp = session.bridgeIp;
      username = session.username;
      ws.authMethod = 'session';
      logger.info('Client authenticated via session token', { bridgeIp });
    }
    // Error: No valid auth provided
    else {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Missing authentication: provide demoMode or sessionToken',
        })
      );
      return;
    }

    // Store connection credentials
    ws.bridgeIp = bridgeIp;
    ws.username = username;

    // Add to connections map
    if (!this.connections.has(bridgeIp)) {
      this.connections.set(bridgeIp, new Set());
      await this.startPolling(bridgeIp, username);
    }
    this.connections.get(bridgeIp).add(ws);
    this.logStats('after auth');

    // Send initial state (use cached state from polling if available)
    try {
      const cachedState = this.stateCache.get(bridgeIp);
      const dashboard = cachedState || (await dashboardService.getDashboard(bridgeIp, username));
      ws.send(
        JSON.stringify({
          type: 'initial_state',
          data: dashboard,
        })
      );
    } catch (error) {
      logger.error('Failed to send initial state', { error: error.message });
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Failed to fetch initial state',
        })
      );
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(ws) {
    const bridgeIp = ws.bridgeIp || 'unknown';
    logger.info('Client disconnected', { bridgeIp });

    if (ws.bridgeIp) {
      const connections = this.connections.get(ws.bridgeIp);
      if (connections) {
        const hadConnection = connections.has(ws);
        connections.delete(ws);

        if (hadConnection) {
          logger.debug('Removed connection', {
            bridgeIp: ws.bridgeIp,
            remaining: connections.size,
          });
        }

        // Stop polling if no more connections for this bridge
        if (connections.size === 0) {
          logger.debug('No more connections, cleaning up', { bridgeIp: ws.bridgeIp });
          this.stopPolling(ws.bridgeIp);
          this.connections.delete(ws.bridgeIp);
          this.stateCache.delete(ws.bridgeIp);
        }
      }
    }

    this.logStats('after disconnect');
  }

  /**
   * Start polling Hue Bridge for state changes
   */
  async startPolling(bridgeIp, username) {
    logger.info('Starting polling', { bridgeIp });

    const poll = async () => {
      try {
        const currentState = await dashboardService.getDashboard(bridgeIp, username);
        const previousState = this.stateCache.get(bridgeIp);

        if (previousState) {
          const changes = this.detectChanges(previousState, currentState);
          if (changes.length > 0) {
            this.broadcast(bridgeIp, {
              type: 'state_update',
              changes,
            });
          }
        }

        this.stateCache.set(bridgeIp, currentState);
      } catch (error) {
        logger.error('Polling error', { bridgeIp, error: error.message });
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    const intervalId = setInterval(poll, this.pollInterval);
    this.pollingIntervals.set(bridgeIp, intervalId);
  }

  /**
   * Stop polling for a bridge
   */
  stopPolling(bridgeIp) {
    const intervalId = this.pollingIntervals.get(bridgeIp);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(bridgeIp);
      logger.info('Stopped polling', { bridgeIp });
    }
  }

  /**
   * Detect changes between states
   */
  detectChanges(previous, current) {
    const changes = [];

    // Detect summary changes
    if (JSON.stringify(previous.summary) !== JSON.stringify(current.summary)) {
      changes.push({
        type: 'summary',
        data: current.summary,
      });
    }

    // Detect room changes
    const prevRoomMap = new Map(previous.rooms.map((r) => [r.id, r]));
    const currRoomMap = new Map(current.rooms.map((r) => [r.id, r]));

    for (const [roomId, currRoom] of currRoomMap) {
      const prevRoom = prevRoomMap.get(roomId);

      if (!prevRoom || JSON.stringify(prevRoom) !== JSON.stringify(currRoom)) {
        changes.push({
          type: 'room',
          data: currRoom,
        });
      }
    }

    // Detect light changes
    for (const room of current.rooms) {
      const prevRoom = prevRoomMap.get(room.id);
      if (!prevRoom) continue;

      const prevLightMap = new Map(prevRoom.lights.map((l) => [l.id, l]));

      for (const light of room.lights) {
        const prevLight = prevLightMap.get(light.id);

        if (!prevLight || JSON.stringify(prevLight) !== JSON.stringify(light)) {
          changes.push({
            type: 'light',
            data: light,
            roomId: room.id,
          });
        }
      }
    }

    // Detect motion zone changes
    const prevMotionZones = previous.motionZones || [];
    const currMotionZones = current.motionZones || [];

    const prevMotionMap = new Map(prevMotionZones.map((z) => [z.id, z]));

    for (const zone of currMotionZones) {
      const prevZone = prevMotionMap.get(zone.id);

      if (!prevZone || JSON.stringify(prevZone) !== JSON.stringify(zone)) {
        changes.push({
          type: 'motion_zone',
          data: zone,
        });
      }
    }

    // Detect zone (light grouping) changes
    const prevZones = previous.zones || [];
    const currZones = current.zones || [];

    const prevZoneMap = new Map(prevZones.map((z) => [z.id, z]));

    for (const zone of currZones) {
      const prevZone = prevZoneMap.get(zone.id);

      if (!prevZone || JSON.stringify(prevZone) !== JSON.stringify(zone)) {
        changes.push({
          type: 'zone',
          data: zone,
        });
      }
    }

    return changes;
  }

  /**
   * Broadcast message to all clients connected to a bridge
   */
  broadcast(bridgeIp, message) {
    const connections = this.connections.get(bridgeIp);
    if (!connections) return;

    const messageStr = JSON.stringify(message);
    let sent = 0;

    connections.forEach((ws) => {
      if (ws.readyState === 1) {
        // OPEN state
        ws.send(messageStr);
        sent++;
      }
    });

    if (sent > 0) {
      logger.debug('Broadcasted update', { type: message.type, clients: sent });
    }
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown() {
    logger.info('Shutting down');
    this.logStats('before shutdown');

    // Stop all polling
    for (const bridgeIp of this.pollingIntervals.keys()) {
      this.stopPolling(bridgeIp);
    }

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear all maps
    this.connections.clear();
    this.stateCache.clear();

    // Close all connections
    if (this.wss) {
      this.wss.close();
    }

    logger.info('Shutdown complete');
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
