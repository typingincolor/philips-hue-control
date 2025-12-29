import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HiveTile } from './HiveTile';

describe('HiveTile', () => {
  describe('Heating Tile', () => {
    const heatingData = {
      currentTemperature: 19.5,
      targetTemperature: 21.0,
      isHeating: true,
      mode: 'schedule',
    };

    it('should render as a display-only element (not button)', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      // Should be a div, not a button (display only)
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByTestId('hive-tile-heating')).toBeInTheDocument();
    });

    it('should have hive-tile-heating class', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const tile = screen.getByTestId('hive-tile-heating');
      expect(tile).toHaveClass('hive-tile-heating');
    });

    it('should display current temperature rounded to 1 decimal place', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const currentTemp = screen.getByTestId('hive-tile-temp-current');
      expect(currentTemp).toHaveTextContent('19.5°');
    });

    it('should round current temperature to 1 decimal place', () => {
      const dataWithLongDecimal = { ...heatingData, currentTemperature: 19.567 };
      render(<HiveTile type="heating" data={dataWithLongDecimal} />);

      const currentTemp = screen.getByTestId('hive-tile-temp-current');
      expect(currentTemp).toHaveTextContent('19.6°');
    });

    it('should display target temperature with arrow indicator', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const targetTemp = screen.getByTestId('hive-tile-temp-target');
      expect(targetTemp).toHaveTextContent('→');
      expect(targetTemp).toHaveTextContent('21.0°');
    });

    it('should round target temperature to 1 decimal place', () => {
      const dataWithLongDecimal = { ...heatingData, targetTemperature: 21.333 };
      render(<HiveTile type="heating" data={dataWithLongDecimal} />);

      const targetTemp = screen.getByTestId('hive-tile-temp-target');
      expect(targetTemp).toHaveTextContent('21.3°');
    });

    it('should display mode badge', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const modeBadge = screen.getByTestId('hive-tile-mode');
      expect(modeBadge).toHaveTextContent('schedule');
    });

    it('should have active class when heating is on', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const tile = screen.getByTestId('hive-tile-heating');
      expect(tile).toHaveClass('active');
    });

    it('should not have active class when heating is off', () => {
      const notHeating = { ...heatingData, isHeating: false };
      render(<HiveTile type="heating" data={notHeating} />);

      const tile = screen.getByTestId('hive-tile-heating');
      expect(tile).not.toHaveClass('active');
    });

    it('should show orange fill when heating is active', () => {
      const { container } = render(<HiveTile type="heating" data={heatingData} />);

      const fill = container.querySelector('.hive-tile-fill');
      expect(fill).toBeInTheDocument();
      // Active heating should have 100% fill
      expect(fill).toHaveStyle({ height: '100%' });
    });

    it('should not show fill when heating is inactive', () => {
      const notHeating = { ...heatingData, isHeating: false };
      const { container } = render(<HiveTile type="heating" data={notHeating} />);

      const fill = container.querySelector('.hive-tile-fill');
      expect(fill).toHaveStyle({ height: '0%' });
    });

    it('should have accessible label with temperature info', () => {
      render(<HiveTile type="heating" data={heatingData} />);

      const tile = screen.getByTestId('hive-tile-heating');
      const ariaLabel = tile.getAttribute('aria-label');
      expect(ariaLabel).toContain('degree');
      expect(ariaLabel).toContain('19.5');
    });

    it('should display different modes correctly', () => {
      const manualMode = { ...heatingData, mode: 'manual' };
      render(<HiveTile type="heating" data={manualMode} />);

      expect(screen.getByTestId('hive-tile-mode')).toHaveTextContent('manual');
    });

    it('should display boost mode correctly', () => {
      const boostMode = { ...heatingData, mode: 'boost' };
      render(<HiveTile type="heating" data={boostMode} />);

      expect(screen.getByTestId('hive-tile-mode')).toHaveTextContent('boost');
    });
  });

  describe('Hot Water Tile', () => {
    const hotWaterData = {
      isOn: true,
      mode: 'schedule',
    };

    it('should render hot water tile', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      expect(screen.getByTestId('hive-tile-hotwater')).toBeInTheDocument();
    });

    it('should have hive-tile-hotwater class', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      const tile = screen.getByTestId('hive-tile-hotwater');
      expect(tile).toHaveClass('hive-tile-hotwater');
    });

    it('should display "Hot Water" label', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      expect(screen.getByText(/hot water/i)).toBeInTheDocument();
    });

    it('should have active class when hot water is on', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      const tile = screen.getByTestId('hive-tile-hotwater');
      expect(tile).toHaveClass('active');
    });

    it('should not have active class when hot water is off', () => {
      const offHotWater = { isOn: false, mode: 'off' };
      render(<HiveTile type="hotwater" data={offHotWater} />);

      const tile = screen.getByTestId('hive-tile-hotwater');
      expect(tile).not.toHaveClass('active');
    });

    it('should show orange fill when hot water is on', () => {
      const { container } = render(<HiveTile type="hotwater" data={hotWaterData} />);

      const fill = container.querySelector('.hive-tile-fill');
      expect(fill).toBeInTheDocument();
      expect(fill).toHaveStyle({ height: '100%' });
    });

    it('should not show fill when hot water is off', () => {
      const offHotWater = { isOn: false, mode: 'off' };
      const { container } = render(<HiveTile type="hotwater" data={offHotWater} />);

      const fill = container.querySelector('.hive-tile-fill');
      expect(fill).toHaveStyle({ height: '0%' });
    });

    it('should display mode badge', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      expect(screen.getByTestId('hive-tile-mode')).toHaveTextContent('schedule');
    });

    it('should have accessible label', () => {
      render(<HiveTile type="hotwater" data={hotWaterData} />);

      const tile = screen.getByTestId('hive-tile-hotwater');
      const ariaLabel = tile.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.toLowerCase()).toContain('hot water');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML for display-only tiles', () => {
      const heatingData = {
        currentTemperature: 19.5,
        targetTemperature: 21.0,
        isHeating: true,
        mode: 'schedule',
      };
      render(<HiveTile type="heating" data={heatingData} />);

      // Should not be interactive - no button role
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
