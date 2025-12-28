import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationsView } from './AutomationsView';
import { UI_TEXT } from '../../constants/uiText';

describe('AutomationsView', () => {
  const mockAutomations = [
    {
      id: 'automation-1',
      name: 'Good Morning',
      type: 'behavior_instance',
      scriptId: 'wake_up',
      enabled: true,
      triggerTime: { hour: 7, minute: 0 },
    },
    {
      id: 'automation-2',
      name: 'Movie Time',
      type: 'behavior_instance',
      scriptId: 'timer',
      enabled: true,
    },
    {
      id: 'automation-3',
      name: 'Goodnight',
      type: 'behavior_instance',
      scriptId: 'go_to_sleep',
      enabled: false,
    },
  ];

  const defaultProps = {
    automations: mockAutomations,
    onTrigger: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render automations view container', () => {
      const { container } = render(<AutomationsView {...defaultProps} />);
      expect(container.querySelector('.automations-view')).toBeInTheDocument();
    });

    it('should render automation cards for each automation', () => {
      render(<AutomationsView {...defaultProps} />);

      expect(screen.getByText('Good Morning')).toBeInTheDocument();
      expect(screen.getByText('Movie Time')).toBeInTheDocument();
      expect(screen.getByText('Goodnight')).toBeInTheDocument();
    });

    it('should render trigger button for each automation', () => {
      const { container } = render(<AutomationsView {...defaultProps} />);

      const triggerButtons = container.querySelectorAll('.automation-trigger');
      expect(triggerButtons).toHaveLength(3);
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<AutomationsView {...defaultProps} isLoading={true} automations={[]} />);

      expect(screen.getByText(UI_TEXT.AUTOMATIONS_LOADING)).toBeInTheDocument();
    });

    it('should not show automations while loading', () => {
      render(<AutomationsView {...defaultProps} isLoading={true} />);

      expect(screen.queryByText('Good Morning')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no automations exist', () => {
      render(<AutomationsView {...defaultProps} automations={[]} />);

      expect(screen.getByText(UI_TEXT.AUTOMATIONS_EMPTY)).toBeInTheDocument();
    });

    it('should show empty state message with helpful text', () => {
      render(<AutomationsView {...defaultProps} automations={[]} />);

      expect(screen.getByText(UI_TEXT.AUTOMATIONS_EMPTY_HINT)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when error prop is set', () => {
      render(<AutomationsView {...defaultProps} error="Failed to load automations" />);

      expect(screen.getByText(UI_TEXT.AUTOMATIONS_ERROR)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const onRetry = vi.fn();
      render(<AutomationsView {...defaultProps} error="Network error" onRetry={onRetry} />);

      expect(screen.getByText(UI_TEXT.RETRY)).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<AutomationsView {...defaultProps} error="Network error" onRetry={onRetry} />);

      await user.click(screen.getByText(UI_TEXT.RETRY));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('trigger automation', () => {
    it('should call onTrigger with automation ID when trigger button is clicked', async () => {
      const user = userEvent.setup();
      const onTrigger = vi.fn();
      render(<AutomationsView {...defaultProps} onTrigger={onTrigger} />);

      const triggerButtons = screen.getAllByRole('button', { name: /Trigger/i });
      await user.click(triggerButtons[0]);

      expect(onTrigger).toHaveBeenCalledWith('automation-1');
    });

    it('should disable trigger button for disabled automations', () => {
      render(<AutomationsView {...defaultProps} />);

      // The third automation is disabled
      const triggerButtons = screen.getAllByRole('button', { name: /Trigger/i });
      expect(triggerButtons[2]).toBeDisabled();
    });
  });

  describe('triggering state', () => {
    it('should show spinner on triggering automation', () => {
      const { container } = render(
        <AutomationsView {...defaultProps} triggeringId="automation-1" />
      );

      const firstCard = container.querySelectorAll('.automation-card')[0];
      expect(firstCard.querySelector('.spinner')).toBeInTheDocument();
    });

    it('should disable trigger button while triggering', () => {
      render(<AutomationsView {...defaultProps} triggeringId="automation-1" />);

      const triggerButtons = screen.getAllByRole('button', { name: /Trigger/i });
      expect(triggerButtons[0]).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label on trigger buttons', () => {
      render(<AutomationsView {...defaultProps} />);

      const triggerButtons = screen.getAllByRole('button', { name: /Trigger/i });
      expect(triggerButtons[0]).toHaveAttribute('aria-label', 'Trigger Good Morning');
    });

    it('should have role="list" on automations container', () => {
      const { container } = render(<AutomationsView {...defaultProps} />);

      expect(container.querySelector('.automations-list')).toHaveAttribute('role', 'list');
    });

    it('should have role="listitem" on automation cards', () => {
      const { container } = render(<AutomationsView {...defaultProps} />);

      const cards = container.querySelectorAll('.automation-card');
      cards.forEach((card) => {
        expect(card).toHaveAttribute('role', 'listitem');
      });
    });
  });
});
