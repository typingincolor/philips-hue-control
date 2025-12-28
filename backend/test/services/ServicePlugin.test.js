import { describe, it, expect, beforeEach } from 'vitest';
import ServicePlugin from '../../services/ServicePlugin.js';

describe('ServicePlugin', () => {
  describe('static properties', () => {
    it('should have id property', () => {
      expect(ServicePlugin.id).toBeDefined();
    });

    it('should have displayName property', () => {
      expect(ServicePlugin.displayName).toBeDefined();
    });

    it('should have description property', () => {
      expect(ServicePlugin.description).toBeDefined();
    });

    it('should have authType property', () => {
      expect(ServicePlugin.authType).toBeDefined();
    });
  });

  describe('instance methods', () => {
    let plugin;

    beforeEach(() => {
      plugin = new ServicePlugin();
    });

    describe('lifecycle', () => {
      it('should have initialize method', async () => {
        expect(typeof plugin.initialize).toBe('function');
        await expect(plugin.initialize()).resolves.not.toThrow();
      });

      it('should have shutdown method', async () => {
        expect(typeof plugin.shutdown).toBe('function');
        await expect(plugin.shutdown()).resolves.not.toThrow();
      });
    });

    describe('connection', () => {
      it('should have connect method that throws NotImplementedError', async () => {
        await expect(plugin.connect({}, false)).rejects.toThrow('Not implemented');
      });

      it('should have disconnect method that throws NotImplementedError', async () => {
        await expect(plugin.disconnect()).rejects.toThrow('Not implemented');
      });

      it('should have isConnected method that throws NotImplementedError', () => {
        expect(() => plugin.isConnected(false)).toThrow('Not implemented');
      });

      it('should have getConnectionStatus method that throws NotImplementedError', () => {
        expect(() => plugin.getConnectionStatus(false)).toThrow('Not implemented');
      });
    });

    describe('data', () => {
      it('should have getStatus method that throws NotImplementedError', async () => {
        await expect(plugin.getStatus(false)).rejects.toThrow('Not implemented');
      });
    });

    describe('credentials', () => {
      it('should have hasCredentials method that throws NotImplementedError', () => {
        expect(() => plugin.hasCredentials()).toThrow('Not implemented');
      });

      it('should have clearCredentials method that throws NotImplementedError', async () => {
        await expect(plugin.clearCredentials()).rejects.toThrow('Not implemented');
      });
    });

    describe('demo mode', () => {
      it('should have getDemoCredentials method that returns null by default', () => {
        expect(plugin.getDemoCredentials()).toBeNull();
      });

      it('should have resetDemo method that does nothing by default', () => {
        expect(() => plugin.resetDemo()).not.toThrow();
      });
    });

    describe('extensions', () => {
      it('should have getRouter method that returns null by default', () => {
        expect(plugin.getRouter()).toBeNull();
      });

      it('should have detectChanges method that returns null by default', () => {
        expect(plugin.detectChanges({}, {})).toBeNull();
      });
    });
  });

  describe('getMetadata', () => {
    it('should return service metadata object', () => {
      const plugin = new ServicePlugin();
      const metadata = plugin.getMetadata();

      expect(metadata).toHaveProperty('id');
      expect(metadata).toHaveProperty('displayName');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('authType');
    });
  });

  describe('validateImplementation', () => {
    it('should validate that required methods are implemented', () => {
      class IncompletePlugin extends ServicePlugin {
        static id = 'incomplete';
      }

      const plugin = new IncompletePlugin();
      const errors = plugin.validateImplementation();

      expect(errors).toContain('connect');
      expect(errors).toContain('disconnect');
      expect(errors).toContain('isConnected');
      expect(errors).toContain('getStatus');
    });

    it('should return empty array for complete implementation', () => {
      class CompletePlugin extends ServicePlugin {
        static id = 'complete';
        async connect() {
          return { success: true };
        }
        async disconnect() {}
        isConnected() {
          return false;
        }
        getConnectionStatus() {
          return { connected: false };
        }
        async getStatus() {
          return {};
        }
        hasCredentials() {
          return false;
        }
        async clearCredentials() {}
      }

      const plugin = new CompletePlugin();
      const errors = plugin.validateImplementation();

      expect(errors).toEqual([]);
    });
  });
});
