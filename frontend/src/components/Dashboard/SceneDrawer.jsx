import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { SceneShape } from '../../propTypes/shapes';
import { SceneIcon, Spinner, Moon, Sun, X } from './Icons';

export const SceneDrawer = ({
  isOpen,
  onClose,
  scenes = [],
  onActivateScene,
  onToggleRoom,
  roomId,
  anyOn,
  isActivating,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="scene-drawer-overlay" onClick={onClose} />
      <div className="scene-drawer">
        <div className="scene-drawer-header">
          <h3 className="scene-drawer-title">Scenes</h3>
          <button className="scene-drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scene-drawer-content">
          {scenes.length > 0 ? (
            <div className="scene-drawer-list">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  className="scene-drawer-item"
                  onClick={() => {
                    onActivateScene(scene.id);
                    onClose();
                  }}
                  disabled={isActivating}
                >
                  <span className="scene-drawer-item-icon">
                    {isActivating ? (
                      <Spinner size={24} />
                    ) : (
                      <SceneIcon name={scene.name} size={24} />
                    )}
                  </span>
                  <span className="scene-drawer-item-name">{scene.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="scene-drawer-empty">No scenes available</div>
          )}
        </div>

        <div className="scene-drawer-footer">
          <button
            className={`scene-drawer-toggle ${anyOn ? 'on' : 'off'}`}
            onClick={() => {
              onToggleRoom(roomId, !anyOn);
              onClose();
            }}
          >
            {anyOn ? (
              <>
                <Moon size={20} />
                <span>Turn All Off</span>
              </>
            ) : (
              <>
                <Sun size={20} />
                <span>Turn All On</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

SceneDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scenes: PropTypes.arrayOf(SceneShape),
  onActivateScene: PropTypes.func.isRequired,
  onToggleRoom: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
  anyOn: PropTypes.bool.isRequired,
  isActivating: PropTypes.bool,
};
