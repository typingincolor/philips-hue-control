import PropTypes from 'prop-types';
import { LightTile } from './LightTile';
import { SceneSelector } from './SceneSelector';
import { UI_TEXT } from '../../constants/uiText';
import { Moon, Sun, Home, LightbulbOff } from './Icons';

export const RoomContent = ({
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  togglingLights = new Set(),
  isActivatingScene = false
}) => {
  if (!room) {
    return (
      <div className="empty-state-dark">
        <Home size={48} className="empty-state-dark-icon" />
        <div className="empty-state-dark-text">Select a room from the navigation below</div>
      </div>
    );
  }

  const { lights = [], scenes = [] } = room;
  // Calculate from actual light states (not pre-computed stats) so toggle updates immediately
  const lightsOn = lights.filter(l => l.on).length;
  const allOn = lightsOn === lights.length && lights.length > 0;
  const anyOn = lightsOn > 0;

  return (
    <div className="room-content">
      <div className="room-header-bar">
        <div className="scene-selector">
          <SceneSelector
            scenes={scenes}
            onActivate={onActivateScene}
            isActivating={isActivatingScene}
          />
        </div>
        <div className="toggle-selector">
          <button
            className={`room-toggle-all ${!anyOn ? 'lights-off' : ''}`}
            onClick={() => onToggleRoom(room.id, !anyOn)}
            title={anyOn ? UI_TEXT.BUTTON_ALL_OFF : UI_TEXT.BUTTON_ALL_ON}
          >
            {anyOn ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {lights.length === 0 ? (
        <div className="empty-state-dark">
          <LightbulbOff size={48} className="empty-state-dark-icon" />
          <div className="empty-state-dark-text">No lights in this room</div>
        </div>
      ) : (
        <div className="light-tiles-grid">
          {lights.map((light) => (
            <LightTile
              key={light.id}
              light={light}
              onToggle={onToggleLight}
              isToggling={togglingLights.has(light.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

RoomContent.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    lights: PropTypes.array,
    scenes: PropTypes.array,
    stats: PropTypes.shape({
      lightsOnCount: PropTypes.number,
      totalLights: PropTypes.number,
      averageBrightness: PropTypes.number
    })
  }),
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set),
  isActivatingScene: PropTypes.bool
};
