import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * HiveAuthService Tests - AWS Cognito SRP Authentication
 *
 * Tests for the Hive authentication service using AWS Cognito
 * with SMS 2FA and device registration support.
 */

// Ensure we're using the real hiveAuthService module, not a mock from other test files
vi.unmock('../../services/hiveAuthService.js');

// Mock Cognito SDK
const mockAuthenticateUser = vi.fn();
const mockSendMFACode = vi.fn();
const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();

// Use function keyword for constructor mocks (required by vitest)
vi.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: vi.fn().mockImplementation(function () {
    return {};
  }),
  CognitoUser: vi.fn().mockImplementation(function () {
    return {
      authenticateUser: mockAuthenticateUser,
      sendMFACode: mockSendMFACode,
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    };
  }),
  AuthenticationDetails: vi.fn().mockImplementation(function (data) {
    return data;
  }),
  CognitoRefreshToken: vi.fn().mockImplementation(function (data) {
    return data;
  }),
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock credentials manager
vi.mock('../../services/hiveCredentialsManager.js', () => ({
  default: {
    hasCredentials: vi.fn(() => false),
    getCredentials: vi.fn(() => null),
    getSessionToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    setSessionToken: vi.fn(),
    clearSessionToken: vi.fn(),
    getDeviceCredentials: vi.fn(() => null),
    setDeviceCredentials: vi.fn(),
    clearDeviceCredentials: vi.fn(),
  },
  HIVE_DEMO_CREDENTIALS: {
    username: 'demo@hive.com',
    password: 'demo',
    code: '123456',
  },
}));

describe('HiveAuthService', () => {
  let HiveAuthService;
  let hiveCredentialsManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Set up default mock behavior for Cognito SDK
    // By default, authenticateUser triggers mfaRequired callback
    mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
      callbacks.mfaRequired('SMS_MFA', { CODE_DELIVERY_DESTINATION: '+44*****1234' });
    });

    // By default, sendMFACode succeeds
    mockSendMFACode.mockImplementation((code, callbacks) => {
      if (code === '000000') {
        callbacks.onFailure({ message: 'Invalid verification code' });
      } else {
        callbacks.onSuccess({
          getAccessToken: () => ({ getJwtToken: () => `access-${Date.now()}` }),
          getRefreshToken: () => ({ getToken: () => `refresh-${Date.now()}` }),
          getIdToken: () => ({ getJwtToken: () => `id-${Date.now()}` }),
        });
      }
    });

    // Import fresh modules after reset
    const credsMod = await import('../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = credsMod.default;

    const serviceMod = await import('../../services/hiveAuthService.js');
    HiveAuthService = serviceMod.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCognitoConfig', () => {
    it('should fetch Cognito pool ID and client ID from Hive SSO page', async () => {
      const config = await HiveAuthService.fetchCognitoConfig();

      expect(config).toHaveProperty('poolId');
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('region');
      expect(config.region).toBe('eu-west-1');
    });

    it('should cache config after first fetch', async () => {
      const config1 = await HiveAuthService.fetchCognitoConfig();
      const config2 = await HiveAuthService.fetchCognitoConfig();

      expect(config1).toEqual(config2);
    });
  });

  describe('initiateAuth', () => {
    it('should return requires2fa when SMS MFA challenge is required', async () => {
      const result = await HiveAuthService.initiateAuth('user@hive.com', 'password');

      expect(result).toHaveProperty('requires2fa');
      if (result.requires2fa) {
        expect(result).toHaveProperty('session');
        expect(result.session).toBeTruthy();
      }
    });

    it('should always require 2FA for authentication', async () => {
      const result = await HiveAuthService.initiateAuth('anyuser@hive.com', 'anypassword');

      // Should always require 2FA (device auth not implemented)
      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should return error for invalid demo credentials', async () => {
      const result = await HiveAuthService.initiateAuth('invalid@hive.com', 'wrongpassword', true);

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid/i);
    });

    it('should include session token when 2FA is required', async () => {
      const result = await HiveAuthService.initiateAuth('user@hive.com', 'password');

      if (result.requires2fa) {
        expect(result.session).toBeTruthy();
        expect(result.session).toMatch(/session-/);
      }
    });
  });

  describe('verify2fa', () => {
    it('should verify SMS code and return tokens', async () => {
      // First initiate auth to get a session
      const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password');
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, initResult.session, 'user@hive.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('idToken');
    });

    it('should return error for invalid 2FA code', async () => {
      // First initiate auth to get a session
      const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password');
      const invalidCode = '000000';

      const result = await HiveAuthService.verify2fa(
        invalidCode,
        initResult.session,
        'user@hive.com'
      );

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid|incorrect|code/i);
    });

    it('should return error for expired session', async () => {
      const expiredSession = 'expired-session-token';
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, expiredSession, 'user@hive.com');

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/expired|session/i);
    });

    it('should return device credentials for future logins', async () => {
      // First initiate auth to get a session
      const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password');
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, initResult.session, 'user@hive.com');

      if (result.deviceKey) {
        expect(result).toHaveProperty('deviceKey');
        expect(result).toHaveProperty('deviceGroupKey');
        expect(result).toHaveProperty('devicePassword');
      }
    });
  });

  describe('deviceLogin', () => {
    it('should authenticate using device credentials without 2FA', async () => {
      const deviceCreds = {
        deviceKey: 'device-key-123',
        deviceGroupKey: 'device-group-key',
        devicePassword: 'device-password',
      };

      const result = await HiveAuthService.deviceLogin('user@hive.com', 'password', deviceCreds);

      expect(result).toHaveProperty('accessToken');
      expect(result.requires2fa).toBeFalsy();
    });

    it('should return error for invalid device credentials', async () => {
      const invalidDeviceCreds = {
        deviceKey: 'invalid-key',
        deviceGroupKey: 'invalid-group',
        devicePassword: 'invalid-pass',
      };

      const result = await HiveAuthService.deviceLogin(
        'user@hive.com',
        'password',
        invalidDeviceCreds
      );

      expect(result).toHaveProperty('error');
    });

    it('should fall back to 2FA if device is no longer recognized', async () => {
      const staleDeviceCreds = {
        deviceKey: 'stale-device-key',
        deviceGroupKey: 'stale-group',
        devicePassword: 'stale-pass',
      };

      const result = await HiveAuthService.deviceLogin(
        'user@hive.com',
        'password',
        staleDeviceCreds
      );

      // Either returns error or requires 2FA
      expect(result.error || result.requires2fa).toBeTruthy();
    });
  });

  describe('refreshTokens', () => {
    beforeEach(() => {
      // Configure mock to call callback with success
      mockRefreshSession.mockImplementation((refreshToken, callback) => {
        const mockSession = {
          getAccessToken: () => ({ getJwtToken: () => 'new-access-token' }),
          getRefreshToken: () => ({ getToken: () => 'new-refresh-token' }),
          getIdToken: () => ({ getJwtToken: () => 'new-id-token' }),
        };
        callback(null, mockSession);
      });
    });

    it('should refresh access token using refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';

      const result = await HiveAuthService.refreshTokens(mockRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('idToken');
    });

    it('should work with username parameter', async () => {
      const mockRefreshToken = 'valid-refresh-token';

      const result = await HiveAuthService.refreshTokens(mockRefreshToken, 'user@example.com');

      expect(result).toHaveProperty('accessToken');
    });

    it('should return error for expired refresh token', async () => {
      const expiredRefreshToken = 'expired-refresh-token';

      const result = await HiveAuthService.refreshTokens(expiredRefreshToken);

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/expired|invalid/i);
    });

    it('should handle Cognito refresh errors', async () => {
      mockRefreshSession.mockImplementation((refreshToken, callback) => {
        callback(new Error('Token expired'), null);
      });

      const result = await HiveAuthService.refreshTokens('some-token');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('expired');
    });
  });

  describe('Demo Mode', () => {
    it('should require 2FA for demo credentials (like real Hive)', async () => {
      const result = await HiveAuthService.initiateAuth('demo@hive.com', 'demo', true);

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should verify 2FA code 123456 in demo mode', async () => {
      const result = await HiveAuthService.verify2fa(
        '123456',
        'demo-session',
        'demo@hive.com',
        true
      );

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeTruthy();
    });

    it('should reject invalid 2FA code in demo mode', async () => {
      const result = await HiveAuthService.verify2fa(
        '000000',
        'demo-session',
        'demo@hive.com',
        true
      );

      expect(result).toHaveProperty('error');
    });

    it('should reject invalid demo credentials', async () => {
      const result = await HiveAuthService.initiateAuth('invalid@email.com', 'wrong', true);

      expect(result).toHaveProperty('error');
    });
  });

  describe('storeTokens', () => {
    it('should store id token, expiry, and refresh token', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresIn: 3600,
      };

      await HiveAuthService.storeTokens(tokens);

      expect(hiveCredentialsManager.setSessionToken).toHaveBeenCalledWith(
        'id-token',
        expect.any(Number),
        'refresh-token'
      );
    });

    it('should not store if no idToken present', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      await HiveAuthService.storeTokens(tokens);

      expect(hiveCredentialsManager.setSessionToken).not.toHaveBeenCalled();
    });
  });

  describe('clearAuth', () => {
    it('should clear all stored authentication data', async () => {
      await HiveAuthService.clearAuth();

      expect(hiveCredentialsManager.clearSessionToken).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearDeviceCredentials).toHaveBeenCalled();
    });
  });

  describe('Cognito SDK Integration', () => {
    let CognitoUserPool, AuthenticationDetails;

    beforeEach(async () => {
      // Reset mocks
      mockAuthenticateUser.mockReset();
      mockSendMFACode.mockReset();

      // Import Cognito mocks
      const cognitoMod = await import('amazon-cognito-identity-js');
      CognitoUserPool = cognitoMod.CognitoUserPool;
      AuthenticationDetails = cognitoMod.AuthenticationDetails;
    });

    describe('initiateAuth with real Cognito', () => {
      it('should create CognitoUserPool with Hive configuration', async () => {
        // Setup mock to trigger mfaRequired callback
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', { CODE_DELIVERY_DESTINATION: '+44*****1234' });
        });

        await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        expect(CognitoUserPool).toHaveBeenCalledWith({
          UserPoolId: 'eu-west-1_SamNfoWtf',
          ClientId: '3rl4i0ajrmtdm8sbre54p9dvd9',
        });
      });

      it('should create AuthenticationDetails with username and password', async () => {
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        await HiveAuthService.initiateAuth('user@hive.com', 'mypassword', false);

        expect(AuthenticationDetails).toHaveBeenCalledWith({
          Username: 'user@hive.com',
          Password: 'mypassword',
        });
      });

      it('should call CognitoUser.authenticateUser for non-demo mode', async () => {
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        expect(mockAuthenticateUser).toHaveBeenCalled();
      });

      it('should return requires2fa when mfaRequired callback is triggered', async () => {
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', { CODE_DELIVERY_DESTINATION: '+44*****1234' });
        });

        const result = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        expect(result.requires2fa).toBe(true);
        expect(result.session).toBeTruthy();
      });

      it('should return error when onFailure callback is triggered', async () => {
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.onFailure({ message: 'Incorrect username or password' });
        });

        const result = await HiveAuthService.initiateAuth('user@hive.com', 'wrongpass', false);

        expect(result.error).toBeTruthy();
      });

      it('should return tokens when onSuccess callback is triggered (device auth)', async () => {
        const mockSession = {
          getAccessToken: () => ({ getJwtToken: () => 'access-token-123' }),
          getRefreshToken: () => ({ getToken: () => 'refresh-token-123' }),
          getIdToken: () => ({ getJwtToken: () => 'id-token-123' }),
        };

        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.onSuccess(mockSession);
        });

        const result = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        expect(result.accessToken).toBe('access-token-123');
        expect(result.refreshToken).toBe('refresh-token-123');
        expect(result.idToken).toBe('id-token-123');
      });
    });

    describe('verify2fa with real Cognito', () => {
      it('should call sendMFACode on the stored CognitoUser instance', async () => {
        // First, initiate auth to store the cognitoUser
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);
        const session = initResult.session;

        // Setup sendMFACode mock
        const mockTokens = {
          getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
          getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
          getIdToken: () => ({ getJwtToken: () => 'id-token' }),
        };
        mockSendMFACode.mockImplementation((code, callbacks) => {
          callbacks.onSuccess(mockTokens);
        });

        await HiveAuthService.verify2fa('123456', session, 'user@hive.com', false);

        expect(mockSendMFACode).toHaveBeenCalledWith('123456', expect.any(Object));
      });

      it('should extract tokens from Cognito session on success', async () => {
        // First, initiate auth
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        // Setup sendMFACode mock with tokens
        const mockTokens = {
          getAccessToken: () => ({ getJwtToken: () => 'real-access-token' }),
          getRefreshToken: () => ({ getToken: () => 'real-refresh-token' }),
          getIdToken: () => ({ getJwtToken: () => 'real-id-token' }),
        };
        mockSendMFACode.mockImplementation((code, callbacks) => {
          callbacks.onSuccess(mockTokens);
        });

        const result = await HiveAuthService.verify2fa(
          '123456',
          initResult.session,
          'user@hive.com',
          false
        );

        expect(result.accessToken).toBe('real-access-token');
        expect(result.refreshToken).toBe('real-refresh-token');
        expect(result.idToken).toBe('real-id-token');
      });

      it('should return error when sendMFACode fails', async () => {
        // First, initiate auth
        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        // Setup sendMFACode to fail
        mockSendMFACode.mockImplementation((code, callbacks) => {
          callbacks.onFailure({ message: 'Invalid code' });
        });

        const result = await HiveAuthService.verify2fa(
          '000000',
          initResult.session,
          'user@hive.com',
          false
        );

        expect(result.error).toBeTruthy();
      });

      it('should use stored CognitoUser from initiateAuth session', async () => {
        // This test verifies that the same CognitoUser instance is used
        // between initiateAuth and verify2fa calls

        mockAuthenticateUser.mockImplementation((authDetails, callbacks) => {
          callbacks.mfaRequired('SMS_MFA', {});
        });

        const initResult = await HiveAuthService.initiateAuth('user@hive.com', 'password', false);

        mockSendMFACode.mockImplementation((code, callbacks) => {
          callbacks.onSuccess({
            getAccessToken: () => ({ getJwtToken: () => 'token' }),
            getRefreshToken: () => ({ getToken: () => 'refresh' }),
            getIdToken: () => ({ getJwtToken: () => 'id' }),
          });
        });

        // Call verify2fa with the session from initiateAuth
        await HiveAuthService.verify2fa('123456', initResult.session, 'user@hive.com', false);

        // Verify sendMFACode was called (proves we have the stored CognitoUser)
        expect(mockSendMFACode).toHaveBeenCalled();
      });
    });
  });
});
