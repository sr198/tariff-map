import React from 'react';
import CountryTradeStats from './CountryTradeStats';

interface CountryDetailsProps {
  countryCode?: string;
  countryName?: string;
  onClose?: () => void;
  onBack?: () => void;
}

const CountryDetails: React.FC<CountryDetailsProps> = ({ 
  countryCode, 
  countryName, 
  onClose, 
  onBack 
}) => {
  // Determine which close function to use
  const handleClose = onClose || onBack;

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{countryName}</h2>
        <div className="flex space-x-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Add the CountryTradeStats component */}
      {countryCode && countryName ? (
        <div className="mb-6">
          <CountryTradeStats countryCode={countryCode} countryName={countryName} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Select a country to view details</p>
        </div>
      )}
    </div>
  );
};

export default CountryDetails; 