import React from 'react';

interface SmartBlendPanelProps {
  riskLevel: number;
  setRiskLevel: (level: number) => void;
  isGenerating: boolean;
  progressPhase: string;
  progressPercent: number;
  onGenerate: () => void;
}

const RISK_STRATEGIES = [
  { value: 0, label: '💎 안심 전략', desc: '최근 100회 기준 5등 이상 이력 필수', color: 'bg-green-50 border-green-200' },
  { value: 1, label: '🎯 균형 전략', desc: '최근 50회 기준 5등 이상 이력 필수', color: 'bg-blue-50 border-blue-200' },
  { value: 2, label: '🔥 공격 전략', desc: '과거 이력 조건 없이 다양성과 엔트로피 우선', color: 'bg-orange-50 border-orange-200' }
] as const;

export default function SmartBlendPanel({
  riskLevel,
  setRiskLevel,
  isGenerating,
  progressPhase,
  progressPercent,
  onGenerate
}: SmartBlendPanelProps) {
  return (
    <div className="smart-blend-panel">
      {/* Risk Strategy Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">전략 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RISK_STRATEGIES.map((strategy) => (
            <button
              key={strategy.value}
              onClick={() => setRiskLevel(strategy.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                riskLevel === strategy.value 
                  ? `${strategy.color} border-blue-500 shadow-lg scale-105` 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              aria-label={`${strategy.label} 선택`}
            >
              <div className="text-lg font-semibold mb-1">{strategy.label}</div>
              <div className="text-sm text-gray-600">{strategy.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Feedback */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-800 font-medium">{progressPhase}</span>
            <span className="text-blue-600 text-sm">{progressPercent}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Generation Button */}
      <div className="mb-6">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isGenerating 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg'
          }`}
          aria-label="5개 번호 생성하기"
        >
          {isGenerating ? '생성 중...' : '5개 번호 생성하기'}
        </button>
      </div>
    </div>
  );
} 