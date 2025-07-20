import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/utils';

interface HistoricalData {
  draws: any[];
  lastUpdated: string;
  latestDraw: number;
}

interface UseHistoricalDataReturn {
  data: any[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  refetch: () => Promise<void>;
}

const CACHE_KEY = 'luckyday-historical-data';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export function useHistoricalData(): UseHistoricalDataReturn {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = storage.get(CACHE_KEY);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setProgress(100);
          setIsLoading(false);
          return;
        }
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 20000);
      });

      // Fetch with timeout
      const response = await Promise.race([
        fetch('/api/lotto/all'),
        timeoutPromise
      ]);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      const historicalData: HistoricalData = {
        draws: result.draws || [],
        lastUpdated: new Date().toISOString(),
        latestDraw: result.latestDraw || 0
      };

      // Cache the result
      storage.set(CACHE_KEY, {
        data: historicalData.draws,
        timestamp: Date.now(),
        metadata: {
          lastUpdated: historicalData.lastUpdated,
          latestDraw: historicalData.latestDraw
        }
      });

      setData(historicalData.draws);
      setProgress(100);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      
      // Fallback to mock data
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        drwNo: 1000 + i,
        drwNoDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        drwtNo1: Math.floor(Math.random() * 45) + 1,
        drwtNo2: Math.floor(Math.random() * 45) + 1,
        drwtNo3: Math.floor(Math.random() * 45) + 1,
        drwtNo4: Math.floor(Math.random() * 45) + 1,
        drwtNo5: Math.floor(Math.random() * 45) + 1,
        drwtNo6: Math.floor(Math.random() * 45) + 1,
        bnusNo: Math.floor(Math.random() * 45) + 1,
        returnValue: "success",
        totSellamnt: Math.floor(Math.random() * 1000000000),
        firstWinamnt: Math.floor(Math.random() * 1000000000),
        firstPrzwnerCo: Math.floor(Math.random() * 10),
        firstAccumamnt: Math.floor(Math.random() * 1000000000)
      }));
      
      setData(mockData);
      setProgress(100);
      setError('Using fallback data due to network issues');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    progress,
    refetch
  };
} 