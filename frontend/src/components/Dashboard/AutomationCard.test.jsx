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

  describe('formatTriggerTime', () => {
    it('should format morning time with AM', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 7, minute: 0 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('7:00 AM');
    });

    it('should format afternoon time with PM', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 14, minute: 30 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('2:30 PM');
    });

    it('should format midnight as 12:00 AM', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 0, minute: 0 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('12:00 AM');
    });

    it('should format noon as 12:00 PM', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 12, minute: 0 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('12:00 PM');
    });

    it('should pad single digit minutes with zero', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 9, minute: 5 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('9:05 AM');
    });

    it('should handle 11:59 PM correctly', () => {
      const automation = { ...mockAutomation, triggerTime: { hour: 23, minute: 59 } };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('11:59 PM');
    });

    it('should handle missing triggerTime', () => {
      const automation = { ...mockAutomation, triggerTime: null };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).not.toHaveTextContent('AM');
      expect(container.querySelector('.automation-description')).not.toHaveTextContent('PM');
    });
  });

  describe('formatRecurrenceDays', () => {
    it('should show Mon-Fri for weekdays', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Mon-Fri');
    });

    it('should show Weekends for Saturday and Sunday', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: ['saturday', 'sunday'],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Weekends');
    });

    it('should show Every day for all seven days', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Every day');
    });

    it('should show individual days for custom selection', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: ['monday', 'wednesday', 'friday'],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent(
        'Mon, Wed, Fri'
      );
    });

    it('should sort days in week order', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: ['friday', 'monday', 'wednesday'], // Out of order
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent(
        'Mon, Wed, Fri'
      );
    });

    it('should handle single day', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: ['sunday'],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Sun');
    });

    it('should handle empty recurrenceDays', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: [],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).not.toHaveTextContent('Mon');
    });

    it('should handle null recurrenceDays', () => {
      const automation = {
        ...mockAutomation,
        recurrenceDays: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toBeInTheDocument();
    });
  });

  describe('formatStyleInfo', () => {
    it('should capitalize style name', () => {
      const automation = {
        ...mockAutomation,
        styleInfo: { style: 'sunset', fadeOutMinutes: null },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Sunset');
    });

    it('should show fade out minutes', () => {
      const automation = {
        ...mockAutomation,
        styleInfo: { style: 'relax', fadeOutMinutes: 15 },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('15 min fade');
    });

    it('should combine style and fade info', () => {
      const automation = {
        ...mockAutomation,
        styleInfo: { style: 'sunset', fadeOutMinutes: 30 },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('Sunset');
      expect(description).toContain('30 min fade');
    });

    it('should handle styleInfo with only fadeOutMinutes', () => {
      const automation = {
        ...mockAutomation,
        styleInfo: { fadeOutMinutes: 10 },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('10 min fade');
    });

    it('should handle null styleInfo', () => {
      const automation = {
        ...mockAutomation,
        styleInfo: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toBeInTheDocument();
    });
  });

  describe('formatTargets', () => {
    it('should show group names', () => {
      const automation = {
        ...mockAutomation,
        targets: {
          groups: [{ id: 'g1', name: 'Bedroom', type: 'room' }],
          lights: [],
        },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Bedroom');
    });

    it('should show multiple group names joined', () => {
      const automation = {
        ...mockAutomation,
        targets: {
          groups: [
            { id: 'g1', name: 'Bedroom', type: 'room' },
            { id: 'g2', name: 'Living Room', type: 'room' },
          ],
          lights: [],
        },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent(
        'Bedroom, Living Room'
      );
    });

    it('should show light count singular', () => {
      const automation = {
        ...mockAutomation,
        targets: {
          groups: [],
          lights: [{ id: 'l1', name: 'Lamp' }],
        },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('1 light');
    });

    it('should show light count plural', () => {
      const automation = {
        ...mockAutomation,
        targets: {
          groups: [],
          lights: [
            { id: 'l1', name: 'Lamp 1' },
            { id: 'l2', name: 'Lamp 2' },
            { id: 'l3', name: 'Lamp 3' },
          ],
        },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('3 lights');
    });

    it('should combine groups and lights', () => {
      const automation = {
        ...mockAutomation,
        targets: {
          groups: [{ id: 'g1', name: 'Bedroom', type: 'room' }],
          lights: [{ id: 'l1', name: 'Lamp 1' }, { id: 'l2', name: 'Lamp 2' }],
        },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('Bedroom');
      expect(description).toContain('2 lights');
    });

    it('should handle null targets', () => {
      const automation = {
        ...mockAutomation,
        targets: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toBeInTheDocument();
    });

    it('should handle empty targets', () => {
      const automation = {
        ...mockAutomation,
        targets: { groups: [], lights: [] },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toBeInTheDocument();
    });
  });

  describe('getAutomationDescription', () => {
    it('should combine all parts with separators', () => {
      const automation = {
        ...mockAutomation,
        triggerTime: { hour: 7, minute: 0 },
        recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        targets: { groups: [{ id: 'g1', name: 'Bedroom', type: 'room' }], lights: [] },
        styleInfo: { style: 'sunrise', fadeOutMinutes: 15 },
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('Bedroom');
      expect(description).toContain('7:00 AM');
      expect(description).toContain('Mon-Fri');
      expect(description).toContain('Sunrise');
      expect(description).toContain('15 min fade');
    });

    it('should show only time and days when no targets or style', () => {
      const automation = {
        ...mockAutomation,
        triggerTime: { hour: 22, minute: 0 },
        recurrenceDays: ['saturday', 'sunday'],
        targets: null,
        styleInfo: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('10:00 PM');
      expect(description).toContain('Weekends');
    });

    it('should show Automation when no data available', () => {
      const automation = {
        id: 'a1',
        name: 'Empty',
        enabled: true,
        triggerTime: null,
        recurrenceDays: null,
        targets: null,
        styleInfo: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      expect(container.querySelector('.automation-description')).toHaveTextContent('Automation');
    });

    it('should show only days when time is missing', () => {
      const automation = {
        ...mockAutomation,
        triggerTime: null,
        recurrenceDays: ['monday'],
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('Mon');
      expect(description).not.toContain('AM');
      expect(description).not.toContain('PM');
    });

    it('should show only time when days are missing', () => {
      const automation = {
        ...mockAutomation,
        triggerTime: { hour: 8, minute: 30 },
        recurrenceDays: null,
      };
      const { container } = render(<AutomationCard {...defaultProps} automation={automation} />);
      const description = container.querySelector('.automation-description').textContent;
      expect(description).toContain('8:30 AM');
    });
  });
});
