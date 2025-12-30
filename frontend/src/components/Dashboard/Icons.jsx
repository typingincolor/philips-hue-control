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
  Menu as LucideMenu,
  X as LucideX,
  ArrowLeft as LucideArrowLeft,
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
  Star,
  // Weather icons
  Cloud as LucideCloud,
  CloudSun as LucideCloudSun,
  CloudRain as LucideCloudRain,
  CloudSnow as LucideCloudSnow,
  CloudDrizzle as LucideCloudDrizzle,
  CloudFog as LucideCloudFog,
  CloudLightning as LucideCloudLightning,
  Wind as LucideWind,
  Thermometer as LucideThermometer,
  MapPin as LucideMapPin,
  Settings as LucideSettings,
  Clock as LucideClock,
  LocateFixed as LucideLocateFixed,
} from 'lucide-react';

// Default props for consistent styling
const defaultProps = {
  strokeWidth: 1.5,
};

// Light bulb - on state (filled)
export const LightbulbOn = (props) => (
  <Lightbulb {...defaultProps} fill="currentColor" {...props} />
);

// Light bulb - off state (outline only)
export const LightbulbOff = (props) => <Lightbulb {...defaultProps} {...props} />;

// Loading spinner with rotation animation

export const Spinner = ({ className = '', ...props }) => (
  <Loader2 {...defaultProps} className={`icon-spin ${className}`} {...props} />
);

// Moon icon (for "turn off")
export const Moon = (props) => <LucideMoon {...defaultProps} {...props} />;

// Sun icon (for "turn on")
export const Sun = (props) => <LucideSun {...defaultProps} {...props} />;

// Home icon (for rooms)
export const Home = (props) => <LucideHome {...defaultProps} {...props} />;

// Grid icon (for zones)
export const Grid = (props) => <LayoutGrid {...defaultProps} {...props} />;

// Power icon (for toggle buttons)
export const Power = (props) => <LucidePower {...defaultProps} {...props} />;

// Logout icon
export const Logout = (props) => <LogOut {...defaultProps} {...props} />;

// Menu icon (hamburger)
export const Menu = (props) => <LucideMenu {...defaultProps} {...props} />;

// X/Close icon
export const X = (props) => <LucideX {...defaultProps} {...props} />;

// Arrow left (back button)
export const ArrowLeft = (props) => <LucideArrowLeft {...defaultProps} {...props} />;

// Sofa icon (living room)
export const Sofa = (props) => <LucideSofa {...defaultProps} {...props} />;

// Dining table icon (dining room)
export const DiningTable = (props) => <UtensilsCrossed {...defaultProps} {...props} />;

// Saucepan/cooking pot icon (kitchen)
export const Saucepan = (props) => <CookingPot {...defaultProps} {...props} />;

// Bed icon (bedroom)
export const Bed = (props) => <LucideBed {...defaultProps} {...props} />;

// Desk lamp icon (office)
export const DeskLamp = (props) => <LampDesk {...defaultProps} {...props} />;

// Shower icon (bathroom)
export const Shower = (props) => <ShowerHead {...defaultProps} {...props} />;

// Car icon (garage)
export const Car = (props) => <LucideCar {...defaultProps} {...props} />;

// Tree icon (garden/outdoor)
export const Tree = (props) => <TreeDeciduous {...defaultProps} {...props} />;

// Door icon (hallway/entry)
export const Door = (props) => <DoorOpen {...defaultProps} {...props} />;

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
  default: Sparkles,
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
  // Get the icon component constructor - this is a valid pattern for dynamic icon selection
  const IconComponent = getSceneIcon(name);

  return <IconComponent {...defaultProps} {...props} />;
};

// ============================================
// Weather Icons
// ============================================

// Weather icon exports
export const Cloud = (props) => <LucideCloud {...defaultProps} {...props} />;
export const CloudSun = (props) => <LucideCloudSun {...defaultProps} {...props} />;
export const CloudRain = (props) => <LucideCloudRain {...defaultProps} {...props} />;
export const CloudSnow = (props) => <LucideCloudSnow {...defaultProps} {...props} />;
export const CloudDrizzle = (props) => <LucideCloudDrizzle {...defaultProps} {...props} />;
export const CloudFog = (props) => <LucideCloudFog {...defaultProps} {...props} />;
export const CloudLightning = (props) => <LucideCloudLightning {...defaultProps} {...props} />;
export const Wind = (props) => <LucideWind {...defaultProps} {...props} />;
export const Thermometer = (props) => <LucideThermometer {...defaultProps} {...props} />;
export const MapPin = (props) => <LucideMapPin {...defaultProps} {...props} />;
export const LocateFixed = (props) => <LucideLocateFixed {...defaultProps} {...props} />;
export const Settings = (props) => <LucideSettings {...defaultProps} {...props} />;
export const Clock = (props) => <LucideClock {...defaultProps} {...props} />;

// Weather condition to icon mapping
// Maps condition strings from the backend to icons
const weatherConditionIconMap = {
  // Clear
  'Clear sky': LucideSun,
  'Mainly clear': LucideCloudSun,
  'Partly cloudy': LucideCloudSun,
  // Overcast
  Overcast: LucideCloud,
  // Fog
  Fog: LucideCloudFog,
  'Depositing rime fog': LucideCloudFog,
  // Drizzle
  'Light drizzle': LucideCloudDrizzle,
  'Moderate drizzle': LucideCloudDrizzle,
  'Dense drizzle': LucideCloudDrizzle,
  'Light freezing drizzle': LucideCloudDrizzle,
  'Dense freezing drizzle': LucideCloudDrizzle,
  // Rain
  'Slight rain': LucideCloudRain,
  'Moderate rain': LucideCloudRain,
  'Heavy rain': LucideCloudRain,
  'Light freezing rain': LucideCloudRain,
  'Heavy freezing rain': LucideCloudRain,
  'Slight rain showers': LucideCloudRain,
  'Moderate rain showers': LucideCloudRain,
  'Violent rain showers': LucideCloudRain,
  // Snow
  'Slight snow': LucideCloudSnow,
  'Moderate snow': LucideCloudSnow,
  'Heavy snow': LucideCloudSnow,
  'Snow grains': LucideCloudSnow,
  'Slight snow showers': LucideCloudSnow,
  'Heavy snow showers': LucideCloudSnow,
  // Thunderstorm
  Thunderstorm: LucideCloudLightning,
  'Thunderstorm with slight hail': LucideCloudLightning,
  'Thunderstorm with heavy hail': LucideCloudLightning,
};

/**
 * Get the weather icon component for a condition string
 * @param {string} condition - Weather condition description
 * @returns {React.Component} Icon component
 */
export const getWeatherIcon = (condition) => {
  return weatherConditionIconMap[condition] || LucideSun;
};

/**
 * Weather icon component that auto-selects icon based on condition
 */
export const WeatherIcon = ({ condition, ...props }) => {
  const IconComponent = getWeatherIcon(condition);
  return <IconComponent {...defaultProps} {...props} />;
};

// ============================================
// Hive Icons (Heating / Hot Water)
// ============================================

/**
 * Heating flame icon for Hive heating
 */
export const HeatingIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M12 2c0 4-4 6-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-6-4-10zm0 14c-1.1 0-2-.9-2-2 0-2 2-3 2-5 0 2 2 3 2 5 0 1.1-.9 2-2 2z" />
  </svg>
);

/**
 * Water droplet icon for Hive hot water
 */
export const WaterIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
  </svg>
);
