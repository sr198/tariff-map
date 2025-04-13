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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Trump Tariff Timeline Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Trump-Era Tariff Timeline</h3>
        <div className="space-y-6">
          {tariffTimeline.map((entry, index) => (
            <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200">
              <div className="absolute left-[-9px] top-0 w-4 h-4 bg-orange-500 rounded-full"></div>
              <div className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</div>
              <div className="mt-1 text-sm text-gray-600">{entry.commentary}</div>
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
        <h3 className="text-lg font-semibold mb-4">Top Countries with Trade Deficit</h3>
        <div className="overflow-x-auto">
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
              {deficitRankings.map((country) => (
                <tr key={country.country_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {country.country_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLargeNumber(country.exports)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLargeNumber(country.imports)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatLargeNumber(Math.abs(country.deficit))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 