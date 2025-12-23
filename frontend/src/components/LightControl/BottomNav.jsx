import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import {
  Home,
  Grid,
  Sofa,
  DiningTable,
  Saucepan,
  Bed,
  DeskLamp,
  Shower,
  Car,
  Tree,
  Door,
  LightbulbOff
} from './Icons';

// Icon size for nav tabs
const NAV_ICON_SIZE = 36;

// Hook for drag-to-scroll functionality
const useDragScroll = () => {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
      el.scrollLeft = scrollLeft.current - walk;
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousemove', handleMouseMove);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
};

// Get room-specific icon based on room name
const getRoomIcon = (name) => {
  const lower = name?.toLowerCase() || '';

  // Check specific room types first (order matters - more specific before generic)
  if (lower.includes('living')) return <Sofa size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('dining')) return <DiningTable size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('kitchen')) return <Saucepan size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('office') || lower.includes('study')) return <DeskLamp size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('bathroom') || lower.includes('bath')) return <Shower size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('garage')) return <Car size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('garden') || lower.includes('outdoor') || lower.includes('patio')) return <Tree size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('hall') || lower.includes('entry') || lower.includes('foyer') || lower.includes('landing')) return <Door size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  // Generic "room" check last (for "Bart's Room", "Maggie Room", etc.)
  if (lower.includes('bedroom') || lower.includes('bed room') || lower.includes('room')) return <Bed size={NAV_ICON_SIZE} className="nav-tab-icon" />;

  // Default to home icon for unrecognized rooms
  return <Home size={NAV_ICON_SIZE} className="nav-tab-icon" />;
};

export const BottomNav = ({
  rooms = [],
  zones = [],
  selectedId,
  onSelect
}) => {
  const isZonesSelected = selectedId === 'zones';
  const navRef = useDragScroll();

  return (
    <nav className="bottom-nav" ref={navRef}>
      {rooms.map((room) => {
        const isActive = selectedId === room.id;
        const lightsOn = room.stats?.lightsOnCount || 0;

        return (
          <button
            key={room.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(room.id)}
          >
            {getRoomIcon(room.name)}
            <span className="nav-tab-label">{room.name}</span>
            {lightsOn > 0 && (
              <span className="nav-tab-badge">{lightsOn}</span>
            )}
          </button>
        );
      })}

      {zones.length > 0 && (
        <button
          className={`nav-tab ${isZonesSelected ? 'active' : ''}`}
          onClick={() => onSelect('zones')}
        >
          <Grid size={NAV_ICON_SIZE} className="nav-tab-icon" />
          <span className="nav-tab-label">{UI_TEXT.NAV_ZONES}</span>
          <span className="nav-tab-badge">{zones.length}</span>
        </button>
      )}
    </nav>
  );
};

BottomNav.propTypes = {
  rooms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        lightsOnCount: PropTypes.number
      })
    })
  ),
  zones: PropTypes.array,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};
