import React from 'react';

interface TicketCardProps {
  ticket: number[];
  explain: string;
  isPrimary?: boolean;
  onClick?: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  className?: string;
}

export default function TicketCard({
  ticket,
  explain,
  isPrimary = false,
  onClick,
  onCopy,
  onSave,
  className = ''
}: TicketCardProps) {
  const ballSize = isPrimary ? 'w-12 h-12' : 'w-8 h-8';
  const ballTextSize = isPrimary ? 'text-lg' : 'text-sm';
  const ballColor = isPrimary ? 'bg-blue-600' : 'bg-gray-600';
  
  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 ${
        isPrimary 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg' 
          : 'hover:border-blue-300 hover:shadow-md cursor-pointer'
      } ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? '이 조합을 우선 추천으로 선택' : undefined}
    >
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {ticket.map((num) => (
          <div 
            key={num} 
            className={`${ballSize} ${ballColor} text-white rounded-full flex items-center justify-center ${ballTextSize} font-bold shadow-md`}
            aria-label={`번호 ${num}`}
          >
            {num}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className={`text-gray-700 leading-relaxed ${
          isPrimary ? 'text-sm' : 'text-xs line-clamp-3'
        }`}>
          {explain}
        </p>
      </div>
      {(onCopy || onSave) && (
        <div className="mt-4 flex justify-center gap-2">
          {onCopy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="번호 복사"
            >
              복사
            </button>
          )}
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              aria-label="번호 저장"
            >
              저장
            </button>
          )}
        </div>
      )}
    </div>
  );
} 