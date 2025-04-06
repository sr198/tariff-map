import React, { useMemo, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import Tooltip from './Tooltip';

// Use CDN URL for the geography data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Color legend data
const colorLegendStops = [
  { value: 0, label: '0%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 30, label: '30%' },
  { value: 40, label: '40%' },
  { value: 50, label: '50%' },
];

// Memoize the color scale function
const createColorScale = () => {
  return scaleLinear<string>()
    .domain([0, 10, 20, 30, 40, 50])
    .range([
      '#F1F5F9', // No data
      '#E2E8F0', // 0-10%
      '#94A3B8', // 10-20%
      '#475569', // 20-30%
      '#1E293B', // 30-40%
      '#0F172A'  // 40-50%
    ]);
};

// US specific styling
const US_STYLES = {
  fill: '#10A981', // Distinct green color for US
  stroke: '#FFFFFF',
  strokeWidth: 0.75, // Slightly thicker border for emphasis
};

// Memoize the projection configuration
const projectionConfig = {
  scale: 150,
  center: [0, 20] as [number, number],
};

// Memoize the tooltip styles
const tooltipStyles = (x: number, y: number) => ({
  position: 'fixed' as const,
  zIndex: 1000,
  pointerEvents: 'none' as const,
  left: `${x + 12}px`,
  top: `${y - 12}px`,
  transition: 'transform 0.1s ease-out',
  transform: 'translate(0, -100%)',
});

interface WorldMapProps {
  data: Record<string, any>;
  onCountryClick: (countryName: string) => void;
  onCountryHover: (countryName: string | null) => void;
}

const WorldMap: React.FC<WorldMapProps> = memo(({ data, onCountryClick, onCountryHover }) => {
  const [tooltipData, setTooltipData] = React.useState<{
    countryName: string;
    data: any;
    x: number;
    y: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);

  // Memoize the color scale
  const colorScale = useMemo(() => createColorScale(), []);

  // Memoize the getCountryColor function
  const getCountryColor = useCallback((countryName: string) => {
    if (countryName === 'United States of America') {
      return US_STYLES.fill;
    }
    const countryData = data[countryName];
    if (!countryData?.usImportTariff) return '#F1F5F9';
    return colorScale(Math.min(countryData.usImportTariff, 50));
  }, [data, colorScale]);

  // Memoize the handleCountryClick function
  const handleCountryClick = useCallback((countryName: string) => {
    if (countryName !== 'United States of America') {
      onCountryClick(countryName);
    }
  }, [onCountryClick]);

  // Memoize the handleMouseEnter function
  const handleMouseEnter = useCallback((countryName: string, event: React.MouseEvent) => {
    // Always call onCountryHover for all countries to ensure hover effects work
    onCountryHover(countryName);
    
    // Only show tooltip for non-US countries with data
    if (countryName !== 'United States of America') {
      const countryData = data[countryName];
      if (countryData) {
        setTooltipData({
          countryName,
          data: countryData,
          x: event.clientX,
          y: event.clientY,
        });
      }
    }
  }, [data, onCountryHover]);

  // Memoize the handleMouseLeave function
  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
    onCountryHover(null);
  }, [onCountryHover]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  }, []);

  if (error) {
    return (
      <div className="relative w-full aspect-[21/9] bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-red-600">Error loading map: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: '21/9' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={projectionConfig}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .filter(geo => geo.properties.name !== 'Antarctica')
                .map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => handleMouseEnter(geo.properties.name, event)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleCountryClick(geo.properties.name)}
                    style={{
                      default: {
                        fill: getCountryColor(geo.properties.name),
                        stroke: '#FFFFFF',
                        strokeWidth: geo.properties.name === 'United States of America' ? US_STYLES.strokeWidth : 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: geo.properties.name === 'United States of America' 
                          ? US_STYLES.fill 
                          : getCountryColor(geo.properties.name),
                        stroke: '#FFFFFF',
                        strokeWidth: geo.properties.name === 'United States of America' ? US_STYLES.strokeWidth : 0.75,
                        outline: 'none',
                        cursor: geo.properties.name === 'United States of America' ? 'default' : 'pointer',
                      },
                      pressed: {
                        fill: geo.properties.name === 'United States of America' 
                          ? US_STYLES.fill 
                          : getCountryColor(geo.properties.name),
                        stroke: '#FFFFFF',
                        strokeWidth: geo.properties.name === 'United States of America' ? US_STYLES.strokeWidth : 0.75,
                        outline: 'none',
                      },
                    }}
                  />
                ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-4 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Color Legend - Made more compact for mobile */}
      <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white rounded-lg shadow-lg p-2 md:p-4">
        <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Tariff Rate</div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 md:h-2 w-24 md:w-48 bg-gradient-to-r from-[#F1F5F9] via-[#7BA9E1] to-[#0E3F97] rounded" />
        </div>
        <div className="flex justify-between mt-0.5 md:mt-1">
          {colorLegendStops.map(stop => (
            <div key={stop.value} className="text-[8px] md:text-xs text-gray-600">
              {stop.label}
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated - Made more compact for mobile */}
      <div className="absolute right-2 md:right-4 bottom-2 md:bottom-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-2 py-1 md:px-4 md:py-2">
        <div className="text-[8px] md:text-xs text-gray-500">Last Updated: Jan 2024</div>
      </div>

      {tooltipData && (
        <div style={tooltipStyles(tooltipData.x, tooltipData.y)}>
          <Tooltip
            countryName={tooltipData.countryName}
            data={tooltipData.data}
          />
        </div>
      )}
    </div>
  );
});

WorldMap.displayName = 'WorldMap';

export default WorldMap; 