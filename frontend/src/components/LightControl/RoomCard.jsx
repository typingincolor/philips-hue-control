import PropTypes from 'prop-types';
import { LightButton } from './LightButton';
import { SceneSelector } from './SceneSelector';
import { calculateRoomStats } from '../../utils/roomUtils';

export const RoomCard = ({
  roomName,
  roomData,
  roomScenes,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  togglingLights,
  isActivating
}) => {
  const { lightsOnCount, totalLights, averageBrightness } = calculateRoomStats(roomData.lights);
  const anyLightsOn = lightsOnCount > 0;
  const allLightsToggling = roomData.lightUuids.every(uuid => togglingLights.has(uuid));

  return (
    <div className="room-group">
      <div className="room-header">
        <div className="room-title-row">
          <h4 className="room-name">{roomName}</h4>
          <div className="room-badges">
            <span className="room-status-badge">
              {lightsOnCount} of {totalLights} on
            </span>
            <span className="room-brightness-badge">
              {lightsOnCount > 0 ? `${Math.round(averageBrightness)}%` : '—'}
            </span>
          </div>
        </div>

        <div className="room-controls">
          <SceneSelector
            scenes={roomScenes}
            onActivate={onActivateScene}
            isActivating={isActivating}
          />
          <button
            onClick={() => onToggleRoom(roomData.lightUuids, !anyLightsOn)}
            disabled={allLightsToggling}
            className="room-control-button"
          >
            {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 All Off' : '💡 All On'}
          </button>
        </div>
      </div>

      <div className="room-lights-grid">
        {roomData.lights.map((light) => (
          <LightButton
            key={light.id}
            light={light}
            onToggle={onToggleLight}
            isToggling={togglingLights.has(light.id)}
          />
        ))}
      </div>
    </div>
  );
};

RoomCard.propTypes = {
  roomName: PropTypes.string.isRequired,
  roomData: PropTypes.shape({
    roomUuid: PropTypes.string,
    lightUuids: PropTypes.arrayOf(PropTypes.string).isRequired,
    lights: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  roomScenes: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set).isRequired,
  isActivating: PropTypes.bool
};
