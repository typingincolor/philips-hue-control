import PropTypes from 'prop-types';

export const DashboardSummary = ({ totalLightsOn, roomCount, sceneCount }) => {
  return (
    <div className="lights-summary">
      <div className="summary-stat">
        <span className="stat-value">{totalLightsOn}</span>
        <span className="stat-label">lights on</span>
      </div>
      <div className="summary-stat">
        <span className="stat-value">{roomCount}</span>
        <span className="stat-label">rooms</span>
      </div>
      <div className="summary-stat">
        <span className="stat-value">{sceneCount}</span>
        <span className="stat-label">scenes</span>
      </div>
    </div>
  );
};

DashboardSummary.propTypes = {
  totalLightsOn: PropTypes.number.isRequired,
  roomCount: PropTypes.number.isRequired,
  sceneCount: PropTypes.number.isRequired
};
