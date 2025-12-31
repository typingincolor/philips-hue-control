/**
 * Spotify Service
 * Handles OAuth authentication and Spotify Web API interactions
 */

import { createLogger } from '../utils/logger.js';
import spotifyCredentialsManager from './spotifyCredentialsManager.js';

const logger = createLogger('SPOTIFY');

// Spotify API endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Required scopes for playback control
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'playlist-read-private',
].join(' ');

class SpotifyService {
  constructor() {
    // Auto-initialize from environment variables
    this._clientId = process.env.SPOTIFY_CLIENT_ID || null;
    this._clientSecret = process.env.SPOTIFY_CLIENT_SECRET || null;
    this._redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      'http://localhost:3001/api/v2/services/spotify/callback';

    if (!this._clientId || !this._clientSecret) {
      logger.debug('Spotify credentials not configured in environment');
    } else {
      logger.info('Spotify service initialized');
    }
  }

  /**
   * Initialize with config (optional - can override env vars)
   * @param {Object} config - Spotify config from config.yaml
   */
  initialize(config) {
    if (config?.clientId) {
      this._clientId = config.clientId;
    }
    if (config?.clientSecret) {
      this._clientSecret = config.clientSecret;
    }
    if (config?.redirectUri) {
      this._redirectUri = config.redirectUri;
    }

    if (!this._clientId || !this._clientSecret) {
      logger.warn('Spotify credentials not configured');
    } else {
      logger.info('Spotify service initialized');
    }
  }

  /**
   * Check if Spotify is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this._clientId && this._clientSecret);
  }

  /**
   * Check if connected (has valid tokens)
   * @returns {boolean}
   */
  isConnected() {
    return spotifyCredentialsManager.hasCredentials();
  }

  /**
   * Get OAuth authorization URL
   * @param {string} state - CSRF state parameter
   * @returns {string} Authorization URL
   */
  getAuthUrl(state) {
    if (!this.isConfigured()) {
      throw new Error('Spotify not configured');
    }

    const params = new URLSearchParams({
      client_id: this._clientId,
      response_type: 'code',
      redirect_uri: this._redirectUri,
      scope: SCOPES,
      state: state || 'spotify_auth',
      show_dialog: 'true',
    });

    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCode(code) {
    if (!this.isConfigured()) {
      throw new Error('Spotify not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this._redirectUri,
    });

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Token exchange failed', { status: response.status, error });
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens = await response.json();
    spotifyCredentialsManager.storeTokens(tokens);

    // Fetch and cache user info
    await this._fetchUserInfo();

    logger.info('Spotify authenticated successfully');
    return { success: true };
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} Success
   */
  async refreshToken() {
    const refreshToken = spotifyCredentialsManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Token refresh failed', { status: response.status, error });
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();
    spotifyCredentialsManager.storeTokens(tokens);

    logger.debug('Spotify token refreshed');
    return true;
  }

  /**
   * Get valid access token, refreshing if needed
   * @returns {Promise<string>} Access token
   */
  async _getAccessToken() {
    let token = spotifyCredentialsManager.getAccessToken();

    if (!token && spotifyCredentialsManager.needsRefresh()) {
      await this.refreshToken();
      token = spotifyCredentialsManager.getAccessToken();
    }

    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    return token;
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object|null>} Response data
   */
  async _apiRequest(endpoint, options = {}) {
    const token = await this._getAccessToken();

    const response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Handle 401 - try refresh once
    if (response.status === 401) {
      logger.debug('Token expired, refreshing...');
      await this.refreshToken();
      return this._apiRequest(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.text();
      logger.error('Spotify API error', { endpoint, status: response.status, error });
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch and cache user info
   * @private
   */
  async _fetchUserInfo() {
    try {
      const user = await this._apiRequest('/me');
      spotifyCredentialsManager.setUserInfo(user);
    } catch (error) {
      logger.warn('Failed to fetch user info', { error: error.message });
    }
  }

  /**
   * Disconnect from Spotify (clear tokens)
   */
  disconnect() {
    spotifyCredentialsManager.clearCredentials();
    logger.info('Disconnected from Spotify');
  }

  /**
   * Get connection status
   * @returns {Object}
   */
  getConnectionStatus() {
    const user = spotifyCredentialsManager.getUserInfo();
    return {
      connected: this.isConnected(),
      configured: this.isConfigured(),
      user: user,
    };
  }

  // ===== Playback Control =====

  /**
   * Get available playback devices
   * @returns {Promise<Array>}
   */
  async getDevices() {
    const data = await this._apiRequest('/me/player/devices');
    return data?.devices || [];
  }

  /**
   * Get current playback state
   * @returns {Promise<Object|null>}
   */
  async getPlaybackState() {
    try {
      return await this._apiRequest('/me/player');
    } catch {
      return null;
    }
  }

  /**
   * Get currently playing track
   * @returns {Promise<Object|null>}
   */
  async getCurrentlyPlaying() {
    try {
      return await this._apiRequest('/me/player/currently-playing');
    } catch {
      return null;
    }
  }

  /**
   * Start or resume playback
   * @param {Object} options
   * @param {string} options.deviceId - Target device ID
   * @param {string} options.contextUri - Playlist/album URI to play
   * @param {Array<string>} options.uris - Track URIs to play
   */
  async play(options = {}) {
    const { deviceId, contextUri, uris } = options;

    const queryParams = deviceId ? `?device_id=${deviceId}` : '';
    const body = {};

    if (contextUri) {
      body.context_uri = contextUri;
    }
    if (uris && uris.length > 0) {
      body.uris = uris;
    }

    await this._apiRequest(`/me/player/play${queryParams}`, {
      method: 'PUT',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    logger.debug('Playback started', { deviceId, contextUri });
  }

  /**
   * Pause playback
   * @param {string} deviceId - Target device ID
   */
  async pause(deviceId) {
    const queryParams = deviceId ? `?device_id=${deviceId}` : '';
    await this._apiRequest(`/me/player/pause${queryParams}`, {
      method: 'PUT',
    });
    logger.debug('Playback paused');
  }

  /**
   * Skip to next track
   * @param {string} deviceId - Target device ID
   */
  async next(deviceId) {
    const queryParams = deviceId ? `?device_id=${deviceId}` : '';
    await this._apiRequest(`/me/player/next${queryParams}`, {
      method: 'POST',
    });
    logger.debug('Skipped to next');
  }

  /**
   * Skip to previous track
   * @param {string} deviceId - Target device ID
   */
  async previous(deviceId) {
    const queryParams = deviceId ? `?device_id=${deviceId}` : '';
    await this._apiRequest(`/me/player/previous${queryParams}`, {
      method: 'POST',
    });
    logger.debug('Skipped to previous');
  }

  /**
   * Set playback volume
   * @param {number} volumePercent - Volume 0-100
   * @param {string} deviceId - Target device ID
   */
  async setVolume(volumePercent, deviceId) {
    const volume = Math.max(0, Math.min(100, Math.round(volumePercent)));
    const queryParams = new URLSearchParams({ volume_percent: volume });
    if (deviceId) {
      queryParams.set('device_id', deviceId);
    }

    await this._apiRequest(`/me/player/volume?${queryParams.toString()}`, {
      method: 'PUT',
    });
    logger.debug('Volume set', { volume, deviceId });
  }

  /**
   * Toggle shuffle mode
   * @param {boolean} state - Shuffle on/off
   * @param {string} deviceId - Target device ID
   */
  async setShuffle(state, deviceId) {
    const queryParams = new URLSearchParams({ state: state.toString() });
    if (deviceId) {
      queryParams.set('device_id', deviceId);
    }

    await this._apiRequest(`/me/player/shuffle?${queryParams.toString()}`, {
      method: 'PUT',
    });
    logger.debug('Shuffle set', { state });
  }

  /**
   * Transfer playback to a device
   * @param {string} deviceId - Target device ID
   * @param {boolean} play - Start playing on new device
   */
  async transferPlayback(deviceId, play = true) {
    await this._apiRequest('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    });
    logger.debug('Playback transferred', { deviceId });
  }

  // ===== Playlists =====

  /**
   * Get user's playlists
   * @param {number} limit - Max playlists to return
   * @returns {Promise<Array>}
   */
  async getPlaylists(limit = 50) {
    const data = await this._apiRequest(`/me/playlists?limit=${limit}`);
    return data?.items || [];
  }

  /**
   * Get playlist details
   * @param {string} playlistId - Playlist ID
   * @returns {Promise<Object>}
   */
  async getPlaylist(playlistId) {
    return this._apiRequest(`/playlists/${playlistId}`);
  }

  // ===== Full Status =====

  /**
   * Get full Spotify status for dashboard
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const [devices, playback, playlists] = await Promise.all([
      this.getDevices().catch(() => []),
      this.getPlaybackState().catch(() => null),
      this.getPlaylists().catch(() => []),
    ]);

    const user = spotifyCredentialsManager.getUserInfo();

    return {
      connected: true,
      user,
      devices,
      playback: playback
        ? {
            isPlaying: playback.is_playing,
            shuffleState: playback.shuffle_state,
            repeatState: playback.repeat_state,
            progressMs: playback.progress_ms,
            device: playback.device,
            track: playback.item
              ? {
                  id: playback.item.id,
                  name: playback.item.name,
                  artist: playback.item.artists?.map((a) => a.name).join(', '),
                  album: playback.item.album?.name,
                  albumArt: playback.item.album?.images?.[0]?.url,
                  durationMs: playback.item.duration_ms,
                  uri: playback.item.uri,
                }
              : null,
          }
        : null,
      playlists: playlists.map((p) => ({
        id: p.id,
        name: p.name,
        uri: p.uri,
        imageUrl: p.images?.[0]?.url,
        trackCount: p.tracks?.total,
      })),
    };
  }
}

export default new SpotifyService();
