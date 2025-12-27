import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import SettingsService from '../../services/settingsService.js';
import { getMockSettings } from '../../services/mockData.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const testSettingsPath = '/tmp/test-settings.json';

describe('SettingsService', () => {
  beforeEach(() => {
    SettingsService.clearAll();
    // Clean up test file
    try {
      fs.unlinkSync(testSettingsPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  afterEach(() => {
    // Clean up test file
    try {
      fs.unlinkSync(testSettingsPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  describe('getSettings', () => {
    it('should return default settings for new session', () => {
      const result = SettingsService.getSettings('session-1');

      expect(result).toHaveProperty('location', null);
      expect(result).toHaveProperty('units', 'celsius');
    });

    it('should return demo settings when demoMode is true', () => {
      const result = SettingsService.getSettings('demo-session', true);
      const mockSettings = getMockSettings();

      expect(result.location).toEqual(mockSettings.location);
      expect(result.units).toBe(mockSettings.units);
    });

    it('should return previously saved settings', () => {
      const settings = { location: { lat: 40, lon: -74, name: 'NYC' }, units: 'fahrenheit' };
      SettingsService.updateSettings('session-1', settings);

      const result = SettingsService.getSettings('session-1');

      expect(result).toEqual(settings);
    });

    it('should return separate settings per session', () => {
      SettingsService.updateSettings('session-1', { units: 'fahrenheit' });
      SettingsService.updateSettings('session-2', { units: 'celsius' });

      expect(SettingsService.getSettings('session-1').units).toBe('fahrenheit');
      expect(SettingsService.getSettings('session-2').units).toBe('celsius');
    });
  });

  describe('updateSettings', () => {
    it('should update units', () => {
      SettingsService.updateSettings('session-1', { units: 'fahrenheit' });

      const result = SettingsService.getSettings('session-1');
      expect(result.units).toBe('fahrenheit');
    });

    it('should update location', () => {
      const location = { lat: 48.8566, lon: 2.3522, name: 'Paris' };
      SettingsService.updateSettings('session-1', { location });

      const result = SettingsService.getSettings('session-1');
      expect(result.location).toEqual(location);
    });

    it('should merge with existing settings', () => {
      SettingsService.updateSettings('session-1', { units: 'fahrenheit' });
      SettingsService.updateSettings('session-1', {
        location: { lat: 35, lon: 139, name: 'Tokyo' },
      });

      const result = SettingsService.getSettings('session-1');
      expect(result.units).toBe('fahrenheit');
      expect(result.location.name).toBe('Tokyo');
    });

    it('should return updated settings', () => {
      const result = SettingsService.updateSettings('session-1', { units: 'fahrenheit' });

      expect(result.units).toBe('fahrenheit');
    });

    it('should persist settings even in demo mode', () => {
      // Demo mode now allows settings to be stored in memory
      SettingsService.updateSettings('demo-session', { units: 'fahrenheit' }, true);

      const result = SettingsService.getSettings('demo-session', true);
      expect(result.units).toBe('fahrenheit');
    });
  });

  describe('updateLocation', () => {
    it('should update only location', () => {
      SettingsService.updateSettings('session-1', { units: 'fahrenheit' });
      const location = { lat: 52.52, lon: 13.405, name: 'Berlin' };

      SettingsService.updateLocation('session-1', location);

      const result = SettingsService.getSettings('session-1');
      expect(result.location).toEqual(location);
      expect(result.units).toBe('fahrenheit');
    });

    it('should return updated settings', () => {
      const location = { lat: 55.7558, lon: 37.6173, name: 'Moscow' };
      const result = SettingsService.updateLocation('session-1', location);

      expect(result.location).toEqual(location);
    });
  });

  describe('clearLocation', () => {
    it('should clear location', () => {
      SettingsService.updateLocation('session-1', { lat: 40, lon: -74, name: 'NYC' });
      SettingsService.clearLocation('session-1');

      const result = SettingsService.getSettings('session-1');
      expect(result.location).toBeNull();
    });

    it('should preserve other settings', () => {
      SettingsService.updateSettings('session-1', {
        location: { lat: 40, lon: -74, name: 'NYC' },
        units: 'fahrenheit',
      });
      SettingsService.clearLocation('session-1');

      const result = SettingsService.getSettings('session-1');
      expect(result.location).toBeNull();
      expect(result.units).toBe('fahrenheit');
    });

    it('should return updated settings', () => {
      SettingsService.updateLocation('session-1', { lat: 40, lon: -74, name: 'NYC' });
      const result = SettingsService.clearLocation('session-1');

      expect(result.location).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all session settings', () => {
      SettingsService.updateSettings('session-1', { units: 'fahrenheit' });
      SettingsService.updateSettings('session-2', { units: 'fahrenheit' });

      SettingsService.clearAll();

      // New sessions should get defaults
      expect(SettingsService.getSettings('session-1').units).toBe('celsius');
      expect(SettingsService.getSettings('session-2').units).toBe('celsius');
    });
  });

  describe('validation', () => {
    it('should validate units value', () => {
      expect(() => {
        SettingsService.updateSettings('session-1', { units: 'kelvin' });
      }).toThrow();
    });

    it('should accept valid units values', () => {
      expect(() => {
        SettingsService.updateSettings('session-1', { units: 'celsius' });
      }).not.toThrow();

      expect(() => {
        SettingsService.updateSettings('session-1', { units: 'fahrenheit' });
      }).not.toThrow();
    });

    it('should validate location has required fields', () => {
      expect(() => {
        SettingsService.updateLocation('session-1', { lat: 40 }); // missing lon
      }).toThrow();
    });

    it('should accept valid location', () => {
      expect(() => {
        SettingsService.updateLocation('session-1', { lat: 40.7128, lon: -74.006 });
      }).not.toThrow();
    });

    it('should accept location with optional name', () => {
      expect(() => {
        SettingsService.updateLocation('session-1', {
          lat: 40.7128,
          lon: -74.006,
          name: 'NYC',
        });
      }).not.toThrow();
    });
  });

  describe('Location Persistence', () => {
    beforeEach(async () => {
      vi.resetModules();
    });

    it('should save location in settings file', async () => {
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;

      const location = { lat: 51.5074, lon: -0.1278, name: 'London' };
      service.updateLocation('session-1', location);

      const fileContents = fs.readFileSync(testSettingsPath, 'utf8');
      const saved = JSON.parse(fileContents);

      expect(saved.location).toEqual(location);
    });

    it('should persist units to file when updated', async () => {
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;

      service.updateSettings('session-1', { units: 'fahrenheit' });

      const fileContents = fs.readFileSync(testSettingsPath, 'utf8');
      const saved = JSON.parse(fileContents);

      expect(saved.units).toBe('fahrenheit');
    });

    it('should load location from file on startup', async () => {
      // Write settings file directly
      const savedSettings = {
        location: { lat: 48.8566, lon: 2.3522, name: 'Paris' },
        units: 'celsius',
      };
      fs.writeFileSync(testSettingsPath, JSON.stringify(savedSettings));

      // Reset modules and import fresh
      vi.resetModules();
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;
      service._loadSettings();

      const settings = service.getSettings('any-session');
      expect(settings.location).toEqual(savedSettings.location);
    });

    it('should load units from file on startup', async () => {
      const savedSettings = {
        location: null,
        units: 'fahrenheit',
      };
      fs.writeFileSync(testSettingsPath, JSON.stringify(savedSettings));

      vi.resetModules();
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;
      service._loadSettings();

      const settings = service.getSettings('any-session');
      expect(settings.units).toBe('fahrenheit');
    });

    it('should handle missing settings file gracefully', async () => {
      vi.resetModules();
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = '/tmp/nonexistent-settings.json';

      expect(() => service._loadSettings()).not.toThrow();
    });

    it('should handle corrupted JSON file gracefully', async () => {
      fs.writeFileSync(testSettingsPath, 'not valid json {{{');

      vi.resetModules();
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;

      expect(() => service._loadSettings()).not.toThrow();
    });

    it('should clear location from file when cleared', async () => {
      const module = await import('../../services/settingsService.js');
      const service = module.default;
      service.settingsFilePath = testSettingsPath;

      // Set then clear location
      service.updateLocation('session-1', { lat: 40, lon: -74, name: 'NYC' });
      service.clearLocation('session-1');

      const fileContents = fs.readFileSync(testSettingsPath, 'utf8');
      const saved = JSON.parse(fileContents);

      expect(saved.location).toBeNull();
    });

    it('should persist settings across service instances', async () => {
      // First instance: save location
      const module1 = await import('../../services/settingsService.js');
      const service1 = module1.default;
      service1.settingsFilePath = testSettingsPath;
      service1.updateLocation('session-1', { lat: 35.6762, lon: 139.6503, name: 'Tokyo' });

      // Reset and create new instance
      vi.resetModules();
      const module2 = await import('../../services/settingsService.js');
      const service2 = module2.default;
      service2.settingsFilePath = testSettingsPath;
      service2._loadSettings();

      const settings = service2.getSettings('any-session');
      expect(settings.location.name).toBe('Tokyo');
    });

    it('should have default settings file path', async () => {
      vi.resetModules();
      const module = await import('../../services/settingsService.js');
      const service = module.default;

      expect(service.settingsFilePath).toBeDefined();
      expect(service.settingsFilePath).toContain('settings.json');
    });
  });
});
