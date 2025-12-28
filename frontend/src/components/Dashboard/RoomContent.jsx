import { useState } from 'react';
import PropTypes from 'prop-types';
import { LightTile } from './LightTile';
import { SceneDrawer } from './SceneDrawer';
import { Home, LightbulbOff, Menu } from './Icons';

export const RoomContent = ({
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  togglingLights = new Set(),
  isActivatingScene = false,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  const lightsOn = lights.filter((l) => l.on).length;
  const anyOn = lightsOn > 0;

  return (
    <div className="room-content">
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

      {/* Floating action button to open scene drawer */}
      <button
        className="scene-drawer-trigger"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Open scenes menu"
      >
        <Menu size={24} />
      </button>

      {/* Scene drawer */}
      <SceneDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenes={scenes}
        onActivateScene={onActivateScene}
        onToggleRoom={onToggleRoom}
        roomId={room.id}
        anyOn={anyOn}
        isActivating={isActivatingScene}
      />
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
      averageBrightness: PropTypes.number,
    }),
  }),
  onToggleLight: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set),
  isActivatingScene: PropTypes.bool,
};
