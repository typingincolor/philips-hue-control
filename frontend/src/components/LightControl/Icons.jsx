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
  DoorOpen,
  // Scene icons
  Sunrise,
  Sunset,
  Heart,
  Palette,
  Briefcase,
  Users,
  Focus,
  CloudMoon,
  Gamepad2,
  Sparkles,
  Coffee,
  Wine,
  Tv,
  PartyPopper,
  Flame,
  Snowflake,
  Zap,
  Eye,
  BookOpen,
  Music,
  Dumbbell,
  Bath,
  Baby,
  Star
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

// ============================================
// Scene Icons
// ============================================

// Scene icon mapping - maps scene name patterns to icons
const sceneIconMap = {
  // Brightness/Energy scenes
  bright: Sun,
  energize: Zap,
  concentrate: Focus,
  focus: Focus,
  work: Briefcase,
  meeting: Users,
  read: BookOpen,
  reading: BookOpen,

  // Relaxation scenes
  relax: Sofa,
  calm: CloudMoon,
  dimmed: LucideMoon,
  nightlight: LucideMoon,
  night: LucideMoon,

  // Time of day scenes
  morning: Sunrise,
  sunrise: Sunrise,
  evening: Sunset,
  sunset: Sunset,

  // Dining/Social scenes
  dinner: UtensilsCrossed,
  dining: UtensilsCrossed,
  romantic: Heart,
  date: Heart,
  party: PartyPopper,

  // Activity scenes
  movie: Tv,
  tv: Tv,
  gaming: Gamepad2,
  game: Gamepad2,
  play: Gamepad2,
  music: Music,
  workout: Dumbbell,
  exercise: Dumbbell,

  // Mood scenes
  creative: Palette,
  warm: Flame,
  cozy: Flame,
  cool: Snowflake,
  arctic: Snowflake,

  // Special scenes
  welcome: DoorOpen,
  away: Eye,
  coffee: Coffee,
  wine: Wine,
  bath: Bath,
  spa: Bath,
  nap: LucideBed,
  sleep: LucideBed,
  baby: Baby,
  nursery: Baby,

  // Default
  default: Sparkles
};

// Get the appropriate icon component for a scene name
export const getSceneIcon = (sceneName) => {
  if (!sceneName) return Sparkles;

  const normalizedName = sceneName.toLowerCase().trim();

  // Check for exact match first
  if (sceneIconMap[normalizedName]) {
    return sceneIconMap[normalizedName];
  }

  // Check for partial matches
  for (const [key, IconComponent] of Object.entries(sceneIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return IconComponent;
    }
  }

  // Default icon for custom/unknown scenes
  return Star;
};

// Scene icon component that auto-selects icon based on name
export const SceneIcon = ({ name, ...props }) => {
  const IconComponent = getSceneIcon(name);
  return <IconComponent {...defaultProps} {...props} />;
};
