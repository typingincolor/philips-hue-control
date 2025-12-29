import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HiveInfoTile } from './HiveInfoTile';

describe('HiveInfoTile', () => {
  const heatingSchedule = {
    id: 'schedule-1',
    name: 'Morning Warmup',
    type: 'heating',
    time: '06:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  };

  const hotWaterSchedule = {
    id: 'schedule-2',
    name: 'Hot Water AM',
    type: 'hotWater',
    time: '07:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };

  describe('Info Tile Display', () => {
    it('should render info tile', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      expect(screen.getByTestId('hive-info-tile')).toBeInTheDocument();
    });

    it('should have hive-info-tile class', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      expect(tile).toHaveClass('hive-info-tile');
    });

    it('should display schedule name', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const name = screen.getByTestId('hive-info-name');
      expect(name).toHaveTextContent('Morning Warmup');
    });

    it('should display schedule time', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const time = screen.getByTestId('hive-info-time');
      expect(time).toHaveTextContent('06:00');
    });

    it('should display type icon for heating schedule', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const icon = screen.getByTestId('hive-info-icon');
      expect(icon).toBeInTheDocument();
      // Icon is colored via parent .hive-info-heating class in CSS
    });

    it('should display type icon for hot water schedule', () => {
      render(<HiveInfoTile schedule={hotWaterSchedule} />);

      const icon = screen.getByTestId('hive-info-icon');
      expect(icon).toBeInTheDocument();
      // Icon is colored via parent .hive-info-hotwater class in CSS
    });
  });

  describe('Schedule Types', () => {
    it('should have heating type class for heating schedules', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      expect(tile).toHaveClass('hive-info-heating');
    });

    it('should have hotwater type class for hot water schedules', () => {
      render(<HiveInfoTile schedule={hotWaterSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      expect(tile).toHaveClass('hive-info-hotwater');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label describing the schedule', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      const ariaLabel = tile.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Morning Warmup');
    });

    it('should include time in accessible label', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      const ariaLabel = tile.getAttribute('aria-label');
      expect(ariaLabel).toContain('06:00');
    });

    it('should include type in accessible label', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      const tile = screen.getByTestId('hive-info-tile');
      const ariaLabel = tile.getAttribute('aria-label');
      expect(ariaLabel.toLowerCase()).toContain('heating');
    });

    it('should be non-interactive (display only)', () => {
      render(<HiveInfoTile schedule={heatingSchedule} />);

      // Should not be a button - display only
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Different Schedules', () => {
    it('should render weekend schedule correctly', () => {
      const weekendSchedule = {
        id: 'schedule-3',
        name: 'Weekend Morning',
        type: 'heating',
        time: '09:00',
        days: ['Sat', 'Sun'],
      };
      render(<HiveInfoTile schedule={weekendSchedule} />);

      expect(screen.getByTestId('hive-info-name')).toHaveTextContent('Weekend Morning');
      expect(screen.getByTestId('hive-info-time')).toHaveTextContent('09:00');
    });

    it('should render evening schedule correctly', () => {
      const eveningSchedule = {
        id: 'schedule-4',
        name: 'Evening Boost',
        type: 'heating',
        time: '18:30',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };
      render(<HiveInfoTile schedule={eveningSchedule} />);

      expect(screen.getByTestId('hive-info-name')).toHaveTextContent('Evening Boost');
      expect(screen.getByTestId('hive-info-time')).toHaveTextContent('18:30');
    });
  });
});
