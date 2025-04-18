import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleThreshold } from 'd3-scale';
import { useUsTariffData } from '../hooks/useUsTariffData';
import MapTooltip from './MapTooltip';

// Use CDN URL for the geography data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Define the color scale stops
const COLOR_STOPS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' }
];

// Memoize the color scale function
const createColorScale = () => {
  return scaleThreshold<number, string>()
    .domain([10, 15, 20, 30, 50, 100, 150])
    .range([
      '#E0E0E0', // 0–10% (neutral gray)
      '#FFE4CC', // 10–15%
      '#FFD4A3', // 15–20%
      '#FB923C', // 20–30%
      '#F97316', // 30–50%
      '#EA580C', // 50–100%
      '#C2410C', // 100–150%
      '#9A3412'  // >150%
    ]);
};

// US specific styling
const US_STYLES = {
  fill: '#F1F5F9',
  stroke: '#FFFFFF',
  strokeWidth: 0.75,
};

// Memoize the projection configuration
const projectionConfig = {
  scale: 150,
  center: [0, 20] as [number, number],
};

// Memoize the tooltip styles
const tooltipStyles = (x: number, y: number, isMobile: boolean) => ({
  position: 'fixed' as const,
  zIndex: 1000,
  pointerEvents: 'none' as const,
  left: isMobile ? '50%' : `${x + 12}px`,
  top: isMobile ? 'auto' : `${y - 12}px`,
  bottom: isMobile ? '20px' : 'auto',
  transform: isMobile ? 'translateX(-50%)' : 'translate(0, -100%)',
  transition: 'transform 0.1s ease-out',
  maxWidth: '90vw',
});

interface UsTariffMapProps {
  onCountrySelect: (country: { name: string; code: string }) => void;
}

const UsTariffMap: React.FC<UsTariffMapProps> = memo(({ onCountrySelect }) => {
  const [tooltipData, setTooltipData] = useState<{
    countryName: string;
    data: {
      tariff_rate_1: number;
      tariff_rate_2: number;
      date_1: string;
      date_2: string;
    };
    x: number;
    y: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(2);
  const { tariffData, loading, error } = useUsTariffData();

  // Add scroll event listener to hide tooltip
  useEffect(() => {
    const handleScroll = () => {
      setTooltipData(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format date for display
  const formatDateForDisplay = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  }, []);

  // Get dates from tariff data
  const dates = useMemo(() => {
    if (!tariffData || Object.keys(tariffData).length === 0) return { date1: '', date2: '' };
    const firstCountry = Object.values(tariffData)[0];
    return {
      date1: firstCountry.date_1,
      date2: firstCountry.date_2
    };
  }, [tariffData]);

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

  // Handle mouse enter for tooltip
  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    
    if (!countryId || !countryName) return;
    
    const countryData = tariffData[countryId];
    if (countryData) {
      setTooltipData({
        countryName,
        data: {
          tariff_rate_1: countryData.tariff_rate_1,
          tariff_rate_2: countryData.tariff_rate_2,
          date_1: countryData.date_1,
          date_2: countryData.date_2
        },
        x: event.clientX,
        y: event.clientY,
      });
    }
  }, [tariffData]);

  // Memoize the handleMouseLeave function
  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((geo: any, event: React.TouchEvent) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    
    if (!countryId || !countryName) return;
    
    const countryData = tariffData[countryId];
    if (countryData) {
      setTooltipData({
        countryName,
        data: {
          tariff_rate_1: countryData.tariff_rate_1,
          tariff_rate_2: countryData.tariff_rate_2,
          date_1: countryData.date_1,
          date_2: countryData.date_2
        },
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      });
    }
  }, [tariffData]);

  const handleTouchEnd = useCallback(() => {
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
    
    if (!countryId || !countryName || countryId === '840') return;
    
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
        if (countryId === '840') {
          fillColor = US_STYLES.fill;
        } else {
          const countryData = tariffData[countryId];
          if (countryData) {
            const rate = activeTab === 1 ? countryData.tariff_rate_1 : countryData.tariff_rate_2;
            fillColor = colorScale(rate);
          }
        }
        
        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onMouseEnter={(e) => handleMouseEnter(geo, e as any)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => handleTouchStart(geo, e as any)}
            onTouchEnd={handleTouchEnd}
            onClick={() => handleCountryClick(geo)}
            style={{
              default: {
                fill: fillColor,
                stroke: '#FFFFFF',
                strokeWidth: 0.75,
                outline: 'none',
                cursor: countryId === '840' ? 'default' : 'pointer',
              },
              hover: {
                fill: fillColor,
                stroke: countryId === '840' ? '#FFFFFF' : '#000',
                strokeWidth: countryId === '840' ? 0.75 : 1,
                outline: 'none',
              },
              pressed: {
                fill: fillColor,
                stroke: countryId === '840' ? '#FFFFFF' : '#000',
                strokeWidth: countryId === '840' ? 0.75 : 1,
                outline: 'none',
              },
            }}
          />
        );
      });
  }, [tariffData, colorScale, activeTab, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd, handleCountryClick]);

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
      <div style={{ aspectRatio: isMobile ? '4/3' : '21/9' }} className="relative">
        {/* Map Title - Tab style */}
        <div className="absolute top-1 left-1 md:top-4 md:left-4 z-20 bg-white/90 backdrop-blur-sm rounded-t-md shadow-lg px-2 py-1 md:px-4 md:py-2">
          <h2 className="text-[10px] md:text-sm font-medium text-gray-900">
            US Tariff Rates by Country (2025)
          </h2>
        </div>

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

        {/* Date Tabs - Moved to bottom right */}
        <div className="absolute bottom-1 right-1 md:bottom-4 md:right-4 z-10 flex flex-col items-end space-y-1">
          <div className="text-[8px] md:text-xs text-gray-600 font-medium bg-white/90 backdrop-blur-sm rounded-t-md px-2 py-0.5">
            US Reciprocal Tariff Timeline
          </div>
          <div className="flex space-x-1 md:space-x-2">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-sm font-medium transition-colors ${
                activeTab === 1
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {dates.date1 ? formatDateForDisplay(dates.date1) : 'Loading...'}
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-sm font-medium transition-colors ${
                activeTab === 2
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {dates.date2 ? formatDateForDisplay(dates.date2) : 'Loading...'}
            </button>
          </div>
        </div>

        {/* Color Legend - Make it smaller and more compact on mobile */}

        <div className="absolute left-1 md:left-4 bottom-1 md:bottom-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 md:p-4"
          title="Analyze US tariff rates and customs duties by country">
          <div className="text-[8px] md:text-sm font-medium mb-0.5 md:mb-2">Tariff Rate (%)</div>
          <div className="flex flex-col gap-0.5">
            <div className="flex w-fit overflow-hidden rounded">
              <div className="h-1 md:h-2 w-2 md:w-6" style={{ backgroundColor: '#E0E0E0' }} title="<10%" />
              <div className="h-1 md:h-2 w-2 md:w-6" style={{ backgroundColor: '#FFE4CC' }} title="10–15%" />
              <div className="h-1 md:h-2 w-2 md:w-6" style={{ backgroundColor: '#FFD4A3' }} title="15–20%" />
              <div className="h-1 md:h-2 w-3 md:w-8" style={{ backgroundColor: '#FB923C' }} title="20–30%" />
              <div className="h-1 md:h-2 w-3 md:w-8" style={{ backgroundColor: '#F97316' }} title="30–50%" />
              <div className="h-1 md:h-2 w-4 md:w-10" style={{ backgroundColor: '#EA580C' }} title="50–100%" />
              <div className="h-1 md:h-2 w-4 md:w-10" style={{ backgroundColor: '#C2410C' }} title="100–150%" />
              <div className="h-1 md:h-2 w-2 md:w-6" style={{ backgroundColor: '#9A3412' }} title=">150%" />
            </div>
            <div className="flex justify-between w-full">
              <span className="text-[6px] md:text-xs text-gray-600">0%</span>
              <span className="text-[6px] md:text-xs text-gray-600">150%+</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls - Make them smaller and more compact on mobile */}
        <div className="absolute right-1 md:right-4 top-1 md:top-4 flex flex-col space-y-0.5 md:space-y-2 z-10">
          <button
            onClick={handleZoomIn}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 md:p-2 hover:bg-gray-50 transition-colors"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-5 md:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 md:p-2 hover:bg-gray-50 transition-colors"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-5 md:w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tooltip - Only show on non-mobile screens */}
      {tooltipData && !isMobile && (
        <div
          className="fixed z-50"
          style={tooltipStyles(tooltipData.x, tooltipData.y, isMobile)}
        >
          <MapTooltip 
            data={{
              claimed_tariff: tooltipData.data.tariff_rate_1,
              reciprocal_tariff: tooltipData.data.tariff_rate_2
            }}
            countryName={tooltipData.countryName}
          />
        </div>
      )}
    </div>
  );
});

export default UsTariffMap; 