/**
 * Base class for service plugins.
 * All service integrations should extend this class and implement the required methods.
 */
class ServicePlugin {
  static id = 'base';
  static displayName = 'Base Plugin';
  static description = 'Base service plugin';
  static authType = 'none';

  /**
   * Initialize the plugin. Called once when the plugin is registered.
   */
  async initialize() {
    // Override in subclass if needed
  }

  /**
   * Shutdown the plugin. Called when the application is stopping.
   */
  async shutdown() {
    // Override in subclass if needed
  }

  /**
   * Connect to the service.
   * @param {Object} credentials - Service-specific credentials
   * @param {boolean} demoMode - Whether to use demo mode
   * @returns {Promise<Object>} Connection result
   */
  async connect(_credentials, _demoMode) {
    throw new Error('Not implemented');
  }

  /**
   * Disconnect from the service.
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('Not implemented');
  }

  /**
   * Check if the service is connected.
   * @param {boolean} demoMode - Whether to check demo connection
   * @returns {boolean}
   */
  isConnected(_demoMode) {
    throw new Error('Not implemented');
  }

  /**
   * Get the connection status.
   * @param {boolean} demoMode - Whether to get demo connection status
   * @returns {Object}
   */
  getConnectionStatus(_demoMode) {
    throw new Error('Not implemented');
  }

  /**
   * Get the current status/data from the service.
   * @param {boolean} demoMode - Whether to get demo data
   * @returns {Promise<Object>}
   */
  async getStatus(_demoMode) {
    throw new Error('Not implemented');
  }

  /**
   * Check if the service has stored credentials.
   * @returns {boolean}
   */
  hasCredentials() {
    throw new Error('Not implemented');
  }

  /**
   * Clear stored credentials.
   * @returns {Promise<void>}
   */
  async clearCredentials() {
    throw new Error('Not implemented');
  }

  /**
   * Get demo credentials for this service.
   * @returns {Object|null} Demo credentials or null if not supported
   */
  getDemoCredentials() {
    return null;
  }

  /**
   * Reset demo mode state.
   */
  resetDemo() {
    // Override in subclass if needed
  }

  /**
   * Get an Express router for service-specific endpoints.
   * @returns {Router|null} Express router or null if not needed
   */
  getRouter() {
    return null;
  }

  /**
   * Detect changes between previous and current status.
   * Used for WebSocket notifications.
   * @param {Object} previous - Previous status
   * @param {Object} current - Current status
   * @returns {Object|null} Changes object or null if no changes
   */
  detectChanges(_previous, _current) {
    return null;
  }

  /**
   * Get metadata about the service.
   * @returns {Object}
   */
  getMetadata() {
    return {
      id: this.constructor.id,
      displayName: this.constructor.displayName,
      description: this.constructor.description,
      authType: this.constructor.authType,
    };
  }

  /**
   * Validate that all required methods are properly implemented.
   * @returns {string[]} Array of missing method names
   */
  validateImplementation() {
    const requiredMethods = [
      'connect',
      'disconnect',
      'isConnected',
      'getConnectionStatus',
      'getStatus',
      'hasCredentials',
      'clearCredentials',
    ];

    const missing = [];
    for (const method of requiredMethods) {
      try {
        // Check if method throws "Not implemented"
        if (typeof this[method] === 'function') {
          // For sync methods, call directly
          if (
            method === 'isConnected' ||
            method === 'getConnectionStatus' ||
            method === 'hasCredentials'
          ) {
            try {
              this[method](false);
            } catch (e) {
              if (e.message === 'Not implemented') {
                missing.push(method);
              }
            }
          } else {
            // For async methods, we can't easily check, so verify prototype
            const baseMethod = ServicePlugin.prototype[method];
            if (this[method] === baseMethod) {
              missing.push(method);
            }
          }
        }
      } catch {
        // Method exists but throws, that's expected for base class
      }
    }

    return missing;
  }
}

export default ServicePlugin;
