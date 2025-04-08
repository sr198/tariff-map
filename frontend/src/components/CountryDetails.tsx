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
    <>
      <div className="flex justify-end items-center mb-4">
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
        <div className="w-full">
          <CountryTradeStats countryCode={countryCode} countryName={countryName} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No country selected
        </div>
      )}
    </>
  );
};

export default CountryDetails; 