import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHueApi } from '../../hooks/useHueApi';
import { useDemoMode } from '../../hooks/useDemoMode';
import { usePolling } from '../../hooks/usePolling';
import { buildRoomHierarchy, getScenesForRoom } from '../../utils/roomUtils';
import { POLLING_INTERVALS } from '../../constants/polling';
import { ERROR_MESSAGES } from '../../constants/messages';
import { MotionZones } from '../MotionZones';
import { DashboardSummary } from './DashboardSummary';
import { RoomCard } from './RoomCard';
import { LightButton } from './LightButton';

export const LightControl = ({
  bridgeIp,
  username,
  onLogout
}) => {
  const isDemoMode = useDemoMode();
  const api = useHueApi();

  // API data
  const [lights, setLights] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [devices, setDevices] = useState(null);
  const [scenes, setScenes] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);

  // Fetch all data from API
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [lightsData, roomsData, devicesData, scenesData] = await Promise.all([
        api.getLights(bridgeIp, username),
        api.getRooms(bridgeIp, username),
        api.getResource(bridgeIp, username, 'device'),
        api.getScenes(bridgeIp, username)
      ]);

      setLights(lightsData);
      setRooms(roomsData);
      setDevices(devicesData);
      setScenes(scenesData);

      console.log('[ConnectionTest] Fetched all data successfully');
    } catch (err) {
      console.error('[ConnectionTest] Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    if (bridgeIp && username) {
      fetchAllData();
    }
  }, [bridgeIp, username]);

  // Auto-refresh polling (disabled in demo mode)
  usePolling(
    () => {
      console.log('[Auto-refresh] Refreshing all data...');
      fetchAllData();
    },
    POLLING_INTERVALS.LIGHTS_REFRESH,
    !!(bridgeIp && username && !isDemoMode)
  );

  // Helper: Get light by UUID
  const getLightByUuid = (uuid) => {
    return lights?.data?.find(light => light.id === uuid);
  };

  const toggleLight = async (lightUuid) => {
    setTogglingLights(prev => new Set(prev).add(lightUuid));

    try {
      const light = getLightByUuid(lightUuid);
      if (!light) throw new Error('Light not found');

      const currentState = light.on?.on || false;
      const newState = { on: { on: !currentState } };

      await api.setLightState(bridgeIp, username, lightUuid, newState);

      // Update local state for responsive UI
      setLights(prev => ({
        ...prev,
        data: prev.data.map(l =>
          l.id === lightUuid
            ? { ...l, on: { on: !currentState } }
            : l
        )
      }));
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

  const toggleRoom = async (lightUuids, turnOn) => {
    setTogglingLights(prev => {
      const newSet = new Set(prev);
      lightUuids.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      const newState = { on: { on: turnOn } };

      await Promise.all(
        lightUuids.map(uuid => api.setLightState(bridgeIp, username, uuid, newState))
      );

      // Update local state
      setLights(prev => ({
        ...prev,
        data: prev.data.map(l =>
          lightUuids.includes(l.id)
            ? { ...l, on: { on: turnOn } }
            : l
        )
      }));
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

  const handleSceneChange = async (sceneUuid) => {
    if (!sceneUuid) return;

    setActivatingScene(sceneUuid);
    try {
      await api.activateScene(bridgeIp, username, sceneUuid);
      console.log(`Activated scene ${sceneUuid}`);
      // Refresh lights to show updated states
      setTimeout(() => fetchAllData(), 500);
    } catch (err) {
      console.error('Failed to activate scene:', err);
      alert(`${ERROR_MESSAGES.SCENE_ACTIVATION}: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  const lightsCount = lights?.data?.length || 0;
  const lightsByRoom = buildRoomHierarchy(lights, rooms, devices);

  // Calculate total lights on across all rooms
  const totalLightsOn = lights?.data?.filter(light => light.on?.on).length || 0;

  return (
    <div className="light-control">
      <div className="header-with-status">
        <h2>
          Light Control
          {isDemoMode && <span className="demo-badge">DEMO MODE</span>}
        </h2>
        <div className="header-actions">
          <div className="status-indicator connected" title={isDemoMode ? "Demo mode - no real bridge" : "Connected to bridge"}></div>
          {onLogout && (
            <button onClick={onLogout} className="logout-button" title="Logout and disconnect">
              Logout
            </button>
          )}
        </div>
      </div>

      {loading && !lights && (
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
              <li>Check if the bridge IP is correct: {bridgeIp}</li>
              <li>Make sure the proxy server is running</li>
            </ul>
          </div>
        </div>
      )}

      {lights && !error && (
        <>
          <MotionZones bridgeIp={bridgeIp} username={username} />

          <DashboardSummary
            totalLightsOn={totalLightsOn}
            roomCount={lightsByRoom ? Object.keys(lightsByRoom).length : 0}
            sceneCount={scenes?.data?.length || 0}
          />

          <div className="lights-control">
            <div className="lights-header">
              <h3>Lights ({lightsCount})</h3>
            </div>

            {lightsByRoom ? (
              // Show lights grouped by room
              <div className="rooms-list">
                {Object.entries(lightsByRoom).map(([roomName, roomData]) => {
                  const roomScenes = roomData.roomUuid ? getScenesForRoom(scenes, roomData.roomUuid) : [];
                  const isActivating = activatingScene && roomScenes.some(s => s.uuid === activatingScene);

                  return (
                    <RoomCard
                      key={roomName}
                      roomName={roomName}
                      roomData={roomData}
                      roomScenes={roomScenes}
                      onToggleLight={toggleLight}
                      onToggleRoom={toggleRoom}
                      onActivateScene={handleSceneChange}
                      togglingLights={togglingLights}
                      isActivating={isActivating}
                    />
                  );
                })}
              </div>
            ) : (
              // Show lights without grouping (fallback)
              <div className="lights-grid-simple">
                {lights?.data?.map((light) => (
                  <LightButton
                    key={light.id}
                    light={light}
                    onToggle={toggleLight}
                    isToggling={togglingLights.has(light.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

LightControl.propTypes = {
  bridgeIp: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  onLogout: PropTypes.func
};
