import React from 'react';

interface MapTooltipProps {
  countryName: string;
  data: {
    claimed_tariff?: number;
    reciprocal_tariff?: number;
    deficit_thousands?: number;
  };
}

const MapTooltip: React.FC<MapTooltipProps> = ({ countryName, data }) => {
  const formatDeficitValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(absValue / 1000000).toFixed(1)}B`;
    }
    return `${(absValue / 1000).toFixed(1)}M`;
  };

  return (
    <div className="bg-white p-2 md:p-4 rounded-lg shadow-lg border border-gray-200 max-w-[200px] md:max-w-none">
      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{countryName}</h3>
      {data.claimed_tariff !== undefined && (
        <div className="mb-0.5 md:mb-1">
          <span className="text-xs md:text-sm text-gray-500">April 2:</span>
          <span className="ml-1 md:ml-2 font-medium text-gray-900">
            {data.claimed_tariff.toFixed(1)}%
          </span>
        </div>
      )}
      {data.reciprocal_tariff !== undefined && (
        <div className="mb-0.5 md:mb-1">
          <span className="text-xs md:text-sm text-gray-500">April 9:</span>
          <span className="ml-1 md:ml-2 font-medium text-gray-900">
            {data.reciprocal_tariff.toFixed(1)}%
          </span>
        </div>
      )}
      {data.deficit_thousands !== undefined && (
        <div>
          <span className={`text-xs md:text-sm ${data.deficit_thousands >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.deficit_thousands >= 0 ? 'Surplus:' : 'Deficit:'}
          </span>
          <span className={`ml-1 md:ml-2 font-medium ${data.deficit_thousands >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatDeficitValue(data.deficit_thousands)} USD
          </span>
        </div>
      )}
    </div>
  );
};

export default MapTooltip; 