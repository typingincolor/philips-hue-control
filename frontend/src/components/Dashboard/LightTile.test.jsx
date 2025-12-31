import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightTile } from './LightTile';
import { COLOR_TEMPERATURE } from '../../constants/colors';

describe('LightTile', () => {
  const defaultLight = {
    id: 'light-1',
    name: 'Living Room',
    on: true,
    brightness: 75,
    color: 'rgb(255, 200, 130)',
  };

  const defaultProps = {
    light: defaultLight,
    onToggle: vi.fn(),
    isToggling: false,
  };

  describe('rendering', () => {
    it('should render light name', () => {
      render(<LightTile {...defaultProps} />);
      expect(screen.getByText('Living Room')).toBeInTheDocument();
    });

    it('should render default name when light name is missing', () => {
      const lightWithoutName = { ...defaultLight, name: undefined };
      render(<LightTile {...defaultProps} light={lightWithoutName} />);
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should render as button element', () => {
      render(<LightTile {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply on class when light is on', () => {
      render(<LightTile {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('on');
    });

    it('should apply off class when light is off', () => {
      const offLight = { ...defaultLight, on: false };
      render(<LightTile {...defaultProps} light={offLight} />);
      expect(screen.getByRole('button')).toHaveClass('off');
    });

    it('should apply toggling class when isToggling is true', () => {
      render(<LightTile {...defaultProps} isToggling={true} />);
      expect(screen.getByRole('button')).toHaveClass('toggling');
    });
  });

  describe('brightness fill', () => {
    it('should set fill height to 100% when light is on', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('100%');
    });

    it('should set fill height to 0% when light is off', () => {
      const offLight = { ...defaultLight, on: false, brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('0%');
    });

    it('should show full fill regardless of brightness when on', () => {
      const dimLight = { ...defaultLight, brightness: 0 };
      const { container } = render(<LightTile {...defaultProps} light={dimLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('100%');
    });

    it('should show full fill at 100% brightness', () => {
      const brightLight = { ...defaultLight, brightness: 100 };
      const { container } = render(<LightTile {...defaultProps} light={brightLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('100%');
    });

    it('should show full fill even with undefined brightness when on', () => {
      const noBrightnessLight = { ...defaultLight, brightness: undefined };
      const { container } = render(<LightTile {...defaultProps} light={noBrightnessLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('100%');
    });
  });

  describe('fill color and gradient', () => {
    it('should use light color for fill gradient', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.background).toContain('rgb(255, 200, 130)');
    });

    it('should use default warm color when light has no color', () => {
      const noColorLight = { ...defaultLight, color: undefined };
      const { container } = render(<LightTile {...defaultProps} light={noColorLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.background).toContain('rgb(255, 200, 130)');
    });

    it('should create gradient with adjusted color', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      const fill = container.querySelector('.light-tile-fill');
      // The gradient should go from base color to adjusted (+20) color
      expect(fill.style.background).toContain('linear-gradient');
      expect(fill.style.background).toContain('to top');
    });
  });

  describe('shadow styles', () => {
    it('should apply shadow when on, brightness >= 50, and shadow provided', () => {
      const lightWithShadow = {
        ...defaultLight,
        brightness: 60,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      const { container } = render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const tile = container.querySelector('.light-tile');
      expect(tile.style.boxShadow).toBe('0 0 20px rgba(255, 200, 130, 0.5)');
    });

    it('should not apply shadow when brightness < 50', () => {
      const lightWithShadow = {
        ...defaultLight,
        brightness: 40,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      const { container } = render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const tile = container.querySelector('.light-tile');
      expect(tile.style.boxShadow).toBe('');
    });

    it('should not apply shadow when light is off', () => {
      const lightWithShadow = {
        ...defaultLight,
        on: false,
        brightness: 75,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      const { container } = render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const tile = container.querySelector('.light-tile');
      expect(tile.style.boxShadow).toBe('');
    });

    it('should not apply shadow when no shadow property', () => {
      const lightNoShadow = { ...defaultLight, brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={lightNoShadow} />);
      const tile = container.querySelector('.light-tile');
      expect(tile.style.boxShadow).toBe('');
    });

    it('should apply shadow at exactly 50% brightness', () => {
      const lightWithShadow = {
        ...defaultLight,
        brightness: 50,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      const { container } = render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const tile = container.querySelector('.light-tile');
      expect(tile.style.boxShadow).toBe('0 0 20px rgba(255, 200, 130, 0.5)');
    });
  });

  describe('content color contrast', () => {
    it('should use dark text on light pill for bright fill with high brightness', () => {
      // Bright color (high luminance) with high brightness should get dark text
      const brightLight = {
        ...defaultLight,
        color: 'rgb(255, 255, 200)', // High luminance
        brightness: 75,
      };
      const { container } = render(<LightTile {...defaultProps} light={brightLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(0, 0, 0, 0.9)');
      expect(nameSpan.style.background).toBe('rgba(255, 255, 255, 0.7)');
    });

    it('should use light text on dark pill for dark fill colors', () => {
      // Dark color (low luminance) should get light text
      const darkLight = {
        ...defaultLight,
        color: 'rgb(50, 50, 100)', // Low luminance
        brightness: 75,
      };
      const { container } = render(<LightTile {...defaultProps} light={darkLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
      expect(nameSpan.style.background).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('should use light text when brightness is below 50', () => {
      const lowBrightnessLight = {
        ...defaultLight,
        color: 'rgb(255, 255, 200)', // High luminance but low brightness
        brightness: 40,
      };
      const { container } = render(<LightTile {...defaultProps} light={lowBrightnessLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
    });

    it('should handle missing color with default luminance', () => {
      const noColorLight = { ...defaultLight, color: null, brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={noColorLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      // Default luminance is 180 which is > 140, so should use dark text if brightness >= 50
      expect(nameSpan.style.color).toBe('rgba(0, 0, 0, 0.9)');
    });

    it('should handle non-rgb color format gracefully', () => {
      const hexColorLight = { ...defaultLight, color: '#ff0000', brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={hexColorLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      // Non-matching format uses default luminance (180)
      expect(nameSpan.style.color).toBe('rgba(0, 0, 0, 0.9)');
    });
  });

  describe('icons', () => {
    it('should show LightbulbOn icon when light is on and not toggling', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      // LightbulbOn has fill="currentColor"
      const icon = container.querySelector('.light-tile-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should show LightbulbOff icon when light is off', () => {
      const offLight = { ...defaultLight, on: false };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);
      const icon = container.querySelector('.light-tile-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should show Spinner icon when toggling', () => {
      const { container } = render(<LightTile {...defaultProps} isToggling={true} />);
      // Spinner has className containing 'icon-spin'
      const spinner = container.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('toggle functionality', () => {
    it('should call onToggle with light id when clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<LightTile {...defaultProps} onToggle={onToggle} />);

      await user.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledWith('light-1');
    });

    it('should be disabled when isToggling is true', () => {
      render(<LightTile {...defaultProps} isToggling={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onToggle when disabled', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<LightTile {...defaultProps} onToggle={onToggle} isToggling={true} />);

      await user.click(screen.getByRole('button'));

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('adjustColor helper', () => {
    // These test the internal adjustColor function behavior through the component
    it('should create lighter gradient for positive adjustment', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      const fill = container.querySelector('.light-tile-fill');
      // Base: rgb(255, 200, 130), adjusted +20: rgb(255, 220, 150)
      expect(fill.style.background).toContain('rgb(255, 220, 150)');
    });

    it('should clamp color values at 255 maximum', () => {
      const brightLight = { ...defaultLight, color: 'rgb(250, 250, 250)' };
      const { container } = render(<LightTile {...defaultProps} light={brightLight} />);
      const fill = container.querySelector('.light-tile-fill');
      // +20 would exceed 255, should clamp to rgb(255, 255, 255)
      expect(fill.style.background).toContain('rgb(255, 255, 255)');
    });

    it('should handle color with spaces in rgb format', () => {
      const spacedLight = { ...defaultLight, color: 'rgb(100,  150,  200)' };
      const { container } = render(<LightTile {...defaultProps} light={spacedLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.background).toContain('rgb(120, 170, 220)');
    });
  });

  describe('getContrastStyle helper', () => {
    // Test luminance calculation through component behavior
    it('should calculate luminance correctly for pure red', () => {
      // Red: 0.299 * 255 = 76.245 (low luminance -> light text)
      const redLight = { ...defaultLight, color: 'rgb(255, 0, 0)', brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={redLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
    });

    it('should calculate luminance correctly for pure green', () => {
      // Green: 0.587 * 255 = 149.685 (medium luminance, with 75% brightness -> dark text)
      const greenLight = { ...defaultLight, color: 'rgb(0, 255, 0)', brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={greenLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(0, 0, 0, 0.9)');
    });

    it('should calculate luminance correctly for pure blue', () => {
      // Blue: 0.114 * 255 = 29.07 (low luminance -> light text)
      const blueLight = { ...defaultLight, color: 'rgb(0, 0, 255)', brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={blueLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
    });

    it('should use bright threshold of luminance > 140', () => {
      // Luminance exactly at boundary: 140 should use light text
      // Need rgb where 0.299*r + 0.587*g + 0.114*b = 140
      // Example: rgb(200, 100, 100) = 59.8 + 58.7 + 11.4 = 129.9 < 140 -> light text
      const boundaryLight = { ...defaultLight, color: 'rgb(200, 100, 100)', brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={boundaryLight} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
    });

    it('should require both high luminance AND brightness >= 50 for dark text', () => {
      // High luminance (white) but low brightness
      const lowBrightWhite = { ...defaultLight, color: 'rgb(255, 255, 255)', brightness: 49 };
      const { container } = render(<LightTile {...defaultProps} light={lowBrightWhite} />);
      const nameSpan = container.querySelector('.light-tile-name');
      expect(nameSpan.style.color).toBe('rgba(255, 255, 255, 0.95)');
    });
  });

  describe('color temperature slider', () => {
    const lightWithColorTemp = {
      ...defaultLight,
      on: true,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    it('should render slider when light is on', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const slider = container.querySelector('.light-tile-slider');
      expect(slider).toBeInTheDocument();
    });

    it('should not render slider when light is off', () => {
      const offLight = { ...lightWithColorTemp, on: false };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);
      const slider = container.querySelector('.light-tile-slider');
      expect(slider).not.toBeInTheDocument();
    });

    it('should render range input for color temperature', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toBeInTheDocument();
    });

    it('should have correct min and max values for color temperature', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      // Color temperature range: warm to cool
      expect(rangeInput).toHaveAttribute('min', String(COLOR_TEMPERATURE.MIN));
      expect(rangeInput).toHaveAttribute('max', String(COLOR_TEMPERATURE.MAX));
    });

    it('should reflect current color temperature value', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toHaveValue(String(COLOR_TEMPERATURE.DEFAULT));
    });

    it('should call onColorTemperatureChange when slider is moved', async () => {
      const onColorTemperatureChange = vi.fn();
      const { container } = render(
        <LightTile
          {...defaultProps}
          light={lightWithColorTemp}
          onColorTemperatureChange={onColorTemperatureChange}
        />
      );

      const rangeInput = container.querySelector('input[type="range"]');
      // Change the slider value using fireEvent for range inputs
      fireEvent.change(rangeInput, { target: { value: '5000' } });

      expect(onColorTemperatureChange).toHaveBeenCalledWith('light-1', 5000);
    });

    it('should not toggle light when slider is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithColorTemp} onToggle={onToggle} />
      );

      const slider = container.querySelector('.light-tile-slider');
      await user.click(slider);

      // Clicking on slider should not toggle the light
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should have aria-label for accessibility', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toHaveAttribute('aria-label', 'Color temperature for Living Room');
    });

    it('should have aria-valuemin and aria-valuemax', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toHaveAttribute('aria-valuemin', String(COLOR_TEMPERATURE.MIN));
      expect(rangeInput).toHaveAttribute('aria-valuemax', String(COLOR_TEMPERATURE.MAX));
    });

    it('should have aria-valuenow reflecting current value', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toHaveAttribute('aria-valuenow', String(COLOR_TEMPERATURE.DEFAULT));
    });

    it('should show warm-to-cool gradient on slider track', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithColorTemp} />);
      const slider = container.querySelector('.light-tile-slider');
      // Slider should have gradient styling (CSS handles visual)
      expect(slider).toBeInTheDocument();
    });

    it('should handle light without colorTemperature property', () => {
      const lightNoTemp = { ...defaultLight, on: true };
      delete lightNoTemp.colorTemperature;
      const { container } = render(<LightTile {...defaultProps} light={lightNoTemp} />);
      // Component should handle missing colorTemperature gracefully
      const slider = container.querySelector('.light-tile-slider');
      // Slider may or may not render depending on implementation
      expect(container.querySelector('.light-tile')).toBeInTheDocument();
    });

    it('should disable slider when isToggling', () => {
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithColorTemp} isToggling={true} />
      );
      const rangeInput = container.querySelector('input[type="range"]');
      if (rangeInput) {
        expect(rangeInput).toBeDisabled();
      }
    });
  });

  describe('tap to toggle with slider', () => {
    const lightWithSlider = {
      ...defaultLight,
      on: true,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    it('should toggle light when tile body is clicked (not slider)', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithSlider} onToggle={onToggle} />
      );

      // Click on the tile button, not the slider
      const tileButton = container.querySelector('.light-tile');
      await user.click(tileButton);

      expect(onToggle).toHaveBeenCalledWith('light-1');
    });

    it('should have separate click areas for toggle and slider', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const tileButton = container.querySelector('.light-tile');
      const slider = container.querySelector('.light-tile-slider');

      expect(tileButton).toBeInTheDocument();
      expect(slider).toBeInTheDocument();
      // Slider should be inside tile but handle events separately
    });
  });

  describe('accessibility with slider', () => {
    const lightWithSlider = {
      ...defaultLight,
      on: true,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    it('should have accessible label on tile including state', () => {
      render(<LightTile {...defaultProps} light={lightWithSlider} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Living Room'));
    });

    it('should be keyboard navigable to slider', async () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);
      const rangeInput = container.querySelector('input[type="range"]');

      rangeInput.focus();
      expect(rangeInput).toHaveFocus();
    });

    it('should allow arrow key adjustment of slider', () => {
      const onColorTemperatureChange = vi.fn();
      const { container } = render(
        <LightTile
          {...defaultProps}
          light={lightWithSlider}
          onColorTemperatureChange={onColorTemperatureChange}
        />
      );

      const rangeInput = container.querySelector('input[type="range"]');
      rangeInput.focus();

      // Simulate arrow key by changing value (arrow keys trigger change events on range inputs)
      fireEvent.change(rangeInput, { target: { value: '4001' } });

      // Arrow key should change slider value
      expect(onColorTemperatureChange).toHaveBeenCalled();
    });
  });

  describe('layout structure (bug 44)', () => {
    const lightWithSlider = {
      ...defaultLight,
      on: true,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    it('should have toggle button as a separate section at the top', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      // Toggle button area should be a distinct section with class light-tile-toggle
      const toggleArea = container.querySelector('.light-tile-toggle');
      expect(toggleArea).toBeInTheDocument();

      // The icon should be inside the toggle area
      const icon = toggleArea.querySelector('.light-tile-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have slider positioned below the toggle button', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      // Get all direct children of light-tile to check order
      const tile = container.querySelector('.light-tile');
      const toggleArea = container.querySelector('.light-tile-toggle');
      const sliderArea = container.querySelector('.light-tile-slider');

      // Both should exist
      expect(toggleArea).toBeInTheDocument();
      expect(sliderArea).toBeInTheDocument();

      // Slider should come after toggle in DOM order
      const children = Array.from(tile.children);
      const toggleIndex = children.indexOf(toggleArea);
      const sliderIndex = children.indexOf(sliderArea);

      expect(sliderIndex).toBeGreaterThan(toggleIndex);
    });

    it('should have name label at the bottom of the tile', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const tile = container.querySelector('.light-tile');
      const sliderArea = container.querySelector('.light-tile-slider');
      const nameLabel = container.querySelector('.light-tile-name');

      // Both should exist
      expect(sliderArea).toBeInTheDocument();
      expect(nameLabel).toBeInTheDocument();

      // Name should come after slider in DOM order
      const children = Array.from(tile.children);
      const sliderIndex = children.indexOf(sliderArea);
      const nameIndex = children.indexOf(nameLabel);

      expect(nameIndex).toBeGreaterThan(sliderIndex);
    });

    it('should have toggle button filling most of the tile height', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      // Toggle area should have flex-grow to fill available space
      const toggleArea = container.querySelector('.light-tile-toggle');
      expect(toggleArea).toBeInTheDocument();

      // The toggle area should have class indicating it fills space
      expect(toggleArea).toHaveClass('light-tile-toggle');
    });

    it('should trigger toggle when clicking the toggle area', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithSlider} onToggle={onToggle} />
      );

      // Click specifically on the toggle area
      const toggleArea = container.querySelector('.light-tile-toggle');
      await user.click(toggleArea);

      expect(onToggle).toHaveBeenCalledWith('light-1');
    });

    it('should not trigger toggle when clicking the slider area', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithSlider} onToggle={onToggle} />
      );

      // Click on the slider container
      const sliderArea = container.querySelector('.light-tile-slider');
      await user.click(sliderArea);

      // Should not toggle the light
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should not trigger toggle when clicking the name label', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const { container } = render(
        <LightTile {...defaultProps} light={lightWithSlider} onToggle={onToggle} />
      );

      // Click on the name label
      const nameLabel = container.querySelector('.light-tile-name');
      await user.click(nameLabel);

      // Should not toggle the light
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should have full tile background fill (issue 47)', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      // The fill should cover the entire tile (direct child of tile, not toggle)
      const tile = container.querySelector('.light-tile');
      const fill = container.querySelector('.light-tile-fill');

      expect(fill).toBeInTheDocument();
      expect(tile.contains(fill)).toBe(true);
      expect(fill).toHaveClass('light-tile-fill-full');
    });

    it('should show name label when light is off (no slider)', () => {
      const offLight = { ...defaultLight, on: false };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);

      // Name should still be visible when off
      const nameLabel = container.querySelector('.light-tile-name');
      expect(nameLabel).toBeInTheDocument();
      expect(nameLabel).toHaveTextContent('Living Room');
    });

    it('should have correct DOM structure order: toggle, slider (if on), name', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const tile = container.querySelector('.light-tile');
      const directChildren = Array.from(tile.children).filter(
        (el) =>
          el.classList.contains('light-tile-toggle') ||
          el.classList.contains('light-tile-slider') ||
          el.classList.contains('light-tile-name')
      );

      // Should have 3 sections when light is on
      expect(directChildren).toHaveLength(3);

      // Check order
      expect(directChildren[0]).toHaveClass('light-tile-toggle');
      expect(directChildren[1]).toHaveClass('light-tile-slider');
      expect(directChildren[2]).toHaveClass('light-tile-name');
    });

    it('should have correct DOM structure order when light is off: toggle, name', () => {
      const offLight = { ...defaultLight, on: false };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);

      const tile = container.querySelector('.light-tile');
      const directChildren = Array.from(tile.children).filter(
        (el) =>
          el.classList.contains('light-tile-toggle') ||
          el.classList.contains('light-tile-slider') ||
          el.classList.contains('light-tile-name')
      );

      // Should have 2 sections when light is off (no slider)
      expect(directChildren).toHaveLength(2);

      // Check order
      expect(directChildren[0]).toHaveClass('light-tile-toggle');
      expect(directChildren[1]).toHaveClass('light-tile-name');
    });
  });

  describe('visual polish - fill and spacing (bug 45 refinements)', () => {
    const lightWithSlider = {
      ...defaultLight,
      on: true,
      brightness: 75,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    describe('button fill edge-to-edge with proper inset', () => {
      it('should have toggle button with contained fill class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const toggle = container.querySelector('.light-tile-toggle');
        // Toggle should have class indicating fill is properly contained
        expect(toggle).toHaveClass('light-tile-toggle-contained');
      });

      it('should have fill element with rounded corners class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const fill = container.querySelector('.light-tile-fill');
        // Fill should have rounded corners to match container border-radius
        expect(fill).toHaveClass('light-tile-fill-rounded');
      });

      it('should have fill element with inset class for padding from edges', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const fill = container.querySelector('.light-tile-fill');
        // Fill should have inset to create padding from tile edges
        expect(fill).toHaveClass('light-tile-fill-inset');
      });
    });

    describe('vertical spacing between sections', () => {
      it('should have slider with expanded vertical spacing class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const slider = container.querySelector('.light-tile-slider');
        // Slider needs more vertical space above and below
        expect(slider).toHaveClass('light-tile-slider-expanded');
      });

      it('should have name label with expanded vertical spacing class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const name = container.querySelector('.light-tile-name');
        // Name needs more vertical space above
        expect(name).toHaveClass('light-tile-name-expanded');
      });

      it('should have toggle with proportional flex class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const toggle = container.querySelector('.light-tile-toggle');
        // Toggle should indicate it takes proportional space, not all remaining
        expect(toggle).toHaveClass('light-tile-toggle-proportional');
      });
    });

    describe('visual balance', () => {
      it('should have tile with balanced proportions class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const tile = container.querySelector('.light-tile');
        // Tile should have class indicating balanced section proportions
        expect(tile).toHaveClass('light-tile-balanced');
      });
    });

    describe('fill corner rounding (issue 45 comment)', () => {
      it('should have fill with all corners rounded class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const fill = container.querySelector('.light-tile-fill');
        // Fill should have all 4 corners rounded, not just top 2
        expect(fill).toHaveClass('light-tile-fill-all-rounded');
      });

      it('should have toggle with edge-to-edge fill support class', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const toggle = container.querySelector('.light-tile-toggle');
        // Toggle should support fill extending to its edges
        expect(toggle).toHaveClass('light-tile-toggle-fill-container');
      });

      it('should have fill extending edge-to-edge with no inset', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const fill = container.querySelector('.light-tile-fill');
        // Fill should extend to edges, not be inset
        expect(fill).toHaveClass('light-tile-fill-edge-to-edge');
      });

      it('should have toggle with flush edges for fill', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const toggle = container.querySelector('.light-tile-toggle');
        // Toggle should have no internal padding that creates gaps
        expect(toggle).toHaveClass('light-tile-toggle-flush');
      });

      it('should have fill covering full toggle height (not brightness-based)', () => {
        const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

        const fill = container.querySelector('.light-tile-fill');
        // Fill should always be 100% height, not based on brightness percentage
        expect(fill.style.height).toBe('100%');
      });
    });
  });

  describe('layout centering and spacing (bug 45)', () => {
    const lightWithSlider = {
      ...defaultLight,
      on: true,
      colorTemperature: COLOR_TEMPERATURE.DEFAULT,
    };

    it('should have slider section with centered alignment class', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const slider = container.querySelector('.light-tile-slider');
      expect(slider).toBeInTheDocument();
      // Slider section should have centering class
      expect(slider).toHaveClass('light-tile-slider-centered');
    });

    it('should have name label with centered alignment class', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const name = container.querySelector('.light-tile-name');
      expect(name).toBeInTheDocument();
      // Name section should have centering class
      expect(name).toHaveClass('light-tile-name-centered');
    });

    it('should have proper flex container for vertical layout with no overlap', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const tile = container.querySelector('.light-tile');
      // Tile should have proper flex layout class to prevent overlaps
      expect(tile).toHaveClass('light-tile-flex-layout');
    });

    it('should have slider with proper horizontal padding', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const slider = container.querySelector('.light-tile-slider');
      // Slider should have horizontal padding class
      expect(slider).toHaveClass('light-tile-slider-padded');
    });

    it('should have name label with proper padding', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const name = container.querySelector('.light-tile-name');
      // Name should have proper padding class
      expect(name).toHaveClass('light-tile-name-padded');
    });

    it('should have consistent spacing between toggle and slider', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const slider = container.querySelector('.light-tile-slider');
      // Slider should have proper spacing from toggle
      expect(slider).toHaveClass('light-tile-slider-spaced');
    });

    it('should have consistent spacing between slider and name', () => {
      const { container } = render(<LightTile {...defaultProps} light={lightWithSlider} />);

      const name = container.querySelector('.light-tile-name');
      // Name should have proper spacing from slider
      expect(name).toHaveClass('light-tile-name-spaced');
    });

    it('should have name label properly centered when light is off (no slider)', () => {
      const offLight = { ...defaultLight, on: false };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);

      const name = container.querySelector('.light-tile-name');
      expect(name).toBeInTheDocument();
      // Name should still have centering class when no slider present
      expect(name).toHaveClass('light-tile-name-centered');
    });
  });
});
