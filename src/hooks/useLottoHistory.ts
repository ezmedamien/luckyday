import { useState, useEffect, useMemo } from 'react';

interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

interface UseLottoHistoryReturn {
  history: LottoHistoryDraw[];
  loading: boolean;
  error: string | null;
  latestDraw: LottoHistoryDraw | null;
  refetch: () => void;
}

export function useLottoHistory(): UseLottoHistoryReturn {
  const [history, setHistory] = useState<LottoHistoryDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (abortController?: AbortController) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/lotto", {
        signal: abortController?.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHistory(data.draws || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Don't set error for aborted requests
      }
      setError("로또 데이터를 불러올 수 없습니다.");
      console.error('Failed to fetch lotto history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController);
    
    return () => {
      abortController.abort();
    };
  }, []);

  const latestDraw = useMemo(() => {
    if (history.length === 0) return null;
    return history.reduce((a, b) => (a.round > b.round ? a : b));
  }, [history]);

  const refetch = () => {
    fetchData();
  };

  return {
    history,
    loading,
    error,
    latestDraw,
    refetch
  };
} 