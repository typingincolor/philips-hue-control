import PropTypes from 'prop-types';
import { ZoneShape } from '../../propTypes/shapes';
import { SceneSelector } from './SceneSelector';

export const ZoneCard = ({
  zoneName,
  zone,
  onToggleZone,
  onActivateScene,
  togglingLights,
  isActivating
}) => {
  // Use pre-computed stats from backend
  const { lightsOnCount, totalLights, averageBrightness } = zone.stats;
  const anyLightsOn = lightsOnCount > 0;

  // Get light UUIDs for toggling
  const lightUuids = zone.lights.map(l => l.id);
  const allLightsToggling = lightUuids.every(uuid => togglingLights.has(uuid));

  return (
    <div className="zone-bar">
      <div className="zone-bar-info">
        <h4 className="zone-name">{zoneName}</h4>
        <div className="zone-badges">
          <span className="zone-status-badge">
            {lightsOnCount}/{totalLights}
          </span>
          <span className="zone-brightness-badge">
            {lightsOnCount > 0 ? `${Math.round(averageBrightness)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="zone-bar-controls">
        <SceneSelector
          scenes={zone.scenes}
          onActivate={onActivateScene}
          isActivating={isActivating}
        />
        <button
          onClick={() => onToggleZone(zone.id, lightUuids, !anyLightsOn)}
          disabled={allLightsToggling}
          className="zone-control-button"
        >
          {allLightsToggling ? '⏳' : anyLightsOn ? '🌙 Off' : '💡 On'}
        </button>
      </div>
    </div>
  );
};

ZoneCard.propTypes = {
  zoneName: PropTypes.string.isRequired,
  zone: ZoneShape.isRequired,
  onToggleZone: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingLights: PropTypes.instanceOf(Set).isRequired,
  isActivating: PropTypes.bool
};
