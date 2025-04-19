import { API_BASE_URL } from '@/config';

export interface MarketData {
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

export async function fetchMarketData(): Promise<Record<string, MarketData>> {
  const response = await fetch(`${API_BASE_URL}/market-data`);
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  return response.json();
} 