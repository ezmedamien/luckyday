import { useState, useCallback } from 'react';
import { generateSmartBlend as generateSmartBlendCore } from 'packages/core/generateSmartBlend';

interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

interface SmartBlendResult {
  ticket: number[];
  explain: string;
}

interface UseSmartBlendReturn {
  riskLevel: number;
  setRiskLevel: (level: number) => void;
  smartBlendResults: SmartBlendResult[];
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  isGenerating: boolean;
  progressPhase: string;
  progressPercent: number;
  generateSmartBlend: (history: LottoHistoryDraw[]) => Promise<void>;
}

export function useSmartBlend(): UseSmartBlendReturn {
  const [riskLevel, setRiskLevel] = useState<number>(1); // Keep for compatibility but unused
  const [smartBlendResults, setSmartBlendResults] = useState<SmartBlendResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPhase, setProgressPhase] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const generateSmartBlend = useCallback(async (history: LottoHistoryDraw[]) => {
    setIsGenerating(true);
    setProgressPhase('번호 생성 중...');
    setProgressPercent(20);
    setSmartBlendResults([]);
    setHighlightedIndex(0);

    try {
      // Simulate progress phases with real timing
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgressPhase('당첨 이력 확인 중...');
      setProgressPercent(40);

      await new Promise(resolve => setTimeout(resolve, 300));
      setProgressPhase('통계 분석 중...');
      setProgressPercent(60);

      await new Promise(resolve => setTimeout(resolve, 300));
      setProgressPhase('최적 조합 선별 중...');
      setProgressPercent(80);

      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate 5 combinations with the new strategy approach
      const results = generateSmartBlendCore(history.map(d => d.numbers), 0); // riskLevel no longer used
      setSmartBlendResults(results);
      setHighlightedIndex(0);
      
      setProgressPhase('완료!');
      setProgressPercent(100);
      
      // Clear completion message after 1 second
      setTimeout(() => setProgressPhase(''), 1000);
    } catch (error) {
      setProgressPhase('오류 발생');
      console.error('SmartBlend generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []); // Removed riskLevel dependency

  return {
    riskLevel,
    setRiskLevel,
    smartBlendResults,
    highlightedIndex,
    setHighlightedIndex,
    isGenerating,
    progressPhase,
    progressPercent,
    generateSmartBlend
  };
} 