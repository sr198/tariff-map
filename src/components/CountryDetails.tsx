import React from 'react';

interface CountryDetailsProps {
  countryName: string;
  data: {
    usImportTariff: number;
    exportTariff: number;
    tradeBalance: number;
  };
  onBack: () => void;
}

const CountryDetails: React.FC<CountryDetailsProps> = ({ countryName, data, onBack }) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <img 
              src={`https://flagcdn.com/w80/${countryName === 'United States of America' ? 'us' : 
                countryName === 'United Kingdom' ? 'gb' : 
                countryName === 'South Korea' ? 'kr' : 
                countryName === 'European Union' ? 'eu' : 
                countryName.toLowerCase().slice(0, 2)}.png`}
              alt={`${countryName} flag`}
              className="w-6 h-4 object-cover rounded-sm"
              onError={(e) => {
                // Fallback to a generic flag icon if the image fails to load
                e.currentTarget.style.display = 'none';
                const nextSibling = e.currentTarget.nextSibling as HTMLElement;
                if (nextSibling) {
                  nextSibling.classList.remove('hidden');
                }
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">{countryName}</h2>
          </div>
          <span className="text-gray-400">|</span>
          <h3 className="text-md font-medium text-gray-700">Country Analysis</h3>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center group"
        >
          <svg 
            className="w-4 h-4 mr-1 transition-transform duration-200 transform group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Global View
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">US Import Tariff</div>
          <div className="text-2xl font-semibold text-gray-900">{data.usImportTariff.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Export Tariff</div>
          <div className="text-2xl font-semibold text-gray-900">{data.exportTariff.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">Trade Balance</div>
          <div className={`text-2xl font-semibold ${data.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(data.tradeBalance).toFixed(1)}B
            <span className="text-sm ml-1">{data.tradeBalance >= 0 ? 'Surplus' : 'Deficit'}</span>
          </div>
        </div>
      </div>

      {/* Main content area with charts */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Historical Trade Volume</h3>
            <div className="aspect-[16/9] bg-white rounded flex items-center justify-center text-gray-400">
              Chart coming soon
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Tariff Trends</h3>
            <div className="aspect-[16/9] bg-white rounded flex items-center justify-center text-gray-400">
              Chart coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryDetails; 