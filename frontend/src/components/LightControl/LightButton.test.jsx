import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightButton } from './LightButton';

describe('LightButton', () => {
  const mockLight = {
    id: 'light-1',
    name: 'Living Room Light',
    on: true,
    brightness: 75,
    color: 'rgb(255, 200, 100)',
    shadow: '0 0 20px rgba(255, 200, 100, 0.4)',
    colorSource: 'xy'
  };

  it('should render light name', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
  });

  it('should show Unknown Light when name is missing', () => {
    const lightWithoutName = { ...mockLight, name: '' };
    const onToggle = vi.fn();
    render(<LightButton light={lightWithoutName} onToggle={onToggle} isToggling={false} />);

    expect(screen.getByText('Unknown Light')).toBeInTheDocument();
  });

  it('should call onToggle with light ID when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggle).toHaveBeenCalledWith('light-1');
  });

  it('should be disabled when toggling', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not be disabled when not toggling', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={false} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should have "on" class when light is on', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('on');
  });

  it('should have "off" class when light is off', () => {
    const offLight = { ...mockLight, on: false };
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={offLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('off');
  });

  it('should render bulb icon when not toggling', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const svg = container.querySelector('.bulb-icon');
    expect(svg).toBeInTheDocument();
  });

  it('should render loading emoji when toggling', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} isToggling={true} />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('should apply pre-computed color from backend', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button.style.background).toContain('rgb(255, 200, 100)');
  });

  it('should apply pre-computed shadow from backend', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button.style.boxShadow).toBe('0 0 20px rgba(255, 200, 100, 0.4)');
  });

  it('should handle light without color', () => {
    const offLight = { ...mockLight, on: false, color: null, shadow: null };
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={offLight} onToggle={onToggle} isToggling={false} />
    );

    const button = container.querySelector('button');
    expect(button.style.background).toBe('');
    expect(button.style.boxShadow).toBe('');
  });

  it('should have correct structure', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <LightButton light={mockLight} onToggle={onToggle} isToggling={false} />
    );

    expect(container.querySelector('.light-card')).toBeInTheDocument();
    expect(container.querySelector('.light-bulb-button')).toBeInTheDocument();
    expect(container.querySelector('.light-label')).toBeInTheDocument();
  });

  it('should handle isToggling undefined', () => {
    const onToggle = vi.fn();
    render(<LightButton light={mockLight} onToggle={onToggle} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should display different color sources correctly', () => {
    const temperatures = [
      { ...mockLight, color: 'rgb(255, 245, 235)', colorSource: 'temperature' },
      { ...mockLight, color: 'rgb(255, 200, 130)', colorSource: 'fallback' },
      { ...mockLight, color: 'rgb(255, 180, 120)', colorSource: 'xy' }
    ];

    temperatures.forEach((light) => {
      const onToggle = vi.fn();
      const { container } = render(
        <LightButton light={light} onToggle={onToggle} isToggling={false} />
      );

      const button = container.querySelector('button');
      expect(button.style.background).toContain(light.color);
    });
  });
});
