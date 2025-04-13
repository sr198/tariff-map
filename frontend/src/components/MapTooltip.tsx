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
  return (
    <div className="bg-white p-2 md:p-4 rounded-lg shadow-lg border border-gray-200 max-w-[200px] md:max-w-none">
      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{countryName}</h3>
      {data.claimed_tariff !== undefined && (
        <div className="mb-0.5 md:mb-1">
          <span className="text-xs md:text-sm text-gray-500">Claimed:</span>
          <span className="ml-1 md:ml-2 font-medium text-gray-900">
            {data.claimed_tariff.toFixed(1)}%
          </span>
        </div>
      )}
      {data.reciprocal_tariff !== undefined && (
        <div className="mb-0.5 md:mb-1">
          <span className="text-xs md:text-sm text-gray-500">Reciprocal:</span>
          <span className="ml-1 md:ml-2 font-medium text-gray-900">
            {data.reciprocal_tariff.toFixed(1)}%
          </span>
        </div>
      )}
      {data.deficit_thousands !== undefined && (
        <div>
          <span className="text-xs md:text-sm text-gray-500">Deficit:</span>
          <span className="ml-1 md:ml-2 font-medium text-gray-900">
            {(data.deficit_thousands / 1000000).toFixed(1)}B USD
          </span>
        </div>
      )}
    </div>
  );
};

export default MapTooltip; 