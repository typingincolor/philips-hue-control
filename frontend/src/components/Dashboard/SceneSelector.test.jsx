import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneSelector } from './SceneSelector';

describe('SceneSelector', () => {
  const mockScenes = [
    { id: 'scene-1', name: 'Bright' },
    { id: 'scene-2', name: 'Relax' },
    { id: 'scene-3', name: 'Concentrate' },
  ];

  it('should render scene icon buttons', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('should show tooltip with scene name on each button', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    expect(screen.getByTitle('Bright')).toBeInTheDocument();
    expect(screen.getByTitle('Relax')).toBeInTheDocument();
    expect(screen.getByTitle('Concentrate')).toBeInTheDocument();
  });

  it('should call onActivate when scene button is clicked', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    const relaxButton = screen.getByTitle('Relax');
    await user.click(relaxButton);

    expect(onActivate).toHaveBeenCalledWith('scene-2');
  });

  it('should disable all buttons when activating', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should return null when scenes array is empty', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <SceneSelector scenes={[]} onActivate={onActivate} isActivating={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when scenes is null', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <SceneSelector scenes={null} onActivate={onActivate} isActivating={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have correct CSS class', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />
    );

    expect(container.querySelector('.scene-icons')).toBeInTheDocument();
    expect(container.querySelector('.scene-icon-button')).toBeInTheDocument();
  });

  it('should render scene names in tooltips', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    // Check tooltip spans exist
    expect(screen.getByText('Bright')).toBeInTheDocument();
    expect(screen.getByText('Relax')).toBeInTheDocument();
    expect(screen.getByText('Concentrate')).toBeInTheDocument();
  });
});
