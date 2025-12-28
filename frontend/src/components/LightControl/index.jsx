import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDemoMode } from '../../context/DemoModeContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSettings } from '../../hooks/useSettings';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { useHive } from '../../hooks/useHive';
import { ERROR_MESSAGES } from '../../constants/messages';
import { createLogger } from '../../utils/logger';
import { TopToolbar } from './TopToolbar';
import { BottomNav } from './BottomNav';
import { RoomContent } from './RoomContent';
import { ZonesView } from './ZonesView';
import { AutomationsView } from './AutomationsView';
import { HiveView } from './HiveView';
import { MotionZones } from '../MotionZones';
import { SettingsPage } from './SettingsPage';

const logger = createLogger('Dashboard');

export const LightControl = ({ sessionToken, onLogout }) => {
  const { isDemoMode, api } = useDemoMode();

  // WebSocket connection (disabled in demo mode)
  const {
    isConnected: wsConnected,
    isReconnecting: wsReconnecting,
    dashboard: wsDashboard,
    error: wsError,
  } = useWebSocket(sessionToken, !isDemoMode);

  // Settings from backend (includes location and units)
  const { settings, updateSettings } = useSettings(!!sessionToken);

  // Callback for when location is updated
  const handleLocationUpdate = useCallback(
    (newLocation) => {
      // Update local settings state with new location
      updateSettings({ location: newLocation });
    },
    [updateSettings]
  );

  // Location detection hook
  const {
    isDetecting,
    error: locationError,
    detectLocation,
  } = useLocation(settings.location, handleLocationUpdate);

  // Weather from backend (uses session's location and units)
  const {
    weather,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
  } = useWeather(!!sessionToken);

  // Hive heating integration
  const {
    isConnected: hiveConnected,
    isConnecting: hiveConnecting,
    isLoading: hiveLoading,
    status: hiveStatus,
    schedules: hiveSchedules,
    error: hiveError,
    requires2fa: hiveRequires2fa,
    pendingUsername: hivePendingUsername,
    isVerifying: hiveVerifying,
    connect: hiveConnect,
    disconnect: hiveDisconnect,
    refresh: hiveRefresh,
    checkConnection: hiveCheckConnection,
    submit2faCode: hiveSubmit2fa,
    cancel2fa: hiveCancel2fa,
    clearError: hiveClearError,
  } = useHive(isDemoMode);

  // Refetch weather when settings change (location or units updated)
  useEffect(() => {
    if (settings.location) {
      refetchWeather();
    }
  }, [settings.location, settings.units, refetchWeather]);

  // Local dashboard state (for demo mode or manual updates)
  const [localDashboard, setLocalDashboard] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingLights, setTogglingLights] = useState(new Set());
  const [togglingZones, setTogglingZones] = useState(new Set());
  const [activatingScene, setActivatingScene] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Automations state
  const [automations, setAutomations] = useState([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationsError, setAutomationsError] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);

  // Navigation state - 'zones', 'automations', or a room ID
  const [selectedId, setSelectedId] = useState(null);

  // Use local dashboard (synced from WebSocket in real mode, manually fetched in demo mode)
  const dashboard = localDashboard;

  // Fetch dashboard for demo mode (no WebSocket)
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await api.getDashboard();
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
            const dashboardData = await api.getDashboard();
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

      const response = await api.updateLight(lightUuid, newState);

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
      const response = await api.updateRoomLights(roomId, newState);

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
      const response = await api.updateZoneLights(zoneId, newState);

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
      const response = await api.activateSceneV1(sceneUuid);
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

  // Fetch automations
  const fetchAutomations = async () => {
    setAutomationsLoading(true);
    setAutomationsError(null);

    try {
      const result = await api.getAutomations();
      setAutomations(result.automations || []);
    } catch (err) {
      logger.error('Failed to fetch automations:', err);
      setAutomationsError(err.message);
    } finally {
      setAutomationsLoading(false);
    }
  };

  // Fetch automations when navigating to automations tab
  useEffect(() => {
    if (selectedId === 'automations' && automations.length === 0 && !automationsLoading) {
      fetchAutomations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only fetch when navigating to automations
  }, [selectedId]);

  // Check Hive connection when navigating to hive tab
  useEffect(() => {
    if (selectedId === 'hive' && !hiveConnected && !hiveConnecting && !hiveRequires2fa) {
      hiveCheckConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only check when navigating to hive
  }, [selectedId]);

  const handleTriggerAutomation = async (automationId) => {
    setTriggeringId(automationId);

    try {
      await api.triggerAutomation(automationId);
      logger.info('Automation triggered', { automationId });
    } catch (err) {
      logger.error('Failed to trigger automation:', err);
      alert(`Failed to trigger automation: ${err.message}`);
    } finally {
      setTriggeringId(null);
    }
  };

  // Get the selected room from dashboard
  const selectedRoom =
    selectedId !== 'zones' && selectedId !== 'automations' && selectedId !== 'hive'
      ? dashboard?.rooms?.find((r) => r.id === selectedId)
      : null;

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
        <TopToolbar summary={{}} isConnected={false} onLogout={onLogout} />
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
        onLogout={onLogout}
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        location={settings.location}
        units={settings.units}
        onOpenSettings={() => setSettingsOpen((prev) => !prev)}
      />

      <div className="main-panel">
        {settingsOpen ? (
          <SettingsPage
            onBack={() => setSettingsOpen(false)}
            location={settings.location}
            settings={settings}
            onUpdateSettings={updateSettings}
            onDetectLocation={detectLocation}
            isDetecting={isDetecting}
            locationError={locationError}
            hueConnected={true} // Always true here - LightControl only renders when Hue is connected
            hiveConnected={hiveConnected}
            onHiveDisconnect={hiveDisconnect}
            onEnableHive={() => {
              setSettingsOpen(false);
              setSelectedId('hive');
            }}
          />
        ) : selectedId === 'hive' ? (
          <HiveView
            isConnected={hiveConnected}
            status={hiveStatus}
            schedules={hiveSchedules}
            isLoading={hiveLoading}
            error={hiveError}
            onRetry={hiveRefresh}
            onConnect={hiveConnect}
            onVerify2fa={hiveSubmit2fa}
            onCancel2fa={hiveCancel2fa}
            onClearError={hiveClearError}
            requires2fa={hiveRequires2fa}
            isConnecting={hiveConnecting}
            isVerifying={hiveVerifying}
            pendingUsername={hivePendingUsername}
          />
        ) : selectedId === 'automations' ? (
          <AutomationsView
            automations={automations}
            onTrigger={handleTriggerAutomation}
            isLoading={automationsLoading}
            error={automationsError}
            onRetry={fetchAutomations}
            triggeringId={triggeringId}
          />
        ) : selectedId === 'zones' ? (
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

      <MotionZones motionZones={dashboard?.motionZones} />

      <BottomNav
        rooms={dashboard?.rooms || []}
        zones={dashboard?.zones || []}
        hasAutomations={true}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setSettingsOpen(false);
        }}
        services={settings.services}
        hueConnected={true} // Always true here - LightControl only renders when Hue is connected
        hiveConnected={hiveConnected}
      />
    </div>
  );
};

LightControl.propTypes = {
  sessionToken: PropTypes.string.isRequired,
  onLogout: PropTypes.func,
};
