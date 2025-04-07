import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLog, scaleLinear } from 'd3-scale';
import { fetchTradeDeficitMap, TradeDeficitEntry } from '../services/tradeService';
import TradeDeficitTooltip from './TradeDeficitTooltip';

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
  // Add more mappings as needed
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
  reporterIso3?: string;
  onCountrySelect?: (countryCode: string, countryName: string) => void;
}

const TradeDeficitMap: React.FC<TradeDeficitMapProps> = ({ 
  countryNameToCode,
  countryCodeToName,
  countryMappings,
  year,
  reporterIso3 = 'USA',
  onCountrySelect
}) => {
  const [deficitData, setDeficitData] = useState<Record<string, TradeDeficitEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    countryName: string;
    data: TradeDeficitEntry;
    x: number;
    y: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchTradeDeficitMap(reporterIso3, year);
        
        // Convert array to object for easier lookup, using both ISO3 and country name as keys
        const deficitMap = response.deficits.reduce((acc, item) => {
          acc[item.country_code] = item;
          // Also store by country name if we have it
          if (item.country_name) {
            acc[item.country_name] = item;
          }
          return acc;
        }, {} as Record<string, TradeDeficitEntry>);
        
        setDeficitData(deficitMap);
        setError(null);
      } catch (err) {
        setError('Failed to load trade deficit data');
        console.error('Error loading trade deficit data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, reporterIso3]);

  // Create color scale based on deficit values
  const colorScale = useMemo(() => {
    // Don't create scale if no data
    if (Object.keys(deficitData).length === 0) {
      return null;
    }

    // Convert to billions
    const values = Object.values(deficitData).map(d => d.deficit_thousands / 1000000);
    const deficitValues = values.filter(v => v < 0).map(v => Math.abs(v)); // Negative values are deficits

    // Find the maximum deficit value
    const maxDeficit = Math.max(...deficitValues, 1); // Use 1 as minimum to avoid log(0)

    // Create scale for deficits only
    const deficitScale = scaleLog<string>()
      .domain([1, maxDeficit])
      .range(['#ffffff', '#7f1d1d']) // White to darker red (red-800)
      .clamp(true);

    // Debug: Log the scale range
    console.log('Scale range:', {
      maxDeficit,
      sampleValues: values.slice(0, 5)
    });

    // Return a function that handles the values
    return (value: number): string => {
      if (value >= 0) return '#f1f5f9'; // Light gray for surpluses or zero
      return deficitScale(Math.abs(value)); // Dark red scale for deficits (negative values)
    };
  }, [deficitData]);

  // Handle mouse enter for tooltip
  const handleMouseEnter = useCallback((countryName: string, event: React.MouseEvent) => {
    const countryCode = countryNameToCode[countryName];
    const deficit = countryCode ? deficitData[countryCode] : null;
    
    if (deficit) {
      setTooltipData({
        countryName: deficit.country_name,
        data: deficit,
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [countryNameToCode, deficitData]);

  // Handle mouse leave for tooltip
  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Handle country click
  const handleCountryClick = useCallback((countryName: string) => {
    const countryCode = countryNameToCode[countryName];
    
    if (countryCode && countryCode !== 'USA') {
      setSelectedCountry(countryCode);
      
      if (onCountrySelect) {
        onCountrySelect(countryCode, countryName);
      }
    }
  }, [countryNameToCode, onCountrySelect]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  }, []);

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
              {({ geographies }) => {
                // Debug: Log all country codes from the map data
                console.log('Available country codes in map:', 
                  geographies.map(geo => ({
                    name: geo.properties.name,
                    iso_a3: COUNTRY_TO_ISO3[geo.properties.name],
                    hasData: !!(COUNTRY_TO_ISO3[geo.properties.name] && deficitData[COUNTRY_TO_ISO3[geo.properties.name]])
                  }))
                );

                return geographies
                  .filter(geo => geo.properties.name !== 'Antarctica')
                  .map((geo) => {
                    const countryName = geo.properties.name;
                    const countryCode = countryNameToCode[countryName];
                    const deficit = countryCode ? deficitData[countryCode] : null;
                    const isUS = countryName === 'United States of America';
                    const isSelected = countryCode === selectedCountry;
                    
                    // Convert thousands to billions for display
                    const deficitValue = deficit ? deficit.deficit_thousands / 1000000 : 0;
                    
                    // Get the color based on the deficit value
                    const color = isUS 
                      ? US_STYLES.fill 
                      : deficit && colorScale
                        ? colorScale(deficitValue)
                        : '#F1F5F9';
                    
                    // Debug: Log country data for all countries
                    console.log('Country mapping:', {
                      name: countryName,
                      code: countryCode,
                      hasDeficitData: !!deficit,
                      deficitValue: deficit ? deficitValue : 'no data',
                      color
                    });
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={(event) => handleMouseEnter(countryName, event)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCountryClick(countryName)}
                        style={{
                          default: {
                            fill: color,
                            stroke: '#FFFFFF',
                            strokeWidth: isUS ? US_STYLES.strokeWidth : 0.5,
                            outline: 'none',
                          },
                          hover: {
                            fill: color,
                            stroke: '#FFFFFF',
                            strokeWidth: isUS ? US_STYLES.strokeWidth : 0.75,
                            outline: 'none',
                            cursor: isUS ? 'default' : 'pointer',
                          },
                          pressed: {
                            fill: color,
                            stroke: isSelected ? '#000000' : '#FFFFFF',
                            strokeWidth: isSelected ? 1.5 : (isUS ? US_STYLES.strokeWidth : 0.75),
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Color Legend */}
        {!isMobile && (
          <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 bg-white rounded-lg shadow-lg p-2 md:p-4">
            <div className="text-[10px] md:text-sm font-medium mb-1 md:mb-2">Trade Deficit (Billions USD)</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 md:h-2 w-24 md:w-48 bg-gradient-to-r from-[#ffffff] to-[#7f1d1d] rounded" />
            </div>
            <div className="flex justify-between mt-0.5 md:mt-1">
              <div className="text-[8px] md:text-xs text-gray-600">0</div>
              <div className="text-[8px] md:text-xs text-gray-600">Higher Deficit</div>
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

        {/* Last Updated */}
        {!isMobile && (
          <div className="absolute right-2 md:right-4 bottom-2 md:bottom-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-2 py-1 md:px-4 md:py-2">
            <div className="text-[8px] md:text-xs text-gray-500">Last Updated: April 7 2025</div>
          </div>
        )}

        {/* Tooltip */}
        {tooltipData && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipData.x + 12}px`,
              top: `${tooltipData.y - 12}px`,
              zIndex: 1000,
              pointerEvents: 'none',
              transform: 'translate(0, -100%)',
            }}
            className="bg-white rounded-lg shadow-lg p-2 max-w-[200px] border border-gray-200"
          >
            <div className="font-semibold text-gray-900 text-sm mb-1">{tooltipData.countryName}</div>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Trade Balance:</span>
                <span className={`font-medium whitespace-nowrap ${tooltipData.data.deficit_thousands < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tooltipData.data.deficit_thousands < 0 ? '-' : '+'}
                  {Math.abs(tooltipData.data.deficit_thousands / 1000000).toFixed(1)}B
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeDeficitMap; 