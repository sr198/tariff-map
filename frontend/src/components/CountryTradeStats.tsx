import React from 'react';
import { TradeDeficitEntry } from '../services/tradeService';

interface CountryTradeStatsProps {
  countryCode: string;
  countryName: string;
  deficitData: TradeDeficitEntry;
  onClose: () => void;
}

const CountryTradeStats: React.FC<CountryTradeStatsProps> = ({
  countryCode,
  countryName,
  deficitData,
  onClose
}) => {
  // Convert deficit from thousands to billions
  const deficit = deficitData.deficit_thousands / 1000000;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{countryName}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Trade Deficit</h3>
          <p className="text-2xl font-bold text-gray-900">
            {deficit > 0 ? '+' : ''}{deficit.toFixed(2)}B USD
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Exports</h3>
          <p className="text-2xl font-bold text-gray-900">
            {deficitData.exports.toFixed(2)}B USD
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Imports</h3>
          <p className="text-2xl font-bold text-gray-900">
            {deficitData.imports.toFixed(2)}B USD
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Trade Balance</h3>
          <p className="text-2xl font-bold text-gray-900">
            {deficitData.balance > 0 ? '+' : ''}{deficitData.balance.toFixed(2)}B USD
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountryTradeStats; 