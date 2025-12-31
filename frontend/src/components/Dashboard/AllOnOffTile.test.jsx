import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllOnOffTile } from './AllOnOffTile';

describe('AllOnOffTile', () => {
  const defaultProps = {
    anyOn: true,
    onToggle: vi.fn(),
    roomId: 'room-1',
    isToggling: false,
  };

  describe('rendering', () => {
    it('should render as button element', () => {
      render(<AllOnOffTile {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have all-on-off-tile class', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} />);
      expect(container.querySelector('.all-on-off-tile')).toBeInTheDocument();
    });

    it('should render icon', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('lights on state', () => {
    it('should show "All Off" label when lights are on', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      expect(screen.getByText('All Off')).toBeInTheDocument();
    });

    it('should render Moon icon when lights are on', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      // Moon icon should be rendered when lights are on (to turn off)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have on class when lights are on', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      expect(screen.getByRole('button')).toHaveClass('on');
    });

    it('should have warm/orange accent background when lights are on', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      const tile = container.querySelector('.all-on-off-tile');
      expect(tile).toHaveClass('on');
    });
  });

  describe('lights off state', () => {
    it('should show "All On" label when lights are off', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      expect(screen.getByText('All On')).toBeInTheDocument();
    });

    it('should render Sun icon when lights are off', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      // Sun icon should be rendered when lights are off (to turn on)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have off class when lights are off', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      expect(screen.getByRole('button')).toHaveClass('off');
    });

    it('should have blue accent background when lights are off', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      const tile = container.querySelector('.all-on-off-tile');
      expect(tile).toHaveClass('off');
    });
  });

  describe('toggle functionality', () => {
    it('should call onToggle with roomId and false when turning off', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<AllOnOffTile {...defaultProps} anyOn={true} onToggle={onToggle} />);

      await user.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledWith('room-1', false);
    });

    it('should call onToggle with roomId and true when turning on', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<AllOnOffTile {...defaultProps} anyOn={false} onToggle={onToggle} />);

      await user.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledWith('room-1', true);
    });

    it('should be disabled when isToggling is true', () => {
      render(<AllOnOffTile {...defaultProps} isToggling={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onToggle when disabled', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<AllOnOffTile {...defaultProps} onToggle={onToggle} isToggling={true} />);

      await user.click(screen.getByRole('button'));

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should show spinner when isToggling', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} isToggling={true} />);
      const spinner = container.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply toggling class when isToggling', () => {
      render(<AllOnOffTile {...defaultProps} isToggling={true} />);
      expect(screen.getByRole('button')).toHaveClass('toggling');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label "Turn all lights off" when lights are on', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Turn all lights off');
    });

    it('should have aria-label "Turn all lights on" when lights are off', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Turn all lights on');
    });

    it('should have aria-pressed attribute reflecting state', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-pressed false when lights are off', () => {
      render(<AllOnOffTile {...defaultProps} anyOn={false} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('should be focusable', () => {
      render(<AllOnOffTile {...defaultProps} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should toggle on Enter key press', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<AllOnOffTile {...defaultProps} onToggle={onToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(onToggle).toHaveBeenCalled();
    });

    it('should toggle on Space key press', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<AllOnOffTile {...defaultProps} onToggle={onToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('visual distinction', () => {
    it('should have distinct styling from scene tiles', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} />);
      const tile = container.querySelector('.all-on-off-tile');
      // All On/Off tile should NOT have scene-tile class
      expect(tile).not.toHaveClass('scene-tile');
    });

    it('should render label in tile-name element', () => {
      const { container } = render(<AllOnOffTile {...defaultProps} anyOn={true} />);
      const nameElement = container.querySelector('.all-on-off-tile-name');
      expect(nameElement).toHaveTextContent('All Off');
    });
  });
});
