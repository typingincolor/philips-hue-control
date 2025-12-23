import { describe, it, expect, vi, beforeEach } from 'vitest';
import dashboardService from '../../services/dashboardService.js';
import hueClient from '../../services/hueClient.js';
import motionService from '../../services/motionService.js';
import zoneService from '../../services/zoneService.js';

// Mock dependencies
vi.mock('../../services/hueClient.js');
vi.mock('../../services/motionService.js');
vi.mock('../../services/zoneService.js');

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
      hueClient.getZones.mockResolvedValue({ data: [] });
      motionService.getMotionZones.mockResolvedValue({ zones: mockMotionZones });
      zoneService.buildZoneHierarchy.mockReturnValue({});

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
      hueClient.getZones.mockResolvedValue({ data: [] });
      motionService.getMotionZones.mockResolvedValue({ zones: [] });
      zoneService.buildZoneHierarchy.mockReturnValue({});

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
      hueClient.getZones.mockResolvedValue({ data: [] });
      motionService.getMotionZones.mockRejectedValue(new Error('Motion service failed'));
      zoneService.buildZoneHierarchy.mockReturnValue({});

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
      hueClient.getZones.mockResolvedValue({ data: [] });
      motionService.getMotionZones.mockResolvedValue({ zones: mockMotionZones });
      zoneService.buildZoneHierarchy.mockReturnValue({});

      // Act
      await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert - verify motion zones were fetched
      expect(motionService.getMotionZones).toHaveBeenCalled();
    });

    // Zone tests
    const mockZonesData = {
      data: [
        {
          id: 'zone-1',
          metadata: { name: 'Upstairs' },
          children: [{ rid: 'light-1', rtype: 'light' }]
        },
        {
          id: 'zone-2',
          metadata: { name: 'Downstairs' },
          children: [{ rid: 'light-1', rtype: 'light' }]
        }
      ]
    };

    const mockZoneMap = {
      'Upstairs': {
        zoneUuid: 'zone-1',
        lightUuids: ['light-1'],
        lights: [{ id: 'light-1', on: { on: true }, metadata: { name: 'Light 1' } }]
      },
      'Downstairs': {
        zoneUuid: 'zone-2',
        lightUuids: ['light-1'],
        lights: [{ id: 'light-1', on: { on: true }, metadata: { name: 'Light 1' } }]
      }
    };

    it('should include zones in dashboard response', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      hueClient.getZones.mockResolvedValue(mockZonesData);
      motionService.getMotionZones.mockResolvedValue({ zones: [] });
      zoneService.buildZoneHierarchy.mockReturnValue(mockZoneMap);
      zoneService.calculateZoneStats.mockReturnValue({ lightsOnCount: 1, totalLights: 1, averageBrightness: 100 });
      zoneService.getScenesForZone.mockReturnValue([]);

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert
      expect(result).toHaveProperty('zones');
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0].name).toBe('Upstairs');
      expect(result.zones[1].name).toBe('Downstairs');
    });

    it('should include empty zones array when no zones exist', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      hueClient.getZones.mockResolvedValue({ data: [] });
      motionService.getMotionZones.mockResolvedValue({ zones: [] });
      zoneService.buildZoneHierarchy.mockReturnValue({});

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert
      expect(result).toHaveProperty('zones');
      expect(result.zones).toEqual([]);
    });

    it('should handle zones fetch error gracefully', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      hueClient.getZones.mockRejectedValue(new Error('Zones fetch failed'));
      motionService.getMotionZones.mockResolvedValue({ zones: [] });

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert - should return empty array on error
      expect(result).toHaveProperty('zones');
      expect(result.zones).toEqual([]);
    });

    it('should include zone stats and scenes', async () => {
      // Arrange
      hueClient.getLights.mockResolvedValue(mockLightsData);
      hueClient.getRooms.mockResolvedValue(mockRoomsData);
      hueClient.getDevices.mockResolvedValue(mockDevicesData);
      hueClient.getScenes.mockResolvedValue(mockScenesData);
      hueClient.getZones.mockResolvedValue(mockZonesData);
      motionService.getMotionZones.mockResolvedValue({ zones: [] });
      zoneService.buildZoneHierarchy.mockReturnValue({
        'Upstairs': {
          zoneUuid: 'zone-1',
          lightUuids: ['light-1'],
          lights: [{ id: 'light-1', on: { on: true }, dimming: { brightness: 80 } }]
        }
      });
      zoneService.calculateZoneStats.mockReturnValue({ lightsOnCount: 1, totalLights: 1, averageBrightness: 80 });
      zoneService.getScenesForZone.mockReturnValue([{ id: 'scene-1', name: 'Bright' }]);

      // Act
      const result = await dashboardService.getDashboard('192.168.1.100', 'test-username');

      // Assert
      expect(result.zones[0]).toHaveProperty('stats');
      expect(result.zones[0].stats.lightsOnCount).toBe(1);
      expect(result.zones[0]).toHaveProperty('scenes');
      expect(result.zones[0].scenes).toHaveLength(1);
    });
  });
});
