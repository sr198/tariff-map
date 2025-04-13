import { useState, useEffect } from 'react';
import { fetchDeficitMap, DeficitMapResponse } from '../services/tradeService';

export const useDeficitData = () => {
  const [deficitData, setDeficitData] = useState<DeficitMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchDeficitMap();
        setDeficitData(data);
      } catch (err) {
        setError('Failed to fetch deficit data');
        console.error('Error fetching deficit data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { deficitData, loading, error };
}; 