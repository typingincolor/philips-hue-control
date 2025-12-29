import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('WebSocket');

const isDemoMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
};

/**
 * WebSocket hook using Socket.IO for real-time dashboard updates
 * @param {string} sessionToken - Session token for authentication
 * @param {boolean} enabled - Whether WebSocket is enabled
 */
export const useWebSocket = (sessionToken, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const hasConnectedOnce = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  // Clear reconnecting state after timeout (don't show spinner indefinitely)
  useEffect(() => {
    if (isReconnecting) {
      reconnectTimeoutRef.current = setTimeout(() => {
        logger.warn('Reconnection timeout - clearing reconnecting state');
        setIsReconnecting(false);
      }, 10000); // 10 second timeout
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isReconnecting]);

  const applyChanges = useCallback((changes) => {
    if (!changes || changes.length === 0) return;

    setDashboard((prev) => {
      if (!prev) return prev;

      const updated = { ...prev };

      for (const change of changes) {
        switch (change.type) {
          case 'summary':
            updated.summary = change.data;
            break;
          case 'room':
            updated.rooms = updated.rooms.map((room) =>
              room.id === change.data.id ? change.data : room
            );
            break;
          case 'light':
            updated.rooms = updated.rooms.map((room) => {
              if (room.id !== change.roomId) return room;
              return {
                ...room,
                lights: room.lights.map((light) =>
                  light.id === change.data.id ? change.data : light
                ),
              };
            });
            break;
          case 'motion_zone':
            if (updated.motionZones) {
              updated.motionZones = updated.motionZones.map((zone) =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;
          case 'zone':
            if (updated.zones) {
              updated.zones = updated.zones.map((zone) =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;
          case 'service':
            // Generic service update - store under services.{serviceId}
            updated.services = {
              ...updated.services,
              [change.serviceId]: change.data,
            };
            break;
          default:
            logger.warn('Unknown change type:', change.type);
        }
      }

      return updated;
    });
  }, []);

  useEffect(() => {
    const demoMode = isDemoMode();
    if (!enabled) return;
    if (!demoMode && !sessionToken) return;

    const wsPath = '/api/v2/ws';
    logger.info('Connecting to', wsPath, demoMode ? '(demo mode)' : '(session mode)');

    const socket = io({
      path: wsPath,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('Connected');
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
      hasConnectedOnce.current = true;

      // Authenticate
      if (demoMode) {
        socket.emit('auth', { demoMode: true });
      } else {
        socket.emit('auth', { sessionToken });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      if (hasConnectedOnce.current) {
        setIsReconnecting(true);
      }
    });

    socket.on('initial_state', (data) => {
      logger.info('Received initial state');
      setDashboard(data);
    });

    socket.on('state_update', (data) => {
      logger.info('Received state update:', data.changes?.length, 'changes');
      applyChanges(data.changes);
    });

    socket.on('error', (data) => {
      logger.error('Server error:', data.message);
      setError(data.message);
    });

    socket.on('pong', () => {
      // Heartbeat response handled by Socket.IO automatically
    });

    return () => {
      logger.info('Closing connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionToken, enabled, applyChanges]);

  return {
    isConnected,
    isReconnecting,
    dashboard,
    error,
  };
};
