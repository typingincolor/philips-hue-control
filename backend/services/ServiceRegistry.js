/**
 * ServiceRegistry - Central registry for all service plugins
 * Manages plugin registration, discovery, and access
 */

import { createLogger } from '../utils/logger.js';
import { isDemoMode } from '../utils/requestContext.js';

const logger = createLogger('REGISTRY');

class ServiceRegistryClass {
  constructor() {
    // Map of service id to plugin instance (real plugins)
    this._plugins = new Map();
    // Map of service id to demo plugin instance
    this._demoPlugins = new Map();
  }

  /**
   * Register a service plugin
   * @param {ServicePlugin} plugin - Plugin instance to register
   * @throws {Error} If plugin is invalid or already registered
   */
  register(plugin) {
    const id = plugin.constructor.id;

    // Validate plugin has an id
    if (!id || id === 'base') {
      throw new Error('Plugin must have a static id property');
    }

    // Check for duplicates
    if (this._plugins.has(id)) {
      throw new Error(`Plugin '${id}' is already registered`);
    }

    // Validate required methods are implemented
    const errors = plugin.validateImplementation();
    if (errors.length > 0) {
      throw new Error(`Plugin '${id}' is missing required methods: ${errors.join(', ')}`);
    }

    this._plugins.set(id, plugin);
    logger.info('Registered plugin', { id, displayName: plugin.constructor.displayName });
  }

  /**
   * Register a demo mode plugin
   * @param {ServicePlugin} plugin - Demo plugin instance to register
   * @throws {Error} If plugin is invalid
   */
  registerDemo(plugin) {
    const id = plugin.constructor.id;

    // Validate plugin has an id
    if (!id || id === 'base') {
      throw new Error('Demo plugin must have a static id property');
    }

    // Check for duplicates
    if (this._demoPlugins.has(id)) {
      throw new Error(`Demo plugin '${id}' is already registered`);
    }

    // Validate required methods are implemented
    const errors = plugin.validateImplementation();
    if (errors.length > 0) {
      throw new Error(`Demo plugin '${id}' is missing required methods: ${errors.join(', ')}`);
    }

    this._demoPlugins.set(id, plugin);
    logger.info('Registered demo plugin', { id });
  }

  /**
   * Unregister a service plugin
   * @param {string} id - Plugin ID to unregister
   * @returns {boolean} True if plugin was found and removed
   */
  unregister(id) {
    if (!this._plugins.has(id)) {
      return false;
    }

    this._plugins.delete(id);
    logger.info('Unregistered plugin', { id });
    return true;
  }

  /**
   * Get a plugin by ID
   * @param {string} id - Plugin ID
   * @param {boolean} [demoMode] - If true, return demo plugin. If undefined, checks request context.
   * @returns {ServicePlugin|null} Plugin instance or null
   */
  get(id, demoMode) {
    // Use explicit parameter if provided, otherwise check request context
    const useDemo = demoMode !== undefined ? demoMode : isDemoMode();
    if (useDemo) {
      return this._demoPlugins.get(id) || null;
    }
    return this._plugins.get(id) || null;
  }

  /**
   * Check if a plugin is registered
   * @param {string} id - Plugin ID
   * @returns {boolean}
   */
  has(id) {
    return this._plugins.has(id);
  }

  /**
   * Get all registered plugins
   * @param {boolean} [demoMode] - If true, return demo plugins. If undefined, checks request context.
   * @returns {ServicePlugin[]}
   */
  getAll(demoMode) {
    // Use explicit parameter if provided, otherwise check request context
    const useDemo = demoMode !== undefined ? demoMode : isDemoMode();
    if (useDemo) {
      return Array.from(this._demoPlugins.values());
    }
    return Array.from(this._plugins.values());
  }

  /**
   * Get all registered plugin IDs
   * @returns {string[]}
   */
  getIds() {
    return Array.from(this._plugins.keys());
  }

  /**
   * Get metadata for all registered plugins
   * @returns {Object[]}
   */
  getAllMetadata() {
    return this.getAll().map((plugin) => plugin.getMetadata());
  }
}

// Create singleton instance
const ServiceRegistry = new ServiceRegistryClass();

// Auto-register built-in plugins
import HuePlugin from './plugins/HuePlugin.js';
import HivePlugin from './plugins/HivePlugin.js';
import SpotifyPlugin from './plugins/SpotifyPlugin.js';
import HueDemoPlugin from './plugins/HueDemoPlugin.js';
import HiveDemoPlugin from './plugins/HiveDemoPlugin.js';
import SpotifyDemoPlugin from './plugins/SpotifyDemoPlugin.js';

ServiceRegistry.register(HuePlugin);
ServiceRegistry.register(HivePlugin);
ServiceRegistry.register(SpotifyPlugin);
ServiceRegistry.registerDemo(HueDemoPlugin);
ServiceRegistry.registerDemo(HiveDemoPlugin);
ServiceRegistry.registerDemo(SpotifyDemoPlugin);

export default ServiceRegistry;
