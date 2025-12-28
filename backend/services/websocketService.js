import { Server } from 'socket.io';
import dashboardService from './dashboardService.js';
import sessionManager from './sessionManager.js';
import { DEMO_BRIDGE_IP, DEMO_USERNAME } from './mockData.js';
import { WEBSOCKET_POLL_INTERVAL_MS } from '../constants/timings.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('WEBSOCKET');

/**
 * WebSocket Service using Socket.IO for real-time updates
 */
class WebSocketService {
  constructor() {
    this.io = null;
    this.pollingIntervals = new Map(); // bridgeIp → intervalId
    this.stateCache = new Map(); // bridgeIp → lastKnownState
    this.pollInterval = WEBSOCKET_POLL_INTERVAL_MS;
  }

  getStats() {
    const sockets = this.io?.sockets?.sockets?.size || 0;
    const rooms = {};
    if (this.io) {
      for (const [bridgeIp, intervalId] of this.pollingIntervals) {
        const room = this.io.sockets.adapter.rooms.get(`bridge:${bridgeIp}`);
        rooms[bridgeIp] = {
          connections: room?.size || 0,
          hasPolling: !!intervalId,
          hasCache: this.stateCache.has(bridgeIp),
        };
      }
    }
    return { totalClients: sockets, bridges: rooms, pollingIntervals: this.pollingIntervals.size };
  }

  logStats(context = '') {
    const stats = this.getStats();
    logger.debug('Stats', { context, ...stats });
  }

  initialize(server) {
    this.io = new Server(server, {
      path: '/api/v1/ws',
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    this.io.on('connection', (socket) => {
      logger.info('New client connected');

      socket.on('auth', (data) => this.handleAuth(socket, data));
      socket.on('ping', () => socket.emit('pong'));
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('error', (err) => logger.error('Connection error', { error: err.message }));
    });

    logger.info('Server initialized', { path: '/api/v1/ws' });
  }

  async handleAuth(socket, data) {
    let bridgeIp, username;

    if (data.demoMode === true) {
      bridgeIp = DEMO_BRIDGE_IP;
      username = DEMO_USERNAME;
      socket.data.authMethod = 'demo';
      socket.data.demoMode = true;
      logger.info('Client authenticated via demo mode');
    } else if (data.sessionToken) {
      const session = sessionManager.getSession(data.sessionToken);
      if (!session) {
        socket.emit('error', { message: 'Invalid or expired session token' });
        return;
      }
      bridgeIp = session.bridgeIp;
      username = session.username;
      socket.data.authMethod = 'session';
      logger.info('Client authenticated via session token', { bridgeIp });
    } else {
      socket.emit('error', { message: 'Missing authentication: provide demoMode or sessionToken' });
      return;
    }

    socket.data.bridgeIp = bridgeIp;
    socket.data.username = username;

    // Join bridge room
    socket.join(`bridge:${bridgeIp}`);

    // Start polling if first connection for this bridge
    const room = this.io.sockets.adapter.rooms.get(`bridge:${bridgeIp}`);
    if (room?.size === 1) {
      await this.startPolling(bridgeIp, username);
    }

    this.logStats('after auth');

    // Send initial state
    try {
      const dashboard =
        this.stateCache.get(bridgeIp) || (await dashboardService.getDashboard(bridgeIp, username));
      socket.emit('initial_state', dashboard);
    } catch (error) {
      logger.error('Failed to send initial state', { error: error.message });
      socket.emit('error', { message: 'Failed to fetch initial state' });
    }
  }

  handleDisconnect(socket) {
    const bridgeIp = socket.data.bridgeIp || 'unknown';
    logger.info('Client disconnected', { bridgeIp });

    if (bridgeIp !== 'unknown') {
      const room = this.io.sockets.adapter.rooms.get(`bridge:${bridgeIp}`);
      if (!room || room.size === 0) {
        logger.debug('No more connections, cleaning up', { bridgeIp });
        this.stopPolling(bridgeIp);
        this.stateCache.delete(bridgeIp);
      }
    }

    this.logStats('after disconnect');
  }

  async startPolling(bridgeIp, username) {
    logger.info('Starting polling', { bridgeIp });

    const poll = async () => {
      try {
        const currentState = await dashboardService.getDashboard(bridgeIp, username);
        const previousState = this.stateCache.get(bridgeIp);

        if (previousState) {
          const changes = this.detectChanges(previousState, currentState);
          if (changes.length > 0) {
            this.io.to(`bridge:${bridgeIp}`).emit('state_update', { changes });
          }
        }

        this.stateCache.set(bridgeIp, currentState);
      } catch (error) {
        logger.error('Polling error', { bridgeIp, error: error.message });
      }
    };

    await poll();
    const intervalId = setInterval(poll, this.pollInterval);
    this.pollingIntervals.set(bridgeIp, intervalId);
  }

  stopPolling(bridgeIp) {
    const intervalId = this.pollingIntervals.get(bridgeIp);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(bridgeIp);
      logger.info('Stopped polling', { bridgeIp });
    }
  }

  detectChanges(previous, current) {
    const changes = [];

    if (JSON.stringify(previous.summary) !== JSON.stringify(current.summary)) {
      changes.push({ type: 'summary', data: current.summary });
    }

    const prevRoomMap = new Map(previous.rooms.map((r) => [r.id, r]));
    const currRoomMap = new Map(current.rooms.map((r) => [r.id, r]));

    for (const [roomId, currRoom] of currRoomMap) {
      const prevRoom = prevRoomMap.get(roomId);
      if (!prevRoom || JSON.stringify(prevRoom) !== JSON.stringify(currRoom)) {
        changes.push({ type: 'room', data: currRoom });
      }
    }

    for (const room of current.rooms) {
      const prevRoom = prevRoomMap.get(room.id);
      if (!prevRoom) continue;
      const prevLightMap = new Map(prevRoom.lights.map((l) => [l.id, l]));
      for (const light of room.lights) {
        const prevLight = prevLightMap.get(light.id);
        if (!prevLight || JSON.stringify(prevLight) !== JSON.stringify(light)) {
          changes.push({ type: 'light', data: light, roomId: room.id });
        }
      }
    }

    const prevMotionZones = previous.motionZones || [];
    const currMotionZones = current.motionZones || [];
    const prevMotionMap = new Map(prevMotionZones.map((z) => [z.id, z]));
    for (const zone of currMotionZones) {
      const prevZone = prevMotionMap.get(zone.id);
      if (!prevZone || JSON.stringify(prevZone) !== JSON.stringify(zone)) {
        changes.push({ type: 'motion_zone', data: zone });
      }
    }

    const prevZones = previous.zones || [];
    const currZones = current.zones || [];
    const prevZoneMap = new Map(prevZones.map((z) => [z.id, z]));
    for (const zone of currZones) {
      const prevZone = prevZoneMap.get(zone.id);
      if (!prevZone || JSON.stringify(prevZone) !== JSON.stringify(zone)) {
        changes.push({ type: 'zone', data: zone });
      }
    }

    // Detect Hive changes
    if (current.hive !== undefined) {
      const prevHive = previous.hive;
      if (!prevHive || JSON.stringify(prevHive) !== JSON.stringify(current.hive)) {
        changes.push({ type: 'hive', data: current.hive });
      }
    }

    return changes;
  }

  /**
   * Broadcast Hive status update to all clients connected to a bridge
   * @param {string} bridgeIp - The bridge IP
   * @param {object} hiveStatus - The Hive status data
   */
  broadcastHiveStatus(bridgeIp, hiveStatus) {
    if (this.io) {
      this.io.to(`bridge:${bridgeIp}`).emit('hive_status', hiveStatus);
    }
  }

  shutdown() {
    logger.info('Shutting down');
    this.logStats('before shutdown');

    for (const bridgeIp of this.pollingIntervals.keys()) {
      this.stopPolling(bridgeIp);
    }

    this.stateCache.clear();
    if (this.io) {
      this.io.close();
    }

    logger.info('Shutdown complete');
  }
}

const websocketService = new WebSocketService();
export default websocketService;
