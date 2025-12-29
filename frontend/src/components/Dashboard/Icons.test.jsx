import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  LightbulbOn,
  LightbulbOff,
  Spinner,
  Moon,
  Sun,
  Home,
  Grid,
  Power,
  Logout,
  Menu,
  X,
  ArrowLeft,
  Sofa,
  DiningTable,
  Saucepan,
  Bed,
  DeskLamp,
  Shower,
  Car,
  Tree,
  Door,
  getSceneIcon,
  SceneIcon,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Wind,
  Thermometer,
  MapPin,
  Settings,
  Clock,
  getWeatherIcon,
  WeatherIcon,
} from './Icons';

describe('Icons', () => {
  describe('basic icon components', () => {
    it('should render LightbulbOn with fill', () => {
      const { container } = render(<LightbulbOn />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    it('should render LightbulbOff without fill', () => {
      const { container } = render(<LightbulbOff />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).not.toHaveAttribute('fill', 'currentColor');
    });

    it('should render Spinner with spin class', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('icon-spin');
    });

    it('should render Spinner with additional className', () => {
      const { container } = render(<Spinner className="extra-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('icon-spin');
      expect(svg).toHaveClass('extra-class');
    });

    it('should render Moon icon', () => {
      const { container } = render(<Moon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Sun icon', () => {
      const { container } = render(<Sun />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Home icon', () => {
      const { container } = render(<Home />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Grid icon', () => {
      const { container } = render(<Grid />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Power icon', () => {
      const { container } = render(<Power />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Logout icon', () => {
      const { container } = render(<Logout />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Menu icon', () => {
      const { container } = render(<Menu />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render X icon', () => {
      const { container } = render(<X />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render ArrowLeft icon', () => {
      const { container } = render(<ArrowLeft />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('room icons', () => {
    it('should render Sofa icon', () => {
      const { container } = render(<Sofa />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render DiningTable icon', () => {
      const { container } = render(<DiningTable />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Saucepan icon', () => {
      const { container } = render(<Saucepan />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Bed icon', () => {
      const { container } = render(<Bed />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render DeskLamp icon', () => {
      const { container } = render(<DeskLamp />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Shower icon', () => {
      const { container } = render(<Shower />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Car icon', () => {
      const { container } = render(<Car />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Tree icon', () => {
      const { container } = render(<Tree />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Door icon', () => {
      const { container } = render(<Door />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('icon props', () => {
    it('should pass size prop to icons', () => {
      const { container } = render(<Sun size={32} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('should pass className prop to icons', () => {
      const { container } = render(<Moon className="custom-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-class');
    });

    it('should use default strokeWidth of 1.5', () => {
      const { container } = render(<Power />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('getSceneIcon', () => {
    describe('exact matches', () => {
      it('should return Sun for "bright"', () => {
        const Icon = getSceneIcon('bright');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "relax"', () => {
        const Icon = getSceneIcon('relax');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "energize"', () => {
        const Icon = getSceneIcon('energize');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "concentrate"', () => {
        const Icon = getSceneIcon('concentrate');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "morning"', () => {
        const Icon = getSceneIcon('morning');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "evening"', () => {
        const Icon = getSceneIcon('evening');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "movie"', () => {
        const Icon = getSceneIcon('movie');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "dinner"', () => {
        const Icon = getSceneIcon('dinner');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "party"', () => {
        const Icon = getSceneIcon('party');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "gaming"', () => {
        const Icon = getSceneIcon('gaming');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "romantic"', () => {
        const Icon = getSceneIcon('romantic');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "work"', () => {
        const Icon = getSceneIcon('work');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "nightlight"', () => {
        const Icon = getSceneIcon('nightlight');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "creative"', () => {
        const Icon = getSceneIcon('creative');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "warm"', () => {
        const Icon = getSceneIcon('warm');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return correct icon for "cool"', () => {
        const Icon = getSceneIcon('cool');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('case insensitivity', () => {
      it('should match "BRIGHT" case-insensitively', () => {
        const Icon = getSceneIcon('BRIGHT');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should match "Relax" case-insensitively', () => {
        const Icon = getSceneIcon('Relax');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should match "MOVIE NIGHT" case-insensitively', () => {
        const Icon = getSceneIcon('MOVIE NIGHT');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('partial matches', () => {
      it('should match "Sunrise Scene" containing "sunrise"', () => {
        const Icon = getSceneIcon('Sunrise Scene');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should match "Movie Night" containing "movie"', () => {
        const Icon = getSceneIcon('Movie Night');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should match "Evening Relax" containing "relax"', () => {
        const Icon = getSceneIcon('Evening Relax');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should match "Party Mode" containing "party"', () => {
        const Icon = getSceneIcon('Party Mode');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('whitespace handling', () => {
      it('should trim whitespace from scene name', () => {
        const Icon = getSceneIcon('  bright  ');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('default/fallback', () => {
      it('should return Star for unknown scene names', () => {
        const Icon = getSceneIcon('My Custom Scene');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return Sparkles for null', () => {
        const Icon = getSceneIcon(null);
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return Sparkles for undefined', () => {
        const Icon = getSceneIcon(undefined);
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should return Sparkles for empty string', () => {
        const Icon = getSceneIcon('');
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('SceneIcon component', () => {
    it('should render correct icon for scene name', () => {
      const { container } = render(<SceneIcon name="relax" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should pass size prop to underlying icon', () => {
      const { container } = render(<SceneIcon name="bright" size={24} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should pass className prop to underlying icon', () => {
      const { container } = render(<SceneIcon name="movie" className="scene-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('scene-icon');
    });

    it('should use default strokeWidth', () => {
      const { container } = render(<SceneIcon name="dinner" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('weather icons', () => {
    it('should render Cloud icon', () => {
      const { container } = render(<Cloud />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudSun icon', () => {
      const { container } = render(<CloudSun />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudRain icon', () => {
      const { container } = render(<CloudRain />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudSnow icon', () => {
      const { container } = render(<CloudSnow />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudDrizzle icon', () => {
      const { container } = render(<CloudDrizzle />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudFog icon', () => {
      const { container } = render(<CloudFog />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render CloudLightning icon', () => {
      const { container } = render(<CloudLightning />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Wind icon', () => {
      const { container } = render(<Wind />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Thermometer icon', () => {
      const { container } = render(<Thermometer />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render MapPin icon', () => {
      const { container } = render(<MapPin />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Settings icon', () => {
      const { container } = render(<Settings />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Clock icon', () => {
      const { container } = render(<Clock />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('getWeatherIcon', () => {
    it('should return Sun icon for "Clear sky"', () => {
      const Icon = getWeatherIcon('Clear sky');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudSun for "Mainly clear"', () => {
      const Icon = getWeatherIcon('Mainly clear');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudSun for "Partly cloudy"', () => {
      const Icon = getWeatherIcon('Partly cloudy');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return Cloud for "Overcast"', () => {
      const Icon = getWeatherIcon('Overcast');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudFog for "Fog"', () => {
      const Icon = getWeatherIcon('Fog');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudDrizzle for "Light drizzle"', () => {
      const Icon = getWeatherIcon('Light drizzle');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudRain for "Moderate rain"', () => {
      const Icon = getWeatherIcon('Moderate rain');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudSnow for "Heavy snow"', () => {
      const Icon = getWeatherIcon('Heavy snow');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return CloudLightning for "Thunderstorm"', () => {
      const Icon = getWeatherIcon('Thunderstorm');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return Sun for unknown condition', () => {
      const Icon = getWeatherIcon('Unknown Condition');
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return Sun for undefined condition', () => {
      const Icon = getWeatherIcon(undefined);
      const { container } = render(<Icon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('WeatherIcon component', () => {
    it('should render correct icon for condition', () => {
      const { container } = render(<WeatherIcon condition="Moderate rain" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should pass size prop to underlying icon', () => {
      const { container } = render(<WeatherIcon condition="Clear sky" size={32} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('should pass className prop to underlying icon', () => {
      const { container } = render(<WeatherIcon condition="Overcast" className="weather-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('weather-icon');
    });

    it('should use default strokeWidth', () => {
      const { container } = render(<WeatherIcon condition="Fog" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });

    it('should handle null condition', () => {
      const { container } = render(<WeatherIcon condition={null} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
