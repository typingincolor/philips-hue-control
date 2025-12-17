import { useEffect, useState } from 'react';
import { hueApi } from '../services/hueApi';
import { mockApi } from '../services/mockData';
import { MotionZones } from './MotionZones';

export const LightControl = ({
  bridgeIp,
  username,
  onLogout
}) => {
  // Check if demo mode is enabled (via URL parameter ?demo=true)
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
  const api = isDemoMode ? mockApi : hueApi;

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

  // Initial data fetch on mount
  useEffect(() => {
    if (bridgeIp && username) {
      fetchAllData();
    }
  }, [bridgeIp, username]);

  // Auto-refresh every 30 seconds (disabled in demo mode)
  useEffect(() => {
    if (!bridgeIp || !username || isDemoMode) return;

    const intervalId = setInterval(() => {
      console.log('[Auto-refresh] Refreshing all data...');
      fetchAllData();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [bridgeIp, username]);

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

  // Helper: Get light by UUID
  const getLightByUuid = (uuid) => {
    return lights?.data?.find(light => light.id === uuid);
  };

  // Helper: Get room by UUID
  const getRoomByUuid = (uuid) => {
    return rooms?.data?.find(room => room.id === uuid);
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
      alert(`Failed to toggle light: ${err.message}`);
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
      alert(`Failed to toggle room lights: ${err.message}`);
    } finally {
      setTogglingLights(prev => {
        const newSet = new Set(prev);
        lightUuids.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSceneChange = async (sceneUuid, roomName) => {
    if (!sceneUuid) return;

    setActivatingScene(sceneUuid);
    try {
      await api.activateScene(bridgeIp, username, sceneUuid);
      console.log(`Activated scene ${sceneUuid} for room ${roomName}`);
      // Refresh lights to show updated states
      setTimeout(() => fetchAllData(), 500);
    } catch (err) {
      console.error('Failed to activate scene:', err);
      alert(`Failed to activate scene: ${err.message}`);
    } finally {
      setActivatingScene(null);
    }
  };

  // Convert Hue XY color to CSS RGB
  const xyToRgb = (x, y) => {
    // Convert xy to XYZ (using full brightness for pure color)
    const z = 1.0 - x - y;
    const Y = 1.0;
    const X = (Y / y) * x;
    const Z = (Y / y) * z;

    // XYZ to RGB (using sRGB D65)
    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    // Apply gamma correction
    const gammaCorrect = (val) => {
      if (val <= 0.0031308) return 12.92 * val;
      return 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055;
    };

    r = gammaCorrect(r);
    g = gammaCorrect(g);
    b = gammaCorrect(b);

    // Normalize if any value is > 1
    const max = Math.max(r, g, b);
    if (max > 1) {
      r /= max;
      g /= max;
      b /= max;
    }

    // Convert to 0-255 range
    r = Math.max(0, Math.min(255, Math.round(r * 255)));
    g = Math.max(0, Math.min(255, Math.round(g * 255)));
    b = Math.max(0, Math.min(255, Math.round(b * 255)));

    return { r, g, b };
  };

  // Convert color temperature (mirek) to RGB
  const mirekToRgb = (mirek) => {
    // Convert mirek to Kelvin (mirek = 1,000,000 / Kelvin)
    const kelvin = 1000000 / mirek;
    const temp = kelvin / 100;

    let r, g, b;

    // Calculate red
    if (temp <= 66) {
      r = 255;
    } else {
      r = temp - 60;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      r = Math.max(0, Math.min(255, r));
    }

    // Calculate green
    if (temp <= 66) {
      g = temp;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
    } else {
      g = temp - 60;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
    }
    g = Math.max(0, Math.min(255, g));

    // Calculate blue
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = Math.max(0, Math.min(255, b));
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  // Get CSS color for a light with opacity based on brightness
  const getLightColor = (light) => {
    if (!light.on?.on) return null;

    const brightness = light.dimming?.brightness || 100;
    // Convert brightness (0-100) to opacity (0.2-1.0)
    // Minimum opacity of 0.2 ensures dim lights are still visible
    const opacity = Math.max(0.2, brightness / 100);

    // Prefer xy color if available
    if (light.color?.xy) {
      const { x, y } = light.color.xy;
      const { r, g, b } = xyToRgb(x, y);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fall back to color temperature
    if (light.color_temperature?.mirek) {
      const { r, g, b } = mirekToRgb(light.color_temperature.mirek);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // No color data available, return null (will use default green)
    return null;
  };

  // Get scenes for a specific room UUID
  const getScenesForRoom = (roomUuid) => {
    if (!scenes?.data) return [];

    return scenes.data
      .filter(scene => scene.group?.rid === roomUuid)
      .map(scene => ({
        uuid: scene.id,
        name: scene.metadata?.name || 'Unknown Scene'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Build room → device → lights hierarchy
  const getLightsByRoom = () => {
    if (!lights?.data || !rooms?.data || !devices?.data) return null;

    // Build device → lights map
    const deviceToLights = {};
    devices.data.forEach(device => {
      const lightUuids = device.services
        ?.filter(s => s.rtype === 'light')
        .map(s => s.rid) || [];
      deviceToLights[device.id] = lightUuids;
    });

    const roomMap = {};

    // Build rooms with their lights
    rooms.data.forEach(room => {
      const lightUuids = [];

      // Get lights from room's devices
      room.children?.forEach(child => {
        if (child.rtype === 'device') {
          const deviceLights = deviceToLights[child.rid] || [];
          lightUuids.push(...deviceLights);
        } else if (child.rtype === 'light') {
          lightUuids.push(child.rid);
        }
      });

      if (lightUuids.length > 0) {
        roomMap[room.metadata?.name || 'Unknown Room'] = {
          roomUuid: room.id,
          lightUuids: [...new Set(lightUuids)], // Deduplicate
          lights: lightUuids
            .map(uuid => getLightByUuid(uuid))
            .filter(Boolean)
        };
      }
    });

    // Add unassigned lights
    const assignedLightUuids = new Set(
      Object.values(roomMap).flatMap(r => r.lightUuids)
    );
    const unassignedLights = lights.data.filter(
      light => !assignedLightUuids.has(light.id)
    );

    if (unassignedLights.length > 0) {
      roomMap['Unassigned'] = {
        roomUuid: null,
        lightUuids: unassignedLights.map(l => l.id),
        lights: unassignedLights
      };
    }

    return roomMap;
  };

  // Calculate room statistics (lights on/off, average brightness)
  const getRoomLightStats = (roomLights) => {
    if (!roomLights || roomLights.length === 0) {
      return { lightsOnCount: 0, totalLights: 0, averageBrightness: 0 };
    }

    const lightsOnCount = roomLights.filter(light => light.on?.on).length;
    const totalLights = roomLights.length;

    // Calculate average brightness of lights that are on
    const lightsOn = roomLights.filter(light => light.on?.on);
    const averageBrightness = lightsOn.length > 0
      ? lightsOn.reduce((sum, light) => sum + (light.dimming?.brightness || 0), 0) / lightsOn.length
      : 0;

    return { lightsOnCount, totalLights, averageBrightness };
  };

  const lightsCount = lights?.data?.length || 0;
  const lightsByRoom = getLightsByRoom();

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

          {/* Summary Statistics */}
          <div className="lights-summary">
            <div className="summary-stat">
              <span className="stat-value">{totalLightsOn}</span>
              <span className="stat-label">lights on</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{lightsByRoom ? Object.keys(lightsByRoom).length : 0}</span>
              <span className="stat-label">rooms</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{scenes?.data?.length || 0}</span>
              <span className="stat-label">scenes</span>
            </div>
          </div>

          <div className="lights-control">
          <div className="lights-header">
            <h3>Lights ({lightsCount})</h3>
          </div>

          {lightsByRoom ? (
            // Show lights grouped by room
            <div className="rooms-list">
              {Object.entries(lightsByRoom).map(([roomName, roomData]) => {
                // Check if any lights in room are on
                const anyLightsOn = roomData.lights.some(light => light.on?.on);
                const allLightsToggling = roomData.lightUuids.every(uuid => togglingLights.has(uuid));
                const roomScenes = roomData.roomUuid ? getScenesForRoom(roomData.roomUuid) : [];
                const isActivating = activatingScene && roomScenes.some(s => s.uuid === activatingScene);

                // Get room statistics
                const { lightsOnCount, totalLights, averageBrightness } = getRoomLightStats(roomData.lights);

                return (
                  <div key={roomName} className="room-group">
                    <div className="room-header">
                      <div className="room-title-row">
                        <h4 className="room-name">{roomName}</h4>
                        <span className="room-status-badge">
                          {lightsOnCount} of {totalLights} on
                        </span>
                      </div>

                      {averageBrightness > 0 && (
                        <div className="room-brightness-indicator">
                          <div className="brightness-bar">
                            <div
                              className="brightness-fill"
                              style={{ width: `${averageBrightness}%` }}
                            />
                          </div>
                          <span className="brightness-label">{Math.round(averageBrightness)}%</span>
                        </div>
                      )}

                      <div className="room-controls">
                        {roomScenes.length > 0 && (
                          <div className="scene-control">
                            <select
                              onChange={(e) => handleSceneChange(e.target.value, roomName)}
                              disabled={isActivating}
                              className="scene-selector"
                              value=""
                            >
                              <option value="">
                                {isActivating ? '⏳ Activating...' : '🎨 Select Scene'}
                              </option>
                              {roomScenes.map((scene) => (
                                <option key={scene.uuid} value={scene.uuid}>
                                  {scene.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          onClick={() => toggleRoom(roomData.lightUuids, !anyLightsOn)}
                          disabled={allLightsToggling}
                          className="room-control-button"
                        >
                          {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 All Off' : '💡 All On'}
                        </button>
                      </div>
                    </div>
                    <div className="room-lights-grid">
                    {roomData.lights.map((light) => {
                      const lightColor = getLightColor(light);
                      const buttonStyle = lightColor ? {
                        background: `linear-gradient(135deg, ${lightColor} 0%, ${lightColor} 100%)`,
                        boxShadow: `0 4px 12px ${lightColor}40, 0 2px 4px rgba(0, 0, 0, 0.1)`
                      } : {};

                      return (
                        <div key={light.id} className="light-card">
                          <button
                            onClick={() => toggleLight(light.id)}
                            disabled={togglingLights.has(light.id)}
                            className={`light-bulb-button ${light.on?.on ? 'on' : 'off'}`}
                            style={buttonStyle}
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
                          <span className="light-label">{light.metadata?.name || 'Unknown Light'}</span>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show lights without grouping (fallback)
            <div className="lights-grid-simple">
              {lights?.data?.map((light) => {
                const lightColor = getLightColor(light);
                const buttonStyle = lightColor ? {
                  background: `linear-gradient(135deg, ${lightColor} 0%, ${lightColor} 100%)`,
                  boxShadow: `0 4px 12px ${lightColor}40, 0 2px 4px rgba(0, 0, 0, 0.1)`
                } : {};

                return (
                  <div key={light.id} className="light-card">
                    <button
                      onClick={() => toggleLight(light.id)}
                      disabled={togglingLights.has(light.id)}
                      className={`light-bulb-button ${light.on?.on ? 'on' : 'off'}`}
                      style={buttonStyle}
                    >
                      {togglingLights.has(light.id) ? (
                        <span className="bulb-loading">⏳</span>
                      ) : (
                        <svg className="bulb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18h6"></path>
                          <path d="M10 22h4"></path>
                          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                        </svg>
                      )}
                    </button>
                    <span className="light-label">{light.metadata?.name || 'Unknown Light'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};
