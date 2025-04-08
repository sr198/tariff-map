import React from 'react';
import Link from 'next/link';

const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 font-outfit">
          US Trade Analytics Platform
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 font-outfit">
            Coming Soon
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            We're working on something exciting! Our interactive trade analytics platform is currently under development.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
            </div>
            
            <p className="text-sm text-gray-500">
              Expected launch: Q2 2024
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 font-outfit">Tariff Analysis</h3>
            <p className="text-gray-600">Interactive visualization of US trade tariffs and relationships</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 font-outfit">Trade Deficits</h3>
            <p className="text-gray-600">Heatmap showing trade deficits with countries worldwide</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 font-outfit">Country Insights</h3>
            <p className="text-gray-600">Detailed trade statistics and analysis by country</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>For inquiries, please contact: <a href="mailto:info@tariffmap.com" className="text-blue-600 hover:underline">info@tariffmap.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 