/**
 * Spotify Demo Plugin - Demo mode implementation for Spotify playback
 * Uses mock data instead of real Spotify API.
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import {
  getMockSpotifyDevices,
  getMockSpotifyPlaylists,
  getMockSpotifyPlayback,
  getMockSpotifyStatus,
  setMockSpotifyPlayback,
  setMockSpotifyDeviceVolume,
  setMockSpotifyActiveDevice,
  resetMockSpotifyData,
} from '../mockData.js';

class SpotifyDemoPluginClass extends ServicePlugin {
  static id = 'spotify';
  static displayName = 'Spotify';
  static description = 'Control Spotify playback on connected devices (Demo)';
  static authType = 'oauth';

  constructor() {
    super();
    this._router = null;
    // Demo mode starts connected so users can explore features
    this._connected = true;
  }

  /**
   * Connect (in demo mode, always succeeds)
   */
  async connect() {
    this._connected = true;
    return { success: true };
  }

  /**
   * Disconnect
   */
  async disconnect() {
    this._connected = false;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this._connected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this._connected,
      configured: true,
      user: this._connected
        ? {
            id: 'demo-user',
            displayName: 'Demo User',
          }
        : null,
    };
  }

  /**
   * Get full Spotify status
   */
  async getStatus() {
    if (!this._connected) {
      return { connected: false };
    }
    return getMockSpotifyStatus();
  }

  /**
   * Demo always has credentials available
   */
  hasCredentials() {
    return true;
  }

  /**
   * Clear credentials (reset connection)
   */
  async clearCredentials() {
    this._connected = false;
  }

  /**
   * Reset demo state
   */
  resetDemo() {
    this._connected = true;
    resetMockSpotifyData();
  }

  /**
   * Get Express router for Spotify-specific endpoints
   */
  getRouter() {
    if (this._router) {
      return this._router;
    }

    const router = express.Router();

    // GET /auth-url - Get OAuth authorization URL (demo just returns a fake URL)
    router.get('/auth-url', (req, res) => {
      res.json({ authUrl: '/?spotify_connected=true' });
    });

    // GET /callback - OAuth callback (demo auto-connects)
    router.get('/callback', (req, res) => {
      this._connected = true;
      res.redirect('/?spotify_connected=true');
    });

    // GET /devices - Get available devices
    router.get('/devices', (req, res) => {
      res.json({ devices: getMockSpotifyDevices() });
    });

    // GET /playlists - Get user's playlists
    router.get('/playlists', (req, res) => {
      res.json({ playlists: getMockSpotifyPlaylists() });
    });

    // GET /playback - Get current playback state
    router.get('/playback', (req, res) => {
      res.json({ playback: getMockSpotifyPlayback() });
    });

    // POST /play - Start or resume playback
    router.post('/play', (req, res) => {
      setMockSpotifyPlayback({ isPlaying: true });
      res.json({ success: true });
    });

    // POST /pause - Pause playback
    router.post('/pause', (req, res) => {
      setMockSpotifyPlayback({ isPlaying: false });
      res.json({ success: true });
    });

    // POST /next - Skip to next track
    router.post('/next', (req, res) => {
      // In demo, just pretend we moved to next track
      setMockSpotifyPlayback({ progressMs: 0 });
      res.json({ success: true });
    });

    // POST /previous - Skip to previous track
    router.post('/previous', (req, res) => {
      setMockSpotifyPlayback({ progressMs: 0 });
      res.json({ success: true });
    });

    // PUT /volume - Set playback volume
    router.put('/volume', (req, res) => {
      const { volumePercent, deviceId } = req.body;
      if (deviceId) {
        setMockSpotifyDeviceVolume(deviceId, volumePercent);
      }
      res.json({ success: true });
    });

    // PUT /shuffle - Toggle shuffle mode
    router.put('/shuffle', (req, res) => {
      const { state } = req.body;
      setMockSpotifyPlayback({ shuffleState: state });
      res.json({ success: true });
    });

    // PUT /device - Transfer playback to device
    router.put('/device', (req, res) => {
      const { deviceId, play } = req.body;
      setMockSpotifyActiveDevice(deviceId);
      if (play) {
        setMockSpotifyPlayback({ isPlaying: true });
      }
      res.json({ success: true });
    });

    // POST /reset-demo - Reset demo state
    router.post('/reset-demo', (req, res) => {
      this.resetDemo();
      res.json({ success: true });
    });

    this._router = router;
    return router;
  }

  /**
   * Detect changes between previous and current status
   */
  detectChanges(previous, current) {
    if (!previous || !current) {
      return null;
    }

    const prevTrack = previous.playback?.track?.id;
    const currTrack = current.playback?.track?.id;
    const prevPlaying = previous.playback?.isPlaying;
    const currPlaying = current.playback?.isPlaying;

    if (prevTrack !== currTrack || prevPlaying !== currPlaying) {
      return {
        playback: current.playback,
      };
    }

    return null;
  }
}

export default new SpotifyDemoPluginClass();
