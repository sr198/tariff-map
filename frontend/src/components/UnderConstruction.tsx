import React from 'react';

const UnderConstruction: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-24 h-24 mx-auto mb-6 text-gray-400"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2 font-outfit">
          Under Construction
        </h1>
        
        <p className="text-gray-600">
          We're working on something exciting. Please check back soon.
        </p>
      </div>
    </div>
  );
};

export default UnderConstruction; 