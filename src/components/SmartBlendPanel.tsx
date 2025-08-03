import React from 'react';

interface SmartBlendPanelProps {
  riskLevel: number;
  setRiskLevel: (level: number) => void;
  isGenerating: boolean;
  progressPhase: string;
  progressPercent: number;
}

const RISK_STRATEGIES = [
  {
    value: 0,
    label: '안심 전략',
    desc: '안전한 번호 조합으로 5등 이상 당첨 확률을 높입니다'
  },
  {
    value: 1,
    label: '균형 전략', 
    desc: '안전성과 수익성을 균형있게 조합합니다'
  },
  {
    value: 2,
    label: '공격 전략',
    desc: '높은 당첨금을 노리는 도전적인 조합입니다'
  }
];

export default function SmartBlendPanel({
  riskLevel,
  setRiskLevel,
  isGenerating,
  progressPhase,
  progressPercent
}: SmartBlendPanelProps) {
  return (
    <div className="smart-blend-panel">
      {/* Risk Strategy Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">전략 선택</h3>
        <div className="flex gap-3 mb-2 justify-center">
          {RISK_STRATEGIES.map((strategy) => (
            <button
              key={strategy.value}
              onClick={() => setRiskLevel(strategy.value)}
              className={`personal-method-btn${riskLevel === strategy.value ? ' selected' : ''}`}
              aria-label={`${strategy.label} 선택`}
            >
              {strategy.label}
            </button>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600 mb-4">
          {RISK_STRATEGIES[riskLevel]?.desc}
        </div>
      </div>

      {/* Progress Feedback */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-800 font-semibold text-sm">{progressPhase}</span>
            <span className="text-blue-600 text-sm font-medium">{progressPercent}%</span>
          </div>
          <div 
            className="w-full rounded-full overflow-hidden"
            style={{ 
              height: '20px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <div 
              className="rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progressPercent}%`,
                height: '18px',
                backgroundColor: '#2563eb',
                minWidth: '4px',
                borderRadius: '10px',
                margin: '1px'
              }}
            ></div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-blue-700 text-xs font-medium">
              {progressPercent < 25 && "데이터 분석 중..."}
              {progressPercent >= 25 && progressPercent < 50 && "전략 적용 중..."}
              {progressPercent >= 50 && progressPercent < 75 && "조합 생성 중..."}
              {progressPercent >= 75 && progressPercent < 100 && "최적화 중..."}
              {progressPercent === 100 && "완료!"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 