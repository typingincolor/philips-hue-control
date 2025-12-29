import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeView } from './HomeView';
import { UI_TEXT } from '../../constants/uiText';

describe('HomeView', () => {
  const mockHiveStatus = {
    heating: {
      currentTemperature: 21,
      targetTemperature: 22,
      isHeating: true,
      mode: 'auto',
    },
    hotWater: {
      isOn: false,
      mode: 'scheduled',
    },
  };

  const mockHiveSchedules = [
    { id: '1', name: 'Morning', type: 'heating', time: '06:00', days: ['Mon', 'Tue', 'Wed'] },
  ];

  const mockHomeDevices = [
    { id: 'hive:heating', type: 'thermostat', name: 'Heating', source: 'hive' },
    { id: 'hive:hotwater', type: 'hotWater', name: 'Hot Water', source: 'hive' },
  ];

  const defaultProps = {
    homeDevices: mockHomeDevices,
    hiveConnected: true,
    hiveStatus: mockHiveStatus,
    hiveSchedules: mockHiveSchedules,
    hiveLoading: false,
    hiveError: null,
    onHiveRetry: vi.fn(),
    onHiveConnect: vi.fn(),
    onHiveVerify2fa: vi.fn(),
    onHiveCancel2fa: vi.fn(),
    onHiveClearError: vi.fn(),
    hiveRequires2fa: false,
    hiveConnecting: false,
    hiveVerifying: false,
    hivePendingUsername: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show empty state message when no home devices', () => {
      render(<HomeView {...defaultProps} homeDevices={[]} />);

      expect(screen.getByText(UI_TEXT.HOME_NO_DEVICES)).toBeInTheDocument();
    });
  });

  describe('with home devices', () => {
    it('should display Hive thermostat when connected', () => {
      render(<HomeView {...defaultProps} />);

      // Should show current temperature (rounded to 1 decimal place)
      expect(screen.getByText('21.0°')).toBeInTheDocument();
    });

    it('should show heating tile', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
    });

    it('should show hot water tile', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
    });
  });

  // NOTE: "Hive not connected" tests removed - demo mode assumes always connected.
  // Auth flows are tested manually.

  describe('loading state', () => {
    it('should show loading state when Hive is loading', () => {
      render(<HomeView {...defaultProps} hiveLoading={true} hiveStatus={null} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when Hive has error', () => {
      render(<HomeView {...defaultProps} hiveError="Connection failed" hiveStatus={null} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText(UI_TEXT.RETRY)).toBeInTheDocument();
    });
  });
});
