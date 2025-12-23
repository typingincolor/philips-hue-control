import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { Logout, LightbulbOn, Home, Grid } from './Icons';

export const TopToolbar = ({
  summary = {},
  isConnected = true,
  isDemoMode = false,
  onLogout
}) => {
  const { lightsOn = 0, roomCount = 0, sceneCount = 0 } = summary;

  return (
    <div className="top-toolbar">
      <div className="toolbar-left">
        <div className="toolbar-stat">
          <LightbulbOn size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{lightsOn}</span>
        </div>
        <div className="toolbar-stat">
          <Home size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{roomCount}</span>
        </div>
        <div className="toolbar-stat">
          <Grid size={16} className="toolbar-stat-icon" />
          <span className="toolbar-stat-value">{sceneCount}</span>
        </div>
      </div>

      <div className="toolbar-center">
      </div>

      <div className="toolbar-right">
        {isDemoMode && (
          <span className="toolbar-status" style={{ color: 'var(--accent-primary)' }}>
            {UI_TEXT.LABEL_DEMO_MODE}
          </span>
        )}
        <div className="toolbar-status">
          <span className={`toolbar-status-dot ${!isConnected ? 'disconnected' : ''}`} />
          <span>{isConnected ? UI_TEXT.STATUS_CONNECTED : 'Reconnecting...'}</span>
        </div>
        <button className="toolbar-logout" onClick={onLogout}>
          <Logout size={16} />
        </button>
      </div>
    </div>
  );
};

TopToolbar.propTypes = {
  summary: PropTypes.shape({
    lightsOn: PropTypes.number,
    roomCount: PropTypes.number,
    sceneCount: PropTypes.number
  }),
  isConnected: PropTypes.bool,
  isDemoMode: PropTypes.bool,
  onLogout: PropTypes.func.isRequired
};
