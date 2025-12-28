import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getServices,
  getService,
  connectService,
  disconnectService,
  getServiceStatus,
  pairHue,
  verifyHive2fa,
  getHiveSchedules,
} from './servicesApi';

describe('servicesApi', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getServices', () => {
    it('should fetch all services', async () => {
      const mockServices = {
        services: [
          { id: 'hue', displayName: 'Philips Hue' },
          { id: 'hive', displayName: 'Hive Heating' },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServices),
      });

      const result = await getServices();

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockServices);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

      await getServices(true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
      });
    });

    it('should throw on error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getServices()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getService', () => {
    it('should fetch a single service by ID', async () => {
      const mockService = {
        id: 'hue',
        displayName: 'Philips Hue',
        connected: true,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockService),
      });

      const result = await getService('hue');

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockService);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getService('hive', true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
      });
    });
  });

  describe('connectService', () => {
    it('should connect to a service with credentials', async () => {
      const mockResponse = { success: true, sessionToken: 'token123' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await connectService('hue', { bridgeIp: '192.168.1.100' });

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: '192.168.1.100' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle requires2fa response', async () => {
      const mockResponse = { requires2fa: true, session: 'session123' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await connectService('hive', { username: 'user', password: 'pass' });

      expect(result).toEqual(mockResponse);
    });

    it('should handle requiresPairing response', async () => {
      const mockResponse = { requiresPairing: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await connectService('hue', { bridgeIp: '192.168.1.100' });

      expect(result).toEqual(mockResponse);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await connectService('hue', { bridgeIp: '192.168.1.100' }, true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
        body: JSON.stringify({ bridgeIp: '192.168.1.100' }),
      });
    });
  });

  describe('disconnectService', () => {
    it('should disconnect from a service', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await disconnectService('hue');

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await disconnectService('hive', true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
      });
    });
  });

  describe('getServiceStatus', () => {
    it('should fetch service status', async () => {
      const mockStatus = {
        heating: { currentTemperature: 20, targetTemperature: 21 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await getServiceStatus('hive');

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockStatus);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getServiceStatus('hue', true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
      });
    });

    it('should throw on 401 not connected', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(getServiceStatus('hive')).rejects.toThrow('HTTP error! status: 401');
    });
  });

  describe('pairHue', () => {
    it('should call pair endpoint with bridgeIp', async () => {
      const mockResponse = { success: true, username: 'generated-user' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await pairHue('192.168.1.100');

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeIp: '192.168.1.100' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await pairHue('192.168.1.100', true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hue/pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
        body: JSON.stringify({ bridgeIp: '192.168.1.100' }),
      });
    });

    it('should throw on pairing error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(pairHue('192.168.1.100')).rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('verifyHive2fa', () => {
    it('should call verify-2fa endpoint with code, session, and username', async () => {
      const mockResponse = { success: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyHive2fa('123456', 'session-id', 'user@email.com');

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '123456', session: 'session-id', username: 'user@email.com' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await verifyHive2fa('123456', 'session-id', 'user@email.com', true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
        body: JSON.stringify({ code: '123456', session: 'session-id', username: 'user@email.com' }),
      });
    });

    it('should throw on invalid code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(verifyHive2fa('000000', 'session-id', 'user@email.com')).rejects.toThrow(
        'HTTP error! status: 401'
      );
    });
  });

  describe('getHiveSchedules', () => {
    it('should fetch schedules from Hive', async () => {
      const mockSchedules = [
        { day: 'Monday', slots: [{ start: '06:00', end: '09:00', temperature: 20 }] },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchedules),
      });

      const result = await getHiveSchedules();

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/schedules', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockSchedules);
    });

    it('should include demo mode header when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getHiveSchedules(true);

      expect(global.fetch).toHaveBeenCalledWith('/api/v2/services/hive/schedules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
      });
    });
  });
});
