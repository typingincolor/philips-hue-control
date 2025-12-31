/**
 * Spotify Plugin - Service plugin for Spotify Connect playback control
 */

import express from 'express';
import ServicePlugin from '../ServicePlugin.js';
import spotifyService from '../spotifyService.js';
import spotifyCredentialsManager from '../spotifyCredentialsManager.js';

class SpotifyPluginClass extends ServicePlugin {
  static id = 'spotify';
  static displayName = 'Spotify';
  static description = 'Control Spotify playback on connected devices';
  static authType = 'oauth';

  constructor() {
    super();
    this._router = null;
  }

  /**
   * Connect to Spotify - returns OAuth URL for redirect
   */
  async connect() {
    if (!spotifyService.isConfigured()) {
      return { success: false, error: 'Spotify not configured' };
    }

    const authUrl = spotifyService.getAuthUrl();
    return { success: true, authUrl };
  }

  /**
   * Disconnect from Spotify
   */
  async disconnect() {
    spotifyService.disconnect();
  }

  /**
   * Check if connected to Spotify
   */
  isConnected() {
    return spotifyService.isConnected();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return spotifyService.getConnectionStatus();
  }

  /**
   * Get full Spotify status (devices, playback, playlists)
   */
  async getStatus() {
    if (!this.isConnected()) {
      return { connected: false };
    }

    return spotifyService.getStatus();
  }

  /**
   * Check if credentials exist
   */
  hasCredentials() {
    return spotifyCredentialsManager.hasCredentials();
  }

  /**
   * Clear Spotify credentials
   */
  async clearCredentials() {
    spotifyCredentialsManager.clearCredentials();
  }

  /**
   * Get Express router for Spotify-specific endpoints
   */
  getRouter() {
    if (this._router) {
      return this._router;
    }

    const router = express.Router();

    // GET /auth-url - Get OAuth authorization URL
    router.get('/auth-url', (req, res) => {
      try {
        if (!spotifyService.isConfigured()) {
          return res.status(400).json({ error: 'Spotify not configured' });
        }

        const authUrl = spotifyService.getAuthUrl();
        res.json({ authUrl });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // GET /callback - OAuth callback handler
    router.get('/callback', async (req, res, next) => {
      try {
        const { code, error, state } = req.query;

        if (error) {
          // Redirect to frontend with error
          return res.redirect(`/?spotify_error=${encodeURIComponent(error)}`);
        }

        if (!code) {
          return res.redirect('/?spotify_error=no_code');
        }

        await spotifyService.exchangeCode(code);

        // Redirect to frontend with success
        res.redirect('/?spotify_connected=true');
      } catch (error) {
        next(error);
      }
    });

    // GET /devices - Get available devices
    router.get('/devices', async (req, res, next) => {
      try {
        const devices = await spotifyService.getDevices();
        res.json({ devices });
      } catch (error) {
        next(error);
      }
    });

    // GET /playlists - Get user's playlists
    router.get('/playlists', async (req, res, next) => {
      try {
        const playlists = await spotifyService.getPlaylists();
        res.json({ playlists });
      } catch (error) {
        next(error);
      }
    });

    // GET /playback - Get current playback state
    router.get('/playback', async (req, res, next) => {
      try {
        const playback = await spotifyService.getPlaybackState();
        res.json({ playback });
      } catch (error) {
        next(error);
      }
    });

    // POST /play - Start or resume playback
    router.post('/play', async (req, res, next) => {
      try {
        const { deviceId, contextUri, uris } = req.body;
        await spotifyService.play({ deviceId, contextUri, uris });
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // POST /pause - Pause playback
    router.post('/pause', async (req, res, next) => {
      try {
        const { deviceId } = req.body;
        await spotifyService.pause(deviceId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // POST /next - Skip to next track
    router.post('/next', async (req, res, next) => {
      try {
        const { deviceId } = req.body;
        await spotifyService.next(deviceId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // POST /previous - Skip to previous track
    router.post('/previous', async (req, res, next) => {
      try {
        const { deviceId } = req.body;
        await spotifyService.previous(deviceId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // PUT /volume - Set playback volume
    router.put('/volume', async (req, res, next) => {
      try {
        const { volumePercent, deviceId } = req.body;
        await spotifyService.setVolume(volumePercent, deviceId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // PUT /shuffle - Toggle shuffle mode
    router.put('/shuffle', async (req, res, next) => {
      try {
        const { state, deviceId } = req.body;
        await spotifyService.setShuffle(state, deviceId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    // PUT /device - Transfer playback to device
    router.put('/device', async (req, res, next) => {
      try {
        const { deviceId, play } = req.body;
        await spotifyService.transferPlayback(deviceId, play);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
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

    // Compare playback state
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

// Export singleton instance
export default new SpotifyPluginClass();
