// Re-export Lucide icons with consistent styling
// Using strokeWidth 1.5 to match our design
import {
  Lightbulb,
  Loader2,
  Moon as LucideMoon,
  Sun as LucideSun,
  Home as LucideHome,
  LayoutGrid,
  Power as LucidePower,
  LogOut,
  Sofa as LucideSofa,
  UtensilsCrossed,
  CookingPot,
  Bed as LucideBed,
  LampDesk,
  ShowerHead,
  Car as LucideCar,
  TreeDeciduous,
  DoorOpen
} from 'lucide-react';

// Default props for consistent styling
const defaultProps = {
  strokeWidth: 1.5
};

// Light bulb - on state (filled)
export const LightbulbOn = (props) => (
  <Lightbulb {...defaultProps} fill="currentColor" {...props} />
);

// Light bulb - off state (outline only)
export const LightbulbOff = (props) => (
  <Lightbulb {...defaultProps} {...props} />
);

// Loading spinner with rotation animation
export const Spinner = ({ className = '', ...props }) => (
  <Loader2 {...defaultProps} className={`icon-spin ${className}`} {...props} />
);

// Moon icon (for "turn off")
export const Moon = (props) => (
  <LucideMoon {...defaultProps} {...props} />
);

// Sun icon (for "turn on")
export const Sun = (props) => (
  <LucideSun {...defaultProps} {...props} />
);

// Home icon (for rooms)
export const Home = (props) => (
  <LucideHome {...defaultProps} {...props} />
);

// Grid icon (for zones)
export const Grid = (props) => (
  <LayoutGrid {...defaultProps} {...props} />
);

// Power icon (for toggle buttons)
export const Power = (props) => (
  <LucidePower {...defaultProps} {...props} />
);

// Logout icon
export const Logout = (props) => (
  <LogOut {...defaultProps} {...props} />
);

// Sofa icon (living room)
export const Sofa = (props) => (
  <LucideSofa {...defaultProps} {...props} />
);

// Dining table icon (dining room)
export const DiningTable = (props) => (
  <UtensilsCrossed {...defaultProps} {...props} />
);

// Saucepan/cooking pot icon (kitchen)
export const Saucepan = (props) => (
  <CookingPot {...defaultProps} {...props} />
);

// Bed icon (bedroom)
export const Bed = (props) => (
  <LucideBed {...defaultProps} {...props} />
);

// Desk lamp icon (office)
export const DeskLamp = (props) => (
  <LampDesk {...defaultProps} {...props} />
);

// Shower icon (bathroom)
export const Shower = (props) => (
  <ShowerHead {...defaultProps} {...props} />
);

// Car icon (garage)
export const Car = (props) => (
  <LucideCar {...defaultProps} {...props} />
);

// Tree icon (garden/outdoor)
export const Tree = (props) => (
  <TreeDeciduous {...defaultProps} {...props} />
);

// Door icon (hallway/entry)
export const Door = (props) => (
  <DoorOpen {...defaultProps} {...props} />
);
