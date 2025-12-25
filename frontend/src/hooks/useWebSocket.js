import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('WebSocket');

// Check if demo mode from URL
const isDemoMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
};

/**
 * WebSocket hook for real-time dashboard updates
 * Replaces polling with push-based updates from backend
 * @param {string} sessionToken - Session token for authentication
 * @param {boolean} enabled - Whether WebSocket is enabled
 */
export const useWebSocket = (sessionToken, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnectedOnce = useRef(false);
  const lastPongTime = useRef(Date.now());
  const isClosingRef = useRef(false); // Track intentional closes (e.g., StrictMode cleanup)

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
            // Update motion zones array
            if (updated.motionZones) {
              updated.motionZones = updated.motionZones.map((zone) =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;

          case 'zone':
            // Update zones array (light groupings)
            if (updated.zones) {
              updated.zones = updated.zones.map((zone) =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;

          default:
            logger.warn('Unknown change type:', change.type);
        }
      }

      return updated;
    });
  }, []);

  const handleMessage = useCallback(
    (message) => {
      switch (message.type) {
        case 'initial_state':
          logger.info('Received initial state');
          setDashboard(message.data);
          break;

        case 'state_update':
          logger.info('Received state update:', message.changes?.length, 'changes');
          applyChanges(message.changes);
          break;

        case 'error':
          logger.error('Server error:', message.message);
          setError(message.message);
          break;

        case 'pong':
          // Heartbeat response - track last pong time
          lastPongTime.current = Date.now();
          break;

        default:
          logger.warn('Unknown message type:', message.type);
      }
    },
    [applyChanges]
  );

  const connect = useCallback(() => {
    const demoMode = isDemoMode();

    // Reset closing flag for new connection
    isClosingRef.current = false;

    // In demo mode, we don't need sessionToken
    if (!enabled) return;
    if (!demoMode && !sessionToken) return;

    // Determine WebSocket URL (same host as current page)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws`;

    logger.info('Connecting to', wsUrl, demoMode ? '(demo mode)' : '(session mode)');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      logger.info('Connected');
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
      reconnectAttempts.current = 0;
      hasConnectedOnce.current = true;
      lastPongTime.current = Date.now();

      // Authenticate based on mode
      if (demoMode) {
        ws.send(JSON.stringify({ type: 'auth', demoMode: true }));
      } else {
        ws.send(JSON.stringify({ type: 'auth', sessionToken }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        logger.error('Failed to parse message:', err);
      }
    };

    ws.onerror = (event) => {
      // Don't log error if this isn't the current WebSocket (e.g., stale from StrictMode cleanup)
      if (wsRef.current === ws && !isClosingRef.current) {
        logger.error('Error:', event);
        setError('WebSocket connection error');
      }
    };

    ws.onclose = () => {
      // Ignore close events from stale WebSocket instances (e.g., StrictMode cleanup)
      if (wsRef.current !== ws && wsRef.current !== null) {
        return;
      }

      logger.info('Disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Don't attempt reconnect if we're intentionally closing
      if (isClosingRef.current) {
        return;
      }

      // Attempt to reconnect with exponential backoff
      if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
        // Only show "reconnecting" if we've connected at least once before
        if (hasConnectedOnce.current) {
          setIsReconnecting(true);
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        logger.info(
          `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;

          connect();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setIsReconnecting(false);
        setError('Failed to connect after multiple attempts');
      }
    };
  }, [sessionToken, enabled, handleMessage]);

  // Connect on mount and when credentials change
  useEffect(() => {
    const demoMode = isDemoMode();

    // In demo mode, connect immediately without needing credentials
    if (enabled && (demoMode || sessionToken)) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        // Mark as intentionally closing to suppress error logs
        isClosingRef.current = true;
        const ws = wsRef.current;
        // Clear ref first so stale callbacks won't match
        wsRef.current = null;
        // Only log if connection was established (not just connecting)
        if (ws.readyState === WebSocket.OPEN) {
          logger.info('Closing connection');
        }
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, sessionToken, enabled]);

  // Heartbeat ping every 30 seconds with dead connection detection
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Check if we haven't received a pong in too long (90 seconds = 3 missed pongs)
        const timeSinceLastPong = Date.now() - lastPongTime.current;
        if (timeSinceLastPong > 90000) {
          logger.warn('No pong received in 90s, connection may be dead');
          // Force close to trigger reconnection
          wsRef.current.close();
          return;
        }

        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    isReconnecting,
    dashboard,
    error,
  };
};
