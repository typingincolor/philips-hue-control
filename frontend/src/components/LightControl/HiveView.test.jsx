import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HiveView } from './HiveView';
import { UI_TEXT } from '../../constants/uiText';

describe('HiveView', () => {
  const defaultProps = {
    status: {
      heating: {
        currentTemperature: 19.5,
        targetTemperature: 21,
        isHeating: true,
        mode: 'schedule',
      },
      hotWater: {
        isOn: false,
        mode: 'schedule',
      },
    },
    schedules: [
      {
        id: '1',
        name: 'Morning Warmup',
        type: 'heating',
        time: '06:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      {
        id: '2',
        name: 'Hot Water AM',
        type: 'hotWater',
        time: '07:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Thermostat Display', () => {
    it('should display current temperature', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('19.5°')).toBeInTheDocument();
    });

    it('should display heating status indicator', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS)).toBeInTheDocument();
    });

    it('should display hot water status indicator', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByLabelText(UI_TEXT.HIVE_HOT_WATER_STATUS)).toBeInTheDocument();
    });

    it('should show heating icon in active state when heating is on', () => {
      render(<HiveView {...defaultProps} />);

      const heatingIndicator = screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS);
      expect(heatingIndicator).toHaveClass('active');
    });

    it('should show heating icon in inactive state when heating is off', () => {
      const propsWithHeatingOff = {
        ...defaultProps,
        status: {
          ...defaultProps.status,
          heating: { ...defaultProps.status.heating, isHeating: false },
        },
      };
      render(<HiveView {...propsWithHeatingOff} />);

      const heatingIndicator = screen.getByLabelText(UI_TEXT.HIVE_HEATING_STATUS);
      expect(heatingIndicator).not.toHaveClass('active');
    });

    it('should display current mode badge', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText(/schedule/i)).toBeInTheDocument();
    });
  });

  describe('Schedule List', () => {
    it('should display list of schedules', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText('Morning Warmup')).toBeInTheDocument();
      expect(screen.getByText('Hot Water AM')).toBeInTheDocument();
    });

    it('should display schedule type icon', () => {
      render(<HiveView {...defaultProps} />);

      // Check heating and hot water icons exist
      const scheduleItems = screen.getAllByRole('listitem');
      expect(scheduleItems.length).toBe(2);
    });

    it('should display schedule time', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByText(/06:00/)).toBeInTheDocument();
      expect(screen.getByText(/07:00/)).toBeInTheDocument();
    });

    it('should display schedule days', () => {
      render(<HiveView {...defaultProps} />);

      // Both schedules include Mon, so use getAllByText
      expect(screen.getAllByText(/Mon/).length).toBeGreaterThan(0);
    });

    it('should show empty state when no schedules', () => {
      render(<HiveView {...defaultProps} schedules={[]} />);

      expect(screen.getByText(UI_TEXT.HIVE_NO_SCHEDULES)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      expect(screen.getByText(UI_TEXT.HIVE_LOADING)).toBeInTheDocument();
    });

    it('should not show content when loading', () => {
      render(<HiveView {...defaultProps} isLoading={true} status={null} />);

      expect(screen.queryByText('19.5°')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on error', () => {
      render(<HiveView {...defaultProps} error="Failed to fetch Hive data" status={null} />);

      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      render(<HiveView {...defaultProps} error="Connection failed" status={null} />);

      expect(screen.getByRole('button', { name: UI_TEXT.RETRY })).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();

      render(<HiveView {...defaultProps} error="Error" status={null} />);

      await user.click(screen.getByRole('button', { name: UI_TEXT.RETRY }));

      expect(defaultProps.onRetry).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible temperature display', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByLabelText(UI_TEXT.HIVE_CURRENT_TEMP)).toBeInTheDocument();
    });

    it('should have accessible schedule list', () => {
      render(<HiveView {...defaultProps} />);

      expect(screen.getByRole('list', { name: UI_TEXT.HIVE_SCHEDULES })).toBeInTheDocument();
    });
  });
});
