import { useEffect, useState } from 'react';
import { hueApi } from '../services/hueApi';

export const ConnectionTest = ({
  bridgeIp,
  username,
  lights,
  onTest,
  loading,
  error
}) => {
  const [groups, setGroups] = useState(null);
  const [scenes, setScenes] = useState(null);
  const [localLights, setLocalLights] = useState(lights);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);

  useEffect(() => {
    // Auto-test on mount if no lights data yet
    if (!lights && !loading && !error) {
      onTest();
    }
  }, []);

  useEffect(() => {
    // Update local lights state when prop changes
    setLocalLights(lights);
  }, [lights]);

  useEffect(() => {
    // Fetch groups when lights are loaded
    if (lights && !groups && !loadingGroups) {
      fetchGroups();
    }
  }, [lights]);

  useEffect(() => {
    // Fetch scenes when groups are loaded
    if (groups && !scenes && !loadingScenes) {
      fetchScenes();
    }
  }, [groups]);

  useEffect(() => {
    // Auto-refresh lights every 30 seconds
    const intervalId = setInterval(() => {
      console.log('[Auto-refresh] Refreshing light states...');
      onTest();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [onTest]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const groupsData = await hueApi.getGroups(bridgeIp, username);
      setGroups(groupsData);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      // If groups fail, we'll just show lights ungrouped
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchScenes = async () => {
    setLoadingScenes(true);
    try {
      const scenesData = await hueApi.getScenes(bridgeIp, username);
      setScenes(scenesData);
    } catch (err) {
      console.error('Failed to fetch scenes:', err);
      // If scenes fail, we just won't show scene selector
    } finally {
      setLoadingScenes(false);
    }
  };

  const toggleLight = async (lightId, currentState) => {
    // Add to toggling set
    setTogglingLights(prev => new Set(prev).add(lightId));

    try {
      // Toggle the light
      await hueApi.setLightState(bridgeIp, username, lightId, { on: !currentState });

      // Update local state immediately for responsive UI
      setLocalLights(prev => ({
        ...prev,
        [lightId]: {
          ...prev[lightId],
          state: {
            ...prev[lightId].state,
            on: !currentState
          }
        }
      }));
    } catch (err) {
      console.error('Failed to toggle light:', err);
      alert(`Failed to toggle light: ${err.message}`);
    } finally {
      // Remove from toggling set
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        newSet.delete(lightId);
        return newSet;
      });
    }
  };

  const toggleRoom = async (roomLights, turnOn) => {
    // Add all lights in room to toggling set
    const lightIds = roomLights.map(light => light.id);
    setTogglingLights(prev => {
      const newSet = new Set(prev);
      lightIds.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      // Toggle all lights in parallel
      await Promise.all(
        roomLights.map(light =>
          hueApi.setLightState(bridgeIp, username, light.id, { on: turnOn })
        )
      );

      // Update local state for all lights
      setLocalLights(prev => {
        const updated = { ...prev };
        roomLights.forEach(light => {
          if (updated[light.id]) {
            updated[light.id] = {
              ...updated[light.id],
              state: {
                ...updated[light.id].state,
                on: turnOn
              }
            };
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to toggle room:', err);
      alert(`Failed to toggle room lights: ${err.message}`);
    } finally {
      // Remove all lights from toggling set
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        lightIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSceneChange = async (groupId, sceneId, roomName) => {
    if (!sceneId) return;

    setActivatingScene(`${groupId}-${sceneId}`);
    try {
      await hueApi.activateScene(bridgeIp, username, groupId, sceneId);
      console.log(`Activated scene ${sceneId} for room ${roomName}`);
      // Refresh lights to show updated states
      setTimeout(() => onTest(), 500);
    } catch (err) {
      console.error('Failed to activate scene:', err);
      alert(`Failed to activate scene: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  // Get scenes for a specific group
  const getScenesForGroup = (groupId) => {
    if (!scenes) return [];

    return Object.entries(scenes)
      .filter(([sceneId, scene]) => scene.group === groupId)
      .map(([sceneId, scene]) => ({ id: sceneId, name: scene.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Group lights by room
  const getLightsByRoom = () => {
    if (!localLights || !groups) return null;

    const roomMap = {};

    // First, organize groups into rooms
    Object.entries(groups).forEach(([groupId, group]) => {
      if (group.type === 'Room' && group.lights && group.lights.length > 0) {
        roomMap[group.name] = {
          groupId,
          lights: []
        };
      }
    });

    // Add an "Unassigned" room for lights not in any room
    roomMap['Unassigned'] = { groupId: null, lights: [] };

    // Assign lights to rooms
    Object.entries(localLights).forEach(([lightId, light]) => {
      let assigned = false;

      // Check each room to see if this light belongs to it
      Object.entries(groups).forEach(([groupId, group]) => {
        if (group.type === 'Room' && group.lights && group.lights.includes(lightId)) {
          if (roomMap[group.name]) {
            roomMap[group.name].lights.push({ id: lightId, ...light });
            assigned = true;
          }
        }
      });

      // If light wasn't assigned to any room, add to Unassigned
      if (!assigned) {
        roomMap['Unassigned'].lights.push({ id: lightId, ...light });
      }
    });

    // Remove empty rooms
    Object.keys(roomMap).forEach(roomName => {
      if (roomMap[roomName].lights.length === 0) {
        delete roomMap[roomName];
      }
    });

    return roomMap;
  };

  const lightsCount = localLights ? Object.keys(localLights).length : 0;
  const lightsByRoom = getLightsByRoom();

  return (
    <div className="connection-test">
      <div className="header-with-status">
        <h2>Light Control</h2>
        <div className="status-indicator connected" title="Connected to bridge"></div>
      </div>

      {loading && !localLights && (
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

      {localLights && !error && (
        <div className="lights-control">
          <div className="lights-header">
            <h3>Lights ({lightsCount})</h3>
            {loadingGroups && <span className="loading-text">Loading rooms...</span>}
          </div>

          {lightsByRoom ? (
            // Show lights grouped by room
            <div className="rooms-list">
              {Object.entries(lightsByRoom).map(([roomName, roomData]) => {
                // Check if any lights in room are on
                const anyLightsOn = roomData.lights.some(light => light.state.on);
                const allLightsToggling = roomData.lights.every(light => togglingLights.has(light.id));
                const roomScenes = roomData.groupId ? getScenesForGroup(roomData.groupId) : [];
                const isActivating = activatingScene && activatingScene.startsWith(roomData.groupId);

                return (
                  <div key={roomName} className="room-group">
                    <div className="room-header">
                      <h4 className="room-name">{roomName}</h4>
                      <div className="room-controls">
                        {roomScenes.length > 0 && (
                          <div className="scene-control">
                            <select
                              onChange={(e) => handleSceneChange(roomData.groupId, e.target.value, roomName)}
                              disabled={isActivating}
                              className="scene-selector"
                              value=""
                            >
                              <option value="">
                                {isActivating ? '⏳ Activating...' : '🎨 Select Scene'}
                              </option>
                              {roomScenes.map((scene) => (
                                <option key={scene.id} value={scene.id}>
                                  {scene.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          onClick={() => toggleRoom(roomData.lights, !anyLightsOn)}
                          disabled={allLightsToggling}
                          className="room-control-button"
                        >
                          {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 All Off' : '💡 All On'}
                        </button>
                      </div>
                    </div>
                    <div className="room-lights-grid">
                    {roomData.lights.map((light) => (
                      <div key={light.id} className="light-card">
                        <button
                          onClick={() => toggleLight(light.id, light.state.on)}
                          disabled={togglingLights.has(light.id) || !light.state.reachable}
                          className={`light-bulb-button ${light.state.on ? 'on' : 'off'}`}
                        >
                          {togglingLights.has(light.id) ? (
                            <span className="bulb-loading">⏳</span>
                          ) : (
                            <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                              <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                            </svg>
                          )}
                        </button>
                        <span className="light-label">{light.name}</span>
                        {!light.state.reachable && (
                          <span className="unreachable-indicator">⚠️</span>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show lights without grouping (fallback)
            <div className="lights-grid-simple">
              {Object.entries(localLights).map(([id, light]) => (
                <div key={id} className="light-card">
                  <button
                    onClick={() => toggleLight(id, light.state.on)}
                    disabled={togglingLights.has(id) || !light.state.reachable}
                    className={`light-bulb-button ${light.state.on ? 'on' : 'off'}`}
                  >
                    {togglingLights.has(id) ? (
                      <span className="bulb-loading">⏳</span>
                    ) : (
                      <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                      </svg>
                    )}
                  </button>
                  <span className="light-label">{light.name}</span>
                  {!light.state.reachable && (
                    <span className="unreachable-indicator">⚠️</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
