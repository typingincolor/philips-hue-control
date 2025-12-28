import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import roomMappingService from '../../services/roomMappingService.js';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

describe('roomMappingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomMappingService.reset(); // Reset internal state
  });

  describe('initialization', () => {
    it('should load mappings from file if exists', () => {
      const savedMappings = {
        'hue:room-1': 'home-room-1',
        'hue:room-2': 'home-room-2',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(savedMappings));

      roomMappingService.initialize();

      expect(roomMappingService.getHomeRoomId('hue', 'room-1')).toBe('home-room-1');
    });

    it('should start with empty mappings if file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      roomMappingService.initialize();

      expect(roomMappingService.getAllMappings()).toEqual({});
    });
  });

  describe('mapServiceRoom', () => {
    it('should create a new mapping for unknown service room', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      const homeRoomId = roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');

      expect(homeRoomId).toBeDefined();
      expect(typeof homeRoomId).toBe('string');
      expect(roomMappingService.getHomeRoomId('hue', 'room-1')).toBe(homeRoomId);
    });

    it('should return existing mapping for known service room', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      const firstId = roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');
      const secondId = roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');

      expect(firstId).toBe(secondId);
    });

    it('should persist mappings to file on create', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('getHomeRoomId', () => {
    it('should return null for unmapped service room', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      const result = roomMappingService.getHomeRoomId('hue', 'unknown-room');

      expect(result).toBeNull();
    });

    it('should return home room ID for mapped service room', () => {
      const savedMappings = {
        'hue:room-1': 'home-living-room',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(savedMappings));

      roomMappingService.initialize();

      expect(roomMappingService.getHomeRoomId('hue', 'room-1')).toBe('home-living-room');
    });
  });

  describe('getServiceRoomIds', () => {
    it('should return all service room IDs mapped to a home room', () => {
      const savedMappings = {
        'hue:room-1': 'home-living-room',
        'other:room-a': 'home-living-room',
        'hue:room-2': 'home-kitchen',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(savedMappings));

      roomMappingService.initialize();

      const serviceRoomIds = roomMappingService.getServiceRoomIds('home-living-room');

      expect(serviceRoomIds).toHaveLength(2);
      expect(serviceRoomIds).toContainEqual({ serviceId: 'hue', roomId: 'room-1' });
      expect(serviceRoomIds).toContainEqual({ serviceId: 'other', roomId: 'room-a' });
    });

    it('should return empty array for home room with no mappings', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      const serviceRoomIds = roomMappingService.getServiceRoomIds('unknown-home-room');

      expect(serviceRoomIds).toEqual([]);
    });
  });

  describe('mergeRooms', () => {
    it('should merge multiple service rooms into one home room', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      // Create initial separate mappings
      const homeRoom1 = roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');
      roomMappingService.mapServiceRoom('other', 'room-a', 'Lounge');

      // Merge them
      roomMappingService.mergeRooms(['hue:room-1', 'other:room-a'], homeRoom1);

      // Both should now map to the same home room
      expect(roomMappingService.getHomeRoomId('hue', 'room-1')).toBe(homeRoom1);
      expect(roomMappingService.getHomeRoomId('other', 'room-a')).toBe(homeRoom1);
    });

    it('should persist merged mappings', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();
      fs.writeFileSync.mockClear();

      roomMappingService.mergeRooms(['hue:room-1', 'other:room-a'], 'merged-room');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('deleteMapping', () => {
    it('should remove a service room mapping', () => {
      const savedMappings = {
        'hue:room-1': 'home-room-1',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(savedMappings));

      roomMappingService.initialize();

      roomMappingService.deleteMapping('hue', 'room-1');

      expect(roomMappingService.getHomeRoomId('hue', 'room-1')).toBeNull();
    });
  });

  describe('getRoomName', () => {
    it('should return stored room name', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');

      expect(roomMappingService.getRoomName('hue', 'room-1')).toBe('Living Room');
    });

    it('should allow renaming a room', () => {
      fs.existsSync.mockReturnValue(false);
      roomMappingService.initialize();

      const homeRoomId = roomMappingService.mapServiceRoom('hue', 'room-1', 'Living Room');
      roomMappingService.setRoomName(homeRoomId, 'Family Room');

      expect(roomMappingService.getRoomNameById(homeRoomId)).toBe('Family Room');
    });
  });
});
