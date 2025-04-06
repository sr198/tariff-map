import React from 'react';

interface TooltipProps {
  data: {
    countryName: string;
    data: {
      usImportTariff: number;
      exportTariff: number;
      tradeBalance: number;
      partnerStatus: string;
    };
    x: number;
    y: number;
  } | null;
}

const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  if (!data) return null;

  const { countryName, data: countryData, x, y } = data;
  
  // Format values with proper handling for undefined data
  const formattedValues = {
    usImportTariff: countryData?.usImportTariff ? countryData.usImportTariff.toFixed(1) : 'N/A',
    exportTariff: countryData?.exportTariff ? countryData.exportTariff.toFixed(1) : 'N/A',
    tradeBalance: countryData?.tradeBalance ? countryData.tradeBalance.toFixed(1) : 'N/A',
    partnerStatus: countryData?.partnerStatus || 'Unknown'
  };

  return (
    <div
      className="absolute z-50 bg-white shadow-lg rounded-lg p-3 max-w-xs transform -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 10 }}
    >
      <div className="font-semibold text-gray-900 mb-2">{countryName}</div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">US Import Tariff:</span>
          <span className="font-medium">{formattedValues.usImportTariff}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Export Tariff:</span>
          <span className="font-medium">{formattedValues.exportTariff}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Trade Balance:</span>
          <span className={`font-medium ${countryData?.tradeBalance && countryData.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${formattedValues.tradeBalance}B
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
          <span className="font-medium">{formattedValues.partnerStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default Tooltip; 