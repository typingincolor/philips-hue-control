import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WebSocket hook for real-time dashboard updates
 * Replaces polling with push-based updates from backend
 * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
 * @param {string} username - Username (only needed for legacy mode)
 * @param {boolean} enabled - Whether WebSocket is enabled
 */
export const useWebSocket = (sessionToken, username = null, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Detect legacy mode (bridgeIp looks like an IP address)
  const isLegacyMode = sessionToken && sessionToken.includes('.');

  const connect = useCallback(() => {
    if (!enabled || !sessionToken) return;
    if (isLegacyMode && !username) return;

    // Determine WebSocket URL (same host as current page)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws`;

    console.log('[WebSocket] Connecting to', wsUrl, isLegacyMode ? '(legacy mode)' : '(session mode)');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Authenticate
      if (isLegacyMode) {
        // Legacy: send bridgeIp + username
        ws.send(JSON.stringify({
          type: 'auth',
          bridgeIp: sessionToken,
          username
        }));
      } else {
        // Session mode: send sessionToken
        ws.send(JSON.stringify({
          type: 'auth',
          sessionToken
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Attempt to reconnect with exponential backoff
      if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Failed to connect after multiple attempts');
      }
    };
  }, [sessionToken, username, enabled, isLegacyMode]);

  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'initial_state':
        console.log('[WebSocket] Received initial state');
        setDashboard(message.data);
        break;

      case 'state_update':
        console.log('[WebSocket] Received state update:', message.changes?.length, 'changes');
        applyChanges(message.changes);
        break;

      case 'error':
        console.error('[WebSocket] Server error:', message.message);
        setError(message.message);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }, []);

  const applyChanges = useCallback((changes) => {
    if (!changes || changes.length === 0) return;

    setDashboard((prev) => {
      if (!prev) return prev;

      let updated = { ...prev };

      for (const change of changes) {
        switch (change.type) {
          case 'summary':
            updated.summary = change.data;
            break;

          case 'room':
            updated.rooms = updated.rooms.map(room =>
              room.id === change.data.id ? change.data : room
            );
            break;

          case 'light':
            updated.rooms = updated.rooms.map(room => {
              if (room.id !== change.roomId) return room;

              return {
                ...room,
                lights: room.lights.map(light =>
                  light.id === change.data.id ? change.data : light
                )
              };
            });
            break;

          case 'motion_zone':
            // Update motion zones array
            if (updated.motionZones) {
              updated.motionZones = updated.motionZones.map(zone =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;

          case 'zone':
            // Update zones array (light groupings)
            if (updated.zones) {
              updated.zones = updated.zones.map(zone =>
                zone.id === change.data.id ? change.data : zone
              );
            }
            break;

          default:
            console.warn('[WebSocket] Unknown change type:', change.type);
        }
      }

      return updated;
    });
  }, []);

  // Connect on mount and when credentials change
  useEffect(() => {
    if (enabled && sessionToken) {
      if (!isLegacyMode || (isLegacyMode && username)) {
        connect();
      }
    }

    return () => {
      if (wsRef.current) {
        console.log('[WebSocket] Closing connection');
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, sessionToken, username, enabled, isLegacyMode]);

  // Heartbeat ping every 30 seconds
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    dashboard,
    error
  };
};
