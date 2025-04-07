import React from 'react';

const TemuSheinTracker: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900">Temu/Shein Impact Tracker</h2>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          This feature is coming soon. It will track the impact of Temu and Shein on US trade patterns and tariffs.
        </p>
      </div>
    </div>
  );
};

export default TemuSheinTracker; 