import React from 'react';

interface SmartBlendPanelProps {
  riskLevel: number;
  setRiskLevel: (level: number) => void;
  isGenerating: boolean;
  progressPhase: string;
  progressPercent: number;
}

export default function SmartBlendPanel({
  riskLevel,
  setRiskLevel,
  isGenerating,
  progressPhase,
  progressPercent
}: SmartBlendPanelProps) {
  return (
    <div className="smart-blend-panel">
      {/* Strategy Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">AI 추첨기 전략</h3>
        <div className="text-center text-sm text-gray-600 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <p className="mb-2">
            <strong>추천 1:</strong> 안심 전략 - 안전한 번호 조합으로 5등 이상 당첨 확률을 높입니다
          </p>
          <p className="mb-2">
            <strong>추천 2:</strong> 공격 전략 - 높은 당첨금을 노리는 도전적인 조합입니다
          </p>
          <p className="mb-2">
            <strong>추천 3-4:</strong> 균형 전략 - 안전성과 수익성을 균형있게 조합합니다
          </p>
          <p>
            <strong>추천 5:</strong> 마르코프 전략 - 지난 주 당첨번호를 기반으로 한 통계적 분석
          </p>
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