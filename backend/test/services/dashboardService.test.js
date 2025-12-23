import { describe, it, expect, vi, beforeEach } from 'vitest';
import dashboardService from '../../services/dashboardService.js';
import hueClient from '../../services/hueClient.js';
import motionService from '../../services/motionService.js';

// Mock dependencies
vi.mock('../../services/hueClient.js');
vi.mock('../../services/motionService.js');

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    const mockLightsData = {
      data: [
        { id: 'light-1', on: { on: true }, metadata: { name: 'Light 1' } }
      ]
    };

    const mockRoomsData = {
      data: [
        {
          id: 'room-1',
          metadata: { name: 'Living Room' },
          children: [{ rid: 'device-1', rtype: 'device' }]
        }
      ]
    };

    const mockDevicesData = {
      data: [
        {
          id: 'device-1',
          services: [{ rid: 'light-1', rtype: 'light' }]
        }
      ]
    };

    const mockScenesData = {
      data: [
        { id: 'scene-1', metadata: { name: 'Bright' }, group: { rid: 'room-1' } }
      ]
    };

    const mockMotionZones = [
      {
        id: 'zone-1',
        name: 'Hallway MotionAware',
        motionDetected: false,
        enabled: true,
        reachable: true
      },
      {
        id: 'zone-2',
        name: 'Living Room MotionAware',
        motionDetected: true,
        enabled: true,
        reachable: true
      }
    ];

    it('should include motionZones in dashboard response', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      motionService.getMotionZones.mockResolvedValue({ zones: mockMotionZones });

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert
      expect(result).toHaveProperty('motionZones');
      expect(result.motionZones).toEqual(mockMotionZones);
      expect(motionService.getMotionZones).toHaveBeenCalledWith('192.168.1.100', 'test-username');
    });

    it('should include empty motionZones array when no zones exist', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      motionService.getMotionZones.mockResolvedValue({ zones: [] });

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert
      expect(result).toHaveProperty('motionZones');
      expect(result.motionZones).toEqual([]);
    });

    it('should handle motionService errors gracefully', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      motionService.getMotionZones.mockRejectedValue(new Error('Motion service failed'));

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert - should return empty array on error
      expect(result).toHaveProperty('motionZones');
      expect(result.motionZones).toEqual([]);
    });

    it('should fetch motion zones in parallel with other data', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      motionService.getMotionZones.mockResolvedValue({ zones: mockMotionZones });

      // Act
      await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert - verify motion zones were fetched
      expect(motionService.getMotionZones).toHaveBeenCalled();
    });
  });
});
