/**
 * OpenAPI 3.0 Specification for Hue Control API v1
 */
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Philips Hue Control API',
    version: '1.0.0',
    description: `
      A simplified, client-friendly API for controlling Philips Hue lights.

      **Features:**
      - Pre-computed RGB colors and CSS shadows
      - Unified dashboard endpoint (1 call instead of 4-6)
      - Room hierarchy already built
      - Session-based authentication
      - Header-based or query parameter auth

      **Authentication Methods:**
      1. **Session Token** (recommended): Get a session token from \`POST /api/v1/auth/session\`, then use \`Authorization: Bearer <token>\` header
      2. **Headers**: Use \`X-Bridge-IP\` and \`X-Hue-Username\` headers
      3. **Query Params** (legacy): Use \`bridgeIp\` and \`username\` query parameters
    `,
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Session Token',
        description: 'Session token from POST /api/v1/auth/session'
      },
      HeaderAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Bridge-IP',
        description: 'Bridge IP address (combine with X-Hue-Username header)'
      },
      QueryAuth: {
        type: 'apiKey',
        in: 'query',
        name: 'bridgeIp',
        description: 'Bridge IP address (combine with username query param)'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'resource_not_found'
          },
          message: {
            type: 'string',
            example: 'The light \'abc123\' was not found'
          },
          suggestion: {
            type: 'string',
            example: 'Check the light ID or refresh the dashboard to get current lights'
          }
        }
      },
      Light: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'abc-123-def'
          },
          name: {
            type: 'string',
            example: 'Living Room 1'
          },
          on: {
            type: 'boolean',
            example: true
          },
          brightness: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 80
          },
          color: {
            type: 'string',
            nullable: true,
            example: 'rgb(255, 180, 120)',
            description: 'Pre-computed CSS color string (ready to use!)'
          },
          shadow: {
            type: 'string',
            nullable: true,
            example: '0 0 20px rgba(255, 180, 120, 0.4)',
            description: 'Pre-computed CSS box-shadow (ready to use!)'
          },
          colorSource: {
            type: 'string',
            enum: ['xy', 'temperature', 'fallback', null],
            example: 'xy'
          }
        }
      },
      Room: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'room-uuid'
          },
          name: {
            type: 'string',
            example: 'Living Room'
          },
          stats: {
            type: 'object',
            properties: {
              lightsOnCount: { type: 'integer', example: 2 },
              totalLights: { type: 'integer', example: 4 },
              averageBrightness: { type: 'number', example: 75.5 }
            }
          },
          lights: {
            type: 'array',
            items: { $ref: '#/components/schemas/Light' }
          },
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/auth/session': {
      post: {
        summary: 'Create a new session',
        description: 'Connect to your Hue Bridge and get a session token for subsequent requests',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bridgeIp', 'username'],
                properties: {
                  bridgeIp: {
                    type: 'string',
                    example: '192.168.1.100',
                    description: 'Your Hue Bridge IP address'
                  },
                  username: {
                    type: 'string',
                    example: 'abc123def456',
                    description: 'Your Hue API username/key'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Session created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionToken: {
                      type: 'string',
                      example: 'hue_sess_abc123...'
                    },
                    expiresIn: {
                      type: 'integer',
                      example: 86400,
                      description: 'Session expires in seconds (24 hours)'
                    },
                    bridgeIp: {
                      type: 'string',
                      example: '192.168.1.100'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '503': {
            description: 'Cannot connect to bridge',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      },
      get: {
        summary: 'Get current session info',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Session info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bridgeIp: { type: 'string', example: '192.168.1.100' },
                    active: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid or expired session',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      },
      delete: {
        summary: 'Revoke session (logout)',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Session revoked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Session revoked' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dashboard': {
      get: {
        summary: 'Get unified dashboard data',
        description: 'Returns all data needed to render the dashboard in a single request with pre-computed colors and stats',
        tags: ['Dashboard'],
        security: [
          { BearerAuth: [] },
          { HeaderAuth: [] },
          { QueryAuth: [] }
        ],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'object',
                      properties: {
                        totalLights: { type: 'integer', example: 12 },
                        lightsOn: { type: 'integer', example: 5 },
                        roomCount: { type: 'integer', example: 4 },
                        sceneCount: { type: 'integer', example: 8 }
                      }
                    },
                    rooms: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Room' }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Missing or invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/lights/{id}': {
      put: {
        summary: 'Update a light',
        tags: ['Lights'],
        security: [{ BearerAuth: [] }, { HeaderAuth: [] }, { QueryAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Light UUID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  on: { type: 'boolean', example: true },
                  brightness: { type: 'number', minimum: 0, maximum: 100, example: 80 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Light updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    light: { $ref: '#/components/schemas/Light' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Light not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/motion-zones': {
      get: {
        summary: 'Get motion zones',
        description: 'Returns all MotionAware zones with parsed motion status',
        tags: ['Motion'],
        security: [{ BearerAuth: [] }, { HeaderAuth: [] }, { QueryAuth: [] }],
        responses: {
          '200': {
            description: 'Motion zones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    zones: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string', example: 'Hallway MotionAware' },
                          motionDetected: { type: 'boolean', example: false },
                          enabled: { type: 'boolean', example: true },
                          reachable: { type: 'boolean', example: true },
                          lastChanged: { type: 'string', example: '2025-12-23T10:30:00Z' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'Authentication', description: 'Session management' },
    { name: 'Dashboard', description: 'Unified dashboard data' },
    { name: 'Lights', description: 'Light control' },
    { name: 'Motion', description: 'MotionAware zones' }
  ]
};
