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
import { fetchUSTradeOverview } from '../services/tradeService';
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
        const response = await fetchUSTradeOverview();
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
        data: tradeData.map(d => d.trade_deficit / 1000000),
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'US Global Trade Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Billions USD',
        },
      },
    },
  };

  if (loading) return <div>Loading trade statistics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">US Exports</h3>
          <Line data={exportData} options={chartOptions} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">US Imports</h3>
          <Line data={importData} options={chartOptions} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Trade Deficit</h3>
          <Line data={deficitData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 