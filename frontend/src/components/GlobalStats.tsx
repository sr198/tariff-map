import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { fetchTradeSummary, fetchDeficitRankings } from '../services/tradeService';
import type { TradeSummary, DeficitRanking } from '../services/tradeService';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrumpTariffTimelineEntry {
  date: string;
  commentary: string;
}

interface GlobalStatsProps {}

const GlobalStats: React.FC<GlobalStatsProps> = () => {
  const [tradeData, setTradeData] = useState<TradeSummary[]>([]);
  const [deficitRankings, setDeficitRankings] = useState<DeficitRanking[]>([]);
  const [tariffTimeline, setTariffTimeline] = useState<TrumpTariffTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradeResponse, deficitResponse, timelineResponse] = await Promise.all([
          fetchTradeSummary(840, 0),
          fetchDeficitRankings(),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trade/trump-tariff-timeline`)
        ]);
        setTradeData(tradeResponse.summary);
        setDeficitRankings(deficitResponse.rankings);
        setTariffTimeline(timelineResponse.data.timeline);
        setLoading(false);
      } catch (err) {
        setError('Failed to load trade data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getChartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        color: 'rgb(17, 24, 39)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgb(75, 85, 99)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgb(75, 85, 99)',
        },
      },
    },
  });

  const exportData = {
    labels: tradeData.map(d => d.year),
    datasets: [
      {
        label: 'Exports (Billions USD)',
        data: tradeData.map(d => d.export / 1000000),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const importData = {
    labels: tradeData.map(d => d.year),
    datasets: [
      {
        label: 'Imports (Billions USD)',
        data: tradeData.map(d => d.import_ / 1000000),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const deficitData = {
    labels: tradeData.map(d => d.year),
    datasets: [
      {
        label: 'Trade Deficit (Billions USD)',
        data: tradeData.map(d => Math.abs(d.trade_deficit) / 1000000),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const combinedData = {
    labels: tradeData.map(d => d.year),
    datasets: [
      {
        label: 'Exports',
        data: tradeData.map(d => d.export / 1000000),
        borderColor: 'rgb(59, 130, 246)', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Imports',
        data: tradeData.map(d => d.import_ / 1000000),
        borderColor: 'rgb(16, 185, 129)', // green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Trade Deficit',
        data: tradeData.map(d => Math.abs(d.trade_deficit) / 1000000),
        borderColor: 'rgb(239, 68, 68)', // red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
        borderDash: [5, 5], // Make deficit line dashed
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const combinedChartOptions = {
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
        text: 'US Trade Flow Over Time',
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
            return `${context.dataset.label}: ${formatLargeNumber(value * 1000000)}`;
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
          callback: (value: any) => formatLargeNumber(value * 1000000),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) return <LoadingSpinner message="Loading trade data..." />;
  if (error) return <div className="text-red-600">{error}</div>;

  const latestData = tradeData[tradeData.length - 1];
  const formatLargeNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value * 1000); // Multiply by 1000 since values are in thousands
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  return (
    <div className="space-y-8">
      {/* Trump Tariff Timeline Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Trump-Era Tariff Timeline</h3>
        <div className="space-y-6">
          {[...tariffTimeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry, index) => (
            <div key={index} className="relative pl-12">
              {/* Timeline line */}
              {index !== tariffTimeline.length - 1 && (
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
                <div className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</div>
                {entry.commentary && (
                  <div className="flex items-center gap-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {entry.commentary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* US Global Trade Overview Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">US Global Trade Overview</h3>
        
        {/* Trade Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total US Exports</div>
            <div className="text-2xl font-semibold text-blue-600">
              {formatLargeNumber(latestData.export)}
            </div>
            <div className="text-xs text-gray-500 mt-2">As of {latestData.year}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total US Imports</div>
            <div className="text-2xl font-semibold text-green-600">
              {formatLargeNumber(latestData.import_)}
            </div>
            <div className="text-xs text-gray-500 mt-2">As of {latestData.year}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Trade Deficit</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatLargeNumber(Math.abs(latestData.trade_deficit))}
            </div>
            <div className="text-xs text-gray-500 mt-2">As of {latestData.year}</div>
          </div>
        </div>

        {/* Trade Flow Chart */}
        <div className="h-96 mb-8">
          <Line data={combinedData} options={combinedChartOptions} />
        </div>
      </div>

      {/* Deficit Rankings Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top 5 U.S. Trade Deficit Partners (2024)</h3>
        <div className="relative">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="min-w-[800px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Exports</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Imports</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade Deficit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deficitRankings.map((country, index) => {
                    // Find the maximum deficit for scaling the bar
                    const maxDeficit = Math.max(...deficitRankings.map(c => Math.abs(c.deficit)));
                    const deficitPercentage = (Math.abs(country.deficit) / maxDeficit) * 100;
                    
                    return (
                      <tr 
                        key={country.country_id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                          Math.abs(country.deficit) === maxDeficit ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {country.country_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLargeNumber(country.exports)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLargeNumber(country.imports)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500 rounded-full" 
                                  style={{ width: `${deficitPercentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-red-600 font-medium min-w-[80px] text-right">
                              {formatLargeNumber(Math.abs(country.deficit))}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          <div className="text-xs text-gray-500 mt-2 text-center md:hidden">
            ← Scroll horizontally to see all data →
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 