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
import { fetchTariffMap, TariffMapResponse } from '@/services/tradeService';

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

// Add EU countries list
const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 
  'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 
  'Slovenia', 'Spain', 'Sweden'
];

interface WorldMapProps {
  data: Record<string, string>;
  onCountryClick: (countryName: string, countryName2?: string) => void;
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
  const [isMobile, setIsMobile] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);
  const [selectedCountryData, setSelectedCountryData] = React.useState<any>(null);
  const [tariffData, setTariffData] = useState<Record<string, { us_reciprocal_tariff: number; trump_claimed_tariff: number }>>({});
  const [loading, setLoading] = useState(true);
  const [geographies, setGeographies] = useState<any[]>([]);

  // Fetch tariff data
  useEffect(() => {
    const loadTariffData = async () => {
      try {
        setLoading(true);
        console.log('Fetching tariff map data...');
        const response = await fetchTariffMap();
        console.log('Tariff map response:', response);
        
        // Convert array to object for easier lookup
        // Use country_name as the key instead of country_code
        const tariffMap = response.tariffs.reduce((acc, item) => {
          acc[item.country_name] = {
            us_reciprocal_tariff: item.us_reciprocal_tariff,
            trump_claimed_tariff: item.trump_claimed_tariff
          };
          return acc;
        }, {} as Record<string, { us_reciprocal_tariff: number; trump_claimed_tariff: number }>);
        
        // Special handling for EU countries
        if (tariffMap['European Union'] !== undefined) {
          const euTariff = tariffMap['European Union'];
          console.log(`Found EU tariff rate: ${euTariff}`);
          
          // Add the EU tariff rate to all EU countries
          EU_COUNTRIES.forEach(country => {
            tariffMap[country] = euTariff;
          });
          
          console.log('Added EU tariff rate to all EU countries');
        }
        
        console.log('Processed tariff map:', tariffMap);
        console.log('Country names in tariff data:', Object.keys(tariffMap));
        
        setTariffData(tariffMap);
        setError(null);
      } catch (err) {
        setError('Failed to load tariff data');
        console.error('Error loading tariff data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTariffData();
  }, []);

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
  const getCountryColor = useCallback((countryName: string) => {
    if (countryName === 'United States of America') {
      return US_STYLES.fill;
    }
    
    // Get the country code from the data
    const countryData = tariffData[countryName];
    
    if (countryData) {
      return colorScale(countryData.us_reciprocal_tariff);
    }
    
    return '#F1F5F9'; // Light gray for countries not in our data
  }, [tariffData, colorScale]);

  // Handle country click on map
  const handleCountryClick = useCallback((countryName: string) => {
    console.log('Country clicked:', countryName);
    console.log('Available data:', tariffData);
    
    if (countryName !== 'United States of America') {
      // Check if the country exists in our data
      if (tariffData[countryName] !== undefined) {
        console.log('Country found in data:', countryName, tariffData[countryName]);
        onCountryClick(countryName, countryName);
      } else {
        console.log('Country not found in data:', countryName);
        
        // Check if it's an EU country
        if (EU_COUNTRIES.includes(countryName) && tariffData['European Union'] !== undefined) {
          console.log('EU country found, using EU tariff rate:', tariffData['European Union']);
          onCountryClick(countryName, countryName);
          return;
        }
        
        // Try to find a close match
        const countryEntries = Object.entries(tariffData);
        const closeMatch = countryEntries.find(([name, _]) => 
          name.toLowerCase().includes(countryName.toLowerCase()) || 
          countryName.toLowerCase().includes(name.toLowerCase())
        );
        
        if (closeMatch) {
          console.log('Found close match:', closeMatch[0]);
          onCountryClick(closeMatch[0], closeMatch[0]);
        } else {
          console.log('No matching country entry found in data');
        }
      }
    }
  }, [tariffData, onCountryClick]);

  // Handle mouse enter for tooltip
  const handleMouseEnter = useCallback((countryName: string, event: React.MouseEvent) => {
    // Always call onCountryHover for all countries to ensure hover effects work
    onCountryHover(countryName);
    
    // Only show tooltip for non-US countries with data
    if (countryName !== 'United States of America') {
      // Check if we have direct data or if it's an EU country
      let countryData = tariffData[countryName];
      let displayName = countryName;
      
      // If no direct data but it's an EU country, use the EU tariff rate
      if (!countryData && EU_COUNTRIES.includes(countryName) && tariffData['European Union'] !== undefined) {
        countryData = tariffData['European Union'];
        displayName = `${countryName} (EU)`;
      }
      
      if (countryData) {
        setTooltipData({
          countryName: displayName,
          data: { 
            trump_claimed_tariff: countryData.trump_claimed_tariff,
            us_reciprocal_tariff: countryData.us_reciprocal_tariff
          },
          x: event.clientX,
          y: event.clientY,
        });
      }
    }
  }, [tariffData, onCountryHover]);

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

  // Handle touch events for mobile
  const handleTouchStart = useCallback((countryName: string, event: React.TouchEvent) => {
    // Prevent default to avoid any browser handling
    event.preventDefault();
    
    // Always call onCountryHover for all countries
    onCountryHover(countryName);
    
    // Only show tooltip for non-US countries with data
    if (countryName !== 'United States of America') {
      let countryData = tariffData[countryName];
      let displayName = countryName;
      
      if (!countryData && EU_COUNTRIES.includes(countryName) && tariffData['European Union'] !== undefined) {
        countryData = tariffData['European Union'];
        displayName = `${countryName} (EU)`;
      }
      
      if (countryData) {
        setTooltipData({
          countryName: displayName,
          data: { 
            trump_claimed_tariff: countryData.trump_claimed_tariff,
            us_reciprocal_tariff: countryData.us_reciprocal_tariff
          },
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        });
      }
    }
  }, [tariffData, onCountryHover]);

  const handleTouchEnd = useCallback(() => {
    setTooltipData(null);
    onCountryHover(null);
  }, [onCountryHover]);

  // Add touch event listener to clear tooltip on scroll
  useEffect(() => {
    const handleScroll = () => {
      setTooltipData(null);
      onCountryHover(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onCountryHover]);

  // Memoize the geographies rendering
  const renderGeographies = useCallback(({ geographies }: { geographies: any[] }) => {
    return geographies
      .filter(geo => geo.properties.name !== 'Antarctica')
      .map(geo => {
        const countryName = geo.properties.name;
        const countryData = tariffData[countryName];
        const isEU = EU_COUNTRIES.includes(countryName);
        const displayName = isEU ? `${countryName} (EU)` : countryName;
        
        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onMouseEnter={(e) => handleMouseEnter(countryName, e as any)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => handleTouchStart(countryName, e as any)}
            onTouchEnd={handleTouchEnd}
            onClick={() => handleCountryClick(countryName)}
            style={{
              default: {
                fill: countryName === 'United States of America' 
                  ? US_STYLES.fill 
                  : countryData 
                    ? colorScale(countryData.us_reciprocal_tariff)
                    : '#F1F5F9',
                stroke: US_STYLES.stroke,
                strokeWidth: US_STYLES.strokeWidth,
                outline: 'none',
              },
              hover: {
                fill: countryName === 'United States of America'
                  ? US_STYLES.fill
                  : countryData
                    ? colorScale(countryData.us_reciprocal_tariff)
                    : '#E2E8F0',
                stroke: '#000',
                strokeWidth: 1,
                outline: 'none',
              },
              pressed: {
                fill: countryName === 'United States of America'
                  ? US_STYLES.fill
                  : countryData
                    ? colorScale(countryData.us_reciprocal_tariff)
                    : '#CBD5E1',
                stroke: '#000',
                strokeWidth: 1,
                outline: 'none',
              },
            }}
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