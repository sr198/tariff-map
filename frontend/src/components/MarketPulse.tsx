import React, { useEffect, useState } from 'react';
import { fetchMarketData } from '@/services/marketService';

interface MarketData {
  name: string;
  price: number;
  daily_change: number;
  daily_change_percent: number;
  change_30d: number;
  change_30d_percent: number;
  change_90d: number;
  change_90d_percent: number;
  last_updated: string;
}

interface MarketPulseProps {
  className?: string;
}

const MarketPulse: React.FC<MarketPulseProps> = ({ className = '' }) => {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMarketData();
        setMarketData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load market data');
        console.error('Error fetching market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (symbol: string) => {
    switch (symbol) {
      case 'SPY':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case '^TNX':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'DX-Y.NYB':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CL=F':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      case 'EEM':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const ChangeIndicator = ({ label, change, changePercent }: { label: string; change: number; changePercent: number }) => (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-gray-500">{label}</span>
      <div className={`text-[10px] font-medium ${
        change >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        <span className="inline-flex items-center">
          {change >= 0 ? (
            <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {Math.abs(change).toFixed(2)} ({changePercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 text-red-600 p-4 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-end mb-2">
        <div className="text-[10px] text-gray-400">
          Last updated: {new Date(marketData[Object.keys(marketData)[0]]?.last_updated || '').toLocaleString()}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(marketData).map(([symbol, data]) => (
          <div 
            key={symbol} 
            className={`rounded-md shadow-sm p-2 hover:shadow transition-all duration-300 border ${
              data.change_90d >= 0 
                ? 'bg-gradient-to-br from-green-50 to-white border-green-100' 
                : 'bg-gradient-to-br from-red-50 to-white border-red-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-medium text-gray-500 truncate">{data.name}</h3>
              <div className={`p-1 rounded ${
                data.daily_change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {getIcon(symbol)}
              </div>
            </div>
            <div className="mb-1">
              <span className="text-sm font-bold text-gray-900">
                {data.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <div className="space-y-0.5">
              <ChangeIndicator label="1D" change={data.daily_change} changePercent={data.daily_change_percent} />
              <ChangeIndicator label="30D" change={data.change_30d} changePercent={data.change_30d_percent} />
              <ChangeIndicator label="90D" change={data.change_90d} changePercent={data.change_90d_percent} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketPulse; 