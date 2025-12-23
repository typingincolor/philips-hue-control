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

// Get room-specific icon based on room name
const getRoomIcon = (name, size) => {
  const lower = name?.toLowerCase() || '';

  if (lower.includes('living')) return <Sofa size={size} className="nav-tab-icon" />;
  if (lower.includes('dining')) return <DiningTable size={size} className="nav-tab-icon" />;
  if (lower.includes('kitchen')) return <Saucepan size={size} className="nav-tab-icon" />;
  if (lower.includes('bedroom') || lower.includes('bed room')) return <Bed size={size} className="nav-tab-icon" />;
  if (lower.includes('office') || lower.includes('study')) return <DeskLamp size={size} className="nav-tab-icon" />;
  if (lower.includes('bathroom') || lower.includes('bath')) return <Shower size={size} className="nav-tab-icon" />;
  if (lower.includes('garage')) return <Car size={size} className="nav-tab-icon" />;
  if (lower.includes('garden') || lower.includes('outdoor') || lower.includes('patio')) return <Tree size={size} className="nav-tab-icon" />;
  if (lower.includes('hall') || lower.includes('entry') || lower.includes('foyer')) return <Door size={size} className="nav-tab-icon" />;

  // Default to home icon for unrecognized rooms
  return <Home size={size} className="nav-tab-icon" />;
};

export const BottomNav = ({
  rooms = [],
  zones = [],
  selectedId,
  onSelect
}) => {
  const isZonesSelected = selectedId === 'zones';

  return (
    <nav className="bottom-nav">
      {rooms.map((room) => {
        const isActive = selectedId === room.id;
        const lightsOn = room.stats?.lightsOnCount || 0;

        return (
          <button
            key={room.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(room.id)}
          >
            {getRoomIcon(room.name, 28)}
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
          <Grid size={28} className="nav-tab-icon" />
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
