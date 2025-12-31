import PropTypes from 'prop-types';
import { SceneIcon, Spinner } from './Icons';

export const SceneTile = ({ scene, onActivate, isActivating }) => {
  const handleClick = () => {
    onActivate(scene.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isActivating}
      className={`scene-tile ${isActivating ? 'activating' : ''}`}
      aria-label={`Activate scene: ${scene.name}`}
      title={scene.name}
    >
      <div className="scene-tile-icon">
        {isActivating ? <Spinner size={24} /> : <SceneIcon name={scene.name} size={24} />}
      </div>
      <span className="scene-tile-name">{scene.name}</span>
    </button>
  );
};

SceneTile.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onActivate: PropTypes.func.isRequired,
  isActivating: PropTypes.bool,
};
