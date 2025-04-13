import React, { useMemo, useCallback, memo, useEffect, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import Tooltip from './Tooltip';
import CountryDetails from './CountryDetails';
import { useTariffData } from '../hooks/useTariffData';

// Use CDN URL for the geography data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Color legend data
const colorLegendStops = [
  { value: 0, label: '0%' },
  { value: 70, label: '70%' }
];

// Memoize the color scale function
const createColorScale = () => {
  return scaleLinear<string>()
    .domain([0, 10, 20, 30, 40, 50, 60, 70])
    .range([
      '#F1F5F9', // 0% - Light gray
      '#CBD5E1', // 10% - Slightly darker gray
      '#94A3B8', // 20% - Medium gray
      '#475569', // 30% - Dark gray
      '#1E293B', // 40% - Very dark gray
      '#0F172A', // 50% - Almost black
      '#020617'  // 60-70% - Black
    ]);
};

// US specific styling
const US_STYLES = {
  fill: '#C4C3C8', 
  stroke: '#FFFFFF',
  strokeWidth: 0.75, // Slightly thicker border for emphasis
};

// Memoize the projection configuration
const projectionConfig = {
  scale: 150,
  center: [0, 20] as [number, number],
};

interface WorldMapProps {
  data?: any;
  onCountryClick?: (countryId: string) => void;
  onCountryHover?: (countryId: string) => void;
}

const WorldMap: React.FC<WorldMapProps> = memo(({ data, onCountryClick, onCountryHover }) => {
  const [tooltipData, setTooltipData] = React.useState<{
    countryName: string;
    data: any;
    x: number;
    y: number;
  } | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);
  const { tariffData, loading, error } = useTariffData();
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);
  const [selectedCountryData, setSelectedCountryData] = React.useState<any>(null);
  const [geographies, setGeographies] = useState<any[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    claimedTariff: number;
    reciprocalTariff: number;
  } | null>(null);

  // Check if device is mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Memoize the color scale
  const colorScale = useMemo(() => createColorScale(), []);

  // Memoize the getCountryColor function
  const getCountryColor = useCallback((geo: any) => {
    const countryCode = geo?.properties?.ISO_A3;
    
    if (!countryCode) return '#F1F5F9';
    
    if (countryCode === 'USA') {
      return US_STYLES.fill;
    }
    
    // Get the tariff data using the ISO3 code
    const countryData = tariffData[countryCode];
    
    if (countryData) {
      return colorScale(countryData.claimed_tariff);
    }
    
    return '#F1F5F9'; // Light gray for countries not in our data
  }, [tariffData, colorScale]);

  // Handle mouse events
  const handleMouseEnter = useCallback((geo: any, event: any) => {
    const countryCode = geo?.properties?.ISO_A3;
    if (!countryCode) return;

    const countryData = tariffData[countryCode];
    if (!countryData) return;

    setTooltipData({
      countryName: geo.properties.name,
      data: countryData,
      x: event.clientX,
      y: event.clientY
    });

    setHoveredCountry(countryCode);
    onCountryHover?.(countryCode);
  }, [tariffData, onCountryHover]);

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
    setHoveredCountry(null);
  }, []);

  const handleCountryClick = useCallback((geo: any) => {
    const countryCode = geo?.properties?.ISO_A3;
    if (!countryCode) return;

    setSelectedCountry(countryCode);
    onCountryClick?.(countryCode);
  }, [onCountryClick]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((geo: any, event: any) => {
    event.preventDefault();
    handleMouseEnter(geo, event);
  }, [handleMouseEnter]);

  const handleTouchEnd = useCallback((event: any) => {
    event.preventDefault();
    handleMouseLeave();
  }, [handleMouseLeave]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  }, []);

  // Memoize the tooltip styles
  const tooltipStyles = useCallback((x: number, y: number) => ({
    position: 'fixed' as const,
    top: y + 10,
    left: x + 10,
    zIndex: 1000,
    pointerEvents: 'none' as const,
  }), []);

  // Memoize the renderGeographies function
  const renderGeographies = useCallback(({ geographies }: { geographies: any[] }) => {
    return geographies.map(geo => {
      const countryCode = geo?.properties?.ISO_A3;
      const isHovered = hoveredCountry === countryCode;
      const isSelected = selectedCountry === countryCode;

      return (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={getCountryColor(geo)}
          stroke="#FFFFFF"
          strokeWidth={0.5}
          style={{
            default: {
              outline: 'none',
            },
            hover: {
              fill: isHovered ? '#475569' : getCountryColor(geo),
              outline: 'none',
              cursor: 'pointer',
            },
            pressed: {
              fill: '#1E293B',
              outline: 'none',
            },
          }}
          onMouseEnter={(event) => handleMouseEnter(geo, event)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleCountryClick(geo)}
          onTouchStart={(event) => handleTouchStart(geo, event)}
          onTouchEnd={handleTouchEnd}
        />
      );
    });
  }, [tariffData, colorScale, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd, handleCountryClick]);

  if (loading) {
    return (
      <div className="w-full aspect-[21/9] bg-gray-100 flex items-center justify-center">
        Loading Map...
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full aspect-[21/9] bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-red-600">Error loading map: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div style={{ aspectRatio: '21/9' }} className="relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={projectionConfig}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={zoom}>
            <Geographies geography={geoUrl}>
              {renderGeographies}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom Controls - Adjusted positioning */}
        <div className="absolute right-4 top-4 flex flex-col space-y-2 z-10">
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
        {!isMobile && (
          <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white rounded-lg shadow-lg p-2 md:p-4">
            <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Tariff Rate</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 md:h-2 w-24 md:w-48 bg-gradient-to-r from-[#F1F5F9] via-[#475569] to-[#020617] rounded" />
            </div>
            <div className="flex justify-between mt-0.5 md:mt-1">
              {colorLegendStops.map(stop => (
                <div key={stop.value} className="text-[8px] md:text-xs text-gray-600">
                  {stop.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated - Made more compact for mobile */}
        {!isMobile && (
          <div className="absolute right-2 md:right-4 bottom-2 md:bottom-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-2 py-1 md:px-4 md:py-2">
            <div className="text-[8px] md:text-xs text-gray-500">Last Updated: April 7 2025</div>
          </div>
        )}

        {tooltipData && (
          <div style={tooltipStyles(tooltipData.x, tooltipData.y)}>
            <Tooltip
              countryName={tooltipData.countryName}
              data={tooltipData.data}
            />
          </div>
        )}
      </div>

      {/* Country Details Modal - Using the existing CountryDetails component */}
      {selectedCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CountryDetails 
              countryCode={selectedCountry} 
              onClose={() => setSelectedCountry(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

WorldMap.displayName = 'WorldMap';

export default WorldMap; 