import React, { useMemo, useCallback, memo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { useUsTariffData } from '../hooks/useUsTariffData';
import Tooltip from './Tooltip';

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
  return scaleLinear<string>()
    .domain([0, 25, 50, 75, 100, 125, 150])
    .range([
      '#FED7AA', // 0% - Light orange
      '#FDBA74', // 25% - Light orange
      '#FB923C', // 50% - Orange
      '#F97316', // 75% - Dark orange
      '#EA580C', // 100% - Darker orange
      '#C2410C', // 125% - Deep orange
      '#9A3412'  // 150% - Pure dark orange
    ]);
};

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
  const [activeTab, setActiveTab] = useState(1);
  const { tariffData, loading, error } = useUsTariffData();

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
          date_1: 'April 2',
          date_2: 'April 9'
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
  }, [tariffData, colorScale, activeTab, handleMouseEnter, handleMouseLeave, handleCountryClick]);

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
        {/* Date Tabs */}
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 1
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            April 2
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 2
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            April 9
          </button>
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

        {/* Color Legend */}
        {!isMobile && (
          <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white rounded-lg shadow-lg p-2 md:p-4">
            <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Tariff Rate</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 md:h-2 w-24 md:w-48 bg-gradient-to-r from-[#FED7AA] to-[#9A3412] rounded" />
            </div>
            <div className="flex justify-between mt-0.5 md:mt-1">
              <div className="text-[8px] md:text-xs text-gray-600">0%</div>
              <div className="text-[8px] md:text-xs text-gray-600">150%</div>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
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
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50"
          style={tooltipStyles(tooltipData.x, tooltipData.y)}
        >
          <Tooltip 
            data={{
              ...tooltipData.data,
              tariff_rate_1: activeTab === 1 ? tooltipData.data.tariff_rate_1 : tooltipData.data.tariff_rate_2,
              date_1: activeTab === 1 ? tooltipData.data.date_1 : tooltipData.data.date_2
            }}
            countryName={tooltipData.countryName}
            mapType="tariff"
          />
        </div>
      )}
    </div>
  );
});

export default UsTariffMap; 