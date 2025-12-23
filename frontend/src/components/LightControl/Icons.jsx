import PropTypes from 'prop-types';

// Reusable SVG icon component
const Icon = ({ children, size = 24, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

Icon.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object
};

// Light bulb - on state (filled)
export const LightbulbOn = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21h6" />
    <path d="M10 17h4" />
    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6z" fill="currentColor" strokeWidth="1.5" />
  </Icon>
);

LightbulbOn.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Light bulb - off state (outline only)
export const LightbulbOff = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21h6" />
    <path d="M10 17h4" />
    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6z" />
  </Icon>
);

LightbulbOff.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Loading spinner
export const Spinner = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={`icon-spin ${className}`} style={style}>
    <path d="M12 2v4" />
    <path d="M12 18v4" opacity="0.3" />
    <path d="M4.93 4.93l2.83 2.83" opacity="0.9" />
    <path d="M16.24 16.24l2.83 2.83" opacity="0.2" />
    <path d="M2 12h4" opacity="0.7" />
    <path d="M18 12h4" opacity="0.4" />
    <path d="M4.93 19.07l2.83-2.83" opacity="0.5" />
    <path d="M16.24 7.76l2.83-2.83" opacity="0.6" />
  </Icon>
);

Spinner.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Moon icon (for "turn off")
export const Moon = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

Moon.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Sun icon (for "turn on")
export const Sun = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Icon>
);

Sun.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Home icon (for rooms)
export const Home = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

Home.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Grid icon (for zones)
export const Grid = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Icon>
);

Grid.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Power icon (for toggle buttons)
export const Power = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </Icon>
);

Power.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Logout icon
export const Logout = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

Logout.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Sofa icon (living room)
export const Sofa = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
    <path d="M3 11h18v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    <path d="M6 18v2" />
    <path d="M18 18v2" />
    <path d="M8 11v2" />
    <path d="M16 11v2" />
  </Icon>
);

Sofa.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Dining table icon (dining room)
export const DiningTable = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <rect x="3" y="9" width="18" height="3" rx="1" />
    <path d="M5 12v7" />
    <path d="M19 12v7" />
    <circle cx="8" cy="6" r="2" />
    <circle cx="16" cy="6" r="2" />
  </Icon>
);

DiningTable.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Saucepan icon (kitchen)
export const Saucepan = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M3 11h16a2 2 0 0 1 2 2v2a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z" />
    <path d="M19 11h3" />
    <path d="M8 7V5" />
    <path d="M12 7V4" />
    <path d="M16 7V5" />
  </Icon>
);

Saucepan.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Bed icon (bedroom)
export const Bed = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M2 9v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9" />
    <path d="M2 13h20" />
    <path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
    <rect x="6" y="7" width="4" height="4" rx="1" />
    <rect x="14" y="7" width="4" height="4" rx="1" />
  </Icon>
);

Bed.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Desk lamp icon (office)
export const DeskLamp = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M14 5l-2 8" />
    <path d="M9 13h6l2-8H7l2 8z" />
    <path d="M12 13v5" />
    <path d="M8 21h8" />
    <path d="M12 18h0" />
  </Icon>
);

DeskLamp.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Bathroom/shower icon
export const Shower = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M4 15h16" />
    <path d="M7 15v5" />
    <path d="M17 15v5" />
    <circle cx="12" cy="8" r="3" />
    <path d="M12 5V3" />
    <path d="M8 11l-1 1" />
    <path d="M16 11l1 1" />
  </Icon>
);

Shower.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Garage/car icon
export const Car = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M5 17h14v-5H5v5z" />
    <path d="M6 12l2-5h8l2 5" />
    <circle cx="7" cy="17" r="1" />
    <circle cx="17" cy="17" r="1" />
  </Icon>
);

Car.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Garden/outdoor icon
export const Tree = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <path d="M12 22v-7" />
    <path d="M12 8a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
    <path d="M12 4a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z" />
  </Icon>
);

Tree.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };

// Door icon (hallway/entry)
export const Door = ({ size = 24, className = '', style = {} }) => (
  <Icon size={size} className={className} style={style}>
    <rect x="5" y="2" width="14" height="20" rx="1" />
    <circle cx="15" cy="12" r="1" />
  </Icon>
);

Door.propTypes = { size: PropTypes.number, className: PropTypes.string, style: PropTypes.object };
