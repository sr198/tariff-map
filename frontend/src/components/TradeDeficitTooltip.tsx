import React from 'react';

interface TradeDeficitTooltipProps {
  countryName: string;
  deficit: number;
}

const TradeDeficitTooltip: React.FC<TradeDeficitTooltipProps> = ({ countryName, deficit }) => {
  const formatDeficit = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? 'Surplus' : 'Deficit';
    return `${sign}: ${absValue.toFixed(2)}B USD`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="text-sm font-medium text-gray-900">{countryName}</div>
      <div className="text-sm text-gray-600">
        {formatDeficit(deficit)}
      </div>
    </div>
  );
};

export default TradeDeficitTooltip; 