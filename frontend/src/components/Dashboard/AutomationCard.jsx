import PropTypes from 'prop-types';

/**
 * Format trigger time for display (e.g., "7:00 AM", "10:30 PM")
 */
const formatTriggerTime = (triggerTime) => {
  if (!triggerTime) return null;
  const { hour, minute } = triggerTime;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

/**
 * Format recurrence days (e.g., "Mon-Fri", "Every day", "Sat, Sun")
 */
const formatRecurrenceDays = (days) => {
  if (!days || days.length === 0) return null;

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortNames = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  // Sort days by week order
  const sorted = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  if (sorted.length === 7) return 'Every day';
  if (sorted.length === 5 && !sorted.includes('saturday') && !sorted.includes('sunday'))
    return 'Mon-Fri';
  if (sorted.length === 2 && sorted.includes('saturday') && sorted.includes('sunday'))
    return 'Weekends';

  return sorted.map((d) => shortNames[d]).join(', ');
};

/**
 * Format style info (e.g., "Sunset · 15 min fade")
 */
const formatStyleInfo = (styleInfo) => {
  if (!styleInfo) return null;

  const parts = [];
  if (styleInfo.style) {
    parts.push(styleInfo.style.charAt(0).toUpperCase() + styleInfo.style.slice(1));
  }
  if (styleInfo.fadeOutMinutes) {
    parts.push(`${styleInfo.fadeOutMinutes} min fade`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
};

/**
 * Format targets (e.g., "Bedroom" or "Bedroom · 2 lights")
 */
const formatTargets = (targets) => {
  if (!targets) return null;

  const parts = [];

  // Add room/zone names
  if (targets.groups?.length > 0) {
    const groupNames = targets.groups.map((g) => g.name).join(', ');
    parts.push(groupNames);
  }

  // Add light count if specific lights are targeted
  if (targets.lights?.length > 0) {
    const count = targets.lights.length;
    parts.push(`${count} light${count > 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
};

/**
 * Build description from automation data
 */
const getAutomationDescription = (automation) => {
  const { triggerTime, recurrenceDays, styleInfo, targets } = automation;

  const parts = [];

  // Targets (room/lights)
  const targetsLabel = formatTargets(targets);
  if (targetsLabel) {
    parts.push(targetsLabel);
  }

  // Time and days
  const timeLabel = formatTriggerTime(triggerTime);
  const daysLabel = formatRecurrenceDays(recurrenceDays);

  if (timeLabel && daysLabel) {
    parts.push(`${timeLabel} · ${daysLabel}`);
  } else if (timeLabel) {
    parts.push(timeLabel);
  } else if (daysLabel) {
    parts.push(daysLabel);
  }

  // Style info
  const styleLabel = formatStyleInfo(styleInfo);
  if (styleLabel) {
    parts.push(styleLabel);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Automation';
};

/**
 * AutomationCard - Display a single automation with trigger button
 */
export function AutomationCard({ automation, onTrigger, isTriggering = false }) {
  const handleTrigger = () => {
    if (automation.enabled && !isTriggering) {
      onTrigger(automation.id);
    }
  };

  const isDisabled = !automation.enabled || isTriggering;
  const description = getAutomationDescription(automation);

  return (
    <div className={`automation-card${!automation.enabled ? ' disabled' : ''}`} role="listitem">
      <div className="automation-icon">
        <span>⏰</span>
      </div>
      <div className="automation-content">
        <div className="automation-name">{automation.name}</div>
        <div className="automation-description">{description}</div>
      </div>
      <button
        className="automation-trigger"
        onClick={handleTrigger}
        disabled={isDisabled}
        aria-label={`Trigger ${automation.name}`}
        aria-disabled={isDisabled}
      >
        {isTriggering ? <span className="spinner" /> : <span>▶</span>}
      </button>
    </div>
  );
}

AutomationCard.propTypes = {
  automation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    scriptId: PropTypes.string,
    triggerTime: PropTypes.shape({
      hour: PropTypes.number,
      minute: PropTypes.number,
    }),
    recurrenceDays: PropTypes.arrayOf(PropTypes.string),
    targets: PropTypes.shape({
      groups: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          name: PropTypes.string,
        })
      ),
      lights: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        })
      ),
    }),
    styleInfo: PropTypes.shape({
      style: PropTypes.string,
      fadeOutMinutes: PropTypes.number,
      endState: PropTypes.string,
    }),
    enabled: PropTypes.bool,
  }).isRequired,
  onTrigger: PropTypes.func.isRequired,
  isTriggering: PropTypes.bool,
};
