import React, { useState } from 'react';
import StorySlideshow from './StorySlideshow';

interface GlobalStatsProps {
  data: {
    [key: string]: {
      usImportTariff: number;
      countryExportTariff: number;
      tradeBalance: number;
    };
  };
}

const GlobalStats: React.FC<GlobalStatsProps> = ({ data }) => {
  const stats = React.useMemo(() => {
    const countries = Object.keys(data);
    const totalTradeVolume = Object.values(data).reduce((sum, country) => 
      sum + Math.abs(country.tradeBalance), 0);
    const avgTariff = countries.reduce((sum, country) => 
      sum + data[country].usImportTariff, 0) / countries.length;
    
    return {
      tradeVolume: totalTradeVolume,
      averageTariff: avgTariff,
      countryCount: countries.length,
      agreementCount: 37,
    };
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">US Trade Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Average US Import Tariff</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.averageTariff.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Trading Partners</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.countryCount}</div>
          <div className="text-xs text-gray-500">Active relationships</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Trade Volume</div>
          <div className="text-2xl font-semibold text-gray-900">${(stats.tradeVolume / 1e12).toFixed(1)}T</div>
          <div className="text-xs text-gray-500">Annual</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top US Trading Partners</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="divide-y divide-gray-200">
              {/* Top partners data would be populated here */}
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">US Import Tariff Trends</h3>
          <div className="bg-gray-50 rounded-lg p-4 aspect-[16/9] flex items-center justify-center text-gray-400">
            Chart coming soon
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 