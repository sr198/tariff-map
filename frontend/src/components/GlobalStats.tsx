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
import { fetchTradeSummary } from '../services/tradeService';
import type { TradeSummary } from '../services/tradeService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GlobalStatsProps {}

const GlobalStats: React.FC<GlobalStatsProps> = () => {
  const [tradeData, setTradeData] = useState<TradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use US (840) as reporter and World (0) as partner
        const response = await fetchTradeSummary(840, 0);
        setTradeData(response.summary);
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
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Imports',
        data: tradeData.map(d => d.import_ / 1000000),
        borderColor: 'rgb(16, 185, 129)', // green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Trade Deficit',
        data: tradeData.map(d => Math.abs(d.trade_deficit) / 1000000),
        borderColor: 'rgb(239, 68, 68)', // red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
        borderDash: [5, 5], // Make deficit line dashed
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
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.dataset.label}: ${value.toFixed(1)}B USD`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Billions USD',
        },
        grid: {
          drawOnChartArea: true,
        },
      },
    },
  };

  if (loading) return <div>Loading trade statistics...</div>;
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

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">US Global Trade Overview</h3>
        
        {/* Trade Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total US Exports</div>
            <div className="text-2xl font-semibold text-blue-600">
              {formatLargeNumber(latestData.export)}
            </div>
            <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total US Imports</div>
            <div className="text-2xl font-semibold text-emerald-600">
              {formatLargeNumber(latestData.import_)}
            </div>
            <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">US Trade Deficit</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatLargeNumber(Math.abs(latestData.trade_deficit))}
            </div>
            <div className="text-xs text-gray-500 mt-2">Latest data from {latestData.year}</div>
          </div>
        </div>

        <div className="h-[400px]">
          <Line data={combinedData} options={combinedChartOptions} />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>The trade deficit (red dashed line) shows the difference between imports and exports. A rising deficit indicates imports are growing faster than exports.</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 