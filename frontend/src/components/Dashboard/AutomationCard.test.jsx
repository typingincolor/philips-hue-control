import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationCard } from './AutomationCard';

describe('AutomationCard', () => {
  const mockAutomation = {
    id: 'automation-1',
    name: 'Good Morning',
    type: 'behavior_instance',
    scriptId: 'wake_up',
    enabled: true,
    triggerTime: { hour: 7, minute: 0 },
    recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  };

  const defaultProps = {
    automation: mockAutomation,
    onTrigger: vi.fn(),
    isTriggering: false,
  };

  describe('rendering', () => {
    it('should render automation card with correct class', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);
      expect(container.querySelector('.automation-card')).toBeInTheDocument();
    });

    it('should display automation name with correct class', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);
      expect(container.querySelector('.automation-name')).toHaveTextContent('Good Morning');
    });

    it('should display automation description/type', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);
      expect(container.querySelector('.automation-description')).toBeInTheDocument();
    });

    it('should render trigger button', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);
      expect(container.querySelector('.automation-trigger')).toBeInTheDocument();
    });

    it('should render automation icon', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);
      expect(container.querySelector('.automation-icon')).toBeInTheDocument();
    });
  });

  describe('trigger functionality', () => {
    it('should call onTrigger when trigger button is clicked', async () => {
      const user = userEvent.setup();
      const onTrigger = vi.fn();
      render(<AutomationCard {...defaultProps} onTrigger={onTrigger} />);

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      await user.click(triggerButton);

      expect(onTrigger).toHaveBeenCalledWith('automation-1');
    });

    it('should disable trigger button when isTriggering is true', () => {
      render(<AutomationCard {...defaultProps} isTriggering={true} />);

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      expect(triggerButton).toBeDisabled();
    });

    it('should show spinner when isTriggering is true', () => {
      const { container } = render(<AutomationCard {...defaultProps} isTriggering={true} />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('should not show spinner when not triggering', () => {
      const { container } = render(<AutomationCard {...defaultProps} isTriggering={false} />);

      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should disable trigger button when automation is disabled', () => {
      const disabledAutomation = { ...mockAutomation, enabled: false };
      render(<AutomationCard {...defaultProps} automation={disabledAutomation} />);

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      expect(triggerButton).toBeDisabled();
    });

    it('should apply disabled class when automation is disabled', () => {
      const disabledAutomation = { ...mockAutomation, enabled: false };
      const { container } = render(
        <AutomationCard {...defaultProps} automation={disabledAutomation} />
      );

      expect(container.querySelector('.automation-card')).toHaveClass('disabled');
    });

    it('should not call onTrigger when disabled automation trigger is clicked', async () => {
      const user = userEvent.setup();
      const onTrigger = vi.fn();
      const disabledAutomation = { ...mockAutomation, enabled: false };
      render(
        <AutomationCard {...defaultProps} automation={disabledAutomation} onTrigger={onTrigger} />
      );

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      await user.click(triggerButton);

      expect(onTrigger).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on trigger button', () => {
      render(<AutomationCard {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      expect(triggerButton).toHaveAttribute('aria-label', 'Trigger Good Morning');
    });

    it('should have role="listitem"', () => {
      const { container } = render(<AutomationCard {...defaultProps} />);

      expect(container.querySelector('.automation-card')).toHaveAttribute('role', 'listitem');
    });

    it('should indicate disabled state for screen readers', () => {
      const disabledAutomation = { ...mockAutomation, enabled: false };
      render(<AutomationCard {...defaultProps} automation={disabledAutomation} />);

      const triggerButton = screen.getByRole('button', { name: /Trigger/i });
      expect(triggerButton).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
