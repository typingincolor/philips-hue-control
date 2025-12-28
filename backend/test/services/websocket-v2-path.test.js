/**
 * Tests for WebSocket V2 Path Migration
 *
 * Goal: WebSocket should use /api/v2/ws path instead of /api/v1/ws
 * This aligns the WebSocket path with the V2 API path convention.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('WebSocket V2 Path', () => {
  let mockServer;

  beforeEach(() => {
    // Reset module cache to get fresh instance
    vi.resetModules();
    mockServer = {
      on: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use /api/v2/ws path when initialized', async () => {
    // Mock socket.io Server to capture initialization options
    let capturedOptions = null;

    vi.doMock('socket.io', () => ({
      Server: class MockServer {
        constructor(server, options) {
          capturedOptions = options;
        }
        on() {}
      },
    }));

    // Import fresh websocketService
    const { default: websocketService } = await import('../../services/websocketService.js');

    // Initialize the service
    websocketService.initialize(mockServer);

    // Verify the path is V2
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.path).toBe('/api/v2/ws');
  });
});
