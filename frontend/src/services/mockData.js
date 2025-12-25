// Mock data for testing without a Hue bridge

export const mockLights = {
  errors: [],
  data: [
    {
      id: 'light-1',
      on: { on: true },
      dimming: { brightness: 100 },
      color: { xy: { x: 0.6915, y: 0.3083 } }, // Red
      metadata: { name: 'Floor Lamp' },
    },
    {
      id: 'light-2',
      on: { on: true },
      dimming: { brightness: 75 },
      color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue
      metadata: { name: 'TV Backlight' },
    },
    {
      id: 'light-3',
      on: { on: true },
      dimming: { brightness: 50 },
      color: { xy: { x: 0.17, y: 0.7 } }, // Green
      metadata: { name: 'Plant Light' },
    },
    {
      id: 'light-4',
      on: { on: true },
      dimming: { brightness: 25 },
      color: { xy: { x: 0.5016, y: 0.4152 } }, // Orange
      metadata: { name: 'Corner Lamp' },
    },
    {
      id: 'light-5',
      on: { on: true },
      dimming: { brightness: 10 },
      color: { xy: { x: 0.3227, y: 0.329 } }, // Warm White
      metadata: { name: 'Accent' },
    },
    {
      id: 'light-6',
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.329 } },
      metadata: { name: 'Ceiling' },
    },
    {
      id: 'light-7',
      on: { on: true },
      dimming: { brightness: 90 },
      color_temperature: { mirek: 153 }, // Cool white
      metadata: { name: 'Ceiling' },
    },
    {
      id: 'light-8',
      on: { on: true },
      dimming: { brightness: 60 },
      color_temperature: { mirek: 250 }, // Neutral white
      metadata: { name: 'Counter' },
    },
    {
      id: 'light-9',
      on: { on: true },
      dimming: { brightness: 40 },
      color_temperature: { mirek: 400 }, // Warm white
      metadata: { name: 'Under Cabinet' },
    },
    {
      id: 'light-10',
      on: { on: true },
      dimming: { brightness: 80 },
      color: { xy: { x: 0.5614, y: 0.4156 } }, // Yellow
      metadata: { name: 'Ceiling' },
    },
    {
      id: 'light-11',
      on: { on: true },
      dimming: { brightness: 45 },
      color: { xy: { x: 0.2731, y: 0.1601 } }, // Purple
      metadata: { name: 'Bedside Left' },
    },
    {
      id: 'light-12',
      on: { on: false },
      dimming: { brightness: 0 },
      color: { xy: { x: 0.3227, y: 0.329 } },
      metadata: { name: 'Bedside Right' },
    },
    {
      id: 'light-13',
      on: { on: true },
      dimming: { brightness: 5 },
      color: { xy: { x: 0.6915, y: 0.3083 } }, // Red (should look warm)
      metadata: { name: 'Closet' },
    },
    {
      id: 'light-14',
      on: { on: true },
      dimming: { brightness: 15 },
      color: { xy: { x: 0.1532, y: 0.0475 } }, // Blue (should start transitioning)
      metadata: { name: 'Reading' },
    },
  ],
};

export const mockRooms = {
  errors: [],
  data: [
    {
      id: 'room-1',
      metadata: { name: 'Living Room' },
      children: [
        { rid: 'device-1', rtype: 'device' },
        { rid: 'device-2', rtype: 'device' },
      ],
    },
    {
      id: 'room-2',
      metadata: { name: 'Kitchen' },
      children: [{ rid: 'device-3', rtype: 'device' }],
    },
    {
      id: 'room-3',
      metadata: { name: 'Bedroom' },
      children: [
        { rid: 'device-4', rtype: 'device' },
        { rid: 'device-5', rtype: 'device' },
      ],
    },
  ],
};

export const mockDevices = {
  errors: [],
  data: [
    {
      id: 'device-1',
      services: [
        { rid: 'light-1', rtype: 'light' },
        { rid: 'light-2', rtype: 'light' },
        { rid: 'light-3', rtype: 'light' },
      ],
    },
    {
      id: 'device-2',
      services: [
        { rid: 'light-4', rtype: 'light' },
        { rid: 'light-5', rtype: 'light' },
        { rid: 'light-6', rtype: 'light' },
      ],
    },
    {
      id: 'device-3',
      services: [
        { rid: 'light-7', rtype: 'light' },
        { rid: 'light-8', rtype: 'light' },
        { rid: 'light-9', rtype: 'light' },
      ],
    },
    {
      id: 'device-4',
      services: [
        { rid: 'light-10', rtype: 'light' },
        { rid: 'light-11', rtype: 'light' },
        { rid: 'light-12', rtype: 'light' },
      ],
    },
    {
      id: 'device-5',
      services: [
        { rid: 'light-13', rtype: 'light' },
        { rid: 'light-14', rtype: 'light' },
      ],
    },
  ],
};

export const mockScenes = {
  errors: [],
  data: [
    {
      id: 'scene-1',
      metadata: { name: 'Bright' },
      group: { rid: 'room-1' },
    },
    {
      id: 'scene-2',
      metadata: { name: 'Relax' },
      group: { rid: 'room-1' },
    },
    {
      id: 'scene-3',
      metadata: { name: 'Concentrate' },
      group: { rid: 'room-2' },
    },
    {
      id: 'scene-4',
      metadata: { name: 'Nightlight' },
      group: { rid: 'room-3' },
    },
  ],
};

// Mock dashboard data (v1 API format)
export const mockDashboard = {
  summary: {
    totalLights: 35,
    lightsOn: 27,
    roomCount: 10,
    sceneCount: 14,
  },
  zones: [
    {
      id: 'zone-1',
      name: 'Downstairs',
      stats: {
        lightsOnCount: 2,
        totalLights: 3,
        averageBrightness: 95,
      },
      lights: [
        { id: 'light-1', name: 'Floor Lamp', on: true, brightness: 100 },
        { id: 'light-7', name: 'Ceiling', on: true, brightness: 90 },
        { id: 'light-6', name: 'Ceiling', on: false, brightness: 0 },
      ],
      scenes: [
        { id: 'scene-z1-1', name: 'Bright' },
        { id: 'scene-z1-2', name: 'Relax' },
        { id: 'scene-z1-3', name: 'Evening' },
        { id: 'scene-z1-4', name: 'Dimmed' },
        { id: 'scene-z1-5', name: 'Nightlight' },
        { id: 'scene-z1-6', name: 'Energize' },
      ],
    },
    {
      id: 'zone-2',
      name: 'Upstairs',
      stats: {
        lightsOnCount: 0,
        totalLights: 2,
        averageBrightness: 0,
      },
      lights: [
        { id: 'light-12', name: 'Bedside Right', on: false, brightness: 0 },
        { id: 'light-6', name: 'Ceiling', on: false, brightness: 0 },
      ],
      scenes: [
        { id: 'scene-z2-1', name: 'Morning' },
        { id: 'scene-z2-2', name: 'Daytime' },
        { id: 'scene-z2-3', name: 'Concentrate' },
        { id: 'scene-z2-4', name: 'Read' },
        { id: 'scene-z2-5', name: 'Relax' },
        { id: 'scene-z2-6', name: 'Rest' },
      ],
    },
    {
      id: 'zone-3',
      name: 'Dining room lamps',
      stats: {
        lightsOnCount: 3,
        totalLights: 3,
        averageBrightness: 68,
      },
      lights: [
        { id: 'light-2', name: 'TV Backlight', on: true, brightness: 75 },
        { id: 'light-3', name: 'Plant Light', on: true, brightness: 50 },
        { id: 'light-10', name: 'Ceiling', on: true, brightness: 80 },
      ],
      scenes: [
        { id: 'scene-z3-1', name: 'Dinner' },
        { id: 'scene-z3-2', name: 'Romantic' },
        { id: 'scene-z3-3', name: 'Party' },
        { id: 'scene-z3-4', name: 'Bright' },
        { id: 'scene-z3-5', name: 'Cozy' },
        { id: 'scene-z3-6', name: 'Movie' },
      ],
    },
  ],
  motionZones: [
    { id: 'motion-1', name: 'Living Room', motionDetected: false, enabled: true, reachable: true },
    { id: 'motion-2', name: 'Kitchen', motionDetected: false, enabled: true, reachable: true },
    { id: 'motion-3', name: 'Hallway', motionDetected: false, enabled: true, reachable: true },
    { id: 'motion-4', name: 'Garage', motionDetected: false, enabled: true, reachable: true },
  ],
  rooms: [
    {
      id: 'room-1',
      name: 'Living Room',
      stats: {
        lightsOnCount: 7,
        totalLights: 8,
        averageBrightness: 58,
      },
      lights: [
        {
          id: 'light-1',
          name: 'Floor Lamp',
          on: true,
          brightness: 100,
          color: 'rgb(255, 120, 100)',
          shadow: '0 0 30px rgba(255, 120, 100, 0.6)',
        },
        {
          id: 'light-2',
          name: 'TV Backlight',
          on: true,
          brightness: 75,
          color: 'rgb(100, 120, 255)',
          shadow: '0 0 25px rgba(100, 120, 255, 0.5)',
        },
        {
          id: 'light-3',
          name: 'Plant Light',
          on: true,
          brightness: 50,
          color: 'rgb(120, 255, 120)',
          shadow: '0 0 20px rgba(120, 255, 120, 0.4)',
        },
        {
          id: 'light-4',
          name: 'Corner Lamp',
          on: true,
          brightness: 25,
          color: 'rgb(255, 200, 130)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        {
          id: 'light-5',
          name: 'Accent',
          on: true,
          brightness: 10,
          color: 'rgb(255, 200, 130)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        { id: 'light-6', name: 'Ceiling', on: false, brightness: 0, color: null, shadow: null },
        {
          id: 'light-lr-7',
          name: 'Bookshelf',
          on: true,
          brightness: 65,
          color: 'rgb(255, 180, 120)',
          shadow: '0 0 22px rgba(255, 180, 120, 0.52)',
        },
        {
          id: 'light-lr-8',
          name: 'Reading',
          on: true,
          brightness: 80,
          color: 'rgb(255, 245, 230)',
          shadow: '0 0 26px rgba(255, 245, 230, 0.6)',
        },
      ],
      scenes: [
        { id: 'scene-1', name: 'Bright' },
        { id: 'scene-2', name: 'Relax' },
      ],
    },
    {
      id: 'room-2',
      name: 'Kitchen',
      stats: {
        lightsOnCount: 3,
        totalLights: 3,
        averageBrightness: 63,
      },
      lights: [
        {
          id: 'light-7',
          name: 'Ceiling',
          on: true,
          brightness: 90,
          color: 'rgb(220, 230, 255)',
          shadow: '0 0 28px rgba(220, 230, 255, 0.56)',
        },
        {
          id: 'light-8',
          name: 'Counter',
          on: true,
          brightness: 60,
          color: 'rgb(255, 240, 220)',
          shadow: '0 0 22px rgba(255, 240, 220, 0.44)',
        },
        {
          id: 'light-9',
          name: 'Under Cabinet',
          on: true,
          brightness: 40,
          color: 'rgb(255, 220, 180)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      ],
      scenes: [{ id: 'scene-3', name: 'Concentrate' }],
    },
    {
      id: 'room-10',
      name: 'Dining Room',
      stats: {
        lightsOnCount: 3,
        totalLights: 3,
        averageBrightness: 65,
      },
      lights: [
        {
          id: 'light-33',
          name: 'Chandelier',
          on: true,
          brightness: 75,
          color: 'rgb(255, 220, 180)',
          shadow: '0 0 25px rgba(255, 220, 180, 0.5)',
        },
        {
          id: 'light-34',
          name: 'Wall Sconce L',
          on: true,
          brightness: 60,
          color: 'rgb(255, 210, 160)',
          shadow: '0 0 22px rgba(255, 210, 160, 0.44)',
        },
        {
          id: 'light-35',
          name: 'Wall Sconce R',
          on: true,
          brightness: 60,
          color: 'rgb(255, 210, 160)',
          shadow: '0 0 22px rgba(255, 210, 160, 0.44)',
        },
      ],
      scenes: [
        { id: 'scene-13', name: 'Dinner' },
        { id: 'scene-14', name: 'Romantic' },
      ],
    },
    {
      id: 'room-3',
      name: 'Bedroom',
      stats: {
        lightsOnCount: 3,
        totalLights: 5,
        averageBrightness: 47,
      },
      lights: [
        {
          id: 'light-10',
          name: 'Ceiling',
          on: true,
          brightness: 80,
          color: 'rgb(255, 230, 120)',
          shadow: '0 0 26px rgba(255, 230, 120, 0.52)',
        },
        {
          id: 'light-11',
          name: 'Bedside Left',
          on: true,
          brightness: 45,
          color: 'rgb(200, 150, 255)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        {
          id: 'light-12',
          name: 'Bedside Right',
          on: false,
          brightness: 0,
          color: null,
          shadow: null,
        },
        {
          id: 'light-13',
          name: 'Closet',
          on: true,
          brightness: 5,
          color: 'rgb(255, 200, 130)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        {
          id: 'light-14',
          name: 'Reading',
          on: true,
          brightness: 15,
          color: 'rgb(255, 200, 130)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      ],
      scenes: [{ id: 'scene-4', name: 'Nightlight' }],
    },
    {
      id: 'room-4',
      name: 'Office',
      stats: {
        lightsOnCount: 2,
        totalLights: 3,
        averageBrightness: 85,
      },
      lights: [
        {
          id: 'light-15',
          name: 'Desk Light',
          on: true,
          brightness: 100,
          color: 'rgb(255, 250, 240)',
          shadow: '0 0 30px rgba(255, 250, 240, 0.6)',
        },
        {
          id: 'light-16',
          name: 'Monitor Bias',
          on: true,
          brightness: 70,
          color: 'rgb(180, 200, 255)',
          shadow: '0 0 24px rgba(180, 200, 255, 0.48)',
        },
        {
          id: 'light-17',
          name: 'Corner Lamp',
          on: false,
          brightness: 0,
          color: null,
          shadow: null,
        },
      ],
      scenes: [
        { id: 'scene-5', name: 'Work' },
        { id: 'scene-6', name: 'Meeting' },
      ],
    },
    {
      id: 'room-5',
      name: "Homer's Office",
      stats: {
        lightsOnCount: 2,
        totalLights: 2,
        averageBrightness: 55,
      },
      lights: [
        {
          id: 'light-18',
          name: 'Ceiling',
          on: true,
          brightness: 65,
          color: 'rgb(255, 230, 180)',
          shadow: '0 0 24px rgba(255, 230, 180, 0.48)',
        },
        {
          id: 'light-19',
          name: 'Reading Lamp',
          on: true,
          brightness: 45,
          color: 'rgb(255, 210, 160)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      ],
      scenes: [{ id: 'scene-7', name: 'Donut Time' }],
    },
    {
      id: 'room-6',
      name: "Bart's Room",
      stats: {
        lightsOnCount: 3,
        totalLights: 4,
        averageBrightness: 72,
      },
      lights: [
        {
          id: 'light-20',
          name: 'Ceiling',
          on: true,
          brightness: 80,
          color: 'rgb(255, 180, 100)',
          shadow: '0 0 26px rgba(255, 180, 100, 0.52)',
        },
        {
          id: 'light-21',
          name: 'Lava Lamp',
          on: true,
          brightness: 60,
          color: 'rgb(255, 100, 150)',
          shadow: '0 0 22px rgba(255, 100, 150, 0.44)',
        },
        {
          id: 'light-22',
          name: 'Desk',
          on: true,
          brightness: 75,
          color: 'rgb(100, 200, 255)',
          shadow: '0 0 25px rgba(100, 200, 255, 0.5)',
        },
        { id: 'light-23', name: 'Closet', on: false, brightness: 0, color: null, shadow: null },
      ],
      scenes: [{ id: 'scene-8', name: 'Skateboard' }],
    },
    {
      id: 'room-7',
      name: 'Maggie Room',
      stats: {
        lightsOnCount: 2,
        totalLights: 3,
        averageBrightness: 25,
      },
      lights: [
        {
          id: 'light-24',
          name: 'Night Light',
          on: true,
          brightness: 15,
          color: 'rgb(255, 200, 220)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        {
          id: 'light-25',
          name: 'Mobile Light',
          on: true,
          brightness: 35,
          color: 'rgb(200, 220, 255)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        { id: 'light-26', name: 'Ceiling', on: false, brightness: 0, color: null, shadow: null },
      ],
      scenes: [
        { id: 'scene-9', name: 'Nap Time' },
        { id: 'scene-10', name: 'Play Time' },
      ],
    },
    {
      id: 'room-8',
      name: "Marge's Office",
      stats: {
        lightsOnCount: 2,
        totalLights: 2,
        averageBrightness: 78,
      },
      lights: [
        {
          id: 'light-27',
          name: 'Vanity',
          on: true,
          brightness: 85,
          color: 'rgb(255, 245, 235)',
          shadow: '0 0 27px rgba(255, 245, 235, 0.54)',
        },
        {
          id: 'light-28',
          name: 'Desk Lamp',
          on: true,
          brightness: 70,
          color: 'rgb(255, 235, 200)',
          shadow: '0 0 24px rgba(255, 235, 200, 0.48)',
        },
      ],
      scenes: [{ id: 'scene-11', name: 'Creative' }],
    },
    {
      id: 'room-9',
      name: 'Landing',
      stats: {
        lightsOnCount: 2,
        totalLights: 4,
        averageBrightness: 40,
      },
      lights: [
        {
          id: 'light-29',
          name: 'Hall Ceiling',
          on: true,
          brightness: 50,
          color: 'rgb(255, 240, 220)',
          shadow: '0 0 20px rgba(255, 240, 220, 0.4)',
        },
        {
          id: 'light-30',
          name: 'Stair Light',
          on: true,
          brightness: 30,
          color: 'rgb(255, 220, 180)',
          shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        { id: 'light-31', name: 'Window', on: false, brightness: 0, color: null, shadow: null },
        { id: 'light-32', name: 'Accent', on: false, brightness: 0, color: null, shadow: null },
      ],
      scenes: [{ id: 'scene-12', name: 'Welcome' }],
    },
  ],
};
