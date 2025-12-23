import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../../hooks/useHueApi';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ERROR_MESSAGES } from '../../constants/messages';
import { MotionZones } from '../MotionZones';
import { DashboardSummary } from './DashboardSummary';
import { RoomCard } from './RoomCard';
import { ZoneCard } from './ZoneCard';
import { LightButton } from './LightButton';

export const LightControl = ({
  sessionToken,
  onLogout
}) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  // WebSocket connection (disabled in demo mode)
  const {
    isConnected: wsConnected,
    dashboard: wsDashboard,
    error: wsError
  } = useWebSocket(sessionToken, null, !isDemoMode);

  // Local dashboard state (for demo mode or manual updates)
  const [localDashboard, setLocalDashboard] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);

  // Use local dashboard (synced from WebSocket in real mode, manually fetched in demo mode)
  const dashboard = localDashboard;

  // Fetch dashboard for demo mode (no WebSocket)
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await api.getDashboard(sessionToken);
      setLocalDashboard(dashboardData);
      console.log('[Dashboard] Fetched dashboard successfully');
    } catch (err) {
      console.error('[Dashboard] Failed to fetch dashboard:', err);
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
  }, [sessionToken, isDemoMode]);

  // Update loading state based on WebSocket connection in real mode
  useEffect(() => {
    if (!isDemoMode) {
      if (wsDashboard) {
        setLoading(false);
        setError(null); // Clear error when data is received
        // Sync WebSocket data to local dashboard for display
        setLocalDashboard(wsDashboard);
      }
      // Only show error if we've been trying for a while (not initial connection)
      // This prevents flash of error during initial WebSocket handshake
      if (wsError && !wsDashboard && !loading) {
        setError(wsError);
      }
    }
  }, [wsDashboard, wsError, isDemoMode, loading]);

  // Helper: Get light by UUID from dashboard
  const getLightByUuid = (uuid) => {
    if (!dashboard?.rooms) return null;
    for (const room of dashboard.rooms) {
      const light = room.lights.find(l => l.id === uuid);
      if (light) return light;
    }
    return null;
  };

  const toggleLight = async (lightUuid) => {
    setTogglingLights(prev => new Set(prev).add(lightUuid));

    try {
      const light = getLightByUuid(lightUuid);
      if (!light) throw new Error('Light not found');

      const currentState = light.on ?? false;
      const newState = { on: !currentState };

      // Use v1 endpoint that returns updated light with pre-computed color
      const response = await api.updateLight(sessionToken, lightUuid, newState);

      // In demo mode, update local dashboard. In real mode, WebSocket will update automatically
      if (isDemoMode) {
        setLocalDashboard(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            lightsOn: newState.on
              ? prev.summary.lightsOn + 1
              : Math.max(0, prev.summary.lightsOn - 1)
          },
          rooms: prev.rooms.map(room => ({
            ...room,
            lights: room.lights.map(l =>
              l.id === lightUuid ? response.light : l
            )
          }))
        }));
      }
    } catch (err) {
      console.error('Failed to toggle light:', err);
      alert(`${ERROR_MESSAGES.LIGHT_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        newSet.delete(lightUuid);
        return newSet;
      });
    }
  };

  const toggleRoom = async (roomId, lightUuids, turnOn) => {
    setTogglingLights(prev => {
      const newSet = new Set(prev);
      lightUuids.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: turnOn };

      // Use v1 endpoint that updates all lights in room
      const response = await api.updateRoomLights(sessionToken, roomId, newState);

      // In demo mode, update local dashboard. In real mode, WebSocket will update automatically
      if (isDemoMode) {
        setLocalDashboard(prev => ({
          ...prev,
          rooms: prev.rooms.map(room => {
            if (room.id === roomId) {
              // Replace all lights in this room with updated data
              const updatedLightMap = new Map(response.updatedLights.map(l => [l.id, l]));
              return {
                ...room,
                lights: room.lights.map(l => updatedLightMap.get(l.id) || l)
              };
            }
            return room;
          })
        }));

        // Refresh dashboard to get updated summary stats
        setTimeout(() => fetchAllData(), 300);
      }
    } catch (err) {
      console.error('Failed to toggle room:', err);
      alert(`${ERROR_MESSAGES.ROOM_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        lightUuids.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const toggleZone = async (zoneId, lightUuids, turnOn) => {
    setTogglingLights(prev => {
      const newSet = new Set(prev);
      lightUuids.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: turnOn };

      // Use v1 endpoint that updates all lights in zone
      const response = await api.updateZoneLights(sessionToken, zoneId, newState);

      // In demo mode, update local dashboard. In real mode, WebSocket will update automatically
      if (isDemoMode) {
        setLocalDashboard(prev => ({
          ...prev,
          zones: prev.zones.map(zone => {
            if (zone.id === zoneId) {
              // Replace all lights in this zone with updated data
              const updatedLightMap = new Map(response.updatedLights.map(l => [l.id, l]));
              return {
                ...zone,
                lights: zone.lights.map(l => updatedLightMap.get(l.id) || l)
              };
            }
            return zone;
          })
        }));

        // Refresh dashboard to get updated summary stats
        setTimeout(() => fetchAllData(), 300);
      }
    } catch (err) {
      console.error('Failed to toggle zone:', err);
      alert(`${ERROR_MESSAGES.ZONE_TOGGLE}: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        lightUuids.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSceneChange = async (sceneUuid) => {
    if (!sceneUuid) return;

    setActivatingScene(sceneUuid);
    try {
      // Use v1 endpoint that returns affected lights with pre-computed colors
      const response = await api.activateSceneV1(sessionToken, sceneUuid);
      console.log(`Activated scene ${sceneUuid}`, response.affectedLights?.length, 'lights affected');

      // Update dashboard immediately with affected lights (optimistic update)
      // WebSocket will reconcile with actual state on next poll in real mode
      if (response.affectedLights && response.affectedLights.length > 0) {
        const updatedLightMap = new Map(response.affectedLights.map(l => [l.id, l]));

        setLocalDashboard(prev => {
          if (!prev) return prev;

          return {
            ...prev,
            rooms: prev.rooms.map(room => ({
              ...room,
              lights: room.lights.map(light =>
                updatedLightMap.get(light.id) || light
              )
            }))
          };
        });
      }

      // In demo mode, refresh full dashboard after short delay
      if (isDemoMode) {
        setTimeout(() => fetchAllData(), 300);
      }
    } catch (err) {
      console.error('Failed to activate scene:', err);
      alert(`${ERROR_MESSAGES.SCENE_ACTIVATION}: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  return (
    <div className="light-control">
      <div className="header-with-status">
        <h2>
          Light Control
          {isDemoMode && <span className="demo-badge">DEMO MODE</span>}
        </h2>
        <div className="header-actions">
          <div
            className={`status-indicator ${wsConnected || isDemoMode ? 'connected' : 'disconnected'}`}
            title={
              isDemoMode
                ? "Demo mode - no real bridge"
                : wsConnected
                  ? "Connected via WebSocket"
                  : "Disconnected - attempting to reconnect..."
            }
          ></div>
          {onLogout && (
            <button onClick={onLogout} className="logout-button" title="Logout and disconnect">
              Logout
            </button>
          )}
        </div>
      </div>

      {loading && !dashboard && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to bridge...</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <h4>Connection Failed</h4>
          <p className="error-message">{error}</p>
          <div className="troubleshooting">
            <h5>Troubleshooting:</h5>
            <ul>
              <li>Ensure your device is on the same network as the bridge</li>
              <li>Try logging out and logging in again</li>
              <li>Make sure the proxy server is running</li>
            </ul>
          </div>
        </div>
      )}

      {dashboard && !error && (
        <>
          <MotionZones
            sessionToken={sessionToken}
            motionZones={dashboard.motionZones}
          />

          <DashboardSummary
            totalLightsOn={dashboard.summary.lightsOn}
            roomCount={dashboard.summary.roomCount}
            sceneCount={dashboard.summary.sceneCount}
          />

          <div className="lights-control">
            <div className="lights-header">
              <h3>Lights ({dashboard.summary.totalLights})</h3>
            </div>

            <div className="rooms-list">
              {dashboard.rooms.map((room) => {
                const isActivating = activatingScene && room.scenes.some(s => s.id === activatingScene);

                return (
                  <RoomCard
                    key={room.id}
                    roomName={room.name}
                    room={room}
                    onToggleLight={toggleLight}
                    onToggleRoom={toggleRoom}
                    onActivateScene={handleSceneChange}
                    togglingLights={togglingLights}
                    isActivating={isActivating}
                  />
                );
              })}
            </div>
          </div>

          {dashboard.zones && dashboard.zones.length > 0 && (
            <div className="zones-control">
              <div className="zones-header">
                <h3>Zones</h3>
              </div>

              <div className="zones-list">
                {dashboard.zones.map((zone) => {
                  const isActivating = activatingScene && zone.scenes.some(s => s.id === activatingScene);

                  return (
                    <ZoneCard
                      key={zone.id}
                      zoneName={zone.name}
                      zone={zone}
                      onToggleLight={toggleLight}
                      onToggleZone={toggleZone}
                      onActivateScene={handleSceneChange}
                      togglingLights={togglingLights}
                      isActivating={isActivating}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

LightControl.propTypes = {
  sessionToken: PropTypes.string.isRequired,
  onLogout: PropTypes.func
};
