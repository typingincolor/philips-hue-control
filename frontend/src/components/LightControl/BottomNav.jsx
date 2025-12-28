import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { useDragScroll } from '../../hooks/useDragScroll';
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
  Clock,
  Thermometer,
} from './Icons';

// Icon size for nav tabs
const NAV_ICON_SIZE = 36;

// Get room-specific icon based on room name
const getRoomIcon = (name) => {
  const lower = name?.toLowerCase() || '';

  // Check specific room types first (order matters - more specific before generic)
  if (lower.includes('living')) return <Sofa size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('dining'))
    return <DiningTable size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('kitchen')) return <Saucepan size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('office') || lower.includes('study'))
    return <DeskLamp size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('bathroom') || lower.includes('bath'))
    return <Shower size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('garage')) return <Car size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (lower.includes('garden') || lower.includes('outdoor') || lower.includes('patio'))
    return <Tree size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  if (
    lower.includes('hall') ||
    lower.includes('entry') ||
    lower.includes('foyer') ||
    lower.includes('landing')
  )
    return <Door size={NAV_ICON_SIZE} className="nav-tab-icon" />;
  // Generic "room" check last (for "Bart's Room", "Maggie Room", etc.)
  if (lower.includes('bedroom') || lower.includes('bed room') || lower.includes('room'))
    return <Bed size={NAV_ICON_SIZE} className="nav-tab-icon" />;

  // Default to home icon for unrecognized rooms
  return <Home size={NAV_ICON_SIZE} className="nav-tab-icon" />;
};

export const BottomNav = ({
  rooms = [],
  zones = [],
  hasAutomations = false,
  selectedId,
  onSelect,
  services,
  hiveConnected = false,
}) => {
  const isZonesSelected = selectedId === 'zones';
  const isAutomationsSelected = selectedId === 'automations';
  const isHiveSelected = selectedId === 'hive';
  const navRef = useDragScroll();

  // Service visibility (default to showing all if services prop is missing for backwards compatibility)
  const hueEnabled = services?.hue?.enabled ?? true;
  const hiveEnabled = services?.hive?.enabled ?? true;

  // Warning state for Hive: enabled but not connected
  const hiveWarning = hiveEnabled && !hiveConnected;

  return (
    <nav className="bottom-nav" ref={navRef}>
      {/* Rooms - only shown when Hue is enabled */}
      {hueEnabled &&
        rooms.map((room) => {
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
              {lightsOn > 0 && <span className="nav-tab-badge">{lightsOn}</span>}
            </button>
          );
        })}

      {/* Zones - only shown when Hue is enabled */}
      {hueEnabled && zones.length > 0 && (
        <button
          className={`nav-tab ${isZonesSelected ? 'active' : ''}`}
          onClick={() => onSelect('zones')}
        >
          <Grid size={NAV_ICON_SIZE} className="nav-tab-icon" />
          <span className="nav-tab-label">{UI_TEXT.NAV_ZONES}</span>
          <span className="nav-tab-badge">{zones.length}</span>
        </button>
      )}

      {/* Automations - only shown when Hue is enabled */}
      {hueEnabled && hasAutomations && (
        <button
          className={`nav-tab ${isAutomationsSelected ? 'active' : ''}`}
          onClick={() => onSelect('automations')}
        >
          <Clock size={NAV_ICON_SIZE} className="nav-tab-icon" />
          <span className="nav-tab-label">{UI_TEXT.NAV_AUTOMATIONS}</span>
        </button>
      )}

      {/* Hive tab - only shown when Hive is enabled */}
      {hiveEnabled && (
        <button
          className={`nav-tab ${isHiveSelected ? 'active' : ''} ${hiveWarning ? 'warning' : ''}`}
          onClick={() => onSelect('hive')}
        >
          <Thermometer size={NAV_ICON_SIZE} className="nav-tab-icon" />
          <span className="nav-tab-label">{UI_TEXT.NAV_HIVE}</span>
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
        lightsOnCount: PropTypes.number,
      }),
    })
  ),
  zones: PropTypes.array,
  hasAutomations: PropTypes.bool,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  services: PropTypes.shape({
    hue: PropTypes.shape({ enabled: PropTypes.bool }),
    hive: PropTypes.shape({ enabled: PropTypes.bool }),
  }),
  hiveConnected: PropTypes.bool,
};
