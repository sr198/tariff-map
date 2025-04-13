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
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{countryName}</h3>
      {data.claimed_tariff !== undefined && (
        <div className="mb-1">
          <span className="text-sm text-gray-500">Claimed Tariff:</span>
          <span className="ml-2 font-medium text-gray-900">
            {data.claimed_tariff.toFixed(2)}%
          </span>
        </div>
      )}
      {data.reciprocal_tariff !== undefined && (
        <div className="mb-1">
          <span className="text-sm text-gray-500">Reciprocal Tariff:</span>
          <span className="ml-2 font-medium text-gray-900">
            {data.reciprocal_tariff.toFixed(2)}%
          </span>
        </div>
      )}
      {data.deficit_thousands !== undefined && (
        <div>
          <span className="text-sm text-gray-500">Trade Deficit:</span>
          <span className="ml-2 font-medium text-gray-900">
            {(data.deficit_thousands / 1000000).toFixed(2)}B USD
          </span>
        </div>
      )}
    </div>
  );
};

export default MapTooltip; 