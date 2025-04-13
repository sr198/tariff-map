import React from 'react';

interface TooltipProps {
  data: {
    tariff_rate_1?: number;
    tariff_rate_2?: number;
    date_1?: string;
    date_2?: string;
    deficit?: number | string; // Allow both number and string for deficit
    country_name?: string;
  };
  countryName: string;
  mapType: 'tariff' | 'deficit';
}

const Tooltip: React.FC<TooltipProps> = ({ data, countryName, mapType }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value * 1000000000); // Convert billions to actual value
  };

  const formatDeficit = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? 'Surplus' : 'Deficit';
    const unit = absValue >= 1 ? 'B' : 'M';
    const displayValue = absValue >= 1 ? absValue : absValue * 1000;
    return `${sign}: ${displayValue.toFixed(2)}${unit} USD`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-900 mb-1">{countryName}</h3>
      {mapType === 'deficit' ? (
        <p className="text-sm text-gray-600">
          {data.deficit}
        </p>
      ) : (
        <div className="text-sm text-gray-600">
          <p>Tariff Rate: {data.tariff_rate_1}%</p>
          <p className="text-xs text-gray-500">As of {data.date_1}</p>
        </div>
      )}
    </div>
  );
};

export default Tooltip; 