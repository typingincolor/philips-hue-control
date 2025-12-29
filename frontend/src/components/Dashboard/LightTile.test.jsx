import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightTile } from './LightTile';

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
    it('should set fill height based on brightness percentage', () => {
      const { container } = render(<LightTile {...defaultProps} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('75%');
    });

    it('should set fill height to 0% when light is off', () => {
      const offLight = { ...defaultLight, on: false, brightness: 75 };
      const { container } = render(<LightTile {...defaultProps} light={offLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('0%');
    });

    it('should handle 0% brightness when on', () => {
      const dimLight = { ...defaultLight, brightness: 0 };
      const { container } = render(<LightTile {...defaultProps} light={dimLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('0%');
    });

    it('should handle 100% brightness', () => {
      const brightLight = { ...defaultLight, brightness: 100 };
      const { container } = render(<LightTile {...defaultProps} light={brightLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('100%');
    });

    it('should handle undefined brightness when on', () => {
      const noBrightnessLight = { ...defaultLight, brightness: undefined };
      const { container } = render(<LightTile {...defaultProps} light={noBrightnessLight} />);
      const fill = container.querySelector('.light-tile-fill');
      expect(fill.style.height).toBe('0%');
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
      render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const button = screen.getByRole('button');
      expect(button.style.boxShadow).toBe('0 0 20px rgba(255, 200, 130, 0.5)');
    });

    it('should not apply shadow when brightness < 50', () => {
      const lightWithShadow = {
        ...defaultLight,
        brightness: 40,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const button = screen.getByRole('button');
      expect(button.style.boxShadow).toBe('');
    });

    it('should not apply shadow when light is off', () => {
      const lightWithShadow = {
        ...defaultLight,
        on: false,
        brightness: 75,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const button = screen.getByRole('button');
      expect(button.style.boxShadow).toBe('');
    });

    it('should not apply shadow when no shadow property', () => {
      const lightNoShadow = { ...defaultLight, brightness: 75 };
      render(<LightTile {...defaultProps} light={lightNoShadow} />);
      const button = screen.getByRole('button');
      expect(button.style.boxShadow).toBe('');
    });

    it('should apply shadow at exactly 50% brightness', () => {
      const lightWithShadow = {
        ...defaultLight,
        brightness: 50,
        shadow: '0 0 20px rgba(255, 200, 130, 0.5)',
      };
      render(<LightTile {...defaultProps} light={lightWithShadow} />);
      const button = screen.getByRole('button');
      expect(button.style.boxShadow).toBe('0 0 20px rgba(255, 200, 130, 0.5)');
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
});
