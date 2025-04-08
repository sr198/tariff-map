import React, { useState, useEffect, useMemo } from 'react';
import { fetchTradeSummary } from '@/services/tradeService';
import { formatTradeValue, convertTradeValueToUnit } from '@/utils/formatters';
import { TradeSummary } from '@/services/tradeService';
import dynamic from 'next/dynamic';
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
  ChartOptions,
  TooltipItem,
} from 'chart.js';

// Dynamically import the chart component to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CountryTradeStatsProps {
  countryCode: string;
  countryName: string;
  isGlobal?: boolean;
}

interface TradeData {
  year: number;
  export: number;
  import_: number;
  trade_deficit: number;
}

const CountryTradeStats: React.FC<CountryTradeStatsProps> = ({ 
  countryCode, 
  countryName,
  isGlobal = false 
}) => {
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'5Y' | '10Y' | 'ALL'>('10Y');

  // Determine the appropriate unit and scale factor based on the data
  const { unit, scaleFactor, formattedData } = useMemo(() => {
    if (!tradeData.length) return { unit: 'M', scaleFactor: 1000, formattedData: [] };
    
    // Find the maximum absolute value across all data points
    const maxValue = Math.max(
      ...tradeData.map(d => Math.max(
        Math.abs(d.export), 
        Math.abs(d.import_), 
        Math.abs(d.trade_deficit)
      ))
    );
    
    // Values from API are in thousands of dollars
    // So 100,000 in the API means $100M
    let unit = 'M';
    let scaleFactor = 1000; // Divide by 1000 to convert from thousands to millions
    
    if (maxValue >= 1000000) { // >= $1B (1,000,000 thousands = $1B)
      unit = 'B';
      scaleFactor = 1000000;
    } else if (maxValue >= 1000000000) { // >= $1T
      unit = 'T';
      scaleFactor = 1000000000;
    }
    
    // Format the data with the appropriate scale and sort in reverse chronological order
    const formattedData = tradeData
      .map(d => ({
        year: d.year,
        export: d.export / scaleFactor,
        import_: d.import_ / scaleFactor,
        trade_deficit: d.trade_deficit / scaleFactor
      }))
      .sort((a, b) => b.year - a.year); // Sort in descending order by year
    
    return { unit, scaleFactor, formattedData };
  }, [tradeData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate start year based on selected time range
        const currentYear = new Date().getFullYear() - 1;
        let startYear;
        
        switch (timeRange) {
          case '5Y':
            startYear = currentYear - 4;
            break;
          case '10Y':
            startYear = currentYear - 9;
            break;
          case 'ALL':
          default:
            startYear = undefined; // No start year filter
        }
        
        // For global stats, use USA vs WLD, otherwise use USA vs selected country
        const partnerCode = isGlobal ? 'WLD' : countryCode;
        const response = await fetchTradeSummary('USA', partnerCode, startYear);
        setTradeData(response.summary);
      } catch (err) {
        console.error('Error fetching trade data:', err);
        setError('Failed to load trade data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (countryCode || isGlobal) {
      fetchData();
    }
  }, [countryCode, timeRange, isGlobal]);

  const chartData = {
    labels: formattedData.map(d => d.year),
    datasets: [
      {
        label: `Exports (${unit})`,
        data: formattedData.map(d => d.export),
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: `Imports (${unit})`,
        data: formattedData.map(d => d.import_),
        borderColor: 'rgb(16, 185, 129)', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
      {
        label: `Trade Balance (${unit})`,
        data: formattedData.map(d => -d.trade_deficit),
        borderColor: 'rgb(107, 114, 128)', // Gray
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: isGlobal 
          ? `US Trade with World (${timeRange})` 
          : `US Trade with ${countryName} (${timeRange})`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Balance')) {
              return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
            }
            return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Value (${unit})`,
          font: {
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tradeData.length) return null;
    
    // Since formattedData is sorted in descending order (newest first),
    // the latest year is at index 0 and the previous year is at index 1
    const latestYear = formattedData[0];
    const previousYear = formattedData[1];
    
    // Calculate year-over-year changes
    const exportChange = previousYear 
      ? ((latestYear.export - previousYear.export) / Math.abs(previousYear.export)) * 100 
      : 0;
    
    const importChange = previousYear 
      ? ((latestYear.import_ - previousYear.import_) / Math.abs(previousYear.import_)) * 100 
      : 0;
    
    const deficitChange = previousYear 
      ? ((-latestYear.trade_deficit - -previousYear.trade_deficit) / Math.abs(previousYear.trade_deficit)) * 100 
      : 0;
    
    return {
      latestYear: latestYear.year,
      export: latestYear.export,
      import: latestYear.import_,
      deficit: -latestYear.trade_deficit,
      exportChange,
      importChange,
      deficitChange
    };
  }, [formattedData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold text-gray-800">
          {isGlobal ? 'US Trade with World' : `US Trade with ${countryName}`}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('5Y')}
            className={`px-3 py-1 rounded ${
              timeRange === '5Y' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            5Y
          </button>
          <button
            onClick={() => setTimeRange('10Y')}
            className={`px-3 py-1 rounded ${
              timeRange === '10Y' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            10Y
          </button>
          <button
            onClick={() => setTimeRange('ALL')}
            className={`px-3 py-1 rounded ${
              timeRange === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      {tradeData.length === 0 ? (
        <div className="text-gray-500 p-4 text-center">No trade data available.</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">US Exports {isGlobal ? 'to World' : `to ${countryName}`}</h3>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.export.toFixed(2)} {unit}</p>
                <p className="text-sm text-gray-600">
                  {summaryStats.exportChange >= 0 ? '↑' : '↓'} {Math.abs(summaryStats.exportChange).toFixed(1)}% YoY
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">US Imports {isGlobal ? 'from World' : `from ${countryName}`}</h3>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.import.toFixed(2)} {unit}</p>
                <p className="text-sm text-gray-600">
                  {summaryStats.importChange >= 0 ? '↑' : '↓'} {Math.abs(summaryStats.importChange).toFixed(1)}% YoY
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">US Trade Balance {isGlobal ? 'with World' : `with ${countryName}`}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryStats.deficit >= 0 ? '+' : ''}{summaryStats.deficit.toFixed(2)} {unit}
                </p>
                <p className="text-sm text-gray-600">
                  {summaryStats.deficitChange >= 0 ? '↑' : '↓'} {Math.abs(summaryStats.deficitChange).toFixed(1)}% YoY
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          
          {/* Data Table */}
          <div className="bg-gray-50 rounded-lg p-4 w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exports ({unit})</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imports ({unit})</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance ({unit})</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formattedData.map((item) => (
                    <tr key={item.year}>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.year}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.export.toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.import_.toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {-item.trade_deficit >= 0 ? '+' : ''}{(-item.trade_deficit).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryTradeStats; 