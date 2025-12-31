import { useState, useCallback, useEffect } from 'react';
import {
  getService,
  getServiceStatus,
  disconnectService,
  getSpotifyAuthUrl,
  getSpotifyDevices,
  getSpotifyPlaylists,
  getSpotifyPlayback,
  spotifyPlay,
  spotifyPause,
  spotifyNext,
  spotifyPrevious,
  setSpotifyVolume,
  setSpotifyShuffle,
} from '../services/servicesApi';

/**
 * Hook for managing Spotify Connect playback
 * Supports OAuth authentication and multi-device playback
 * @param {boolean} demoMode - Whether in demo mode (uses mock data)
 * @returns {object} Spotify state and control functions
 */
export const useSpotify = (demoMode = false) => {
  const [isConnected, setIsConnected] = useState(false);
  // Default to false - will be set to true when we confirm Spotify is configured
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Spotify data
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playback, setPlayback] = useState(null);

  // UI state
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState(new Set());

  /**
   * Fetch all Spotify data (devices, playlists, playback state)
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [devicesRes, playlistsRes, playbackRes] = await Promise.all([
        getSpotifyDevices(demoMode),
        getSpotifyPlaylists(demoMode),
        getSpotifyPlayback(demoMode),
      ]);

      setDevices(devicesRes.devices || []);
      setPlaylists(playlistsRes.playlists || []);
      setPlayback(playbackRes.playback || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch Spotify data');
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  /**
   * Check connection status and fetch initial data
   */
  const checkConnection = useCallback(async () => {
    try {
      const connectionStatus = await getService('spotify', demoMode);
      setIsConnected(connectionStatus.connected);
      setIsConfigured(connectionStatus.configured !== false);
      setUser(connectionStatus.user || null);

      if (connectionStatus.connected) {
        await fetchData();
      }
    } catch {
      setIsConnected(false);
    }
  }, [fetchData, demoMode]);

  /**
   * Initiate OAuth flow - redirect to Spotify login
   */
  const connect = useCallback(async () => {
    setError(null);

    try {
      const { authUrl } = await getSpotifyAuthUrl(demoMode);
      window.location.href = authUrl;
    } catch (err) {
      setError(err.message || 'Failed to start Spotify login');
    }
  }, [demoMode]);

  /**
   * Disconnect from Spotify
   */
  const disconnect = useCallback(async () => {
    try {
      await disconnectService('spotify', demoMode);
    } catch {
      // Ignore disconnect errors
    }
    setIsConnected(false);
    setUser(null);
    setDevices([]);
    setPlaylists([]);
    setPlayback(null);
    setSelectedPlaylist(null);
    setSelectedDevices(new Set());
    setError(null);
  }, [demoMode]);

  /**
   * Refresh current data
   */
  const refresh = useCallback(async () => {
    if (!isConnected && !demoMode) {
      return;
    }
    await fetchData();
  }, [isConnected, demoMode, fetchData]);

  /**
   * Toggle device selection
   */
  const toggleDevice = useCallback((deviceId) => {
    setSelectedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  }, []);

  /**
   * Start playback on selected devices
   */
  const play = useCallback(async () => {
    if (selectedDevices.size === 0) {
      setError('Select at least one speaker');
      return;
    }

    setError(null);

    try {
      // For now, play on the first selected device
      // Spotify doesn't support true multi-room in API, but Spotify Connect groups handle it
      const deviceId = Array.from(selectedDevices)[0];
      const options = { deviceId };

      if (selectedPlaylist) {
        options.contextUri = selectedPlaylist.uri;
      }

      await spotifyPlay(options, demoMode);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to start playback');
    }
  }, [selectedDevices, selectedPlaylist, demoMode, fetchData]);

  /**
   * Pause playback
   */
  const pause = useCallback(async () => {
    setError(null);

    try {
      await spotifyPause(null, demoMode);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to pause playback');
    }
  }, [demoMode, fetchData]);

  /**
   * Skip to next track
   */
  const next = useCallback(async () => {
    setError(null);

    try {
      await spotifyNext(null, demoMode);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to skip track');
    }
  }, [demoMode, fetchData]);

  /**
   * Skip to previous track
   */
  const previous = useCallback(async () => {
    setError(null);

    try {
      await spotifyPrevious(null, demoMode);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to skip to previous');
    }
  }, [demoMode, fetchData]);

  /**
   * Set volume on a specific device
   */
  const setVolume = useCallback(
    async (volumePercent, deviceId) => {
      setError(null);

      try {
        await setSpotifyVolume(volumePercent, deviceId, demoMode);
        // Update local state immediately for responsiveness
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? { ...d, volume_percent: volumePercent } : d))
        );
      } catch (err) {
        setError(err.message || 'Failed to set volume');
      }
    },
    [demoMode]
  );

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = useCallback(async () => {
    setError(null);

    try {
      const newState = !playback?.shuffleState;
      await setSpotifyShuffle(newState, null, demoMode);
      setPlayback((prev) => (prev ? { ...prev, shuffleState: newState } : prev));
    } catch (err) {
      setError(err.message || 'Failed to toggle shuffle');
    }
  }, [playback?.shuffleState, demoMode]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check connection status on mount (to determine isConfigured)
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  // Handle OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spotifyConnected = params.get('spotify_connected');
    const spotifyError = params.get('spotify_error');

    if (spotifyConnected === 'true') {
      // Clear spotify_connected param but preserve others (like demo=true)
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('spotify_connected');
      const newSearch = newParams.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      checkConnection();
    } else if (spotifyError) {
      setError(`Spotify login failed: ${spotifyError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkConnection]);

  return {
    // Connection state
    isConnected,
    isConfigured,
    isLoading,
    error,
    user,

    // Spotify data
    devices,
    playlists,
    playback,

    // Selection state
    selectedPlaylist,
    selectedDevices,

    // Selection actions
    setSelectedPlaylist,
    toggleDevice,

    // Playback actions
    play,
    pause,
    next,
    previous,
    setVolume,
    toggleShuffle,

    // Connection actions
    connect,
    disconnect,
    refresh,
    checkConnection,
    clearError,
  };
};
