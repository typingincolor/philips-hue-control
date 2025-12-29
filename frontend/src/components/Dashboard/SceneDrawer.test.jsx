import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneDrawer } from './SceneDrawer';

describe('SceneDrawer', () => {
  const mockScenes = [
    { id: 'scene-1', name: 'Relax' },
    { id: 'scene-2', name: 'Energize' },
    { id: 'scene-3', name: 'Movie Night' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    scenes: mockScenes,
    onActivateScene: vi.fn(),
    onToggleRoom: vi.fn(),
    roomId: 'room-1',
    anyOn: true,
    isActivating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(<SceneDrawer {...defaultProps} isOpen={false} />);
      expect(container.querySelector('.scene-drawer')).not.toBeInTheDocument();
    });

    it('should render drawer when isOpen is true', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      expect(container.querySelector('.scene-drawer')).toBeInTheDocument();
    });

    it('should render overlay when open', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      expect(container.querySelector('.scene-drawer-overlay')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<SceneDrawer {...defaultProps} />);
      expect(screen.getByText('Scenes')).toBeInTheDocument();
    });

    it('should render close button in header', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      expect(container.querySelector('.scene-drawer-close')).toBeInTheDocument();
    });
  });

  describe('scene list', () => {
    it('should render all scenes', () => {
      render(<SceneDrawer {...defaultProps} />);
      expect(screen.getByText('Relax')).toBeInTheDocument();
      expect(screen.getByText('Energize')).toBeInTheDocument();
      expect(screen.getByText('Movie Night')).toBeInTheDocument();
    });

    it('should render scene items as buttons', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      const sceneButtons = container.querySelectorAll('.scene-drawer-item');
      expect(sceneButtons).toHaveLength(3);
    });

    it('should show empty state when no scenes', () => {
      render(<SceneDrawer {...defaultProps} scenes={[]} />);
      expect(screen.getByText('No scenes available')).toBeInTheDocument();
    });

    it('should show empty state when scenes is undefined', () => {
      render(<SceneDrawer {...defaultProps} scenes={undefined} />);
      expect(screen.getByText('No scenes available')).toBeInTheDocument();
    });

    it('should render scene icon for each scene', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      const iconContainers = container.querySelectorAll('.scene-drawer-item-icon');
      expect(iconContainers).toHaveLength(3);
    });

    it('should render scene name for each scene', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      const nameSpans = container.querySelectorAll('.scene-drawer-item-name');
      expect(nameSpans).toHaveLength(3);
      expect(nameSpans[0]).toHaveTextContent('Relax');
      expect(nameSpans[1]).toHaveTextContent('Energize');
      expect(nameSpans[2]).toHaveTextContent('Movie Night');
    });
  });

  describe('scene activation', () => {
    it('should call onActivateScene and onClose when scene is clicked', async () => {
      const user = userEvent.setup();
      const onActivateScene = vi.fn();
      const onClose = vi.fn();

      render(
        <SceneDrawer {...defaultProps} onActivateScene={onActivateScene} onClose={onClose} />
      );

      await user.click(screen.getByText('Relax'));

      expect(onActivateScene).toHaveBeenCalledWith('scene-1');
      expect(onClose).toHaveBeenCalled();
    });

    it('should disable scene buttons when isActivating is true', () => {
      const { container } = render(<SceneDrawer {...defaultProps} isActivating={true} />);
      const sceneButtons = container.querySelectorAll('.scene-drawer-item');

      sceneButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should show spinner for each scene when isActivating', () => {
      const { container } = render(<SceneDrawer {...defaultProps} isActivating={true} />);
      const spinners = container.querySelectorAll('.icon-spin');
      expect(spinners).toHaveLength(3);
    });

    it('should not show spinner when not activating', () => {
      const { container } = render(<SceneDrawer {...defaultProps} isActivating={false} />);
      const spinners = container.querySelectorAll('.icon-spin');
      expect(spinners).toHaveLength(0);
    });
  });

  describe('toggle room button', () => {
    it('should show "Turn All Off" when anyOn is true', () => {
      render(<SceneDrawer {...defaultProps} anyOn={true} />);
      expect(screen.getByText('Turn All Off')).toBeInTheDocument();
    });

    it('should show "Turn All On" when anyOn is false', () => {
      render(<SceneDrawer {...defaultProps} anyOn={false} />);
      expect(screen.getByText('Turn All On')).toBeInTheDocument();
    });

    it('should have on class when anyOn is true', () => {
      const { container } = render(<SceneDrawer {...defaultProps} anyOn={true} />);
      const toggleButton = container.querySelector('.scene-drawer-toggle');
      expect(toggleButton).toHaveClass('on');
    });

    it('should have off class when anyOn is false', () => {
      const { container } = render(<SceneDrawer {...defaultProps} anyOn={false} />);
      const toggleButton = container.querySelector('.scene-drawer-toggle');
      expect(toggleButton).toHaveClass('off');
    });

    it('should call onToggleRoom with roomId and false when turning off', async () => {
      const user = userEvent.setup();
      const onToggleRoom = vi.fn();
      const onClose = vi.fn();

      render(
        <SceneDrawer
          {...defaultProps}
          anyOn={true}
          onToggleRoom={onToggleRoom}
          onClose={onClose}
        />
      );

      await user.click(screen.getByText('Turn All Off'));

      expect(onToggleRoom).toHaveBeenCalledWith('room-1', false);
      expect(onClose).toHaveBeenCalled();
    });

    it('should call onToggleRoom with roomId and true when turning on', async () => {
      const user = userEvent.setup();
      const onToggleRoom = vi.fn();
      const onClose = vi.fn();

      render(
        <SceneDrawer
          {...defaultProps}
          anyOn={false}
          onToggleRoom={onToggleRoom}
          onClose={onClose}
        />
      );

      await user.click(screen.getByText('Turn All On'));

      expect(onToggleRoom).toHaveBeenCalledWith('room-1', true);
      expect(onClose).toHaveBeenCalled();
    });

    it('should render in footer section', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      const footer = container.querySelector('.scene-drawer-footer');
      const toggleButton = footer.querySelector('.scene-drawer-toggle');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { container } = render(<SceneDrawer {...defaultProps} onClose={onClose} />);

      await user.click(container.querySelector('.scene-drawer-close'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { container } = render(<SceneDrawer {...defaultProps} onClose={onClose} />);

      await user.click(container.querySelector('.scene-drawer-overlay'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<SceneDrawer {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<SceneDrawer {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not respond to Escape when closed', () => {
      const onClose = vi.fn();
      render(<SceneDrawer {...defaultProps} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('should set body overflow to hidden when opened', () => {
      render(<SceneDrawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should reset body overflow when closed', () => {
      const { rerender } = render(<SceneDrawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<SceneDrawer {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('should reset body overflow on unmount', () => {
      const { unmount } = render(<SceneDrawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('should not set overflow when initially closed', () => {
      render(<SceneDrawer {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('keyboard event cleanup', () => {
    it('should remove keydown listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<SceneDrawer {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('icons', () => {
    it('should render Moon icon when anyOn is true', () => {
      const { container } = render(<SceneDrawer {...defaultProps} anyOn={true} />);
      const toggleButton = container.querySelector('.scene-drawer-toggle');
      // Moon icon should be rendered
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Sun icon when anyOn is false', () => {
      const { container } = render(<SceneDrawer {...defaultProps} anyOn={false} />);
      const toggleButton = container.querySelector('.scene-drawer-toggle');
      // Sun icon should be rendered
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render X icon in close button', () => {
      const { container } = render(<SceneDrawer {...defaultProps} />);
      const closeButton = container.querySelector('.scene-drawer-close');
      expect(closeButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
