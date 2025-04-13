import React, { useEffect, useState, useMemo } from 'react';
import { fetchTradeSummary, fetchCountryDetails, Country, TradeSummaryResponse } from '../services/tradeService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimePeriod = '5Y' | '10Y' | 'ALL';

interface CountryDetailsProps {
  countryId: number;
  countryName: string;
  onClose: () => void;
}

const CountryDetails: React.FC<CountryDetailsProps> = ({
  countryId,
  countryName,
  onClose,
}) => {
  const [tradeData, setTradeData] = useState<TradeSummaryResponse | null>(null);
  const [countryDetails, setCountryDetails] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using US as the reporter country (ID: 840)
        const [tradeData, details] = await Promise.all([
          fetchTradeSummary(840, countryId),
          fetchCountryDetails(countryId)
        ]);
        setTradeData(tradeData);
        setCountryDetails(details);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [countryId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value * 1000); // Multiply by 1000 since values are in thousands
  };

  const filteredData = useMemo(() => {
    if (!tradeData?.summary) return [];
    
    const currentYear = new Date().getFullYear();
    const filtered = tradeData.summary.filter(item => {
      switch (timePeriod) {
        case '5Y':
          return item.year >= currentYear - 5;
        case '10Y':
          return item.year >= currentYear - 10;
        default:
          return true;
      }
    });
    
    return filtered;
  }, [tradeData, timePeriod]);

  const latestData = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData[filteredData.length - 1];
  }, [filteredData]);

  const formatLargeNumber = (value: number) => {
    // Convert from thousands to actual value
    const actualValue = value * 1000;
    const absValue = Math.abs(actualValue);
    if (absValue >= 1000000000) {
      return `${(actualValue / 1000000000).toFixed(2)}B`;
    }
    return `${(actualValue / 1000000).toFixed(2)}M`;
  };

  const chartData = {
    labels: filteredData.map(item => item.year),
    datasets: [
      {
        label: 'Exports',
        data: filteredData.map(item => item.export),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Imports',
        data: filteredData.map(item => item.import_),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Trade Deficit',
        data: filteredData.map(item => item.trade_deficit),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `US Trade with ${countryName}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) return (
    <div className="p-4 flex items-center justify-center h-64">
      <div className="text-gray-500">Loading trade data...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-4">
      <div className="text-red-500 mb-4">{error}</div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back to Map
      </button>
    </div>
  );
  
  if (!tradeData || !tradeData.summary.length) return (
    <div className="p-4">
      <div className="text-gray-500 mb-4">No trade data available for {countryName}</div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back to Map
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Trump Tariffs Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Trump Tariffs</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {countryDetails?.trump_tariffs && countryDetails.trump_tariffs.length > 0 ? (
            <div className="space-y-4">
              {[...countryDetails.trump_tariffs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tariff, index) => (
                <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium mb-1">
                        Trump Tariff {index + 1}
                        {tariff.description && (
                          <span className="text-sm text-gray-500 ml-2">({tariff.description})</span>
                        )}
                      </h3>
                      <p className="text-2xl font-bold text-red-600">
                        {tariff.rate.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {tariff.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No Trump tariff data available</p>
          )}
        </div>
      </div>

      {/* WTO Tariffs Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">WTO Tariffs</h2>
        {countryDetails && (countryDetails.tariffs_on_us_imports || countryDetails.us_tariffs_on_imports) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tariff Details</h3>
            <div className="text-xs text-gray-500 mb-4">*Based on WTO data from {countryDetails.tariffs_on_us_imports?.year || countryDetails.us_tariffs_on_imports?.year}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {countryDetails.tariffs_on_us_imports && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Tariffs Imposed by {countryName} on US Imports</div>
                  <div className="text-2xl font-semibold text-red-600">
                    {countryDetails.tariffs_on_us_imports.simple_average.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Weighted Average: {countryDetails.tariffs_on_us_imports.weighted_average.toFixed(1)}%
                  </div>
                </div>
              )}
              
              {countryDetails.us_tariffs_on_imports && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">US Tariffs on {countryName} Imports</div>
                  <div className="text-2xl font-semibold text-emerald-600">
                    {countryDetails.us_tariffs_on_imports.simple_average.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Weighted Average: {countryDetails.us_tariffs_on_imports.weighted_average.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trade Details Section */}
      {latestData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Trade Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Exported to the US</div>
              <div className="text-2xl font-semibold text-red-600">
                ${formatLargeNumber(latestData.export)}
              </div>
              <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Imported from the US</div>
              <div className="text-2xl font-semibold text-emerald-600">
                ${formatLargeNumber(latestData.import_)}
              </div>
              <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">US Trade Balance with {countryName}</div>
              <div className={`text-2xl font-semibold ${latestData.trade_deficit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${formatLargeNumber(latestData.trade_deficit)}
              </div>
              <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setTimePeriod('5Y')}
                className={`px-3 py-1 rounded-full text-sm ${
                  timePeriod === '5Y'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                5Y
              </button>
              <button
                onClick={() => setTimePeriod('10Y')}
                className={`px-3 py-1 rounded-full text-sm ${
                  timePeriod === '10Y'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                10Y
              </button>
              <button
                onClick={() => setTimePeriod('ALL')}
                className={`px-3 py-1 rounded-full text-sm ${
                  timePeriod === 'ALL'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Trade Chart */}
          <div className="h-80">
            <Line data={chartData} options={options} />
          </div>

          {/* Trade Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exported to the US
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imported from the US
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    US Trade Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.year}>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {item.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {formatCurrency(item.export)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {formatCurrency(item.import_)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {formatCurrency(item.trade_deficit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryDetails; 