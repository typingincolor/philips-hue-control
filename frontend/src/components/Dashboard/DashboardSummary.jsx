import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';

export const DashboardSummary = ({ totalLightsOn, roomCount, sceneCount }) => {
  return (
    <div className="lights-summary">
      <div className="summary-stat">
        <span className="stat-value">{totalLightsOn}</span>
        <span className="stat-label">{UI_TEXT.LABEL_LIGHTS_ON}</span>
      </div>
      <div className="summary-stat">
        <span className="stat-value">{roomCount}</span>
        <span className="stat-label">{UI_TEXT.LABEL_ROOMS}</span>
      </div>
      <div className="summary-stat">
        <span className="stat-value">{sceneCount}</span>
        <span className="stat-label">{UI_TEXT.LABEL_SCENES}</span>
      </div>
    </div>
  );
};

DashboardSummary.propTypes = {
  totalLightsOn: PropTypes.number.isRequired,
  roomCount: PropTypes.number.isRequired,
  sceneCount: PropTypes.number.isRequired,
};
