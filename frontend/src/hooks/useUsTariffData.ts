import { useState, useEffect } from 'react';
import { fetchUsTariffMap } from '../services/tradeService';

export const useUsTariffData = () => {
  const [tariffData, setTariffData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchUsTariffMap();
        if (mounted) {
          const dataMap = response.tariffs.reduce((acc: Record<string, any>, item) => {
            acc[item.country_id] = item;
            return acc;
          }, {});
          setTariffData(dataMap);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load US tariff data');
          console.error('Error loading US tariff data:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return { tariffData, loading, error };
}; 