import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { hueApi } from './hueApi';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios };
});

describe('hueApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('discoverBridge', () => {
    it('should return bridge data on success', async () => {
      const mockBridges = [{ id: 'bridge-1', internalipaddress: '192.168.1.100' }];
      axios.get.mockResolvedValue({ data: mockBridges });

      const result = await hueApi.discoverBridge();

      expect(axios.get).toHaveBeenCalledWith('/discovery');
      expect(result).toEqual(mockBridges);
    });

    it('should throw user-friendly error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(hueApi.discoverBridge()).rejects.toThrow(
        'Could not discover bridges. Please enter IP manually.'
      );
    });
  });
});
