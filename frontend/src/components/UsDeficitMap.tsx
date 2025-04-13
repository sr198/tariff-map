import React, { useMemo, useCallback, memo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLog, scaleLinear } from 'd3-scale';
import { useDeficitData } from '../hooks/useDeficitData';
import MapTooltip from './MapTooltip';
import { DeficitMapItem } from '../services/tradeService';

// Use CDN URL for the geography data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// US specific styling
const US_STYLES = {
  fill: '#9A3412',
  stroke: '#FFFFFF',
  strokeWidth: 0.75,
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

interface UsDeficitMapProps {
  onCountrySelect: (country: { name: string; code: string }) => void;
}

const UsDeficitMap: React.FC<UsDeficitMapProps> = memo(({ onCountrySelect }) => {
  const [tooltipData, setTooltipData] = useState<{
    data: DeficitMapItem;
    x: number;
    y: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { deficitData, loading, error } = useDeficitData();

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

  // Transform deficit data into a map for easier lookup
  const deficitMap = useMemo(() => {
    if (!deficitData?.deficits) return {};

    return deficitData.deficits.reduce((acc: { [key: string]: any }, item: DeficitMapItem) => {
      // Convert number to string and pad with leading zeros to match the map format
      const paddedId = String(item.country_id).padStart(3, '0');
      acc[paddedId] = {
        deficit: item.deficit_thousands,
        country_name: item.country_name
      };
      return acc;
    }, {});
  }, [deficitData]);

  // Calculate min and max values from the data
  const { minValue, maxValue } = useMemo(() => {
    if (!deficitData?.deficits) return { minValue: -1000000000, maxValue: 1000000000 };

    const values = deficitData.deficits.map((d: DeficitMapItem) => d.deficit_thousands);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      minValue: min,
      maxValue: max
    };
  }, [deficitData]);

  // Memoize the color scale with logarithmic scale
  const colorScale = useMemo(() => {
    // For deficits, we want the most negative value to be the darkest red
    const scale = scaleLog<string>()
      .domain([Math.abs(minValue), 1]) // Use logarithmic scale for better distribution
      .range([
        '#DC2626',   // Crimson red for largest deficit
        '#F1F5F9'    // Neutral gray for balanced
      ]);
    return scale;
  }, [minValue]);

  // Format value for tooltip display
  const formatValue = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) { // If value is >= 1 billion (1000 * 1000000)
      return `${(value / 1000000).toFixed(2)}B`;
    } else {
      return `${(value / 1000).toFixed(2)}M`;
    }
  };

  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    
    if (!countryId || !countryName) return;
    
    const countryData = deficitMap[countryId];
    if (countryData) {
      const rawValue = countryData.deficit;
      const absValue = Math.abs(rawValue);
      const displayValue = absValue >= 1000000 
        ? `${(absValue / 1000000).toFixed(2)}B` 
        : `${(absValue / 1000).toFixed(2)}M`;
      const type = rawValue > 0 ? 'Surplus' : 'Deficit';
      
      setTooltipData({
        data: {
          country_id: countryId,
          country_code: countryId,
          country_name: countryName,
          deficit_thousands: rawValue
        },
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [deficitMap]);

  // Memoize the handleMouseLeave function
  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  }, []);

  // Handle country click
  const handleCountryClick = useCallback((geo: any) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    
    if (!countryId || !countryName) return;
    
    onCountrySelect({
      name: countryName,
      code: countryId
    });
  }, [onCountrySelect]);

  // Memoize the geographies rendering
  const renderGeographies = useCallback(({ geographies }: { geographies: any[] }) => {
    return geographies
      .filter(geo => geo.properties.name !== 'Antarctica')
      .map(geo => {
        const countryId = geo.id;
        const countryName = geo.properties.name;
        
        let fillColor = '#F1F5F9';
        if (countryId === 'USA') {
          fillColor = US_STYLES.fill;
        } else {
          const countryData = deficitMap[countryId];
          if (countryData) {
            // Use light green for surpluses, red scale for deficits
            fillColor = countryData.deficit < 0 
              ? colorScale(Math.abs(countryData.deficit)) // Use absolute value for color scale
              : countryData.deficit > 0
                ? '#D1FAE5' // Light green for surpluses
                : '#F1F5F9'; // Neutral gray for balanced
          }
        }
        
        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onMouseEnter={(e) => handleMouseEnter(geo, e as any)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleCountryClick(geo)}
            style={{
              default: {
                fill: fillColor,
                stroke: '#FFFFFF',
                strokeWidth: 0.75,
                outline: 'none',
              },
              hover: {
                fill: fillColor,
                stroke: '#000',
                strokeWidth: 1,
                outline: 'none',
              },
              pressed: {
                fill: fillColor,
                stroke: '#000',
                strokeWidth: 1,
                outline: 'none',
              },
            }}
          />
        );
      });
  }, [deficitMap, colorScale, handleMouseEnter, handleMouseLeave, handleCountryClick]);

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

        {/* Color Legend - Make it smaller and more compact on mobile */}
        {!isMobile && (
          <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 md:p-4">
            <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Trade Balance (USD)</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 md:h-2 w-16 md:w-48 bg-gradient-to-r from-[#10B981] via-[#F1F5F9] to-[#EF4444] rounded" />
            </div>
            <div className="flex justify-between mt-0.5 md:mt-1">
              <div className="text-[8px] md:text-xs text-gray-600">Surplus</div>
              <div className="text-[8px] md:text-xs text-gray-600">Balanced</div>
              <div className="text-[8px] md:text-xs text-gray-600">Deficit</div>
            </div>
          </div>
        )}

        {/* Zoom Controls - Make them smaller on mobile */}
        <div className="absolute right-2 md:right-4 top-2 md:top-4 flex flex-col space-y-1 md:space-y-2 z-10">
          <button
            onClick={handleZoomIn}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1.5 md:p-2 hover:bg-gray-50 transition-colors"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1.5 md:p-2 hover:bg-gray-50 transition-colors"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50"
          style={tooltipStyles(tooltipData.x, tooltipData.y)}
        >
          <MapTooltip 
            data={{
              deficit_thousands: tooltipData.data.deficit_thousands
            }}
            countryName={tooltipData.data.country_name}
          />
        </div>
      )}
    </div>
  );
});

export default UsDeficitMap; 