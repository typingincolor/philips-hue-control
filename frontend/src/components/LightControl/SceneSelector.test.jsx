import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneSelector } from './SceneSelector';

describe('SceneSelector', () => {
  const mockScenes = [
    { id: 'scene-1', name: 'Bright' },
    { id: 'scene-2', name: 'Relax' },
    { id: 'scene-3', name: 'Concentrate' }
  ];

  it('should render with scenes', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('🎨 Select Scene')).toBeInTheDocument();
  });

  it('should render all scene options', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    expect(screen.getByText('Bright')).toBeInTheDocument();
    expect(screen.getByText('Relax')).toBeInTheDocument();
    expect(screen.getByText('Concentrate')).toBeInTheDocument();
  });

  it('should call onActivate when scene is selected', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'scene-2');

    expect(onActivate).toHaveBeenCalledWith('scene-2');
  });

  it('should not call onActivate when placeholder is selected', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('should be disabled when activating', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should show activating message when activating', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={true} />);

    expect(screen.getByText('⏳ Activating...')).toBeInTheDocument();
  });

  it('should show default message when not activating', () => {
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    expect(screen.getByText('🎨 Select Scene')).toBeInTheDocument();
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

  it('should reset select value after selection', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'scene-1');

    expect(select.value).toBe('');
  });

  it('should have correct CSS class', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <SceneSelector scenes={mockScenes} onActivate={onActivate} isActivating={false} />
    );

    expect(container.querySelector('.scene-control')).toBeInTheDocument();
    expect(container.querySelector('.scene-selector')).toBeInTheDocument();
  });
});
