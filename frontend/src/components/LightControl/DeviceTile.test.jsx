import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceTile } from './DeviceTile';

describe('DeviceTile', () => {
  const mockOnToggle = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('light device', () => {
    const lightDevice = {
      id: 'hue:light-1',
      name: 'Floor Lamp',
      type: 'light',
      serviceId: 'hue',
      state: {
        on: true,
        brightness: 80,
        color: 'rgb(255, 200, 130)',
      },
    };

    it('should render light device name', () => {
      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} />);

      expect(screen.getByText('Floor Lamp')).toBeInTheDocument();
    });

    it('should show on state visually', () => {
      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('on');
    });

    it('should show off state visually', () => {
      const offLight = { ...lightDevice, state: { on: false, brightness: 0 } };
      render(<DeviceTile device={offLight} onToggle={mockOnToggle} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('off');
    });

    it('should call onToggle when clicked', () => {
      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnToggle).toHaveBeenCalledWith('hue:light-1');
    });

    it('should show toggling state', () => {
      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} isUpdating={true} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('toggling');
      expect(tile).toBeDisabled();
    });

    it('should display brightness level', () => {
      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} />);

      // Brightness fill should be 80%
      const fill = document.querySelector('.device-tile-fill');
      expect(fill).toHaveStyle({ height: '80%' });
    });
  });

  describe('thermostat device', () => {
    const thermostatDevice = {
      id: 'hive:heating',
      name: 'Central Heating',
      type: 'thermostat',
      serviceId: 'hive',
      state: {
        currentTemperature: 19.5,
        targetTemperature: 21,
        isHeating: true,
        mode: 'schedule',
      },
    };

    it('should render thermostat name', () => {
      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Central Heating')).toBeInTheDocument();
    });

    it('should display current temperature', () => {
      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('19.5°')).toBeInTheDocument();
    });

    it('should display target temperature', () => {
      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('21°')).toBeInTheDocument();
    });

    it('should show heating indicator when heating', () => {
      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('heating');
    });

    it('should not show heating indicator when not heating', () => {
      const notHeating = {
        ...thermostatDevice,
        state: { ...thermostatDevice.state, isHeating: false },
      };
      render(<DeviceTile device={notHeating} onUpdate={mockOnUpdate} />);

      const tile = screen.getByRole('button');
      expect(tile).not.toHaveClass('heating');
    });

    it('should show mode badge', () => {
      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('schedule')).toBeInTheDocument();
    });
  });

  describe('hot water device', () => {
    const hotWaterDevice = {
      id: 'hive:hotwater',
      name: 'Hot Water',
      type: 'hotWater',
      serviceId: 'hive',
      state: {
        isOn: true,
        mode: 'schedule',
      },
    };

    it('should render hot water name', () => {
      render(<DeviceTile device={hotWaterDevice} onToggle={mockOnToggle} />);

      expect(screen.getByText('Hot Water')).toBeInTheDocument();
    });

    it('should show on state', () => {
      render(<DeviceTile device={hotWaterDevice} onToggle={mockOnToggle} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('on');
    });

    it('should show off state', () => {
      const offWater = { ...hotWaterDevice, state: { isOn: false, mode: 'off' } };
      render(<DeviceTile device={offWater} onToggle={mockOnToggle} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveClass('off');
    });

    it('should call onToggle when clicked', () => {
      render(<DeviceTile device={hotWaterDevice} onToggle={mockOnToggle} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnToggle).toHaveBeenCalledWith('hive:hotwater');
    });
  });

  describe('service indicator', () => {
    it('should show service badge for Hue devices', () => {
      const lightDevice = {
        id: 'hue:light-1',
        name: 'Light',
        type: 'light',
        serviceId: 'hue',
        state: { on: true },
      };

      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} showServiceBadge={true} />);

      expect(screen.getByText('hue')).toBeInTheDocument();
    });

    it('should show service badge for Hive devices', () => {
      const thermostatDevice = {
        id: 'hive:heating',
        name: 'Heating',
        type: 'thermostat',
        serviceId: 'hive',
        state: { currentTemperature: 20 },
      };

      render(
        <DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} showServiceBadge={true} />
      );

      expect(screen.getByText('hive')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible name for light', () => {
      const lightDevice = {
        id: 'hue:light-1',
        name: 'Floor Lamp',
        type: 'light',
        serviceId: 'hue',
        state: { on: true, brightness: 80 },
      };

      render(<DeviceTile device={lightDevice} onToggle={mockOnToggle} />);

      expect(screen.getByRole('button', { name: /floor lamp/i })).toBeInTheDocument();
    });

    it('should have accessible name for thermostat', () => {
      const thermostatDevice = {
        id: 'hive:heating',
        name: 'Central Heating',
        type: 'thermostat',
        serviceId: 'hive',
        state: { currentTemperature: 20 },
      };

      render(<DeviceTile device={thermostatDevice} onUpdate={mockOnUpdate} />);

      expect(screen.getByRole('button', { name: /central heating/i })).toBeInTheDocument();
    });
  });
});
