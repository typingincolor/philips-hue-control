import PropTypes from 'prop-types';
import { SceneIcon, Spinner } from './Icons';

export const SceneSelector = ({ scenes, onActivate, isActivating }) => {
  if (!scenes || scenes.length === 0) return null;

  return (
    <div className="scene-icons">
      {scenes.map((scene) => (
        <button
          key={scene.id}
          className="scene-icon-button"
          onClick={() => onActivate(scene.id)}
          disabled={isActivating}
          title={scene.name}
        >
          {isActivating ? (
            <Spinner size={20} />
          ) : (
            <SceneIcon name={scene.name} size={20} />
          )}
          <span className="scene-tooltip">{scene.name}</span>
        </button>
      ))}
    </div>
  );
};

SceneSelector.propTypes = {
  scenes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onActivate: PropTypes.func.isRequired,
  isActivating: PropTypes.bool
};
