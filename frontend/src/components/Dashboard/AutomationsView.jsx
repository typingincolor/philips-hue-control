import PropTypes from 'prop-types';
import { AutomationCard } from './AutomationCard';
import { UI_TEXT } from '../../constants/uiText';

/**
 * AutomationsView - Display list of automations
 */
export function AutomationsView({
  automations = [],
  onTrigger,
  isLoading = false,
  error = null,
  onRetry = null,
  triggeringId = null,
}) {
  if (isLoading) {
    return (
      <div className="automations-view">
        <div className="automations-loading">
          <span className="spinner" />
          <span>{UI_TEXT.AUTOMATIONS_LOADING}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="automations-view">
        <div className="automations-error">
          <span>{UI_TEXT.AUTOMATIONS_ERROR}</span>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              {UI_TEXT.RETRY}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!automations || automations.length === 0) {
    return (
      <div className="automations-view">
        <div className="automations-empty">
          <span>{UI_TEXT.AUTOMATIONS_EMPTY}</span>
          <span className="automations-empty-hint">{UI_TEXT.AUTOMATIONS_EMPTY_HINT}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="automations-view">
      <div className="automations-list" role="list">
        {automations.map((automation) => (
          <AutomationCard
            key={automation.id}
            automation={automation}
            onTrigger={onTrigger}
            isTriggering={triggeringId === automation.id}
          />
        ))}
      </div>
    </div>
  );
}

AutomationsView.propTypes = {
  automations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      enabled: PropTypes.bool,
    })
  ),
  onTrigger: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  triggeringId: PropTypes.string,
};
