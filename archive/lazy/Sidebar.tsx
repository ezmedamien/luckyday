import React from 'react';
import { SavedCombo } from '@/hooks/useSavedCombos';
import { NumberBall } from '@/components/ui/NumberBall';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { translations, Language } from '@/lib/translations';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  combos: SavedCombo[];
  onDeleteCombo: (id: string) => void;
  onDeleteClick: (id: string) => void;
  language: Language;
}

const ComboRow = ({ index, style, data }: ListChildComponentProps) => {
  const { combos, onDeleteClick, language } = data;
  const combo = combos[index];
  return (
    <div style={style}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-indigo">{combo.name}</h3>
          <button
            onClick={() => onDeleteClick(combo.id)}
            className="text-error hover:text-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center gap-2 mb-3">
          {combo.numbers.map((number: number, idx: number) => (
            <NumberBall key={idx} number={number} size="sm" />
          ))}
        </div>
        <div className="text-xs text-gray-500">
          {combo.method} • {new Date(combo.date).toLocaleDateString()}
        </div>
      </Card>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, combos, onDeleteCombo, onDeleteClick, language }) => {
  const t = translations[language];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-indigo">
            {language === 'ko' ? '저장된 조합' : 'Saved Combinations'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          {combos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎲</span>
              </div>
              <p className="text-gray-500 font-medium">
                {language === 'ko' ? '저장된 조합이 없습니다' : 'No saved combinations'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {language === 'ko' ? '조합을 생성하고 저장해보세요!' : 'Generate and save your combinations!'}
              </p>
            </div>
          ) : (
            <List
              height={window.innerHeight * 0.7}
              itemCount={combos.length}
              itemSize={56}
              width={"100%"}
              itemData={{ combos, onDeleteClick, language }}
              style={{ minWidth: 0 }}
            >
              {ComboRow}
            </List>
          )}
        </div>
      </div>
    </div>
  );
}; 