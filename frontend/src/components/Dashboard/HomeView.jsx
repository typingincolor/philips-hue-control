import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { HiveView } from './HiveView';

/**
 * HomeView component - displays home-level devices
 * Shows empty state when no devices, or renders device-specific views
 */
export const HomeView = ({
  homeDevices = [],
  // Hive props (passed through to HiveView)
  hiveConnected = false,
  hiveStatus = null,
  hiveSchedules = [],
  hiveLoading = false,
  hiveError = null,
  onHiveRetry,
  onHiveConnect,
  onHiveVerify2fa,
  onHiveCancel2fa,
  onHiveClearError,
  hiveRequires2fa = false,
  hiveConnecting = false,
  hiveVerifying = false,
  hivePendingUsername = '',
}) => {
  // Check if we have any Hive devices
  const hasHiveDevices = homeDevices.some((d) => d.source === 'hive' || d.id.startsWith('hive:'));

  return (
    <div className="home-view">
      {homeDevices.length === 0 ? (
        <div className="home-empty-state">
          <span className="home-empty-message">{UI_TEXT.HOME_NO_DEVICES}</span>
        </div>
      ) : (
        <div className="home-devices">
          {/* Render Hive section if there are Hive devices */}
          {hasHiveDevices && (
            <HiveView
              isConnected={hiveConnected}
              status={hiveStatus}
              schedules={hiveSchedules}
              isLoading={hiveLoading}
              error={hiveError}
              onRetry={onHiveRetry}
              onConnect={onHiveConnect}
              onVerify2fa={onHiveVerify2fa}
              onCancel2fa={onHiveCancel2fa}
              onClearError={onHiveClearError}
              requires2fa={hiveRequires2fa}
              isConnecting={hiveConnecting}
              isVerifying={hiveVerifying}
              pendingUsername={hivePendingUsername}
            />
          )}
        </div>
      )}
    </div>
  );
};

HomeView.propTypes = {
  homeDevices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      name: PropTypes.string,
      source: PropTypes.string,
    })
  ),
  // Hive props
  hiveConnected: PropTypes.bool,
  hiveStatus: PropTypes.object,
  hiveSchedules: PropTypes.array,
  hiveLoading: PropTypes.bool,
  hiveError: PropTypes.string,
  onHiveRetry: PropTypes.func,
  onHiveConnect: PropTypes.func,
  onHiveVerify2fa: PropTypes.func,
  onHiveCancel2fa: PropTypes.func,
  onHiveClearError: PropTypes.func,
  hiveRequires2fa: PropTypes.bool,
  hiveConnecting: PropTypes.bool,
  hiveVerifying: PropTypes.bool,
  hivePendingUsername: PropTypes.string,
};
