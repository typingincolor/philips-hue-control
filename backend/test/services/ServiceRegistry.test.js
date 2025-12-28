import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('ServiceRegistry', () => {
  let ServiceRegistry;
  let ServicePlugin;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Import fresh instances
    const pluginMod = await import('../../services/ServicePlugin.js');
    ServicePlugin = pluginMod.default;

    const registryMod = await import('../../services/ServiceRegistry.js');
    ServiceRegistry = registryMod.default;
  });

  describe('getAll', () => {
    it('should return array of all registered services', () => {
      const services = ServiceRegistry.getAll();

      expect(Array.isArray(services)).toBe(true);
    });

    it('should include Hue service', () => {
      const services = ServiceRegistry.getAll();
      const hue = services.find((s) => s.constructor.id === 'hue');

      expect(hue).toBeDefined();
    });

    it('should include Hive service', () => {
      const services = ServiceRegistry.getAll();
      const hive = services.find((s) => s.constructor.id === 'hive');

      expect(hive).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return service by id', () => {
      const hue = ServiceRegistry.get('hue');

      expect(hue).toBeDefined();
      expect(hue.constructor.id).toBe('hue');
    });

    it('should return null for unknown service id', () => {
      const unknown = ServiceRegistry.get('unknown-service');

      expect(unknown).toBeNull();
    });
  });

  describe('getIds', () => {
    it('should return array of service ids', () => {
      const ids = ServiceRegistry.getIds();

      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toContain('hue');
      expect(ids).toContain('hive');
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      expect(ServiceRegistry.has('hue')).toBe(true);
      expect(ServiceRegistry.has('hive')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(ServiceRegistry.has('unknown')).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new service plugin', () => {
      class TestPlugin extends ServicePlugin {
        static id = 'test-plugin';
        static displayName = 'Test Plugin';
        static description = 'A test plugin';
        static authType = 'none';

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

      const plugin = new TestPlugin();
      ServiceRegistry.register(plugin);

      expect(ServiceRegistry.has('test-plugin')).toBe(true);
      expect(ServiceRegistry.get('test-plugin')).toBe(plugin);
    });

    it('should throw if plugin has no id', () => {
      class NoIdPlugin extends ServicePlugin {}

      const plugin = new NoIdPlugin();

      expect(() => ServiceRegistry.register(plugin)).toThrow('Plugin must have a static id');
    });

    it('should throw if plugin id is already registered', () => {
      class DuplicatePlugin extends ServicePlugin {
        static id = 'hue'; // Already registered

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

      const plugin = new DuplicatePlugin();

      expect(() => ServiceRegistry.register(plugin)).toThrow('already registered');
    });

    it('should throw if plugin does not implement required methods', () => {
      class IncompletePlugin extends ServicePlugin {
        static id = 'incomplete-plugin';
        // Missing required method implementations
      }

      const plugin = new IncompletePlugin();

      expect(() => ServiceRegistry.register(plugin)).toThrow('missing required methods');
    });
  });

  describe('unregister', () => {
    it('should unregister a service by id', () => {
      class RemovablePlugin extends ServicePlugin {
        static id = 'removable';
        static displayName = 'Removable';
        static description = 'Can be removed';
        static authType = 'none';

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

      const plugin = new RemovablePlugin();
      ServiceRegistry.register(plugin);
      expect(ServiceRegistry.has('removable')).toBe(true);

      ServiceRegistry.unregister('removable');
      expect(ServiceRegistry.has('removable')).toBe(false);
    });

    it('should return false for unknown service', () => {
      const result = ServiceRegistry.unregister('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getAllMetadata', () => {
    it('should return metadata for all services', () => {
      const metadata = ServiceRegistry.getAllMetadata();

      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);

      const hueMetadata = metadata.find((m) => m.id === 'hue');
      expect(hueMetadata).toHaveProperty('id', 'hue');
      expect(hueMetadata).toHaveProperty('displayName');
      expect(hueMetadata).toHaveProperty('description');
      expect(hueMetadata).toHaveProperty('authType');
    });
  });

  describe('initialization', () => {
    it('should auto-discover and register built-in plugins', () => {
      // The registry should auto-load Hue and Hive plugins on import
      const ids = ServiceRegistry.getIds();

      expect(ids).toContain('hue');
      expect(ids).toContain('hive');
    });
  });
});
