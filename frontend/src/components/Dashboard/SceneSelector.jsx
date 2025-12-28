import PropTypes from 'prop-types';
import { SceneShape } from '../../propTypes/shapes';
import { SceneIcon, Spinner } from './Icons';
import { useDragScroll } from '../../hooks/useDragScroll';

export const SceneSelector = ({ scenes, onActivate, isActivating }) => {
  const dragScrollRef = useDragScroll();

  if (!scenes || scenes.length === 0) return null;

  return (
    <div className="scene-icons" ref={dragScrollRef}>
      {scenes.map((scene) => (
        <button
          key={scene.id}
          className="scene-icon-button"
          onClick={() => onActivate(scene.id)}
          disabled={isActivating}
          title={scene.name}
        >
          {isActivating ? <Spinner size={20} /> : <SceneIcon name={scene.name} size={20} />}
          <span className="scene-tooltip">{scene.name}</span>
        </button>
      ))}
    </div>
  );
};

SceneSelector.propTypes = {
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  onActivate: PropTypes.func.isRequired,
  isActivating: PropTypes.bool,
};
