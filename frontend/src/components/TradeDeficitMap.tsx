import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLog, scaleLinear } from 'd3-scale';
import { fetchTradeDeficitMap, TradeDeficitEntry } from '../services/tradeService';
import Tooltip from './Tooltip';

// Use CDN URL for the geography data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name to ISO3 mapping for common cases
const COUNTRY_TO_ISO3: Record<string, string> = {
  'United States of America': 'USA',
  'United Kingdom': 'GBR',
  'France': 'FRA',
  'Germany': 'DEU',
  'China': 'CHN',
  'Japan': 'JPN',
  'South Korea': 'KOR',
  'Russia': 'RUS',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  'Brazil': 'BRA',
  'India': 'IND',
  'Australia': 'AUS',
  'New Zealand': 'NZL',
  'South Africa': 'ZAF',
  'Saudi Arabia': 'SAU',
  'United Arab Emirates': 'ARE',
  'Vietnam': 'VNM',
  'Thailand': 'THA',
  'Indonesia': 'IDN',
  'Malaysia': 'MYS',
  'Philippines': 'PHL',
  'Singapore': 'SGP',
};

// Color legend data
const colorLegendStops = [
  { value: -50, label: '-50B' },
  { value: -25, label: '-25B' },
  { value: 0, label: '0' },
  { value: 25, label: '25B' },
  { value: 50, label: '50B' },
];

// US specific styling
const US_STYLES = {
  fill: '#C4C3C8', // Lighter slate gray for US
  stroke: '#FFFFFF',
  strokeWidth: 0.75, // Slightly thicker border for emphasis
};

// Memoize the projection configuration
const projectionConfig = {
  scale: 150,
  center: [0, 20] as [number, number],
};

interface TradeDeficitMapProps {
  countryNameToCode: Record<string, string>;
  countryCodeToName: Record<string, string>;
  countryMappings: Record<string, string>;
  year?: number;
  reporterId?: number;
  onCountrySelect?: (countryId: number, countryName: string) => void;
}

const TradeDeficitMap: React.FC<TradeDeficitMapProps> = ({ 
  countryNameToCode,
  countryCodeToName,
  countryMappings,
  year = 2022,
  reporterId = 842, // USA
  onCountrySelect
}) => {
  const [deficitData, setDeficitData] = useState<Record<string, TradeDeficitEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    countryName: string;
    data: {
      deficit: number;
      country_name: string;
    };
    x: number;
    y: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch deficit data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchTradeDeficitMap(year, reporterId);
        // Transform the response into a record of country IDs to entries
        const data = response.deficits.reduce((acc: Record<string, TradeDeficitEntry>, entry) => {
          acc[entry.country_id] = entry;
          return acc;
        }, {});
        setDeficitData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trade deficit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, reporterId]);

  // Check if device is mobile
  useEffect(() => {
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
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([-50, -25, 0, 25, 50])
      .range([
        '#7f1d1d', // Dark red for large deficits
        '#ef4444', // Red for moderate deficits
        '#ffffff', // White for balanced trade
        '#22c55e', // Green for moderate surpluses
        '#166534'  // Dark green for large surpluses
      ]);
  }, []);

  // Memoize the getCountryColor function
  const getCountryColor = useCallback((geo: any) => {
    const countryId = geo?.id;
    if (!countryId) return '#F1F5F9';

    if (countryId === 'USA') {
      return US_STYLES.fill;
    }

    const deficit = deficitData[countryId]?.deficit_thousands / 1000000; // Convert to billions
    if (deficit === undefined) return '#F1F5F9';

    return colorScale(deficit);
  }, [deficitData, colorScale]);

  // Handle mouse events
  const handleMouseEnter = useCallback((geo: any, event: any) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    if (!countryId || !countryName) return;

    const deficit = deficitData[countryId]?.deficit_thousands / 1000000; // Convert to billions
    if (deficit === undefined) return;

    setTooltipData({
      countryName,
      data: {
        deficit,
        country_name: countryName
      },
      x: event.clientX,
      y: event.clientY
    });
  }, [deficitData]);

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  const handleCountryClick = useCallback((geo: any) => {
    const countryId = geo?.id;
    const countryName = geo?.properties?.name;
    if (!countryId || !countryName) return;

    onCountrySelect?.(parseInt(countryId), countryName);
  }, [onCountrySelect]);

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
      const countryName = geo?.properties?.name;
      const countryCode = COUNTRY_TO_ISO3[countryName] || countryMappings[countryName];

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
              fill: '#475569',
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
        />
      );
    });
  }, [deficitData, colorScale, handleMouseEnter, handleMouseLeave, handleCountryClick]);

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

        {/* Color Legend */}
        {!isMobile && (
          <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white rounded-lg shadow-lg p-2 md:p-4">
            <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Trade Deficit (Billions USD)</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 md:h-2 w-24 md:w-48 bg-gradient-to-r from-[#7f1d1d] via-[#ffffff] to-[#166534] rounded" />
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

        {tooltipData && (
          <div style={tooltipStyles(tooltipData.x, tooltipData.y)}>
            <Tooltip
              data={tooltipData.data}
              countryName={tooltipData.countryName}
              mapType="deficit"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeDeficitMap; 