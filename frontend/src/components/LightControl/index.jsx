import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../../hooks/useHueApi';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ERROR_MESSAGES } from '../../constants/messages';
import { createLogger } from '../../utils/logger';
import { TopToolbar } from './TopToolbar';
import { BottomNav } from './BottomNav';
import { RoomContent } from './RoomContent';
import { ZonesView } from './ZonesView';
import { MotionZones } from '../MotionZones';

const logger = createLogger('Dashboard');

export const LightControl = ({ sessionToken, onLogout }) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  // WebSocket connection (disabled in demo mode)
  const {
    isConnected: wsConnected,
    isReconnecting: wsReconnecting,
    dashboard: wsDashboard,
    error: wsError,
  } = useWebSocket(sessionToken, null, !isDemoMode);

  // Local dashboard state (for demo mode or manual updates)
  const [localDashboard, setLocalDashboard] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [togglingZones, setTogglingZones] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);

  // Navigation state - 'zones' or a room ID
  const [selectedId, setSelectedId] = useState(null);

  // Use local dashboard (synced from WebSocket in real mode, manually fetched in demo mode)
  const dashboard = localDashboard;

  // Fetch dashboard for demo mode (no WebSocket)
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await api.getDashboard(sessionToken);
      setLocalDashboard(dashboardData);
      logger.info('Fetched dashboard successfully');
    } catch (err) {
      logger.error('Failed to fetch dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch in demo mode only
  useEffect(() => {
    if (sessionToken && isDemoMode) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAllData changes on every render, we only want to fetch once
  }, [sessionToken, isDemoMode]);

  // Update loading state based on WebSocket connection in real mode
  useEffect(() => {
    if (!isDemoMode) {
      if (wsDashboard) {
        setLoading(false);
        setError(null);
        setLocalDashboard(wsDashboard);
      } else if (wsError) {
        // Show error and stop loading spinner
        setLoading(false);
        setError(wsError);
      }
    }
  }, [wsDashboard, wsError, isDemoMode]);

  // Fallback: If WebSocket doesn't deliver dashboard within 2 seconds, fetch via REST
  useEffect(() => {
    if (!isDemoMode && sessionToken && loading && !localDashboard) {
      const timeoutId = setTimeout(async () => {
        // Only fetch if still loading and no dashboard
        if (loading && !localDashboard) {
          logger.warn('WebSocket timeout, falling back to REST API');
          try {
            const dashboardData = await api.getDashboard(sessionToken);
            setLocalDashboard(dashboardData);
            setLoading(false);
            logger.info('Fetched dashboard via REST fallback');
          } catch (err) {
            logger.error('REST fallback failed:', err);
            setError(err.message);
            setLoading(false);
          }
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isDemoMode, sessionToken, loading, localDashboard, api]);

  // Set default selected room when dashboard loads
  useEffect(() => {
    if (dashboard?.rooms?.length > 0 && selectedId === null) {
      setSelectedId(dashboard.rooms[0].id);
    }
  }, [dashboard, selectedId]);

  // Apply dark theme to body when component mounts
  useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  // Subscribe to motion updates in demo mode
  useEffect(() => {
    if (!isDemoMode || !api.subscribeToMotion) return;

    const unsubscribe = api.subscribeToMotion((updatedMotionZones) => {
      setLocalDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          motionZones: updatedMotionZones,
        };
      });
    });

    return unsubscribe;
  }, [isDemoMode, api]);

  // Helper: Get light by UUID from dashboard
  const getLightByUuid = (uuid) => {
    if (!dashboard?.rooms) return null;
    for (const room of dashboard.rooms) {
      const light = room.lights.find((l) => l.id === uuid);
      if (light) return light;
    }
    return null;
  };

  const toggleLight = async (lightUuid) => {
    setTogglingLights((prev) => new Set(prev).add(lightUuid));

    try {
      const light = getLightByUuid(lightUuid);
      if (!light) throw new Error('Light not found');

      const currentState = light.on ?? false;
      const newState = { on: !currentState };

      const response = await api.updateLight(sessionToken, lightUuid, newState);

      // Optimistic update - apply immediately for responsive UI
      setLocalDashboard((prev) => ({
        ...prev,
        summary: {
          ...prev.summary,
          lightsOn: newState.on
            ? prev.summary.lightsOn + 1
            : Math.max(0, prev.summary.lightsOn - 1),
        },
        rooms: prev.rooms.map((room) => ({
          ...room,
          lights: room.lights.map((l) => (l.id === lightUuid ? response.light : l)),
        })),
      }));
    } catch (err) {
      logger.error('Failed to toggle light:', err);
      alert(`${ERROR_MESSAGES.LIGHT_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingLights((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lightUuid);
        return newSet;
      });
    }
  };

  const toggleRoom = async (roomId, turnOn) => {
    const room = dashboard?.rooms?.find((r) => r.id === roomId);
    if (!room) return;

    const lightUuids = room.lights.map((l) => l.id);

    setTogglingLights((prev) => {
      const newSet = new Set(prev);
      lightUuids.forEach((id) => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: turnOn };
      const response = await api.updateRoomLights(sessionToken, roomId, newState);

      // Optimistic update - apply immediately for responsive UI
      setLocalDashboard((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => {
          if (r.id === roomId) {
            const updatedLightMap = new Map(response.updatedLights.map((l) => [l.id, l]));
            return {
              ...r,
              lights: r.lights.map((l) => updatedLightMap.get(l.id) || l),
            };
          }
          return r;
        }),
      }));
    } catch (err) {
      logger.error('Failed to toggle room:', err);
      alert(`${ERROR_MESSAGES.ROOM_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingLights((prev) => {
        const newSet = new Set(prev);
        lightUuids.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const toggleZone = async (zoneId, turnOn) => {
    const zone = dashboard?.zones?.find((z) => z.id === zoneId);
    if (!zone) return;

    const lightUuids = zone.lights?.map((l) => l.id) || [];

    setTogglingZones((prev) => new Set(prev).add(zoneId));
    setTogglingLights((prev) => {
      const newSet = new Set(prev);
      lightUuids.forEach((id) => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: turnOn };
      const response = await api.updateZoneLights(sessionToken, zoneId, newState);

      // Optimistic update - apply immediately for responsive UI
      setLocalDashboard((prev) => ({
        ...prev,
        zones: prev.zones.map((z) => {
          if (z.id === zoneId) {
            const updatedLightMap = new Map(response.updatedLights.map((l) => [l.id, l]));
            return {
              ...z,
              lights: z.lights.map((l) => updatedLightMap.get(l.id) || l),
            };
          }
          return z;
        }),
      }));
    } catch (err) {
      logger.error('Failed to toggle zone:', err);
      alert(`${ERROR_MESSAGES.ZONE_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingZones((prev) => {
        const newSet = new Set(prev);
        newSet.delete(zoneId);
        return newSet;
      });
      setTogglingLights((prev) => {
        const newSet = new Set(prev);
        lightUuids.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSceneChange = async (sceneUuid, zoneId = null) => {
    if (!sceneUuid) return;

    setActivatingScene(zoneId || sceneUuid);
    try {
      const response = await api.activateSceneV1(sessionToken, sceneUuid);
      logger.info(
        `Activated scene ${sceneUuid}`,
        response.affectedLights?.length,
        'lights affected'
      );

      // Optimistic update - apply immediately for responsive UI
      if (response.affectedLights && response.affectedLights.length > 0) {
        const updatedLightMap = new Map(response.affectedLights.map((l) => [l.id, l]));

        setLocalDashboard((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            rooms: prev.rooms.map((room) => ({
              ...room,
              lights: room.lights.map((light) => updatedLightMap.get(light.id) || light),
            })),
          };
        });
      }
    } catch (err) {
      logger.error('Failed to activate scene:', err);
      alert(`${ERROR_MESSAGES.SCENE_ACTIVATION}: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  // Get the selected room from dashboard
  const selectedRoom =
    selectedId !== 'zones' ? dashboard?.rooms?.find((r) => r.id === selectedId) : null;

  // Loading state
  if (loading && !dashboard) {
    return (
      <div className="dark-layout">
        <div className="dark-loading">
          <span>Connecting to bridge...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboard) {
    return (
      <div className="dark-layout">
        <TopToolbar summary={{}} isConnected={false} isDemoMode={isDemoMode} onLogout={onLogout} />
        <div className="main-panel">
          <div className="empty-state-dark">
            <div className="empty-state-dark-icon">⚠️</div>
            <div className="empty-state-dark-text">Connection failed: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-layout">
      <TopToolbar
        summary={dashboard?.summary || {}}
        isConnected={wsConnected || isDemoMode}
        isReconnecting={wsReconnecting}
        isDemoMode={isDemoMode}
        onLogout={onLogout}
      />

      <div className="main-panel">
        {selectedId === 'zones' ? (
          <ZonesView
            zones={dashboard?.zones || []}
            onToggleZone={toggleZone}
            onActivateScene={handleSceneChange}
            togglingZones={togglingZones}
            activatingScene={activatingScene}
          />
        ) : (
          <RoomContent
            room={selectedRoom}
            onToggleLight={toggleLight}
            onToggleRoom={toggleRoom}
            onActivateScene={handleSceneChange}
            togglingLights={togglingLights}
            isActivatingScene={!!activatingScene}
          />
        )}
      </div>

      <MotionZones sessionToken={sessionToken} motionZones={dashboard?.motionZones} />

      <BottomNav
        rooms={dashboard?.rooms || []}
        zones={dashboard?.zones || []}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
};

LightControl.propTypes = {
  sessionToken: PropTypes.string.isRequired,
  onLogout: PropTypes.func,
};
