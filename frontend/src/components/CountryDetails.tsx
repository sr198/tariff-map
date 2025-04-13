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
        <h2 className="text-xl font-semibold mb-1">Trump-Era Tariff Timeline</h2>
        <p className="text-sm text-gray-500 mb-4">Chronology of tariff hikes announced by the Trump administration against {countryName}</p>
        <div className="bg-white rounded-lg shadow p-4">
          {countryDetails?.trump_tariffs && countryDetails.trump_tariffs.length > 0 ? (
            <div className="space-y-6">
              {[...countryDetails.trump_tariffs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tariff, index) => {
                  // Calculate gradient color based on tariff rate
                  const rate = tariff.rate;
                  // Normalize to 0-1 range using 10% as minimum and 150% as maximum
                  const minRate = 10;
                  const maxRate = 150;
                  const normalizedRate = Math.min(Math.max((rate - minRate) / (maxRate - minRate), 0), 1);
                  
                  // Create a gradient from orange (rgb(255, 165, 0)) to red (rgb(255, 0, 0))
                  const red = 255;
                  const green = Math.floor(165 * (1 - normalizedRate));
                  const blue = 0;
                  const color = `rgb(${red}, ${green}, ${blue})`;
                  
                  return (
                    <div key={index} className="relative pl-12">
                      {/* Timeline line */}
                      {index !== (countryDetails.trump_tariffs?.length ?? 0) - 1 && (
                        <div className="absolute left-5 top-6 w-0.5 h-full bg-gray-200"></div>
                      )}
                      {/* Timeline dot with calendar icon */}
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {/* Timeline content */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{tariff.date}</span>
                          <span className="text-2xl font-bold" style={{ color }}>
                            {tariff.rate.toFixed(1)}%
                          </span>
                        </div>
                        {tariff.description && (
                          <div className="flex items-center gap-2 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-gray-500">
                              {tariff.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500">No Trump tariff data available</p>
          )}
        </div>
      </div>

      {/* WTO Tariffs Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1 text-navy-900">Official Tariff Records (WTO {countryDetails?.tariffs_on_us_imports?.year || countryDetails?.us_tariffs_on_imports?.year || '2023'})</h2>
        <p className="text-sm text-gray-600 mb-4">Latest verified tariff averages between the US and {countryName}</p>
        {countryDetails && (countryDetails.tariffs_on_us_imports || countryDetails.us_tariffs_on_imports) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {countryDetails.tariffs_on_us_imports && (
                <div className="bg-[#EAF4FF] rounded-lg p-4">
                  <div className="text-sm text-navy-700 mb-1">Tariffs Imposed by {countryName} on US Imports</div>
                  <div className="text-2xl font-semibold text-navy-900">
                    {countryDetails.tariffs_on_us_imports.simple_average.toFixed(1)}%
                  </div>
                  <div className="text-sm text-navy-600 mt-2">
                    Weighted Average: {countryDetails.tariffs_on_us_imports.weighted_average.toFixed(1)}%
                  </div>
                </div>
              )}
              
              {countryDetails.us_tariffs_on_imports && (
                <div className="bg-[#EAF4FF] rounded-lg p-4">
                  <div className="text-sm text-navy-700 mb-1">US Tariffs on {countryName} Imports</div>
                  <div className="text-2xl font-semibold text-navy-900">
                    {countryDetails.us_tariffs_on_imports.simple_average.toFixed(1)}%
                  </div>
                  <div className="text-sm text-navy-600 mt-2">
                    Weighted Average: {countryDetails.us_tariffs_on_imports.weighted_average.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 text-right">
              Based on WTO's {countryDetails.tariffs_on_us_imports?.year || countryDetails.us_tariffs_on_imports?.year || '2023'} database — used globally as the standard reference.
              <br />
              <span className="italic">(Note: This may differ from claims made by governments.)</span>
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