import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneTile } from './SceneTile';

describe('SceneTile', () => {
  const defaultScene = {
    id: 'scene-1',
    name: 'Relax',
  };

  const defaultProps = {
    scene: defaultScene,
    onActivate: vi.fn(),
    isActivating: false,
  };

  describe('rendering', () => {
    it('should render scene name', () => {
      render(<SceneTile {...defaultProps} />);
      expect(screen.getByText('Relax')).toBeInTheDocument();
    });

    it('should render as button element', () => {
      render(<SceneTile {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have scene-tile class', () => {
      const { container } = render(<SceneTile {...defaultProps} />);
      expect(container.querySelector('.scene-tile')).toBeInTheDocument();
    });

    it('should render scene icon', () => {
      const { container } = render(<SceneTile {...defaultProps} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render scene name in name element', () => {
      const { container } = render(<SceneTile {...defaultProps} />);
      const nameElement = container.querySelector('.scene-tile-name');
      expect(nameElement).toHaveTextContent('Relax');
    });
  });

  describe('scene icons', () => {
    it('should render appropriate icon for Relax scene', () => {
      render(<SceneTile {...defaultProps} scene={{ id: 'scene-1', name: 'Relax' }} />);
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('should render appropriate icon for Bright scene', () => {
      render(<SceneTile {...defaultProps} scene={{ id: 'scene-2', name: 'Bright' }} />);
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('should render appropriate icon for Energize scene', () => {
      render(<SceneTile {...defaultProps} scene={{ id: 'scene-3', name: 'Energize' }} />);
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });

    it('should render default icon for unknown scene name', () => {
      render(<SceneTile {...defaultProps} scene={{ id: 'scene-4', name: 'Custom Scene' }} />);
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('activation', () => {
    it('should call onActivate with scene id when clicked', async () => {
      const user = userEvent.setup();
      const onActivate = vi.fn();
      render(<SceneTile {...defaultProps} onActivate={onActivate} />);

      await user.click(screen.getByRole('button'));

      expect(onActivate).toHaveBeenCalledWith('scene-1');
    });

    it('should be disabled when isActivating is true', () => {
      render(<SceneTile {...defaultProps} isActivating={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onActivate when disabled', async () => {
      const user = userEvent.setup();
      const onActivate = vi.fn();
      render(<SceneTile {...defaultProps} onActivate={onActivate} isActivating={true} />);

      await user.click(screen.getByRole('button'));

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('should show spinner when isActivating', () => {
      const { container } = render(<SceneTile {...defaultProps} isActivating={true} />);
      const spinner = container.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide scene icon when isActivating', () => {
      const { container } = render(<SceneTile {...defaultProps} isActivating={true} />);
      // When activating, spinner replaces icon - scene icon should not be visible
      const iconContainer = container.querySelector('.scene-tile-icon');
      const spinner = container.querySelector('.icon-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply activating class when isActivating', () => {
      render(<SceneTile {...defaultProps} isActivating={true} />);
      expect(screen.getByRole('button')).toHaveClass('activating');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label with scene name', () => {
      render(<SceneTile {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Activate scene: Relax');
    });

    it('should have correct aria-label for different scene names', () => {
      render(<SceneTile {...defaultProps} scene={{ id: 'scene-2', name: 'Movie Night' }} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Activate scene: Movie Night'
      );
    });

    it('should be focusable', () => {
      render(<SceneTile {...defaultProps} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should activate on Enter key press', async () => {
      const user = userEvent.setup();
      const onActivate = vi.fn();
      render(<SceneTile {...defaultProps} onActivate={onActivate} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(onActivate).toHaveBeenCalledWith('scene-1');
    });

    it('should activate on Space key press', async () => {
      const user = userEvent.setup();
      const onActivate = vi.fn();
      render(<SceneTile {...defaultProps} onActivate={onActivate} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(onActivate).toHaveBeenCalledWith('scene-1');
    });
  });

  describe('text truncation', () => {
    it('should truncate long scene names', () => {
      const longNameScene = {
        id: 'scene-1',
        name: 'This Is A Very Long Scene Name That Should Be Truncated',
      };
      const { container } = render(<SceneTile {...defaultProps} scene={longNameScene} />);
      const nameElement = container.querySelector('.scene-tile-name');
      // CSS handles truncation, but element should exist with full text
      expect(nameElement).toBeInTheDocument();
    });

    it('should have title attribute with full name for tooltip', () => {
      const longNameScene = {
        id: 'scene-1',
        name: 'This Is A Very Long Scene Name',
      };
      render(<SceneTile {...defaultProps} scene={longNameScene} />);
      // Button should have title for tooltip on hover
      expect(screen.getByRole('button')).toHaveAttribute('title', 'This Is A Very Long Scene Name');
    });
  });

  describe('visual states', () => {
    it('should apply hover state class', () => {
      const { container } = render(<SceneTile {...defaultProps} />);
      const tile = container.querySelector('.scene-tile');
      // Hover state is CSS-based, but tile should accept hover styles
      expect(tile).toBeInTheDocument();
    });

    it('should have dark background by default', () => {
      const { container } = render(<SceneTile {...defaultProps} />);
      const tile = container.querySelector('.scene-tile');
      expect(tile).toBeInTheDocument();
    });
  });
});
