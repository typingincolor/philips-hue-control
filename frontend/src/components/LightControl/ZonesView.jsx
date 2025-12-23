import PropTypes from 'prop-types';
import { SceneSelector } from './SceneSelector';
import { UI_TEXT } from '../../constants/uiText';
import { Moon, Sun, Spinner, Grid } from './Icons';

export const ZonesView = ({
  zones = [],
  onToggleZone,
  onActivateScene,
  togglingZones = new Set(),
  activatingScene = null
}) => {
  if (zones.length === 0) {
    return (
      <div className="zones-view">
        <div className="empty-state-dark">
          <Grid size={48} className="empty-state-dark-icon" />
          <div className="empty-state-dark-text">No zones configured</div>
        </div>
      </div>
    );
  }

  return (
    <div className="zones-view">
      <div className="zones-view-header">
        <h2 className="zones-view-title">{UI_TEXT.ZONES_VIEW_TITLE}</h2>
        <p className="zones-view-subtitle">{UI_TEXT.ZONES_VIEW_SUBTITLE}</p>
      </div>

      <div className="zones-list-dark">
        {zones.map((zone) => {
          const { stats = {} } = zone;
          const anyOn = stats.lightsOnCount > 0;
          const isToggling = togglingZones.has(zone.id);
          const isActivating = activatingScene === zone.id;

          return (
            <div key={zone.id} className="zone-item-dark">
              <div className="zone-item-info">
                <div className="zone-item-name">{zone.name}</div>
                <div className="zone-item-status">
                  {stats.lightsOnCount || 0} of {stats.totalLights || 0} on
                  {stats.averageBrightness > 0 && ` • ${Math.round(stats.averageBrightness)}%`}
                </div>
              </div>

              <div className="zone-item-controls">
                <SceneSelector
                  scenes={zone.scenes || []}
                  onActivate={(sceneId) => onActivateScene(sceneId, zone.id)}
                  isActivating={isActivating}
                />
                <button
                  className={`zone-toggle-btn ${anyOn ? 'on' : ''}`}
                  onClick={() => onToggleZone(zone.id, !anyOn)}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <Spinner size={18} />
                  ) : anyOn ? (
                    <>
                      <Moon size={18} />
                      <span>Off</span>
                    </>
                  ) : (
                    <>
                      <Sun size={18} />
                      <span>On</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ZonesView.propTypes = {
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        lightsOnCount: PropTypes.number,
        totalLights: PropTypes.number,
        averageBrightness: PropTypes.number
      }),
      scenes: PropTypes.array
    })
  ),
  onToggleZone: PropTypes.func.isRequired,
  onActivateScene: PropTypes.func.isRequired,
  togglingZones: PropTypes.instanceOf(Set),
  activatingScene: PropTypes.string
};
