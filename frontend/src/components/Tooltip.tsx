import React from 'react';

interface TooltipProps {
  countryName: string;
  data: {
    trump_claimed_tariff?: number;
    us_reciprocal_tariff?: number;
    tradeBalance?: number;
    partnerStatus?: string;
  };
}

const Tooltip: React.FC<TooltipProps> = ({ countryName, data: countryData }) => {
  if (!countryData) return null;

  return (
    <div
      className="absolute z-50 bg-white shadow-lg rounded-lg p-2 max-w-[200px] transform -translate-x-1/2 -translate-y-full border border-gray-200"
    >
      <div className="font-semibold text-gray-900 text-sm mb-1">{countryName}</div>
      
      <div className="space-y-0.5 text-xs">
        {countryData.trump_claimed_tariff !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Tariff on US Import:</span>
            <span className="font-medium whitespace-nowrap">{countryData.trump_claimed_tariff.toFixed(1)}%</span>
          </div>
        )}
        
        {countryData.us_reciprocal_tariff !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Reciprocal Tariff:</span>
            <span className="font-medium whitespace-nowrap">{countryData.us_reciprocal_tariff.toFixed(1)}%</span>
          </div>
        )}
        
        {countryData.tradeBalance !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Trade Balance:</span>
            <span className={`font-medium whitespace-nowrap ${countryData.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${countryData.tradeBalance.toFixed(1)}B
            </span>
          </div>
        )}
        
        {countryData.partnerStatus && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Status:</span>
            <span className="font-medium whitespace-nowrap">{countryData.partnerStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tooltip; 