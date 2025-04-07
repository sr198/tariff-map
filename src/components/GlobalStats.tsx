import React, { useState, useEffect } from 'react';
import { fetchUSTradeOverview } from '@/services/tradeService';
import { formatTradeValue, convertTradeValueToUnit } from '@/utils/formatters';
import { TradeSummary } from '@/services/tradeService';
import dynamic from 'next/dynamic';

// Dynamically import the chart component to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface GlobalStatsProps {
  data?: {
    [key: string]: {
      usImportTariff: number;
      countryExportTariff: number;
      tradeBalance: number;
    };
  };
}

const GlobalStats: React.FC<GlobalStatsProps> = () => {
  const [tradeData, setTradeData] = useState<TradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get current year and 10 years ago
        const currentYear = new Date().getFullYear() - 1;
        const startYear = currentYear - 9;
        
        const response = await fetchUSTradeOverview(startYear, currentYear);
        setTradeData(response.summary);
        setError(null);
      } catch (err) {
        console.error('Error fetching trade data:', err);
        setError('Failed to load trade data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get the latest year's data
  const latestData = tradeData.length > 0 ? tradeData[tradeData.length - 1] : null;

  // Calculate the actual trade deficit (exports - imports)
  // Note: In the API, trade_deficit is already calculated as imports - exports
  // So we need to negate it to get the correct deficit (exports - imports)
  const getTradeDeficit = (data: TradeSummary) => {
    return -data.trade_deficit; // Negate to get exports - imports
  };

  // Common chart options
  const getChartOptions = (title: string, color: string, isDeficit: boolean = false) => ({
    chart: {
      type: 'line' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      width: 3,
      curve: 'smooth' as const,
      lineCap: 'round' as const
    },
    colors: [color],
    xaxis: {
      categories: tradeData.map(item => item.year),
      title: {
        text: 'Year'
      },
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: true
      }
    },
    yaxis: {
      title: {
        text: isDeficit ? '- Value' : 'Value'
      },
      labels: {
        formatter: (value: number) => `$${value.toFixed(1)}B`
      },
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: true
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.5
      }
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      },
      strokeWidth: 0,
      fillOpacity: 1
    },
    legend: {
      show: false
    },
    tooltip: {
      y: {
        formatter: (value: number) => `$${value.toFixed(1)}B`
      },
      theme: 'light',
      x: {
        show: true
      }
    },
    title: {
      text: title,
      align: 'center' as const,
      style: {
        fontSize: '14px',
        fontWeight: 'bold'
      }
    },
    fill: {
      type: 'solid' as const,
      opacity: 0.1
    }
  });

  // Prepare chart data for exports
  const exportsChartOptions = getChartOptions('US Exports to World', '#3B82F6');
  const exportsChartSeries = [{
    name: 'Exports',
    data: tradeData.map(item => convertTradeValueToUnit(item.export, 'billion'))
  }];

  // Prepare chart data for imports
  const importsChartOptions = getChartOptions('US Imports from World', '#8B5CF6');
  const importsChartSeries = [{
    name: 'Imports',
    data: tradeData.map(item => convertTradeValueToUnit(item.import_, 'billion'))
  }];

  // Prepare chart data for trade deficit
  const deficitChartOptions = getChartOptions('US Trade Deficit', '#EC4899', true);
  
  // For the deficit chart, we need to handle the display of negative values properly
  // We'll use the absolute values for the chart data but maintain the sign in the tooltip
  const deficitChartSeries = [{
    name: 'Trade Deficit',
    data: tradeData.map(item => {
      const deficit = getTradeDeficit(item);
      // For the chart, we'll use the absolute value but maintain the sign in the tooltip
      return Math.abs(convertTradeValueToUnit(deficit, 'billion'));
    })
  }];

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

  // Format the trade deficit with appropriate color based on whether it's positive or negative
  const formatDeficit = (data: TradeSummary | null) => {
    if (!data) return 'N/A';
    
    const deficit = getTradeDeficit(data);
    const formattedValue = formatTradeValue(Math.abs(deficit));
    const color = deficit < 0 ? 'text-red-600' : 'text-green-600';
    const sign = deficit < 0 ? '-' : '';
    
    return <span className={color}>{sign}{formattedValue}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">US Trade Overview</h2>
        <div className="text-sm text-gray-500">
          {latestData ? `Data for ${latestData.year}` : 'Loading data...'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">US Exports to World</div>
          <div className="text-2xl font-semibold text-blue-600">
            {latestData ? formatTradeValue(latestData.export) : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">US Imports from World</div>
          <div className="text-2xl font-semibold text-purple-600">
            {latestData ? formatTradeValue(latestData.import_) : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">US Trade Deficit</div>
          <div className="text-2xl font-semibold">
            {formatDeficit(latestData)}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">US Trade with the World (Last 10 Years)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            {typeof window !== 'undefined' && (
              <Chart
                options={exportsChartOptions}
                series={exportsChartSeries}
                type="line"
                height={250}
              />
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            {typeof window !== 'undefined' && (
              <Chart
                options={importsChartOptions}
                series={importsChartSeries}
                type="line"
                height={250}
              />
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            {typeof window !== 'undefined' && (
              <Chart
                options={deficitChartOptions}
                series={deficitChartSeries}
                type="line"
                height={250}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats; 