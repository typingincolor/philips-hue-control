import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { LightTile } from './LightTile';
import { SceneTile } from './SceneTile';
import { AllOnOffTile } from './AllOnOffTile';
import { Home, LightbulbOff, ChevronLeft, ChevronRight } from './Icons';
import { useDragScroll } from '../../hooks/useDragScroll';

export const RoomContent = ({
  room,
  onToggleLight,
  onToggleRoom,
  onActivateScene,
  onColorTemperatureChange,
  togglingLights = new Set(),
  isActivatingScene = false,
}) => {
  // Scroll state for scenes carousel
  const [canScrollScenesLeft, setCanScrollScenesLeft] = useState(false);
  const [canScrollScenesRight, setCanScrollScenesRight] = useState(false);

  // Scroll state for lights carousel
  const [canScrollLightsLeft, setCanScrollLightsLeft] = useState(false);
  const [canScrollLightsRight, setCanScrollLightsRight] = useState(false);

  // Refs for carousels
  const scenesCarouselRef = useRef(null);
  const lightsCarouselRef = useRef(null);

  // Drag scroll hooks - these return callback refs
  const setScenesDragRef = useDragScroll();
  const setLightsDragRef = useDragScroll();

  // Update scroll button states for scenes
  const updateScenesScroll = useCallback(() => {
    const el = scenesCarouselRef.current;
    if (!el) return;
    setCanScrollScenesLeft(el.scrollLeft > 0);
    setCanScrollScenesRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // Update scroll button states for lights
  const updateLightsScroll = useCallback(() => {
    const el = lightsCarouselRef.current;
    if (!el) return;
    setCanScrollLightsLeft(el.scrollLeft > 0);
    setCanScrollLightsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // Combine refs for scenes carousel
  const setScenesRef = useCallback(
    (el) => {
      scenesCarouselRef.current = el;
      setScenesDragRef(el);
      // Schedule scroll state update after DOM settles
      if (el) {
        requestAnimationFrame(() => {
          requestAnimationFrame(updateScenesScroll);
        });
      }
    },
    [setScenesDragRef, updateScenesScroll]
  );

  // Combine refs for lights carousel
  const setLightsRef = useCallback(
    (el) => {
      lightsCarouselRef.current = el;
      setLightsDragRef(el);
      // Schedule scroll state update after DOM settles
      if (el) {
        requestAnimationFrame(() => {
          requestAnimationFrame(updateLightsScroll);
        });
      }
    },
    [setLightsDragRef, updateLightsScroll]
  );

  // Calculate scroll distance (one tile width + gap)
  const getScrollDistance = (carouselEl) => {
    if (!carouselEl) return 200;
    const firstTile = carouselEl.querySelector('.scene-tile, .light-tile, .all-on-off-tile');
    if (!firstTile) return 200;
    const gap = 12; // matches CSS gap
    return firstTile.offsetWidth + gap;
  };

  // Scroll handlers - scroll by one tile at a time
  const scrollScenesLeft = () => {
    const el = scenesCarouselRef.current;
    if (el) {
      el.scrollBy({ left: -getScrollDistance(el), behavior: 'smooth' });
      setTimeout(updateScenesScroll, 300);
    }
  };

  const scrollScenesRight = () => {
    const el = scenesCarouselRef.current;
    if (el) {
      el.scrollBy({ left: getScrollDistance(el), behavior: 'smooth' });
      setTimeout(updateScenesScroll, 300);
    }
  };

  const scrollLightsLeft = () => {
    const el = lightsCarouselRef.current;
    if (el) {
      el.scrollBy({ left: -getScrollDistance(el), behavior: 'smooth' });
      setTimeout(updateLightsScroll, 300);
    }
  };

  const scrollLightsRight = () => {
    const el = lightsCarouselRef.current;
    if (el) {
      el.scrollBy({ left: getScrollDistance(el), behavior: 'smooth' });
      setTimeout(updateLightsScroll, 300);
    }
  };

  // Setup scroll listeners
  useEffect(() => {
    const scenesEl = scenesCarouselRef.current;
    const lightsEl = lightsCarouselRef.current;

    if (scenesEl) {
      scenesEl.addEventListener('scroll', updateScenesScroll);
    }
    if (lightsEl) {
      lightsEl.addEventListener('scroll', updateLightsScroll);
    }

    // ResizeObserver to update on resize
    const resizeObserver = new ResizeObserver(() => {
      updateScenesScroll();
      updateLightsScroll();
    });

    if (scenesEl) resizeObserver.observe(scenesEl);
    if (lightsEl) resizeObserver.observe(lightsEl);

    return () => {
      if (scenesEl) scenesEl.removeEventListener('scroll', updateScenesScroll);
      if (lightsEl) lightsEl.removeEventListener('scroll', updateLightsScroll);
      resizeObserver.disconnect();
    };
  }, [updateScenesScroll, updateLightsScroll]);

  // Update scroll state when room content changes
  useEffect(() => {
    // Use multiple RAF frames to ensure DOM is fully laid out
    const timeoutId = setTimeout(() => {
      updateScenesScroll();
      updateLightsScroll();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [room, updateScenesScroll, updateLightsScroll]);

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

  if (lights.length === 0) {
    return (
      <div className="room-content">
        <div className="empty-state-dark">
          <LightbulbOff size={48} className="empty-state-dark-icon" />
          <div className="empty-state-dark-text">No lights in this room</div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-content room-content-carousel">
      {/* Row 1: Scenes carousel with All On/Off as first item */}
      <div className="room-row scenes-row">
        <div className="tiles-carousel-container">
          <button
            className="carousel-btn carousel-btn-left"
            onClick={scrollScenesLeft}
            disabled={!canScrollScenesLeft}
            aria-label="Scroll scenes left"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="tiles-carousel scenes-carousel" ref={setScenesRef}>
            <AllOnOffTile
              anyOn={anyOn}
              onToggle={onToggleRoom}
              roomId={room.id}
              isToggling={isActivatingScene}
            />
            {scenes.map((scene) => (
              <SceneTile
                key={scene.id}
                scene={scene}
                onActivate={onActivateScene}
                isActivating={isActivatingScene}
              />
            ))}
            {/* Invisible spacers to align with lights row */}
            {lights.length > scenes.length + 1 &&
              Array.from({ length: lights.length - scenes.length - 1 }).map((_, i) => (
                <div key={`scene-spacer-${i}`} className="carousel-spacer" aria-hidden="true" />
              ))}
          </div>

          <button
            className="carousel-btn carousel-btn-right"
            onClick={scrollScenesRight}
            disabled={!canScrollScenesRight}
            aria-label="Scroll scenes right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Row 2: Lights carousel */}
      <div className="room-row lights-row">
        <div className="tiles-carousel-container">
          <button
            className="carousel-btn carousel-btn-left"
            onClick={scrollLightsLeft}
            disabled={!canScrollLightsLeft}
            aria-label="Scroll lights left"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="tiles-carousel lights-carousel" ref={setLightsRef}>
            {lights.map((light) => (
              <LightTile
                key={light.id}
                light={light}
                onToggle={onToggleLight}
                onColorTemperatureChange={onColorTemperatureChange}
                isToggling={togglingLights.has(light.id)}
              />
            ))}
            {/* Invisible spacers to align with scenes row */}
            {scenes.length + 1 > lights.length &&
              Array.from({ length: scenes.length + 1 - lights.length }).map((_, i) => (
                <div key={`light-spacer-${i}`} className="carousel-spacer" aria-hidden="true" />
              ))}
          </div>

          <button
            className="carousel-btn carousel-btn-right"
            onClick={scrollLightsRight}
            disabled={!canScrollLightsRight}
            aria-label="Scroll lights right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
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
  onColorTemperatureChange: PropTypes.func,
  togglingLights: PropTypes.instanceOf(Set),
  isActivatingScene: PropTypes.bool,
};
