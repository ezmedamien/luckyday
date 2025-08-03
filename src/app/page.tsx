"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import NumberBall from '@/components/ui/NumberBall';
import SmartBlendPanel from '@/components/SmartBlendPanel';
import { useLottoHistory } from '@/hooks/useLottoHistory';
import { useSmartBlend } from '@/hooks/useSmartBlend';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import UserMenu from '@/components/auth/UserMenu';
import { useSavedCombos } from '@/hooks/useSavedCombos';

import { GENERATOR_METHODS, ZODIAC_LIST, YEAR_LIST, MONTH_LIST, DAY_LIST, LOTTO_CONFIG } from '@/lib/constants';
import { 
  generateRandomNumbers, 
  generateFrequencyBased, 
  generateHotColdBalance, 
  generateSumRange, 
  generateCoOccurrence, 
  generatePersonalized, 
  generateSemiAutomatic 
} from '@/lib/generators';

interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}



export default function Home() {
  const { user, loading: authLoading, isGuest, saveAsGuest } = useAuth();
  const { history, loading, error, latestDraw } = useLottoHistory();
  const {
    riskLevel,
    setRiskLevel,
    smartBlendResults,
    highlightedIndex,
    setHighlightedIndex,
    isGenerating,
    progressPhase,
    progressPercent,
    generateSmartBlend
  } = useSmartBlend();
  const { savedCombos, addSavedCombo, removeSavedCombo } = useSavedCombos();

  const [currentTicketNumbers, setCurrentTicketNumbers] = useState<number[]>([]);
  const [searchRound, setSearchRound] = useState("");
  const [filtered, setFiltered] = useState<LottoHistoryDraw | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lockedNumbers, setLockedNumbers] = useState<(number | '')[]>(['', '', '', '', '', '']);
  const [selectedMethod, setSelectedMethod] = useState('random');
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [selectedComboForBacktest, setSelectedComboForBacktest] = useState<{ numbers: number[]; savedAt: string } | null>(null);

  // Personalized method state
  const [personalType, setPersonalType] = useState<'zodiac' | 'birthdate'>('zodiac');
  const [zodiac, setZodiac] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set latest draw as default when history loads
  useEffect(() => {
    if (history.length > 0 && !filtered) {
      const latest = history.reduce((a, b) => (a.round > b.round ? a : b));
      setFiltered(latest);
    }
  }, [history, filtered]);

  // Memoized derived values
  const last100 = useMemo(() => history.slice(-LOTTO_CONFIG.LOOKBACK_WINDOW), [history]);
  
  const filteredRounds = useMemo(() => {
    if (!searchRound) {
      return history.slice().sort((a, b) => b.round - a.round);
    }
    return history
      .filter(d => d.round.toString().includes(searchRound))
      .sort((a, b) => b.round - a.round);
  }, [history, searchRound]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchRound) {
      setFiltered(null);
      return;
    }
    const result = history.find((d) => d.round === Number(searchRound));
    setFiltered(result || null);
  }, [searchRound, history]);

  // Allow Enter key to trigger search
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // Zodiac and birthday options
  const zodiacList = ZODIAC_LIST;
  const yearList = YEAR_LIST;
  const monthList = MONTH_LIST;
  const dayList = DAY_LIST;

  // Add personalized method to generatorMethods
  const generatorMethods = GENERATOR_METHODS;

  // Main generator switch
  const handleGenerate = useCallback(async () => {
    if (selectedMethod === 'smartblend') {
      await generateSmartBlend(history);
      if (smartBlendResults.length > 0) {
        setCurrentTicketNumbers(smartBlendResults[highlightedIndex]?.ticket || []);
      }
      return;
    }

    let result: number[] = [];
    
    switch (selectedMethod) {
      case 'random':
        result = generateRandomNumbers();
        break;
      case 'frequency':
        result = generateFrequencyBased(last100);
        break;
      case 'hotcold':
        result = generateHotColdBalance(last100);
        break;
      case 'sumrange':
        result = generateSumRange();
        break;
      case 'cooccur':
        result = generateCoOccurrence(last100);
        break;
      case 'personal':
        result = generatePersonalized(personalType, zodiac, birthYear, birthMonth, birthDay);
        break;
      case 'semi':
        result = generateSemiAutomatic(lockedNumbers);
        break;
      default:
        result = generateRandomNumbers();
    }
    
    setCurrentTicketNumbers(result);
  }, [
    selectedMethod, 
    history, 
    last100, 
    personalType, 
    zodiac, 
    birthYear, 
    birthMonth, 
    birthDay, 
    lockedNumbers,
    generateSmartBlend,
    smartBlendResults,
    highlightedIndex
  ]);

  // Handle SmartBlend ticket selection
  const handleTicketSelect = useCallback((index: number) => {
    setHighlightedIndex(index);
    setCurrentTicketNumbers(smartBlendResults[index]?.ticket || []);
  }, [smartBlendResults, setHighlightedIndex]);



  // Save ticket
  const handleSaveTicket = useCallback(async (ticket: number[], method: string = 'manual') => {
    if (isGuest) {
      saveAsGuest();
      return;
    }
    await addSavedCombo(ticket, method);
  }, [addSavedCombo, isGuest, saveAsGuest]);

  // Check if generate button should be disabled
  const isGenerateDisabled = useMemo(() => {
    if (selectedMethod === 'personal') {
      return (personalType === 'zodiac' && !zodiac) ||
             (personalType === 'birthdate' && (!birthYear || !birthMonth || !birthDay));
    }
    return false;
  }, [selectedMethod, personalType, zodiac, birthYear, birthMonth, birthDay]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  function getLottoRank(combo: { numbers: number[] }, latestDraw: LottoHistoryDraw | null) {
    if (!latestDraw) return null;
    const mainSet = new Set(latestDraw.numbers);
    const bonus = latestDraw.bonus;
    const matchCount = combo.numbers.filter(n => mainSet.has(n)).length;
    const hasBonus = combo.numbers.includes(bonus);
    

    
    if (matchCount === 6) return '1등';
    if (matchCount === 5 && hasBonus) return '2등';
    if (matchCount === 5) return '3등';
    if (matchCount === 4) return '4등';
    if (matchCount === 3) return '5등';
    return '낙첨';
  }

  function getBacktestResults(combo: { numbers: number[] }) {
    const results = {
      '1등': 0,
      '2등': 0,
      '3등': 0,
      '4등': 0,
      '5등': 0,
      '낙첨': 0,
      total: history.length
    };

    history.forEach(draw => {
      const rank = getLottoRank(combo, draw);
      if (rank) {
        results[rank as keyof typeof results]++;
      }
    });

    return results;
  }

  return (
    <>
      <div className="container-center" style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
      {/* Page Banner with mascot, title, subtitle, and SVG wave */}
      <div style={{ background: '#fff', width: '100vw', position: 'relative', zIndex: 10, marginBottom: 0, paddingBottom: 0 }}>
        <div className="page-banner section-spacing" style={{ background: 'var(--primary)', marginBottom: 0, paddingBottom: '2.5rem', paddingTop: '2.5rem', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <div className="flex flex-col items-center gap-4 mb-2">
            {/* <Mascot /> */}
            <div>
              <div className="banner-title">LuckyDay</div>
              <div className="banner-subtitle">AI 추첨기</div>
            </div>
          </div>
          
          {/* Auth section */}
          <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 99999 }}>
            {authLoading ? (
              <div style={{ color: 'white', fontSize: '0.9rem' }}>로딩 중...</div>
            ) : user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => saveAsGuest()}
                className="login-button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                    fill="currentColor"
                  />
                </svg>
                로그인
              </button>
            )}
          </div>
          
          {/* SVG wave bottom edge */}
          <svg className="banner-wave" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', marginBottom: '-1px' }}>
            <path d="M0 0C360 40 1080 40 1440 0V40H0V0Z" fill="#fff"/>
          </svg>
        </div>
      </div>

      {/* Latest Draw Banner with a distinct shade */}
      <section className="w-full" style={{ position: 'relative', zIndex: 2, margin: 0, padding: 0, background: '#fff' }}>
        <div style={{
          width: '100vw',
          background: '#fff',
          boxShadow: '0 4px 20px rgba(0,100,255,0.08)',
          borderBottomLeftRadius: '0',
          borderBottomRightRadius: '0',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
          border: 'none',
          margin: 0,
          padding: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: 950, margin: '0 auto', padding: '1.2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loading ? (
              <span className="text-gray-400">불러오는 중...</span>
            ) : error ? (
              <span className="text-accent-pink">{error}</span>
            ) : latestDraw ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'auto', maxWidth: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: 90 }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '2.1rem', lineHeight: 1.1, marginBottom: '0.2rem', letterSpacing: '-0.01em', textAlign: 'right' }}>
                    {latestDraw.round}회
                  </div>
                  <div style={{ fontWeight: 500, color: '#6b7280', fontSize: '1.05rem', lineHeight: 1.1, textAlign: 'right' }}>
                    {latestDraw.date} 추첨일
                  </div>
                </div>
                <div className="number-balls-row items-center flex-nowrap justify-center mb-1" style={{ minWidth: 0 }}>
                  {latestDraw.numbers.map((n) => (
                    <NumberBall key={n} number={n} variant="main" />
                  ))}
                  <NumberBall number={latestDraw.bonus} variant="bonus" />
                </div>
              </div>
            ) : (
              <span className="text-gray-400">해당 결과가 없습니다.</span>
            )}
          </div>
          {/* Thin light blue line at the bottom edge of the card */}
          <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, #e6f0fa 0%, #b3d8fa 100%)', margin: 0, border: 'none', position: 'absolute', left: 0, bottom: 0 }} />
        </div>
      </section>

      {/* Generate Numbers (main feature, visually dominant) */}
      <section
        className="main-generator-card card-generator flex flex-col border border-primary/20"
        style={{
          margin: '0 auto',
          zIndex: 2,
          width: '100%',
          maxWidth: '1280px',
          minWidth: 0,
          padding: '2.5rem',
          boxSizing: 'border-box',
        }}
      >
        <h2 className="generator-title flex items-center gap-2" style={{ fontSize: '2rem' }}>
          <span role="img" aria-label="sparkles">✨</span> 오늘의 행운 번호
        </h2>
        {selectedMethod === 'smartblend' && smartBlendResults.length > 0 ? (
          // Empty state for SmartBlend since it's handled separately
          <div className="mt-8 mb-8 text-center text-gray-500">
            AI 추첨기 조합이 아래에 표시됩니다
          </div>
        ) : currentTicketNumbers.length > 0 ? (
          <div
            className="number-balls-row mt-8 mb-8 justify-center flex-nowrap items-center"
            style={{
              fontSize: '3.2rem',
              minHeight: '4.5rem',
              marginBottom: '2.2rem',
              marginTop: selectedMethod === 'semi' ? 0 : '1.2rem',
            }}
          >
            {currentTicketNumbers.map((n) => (
              <NumberBall key={n} number={n} variant="main" className={selectedMethod === 'semi' && lockedNumbers[currentTicketNumbers.indexOf(n)] === n ? 'locked-ball number-ball-lg' : 'number-ball-lg'} />
            ))}
          </div>
        ) : (
          <div className="number-balls-row mt-8 mb-8 justify-center flex-nowrap items-center" style={{ fontSize: '3.2rem', minHeight: '4.5rem', marginBottom: '2.2rem', marginTop: selectedMethod === 'semi' ? 0 : '1.2rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="number-ball number-ball-lg" style={{ background: '#f3f4f6', color: '#d1d5db', border: '2.5px solid #e5e7eb', fontWeight: 700 }} />
            ))}
          </div>
        )}
        {/* Generator method selector as buttons with tooltips */}
        <div className="generator-methods-row" style={{ width: '100%', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          {generatorMethods.map((m, idx) => (
            <div key={m.id} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className={`generator-method-btn${selectedMethod === m.id ? ' selected' : ''}`}
                onClick={() => {
                  if (tooltipIdx === idx) {
                    setTooltipIdx(null);
                    setSelectedMethod(m.id);
                  } else if (window.innerWidth < 768) {
                    setTooltipIdx(idx);
                  } else {
                    setSelectedMethod(m.id);
                  }
                }}
                onMouseEnter={() => {
                  if (window.innerWidth >= 768) {
                    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                    setTooltipIdx(idx);
                  }
                }}
                onMouseLeave={() => {
                  if (window.innerWidth >= 768) {
                    tooltipTimeout.current = setTimeout(() => setTooltipIdx(null), 120);
                  }
                }}
                type="button"
                tabIndex={0}
                aria-describedby={`tooltip-${m.id}`}
              >
                {m.label}
              </button>
              {tooltipIdx === idx && (
                <div
                  id={`tooltip-${m.id}`}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '110%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#222',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.7rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    padding: '0.7rem 1.1rem',
                    fontSize: '0.98rem',
                    fontWeight: 500,
                    zIndex: 20,
                    minWidth: '180px',
                    maxWidth: '260px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {m.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Personalized input UI below buttons, centered */}
        {selectedMethod === 'personal' && (
          <div className="flex flex-col gap-4 mb-6 w-full items-center justify-center">
            <div className="flex gap-3 mb-2">
              <button
                className={`personal-method-btn${personalType === 'zodiac' ? ' selected' : ''}`}
                onClick={() => setPersonalType('zodiac')}
                type="button"
              >띠로</button>
              <button
                className={`personal-method-btn${personalType === 'birthdate' ? ' selected' : ''}`}
                onClick={() => setPersonalType('birthdate')}
                type="button"
              >생년월일로</button>
            </div>
            {personalType === 'zodiac' && (
              <select
                className="personal-method-select"
                value={zodiac}
                onChange={e => setZodiac(e.target.value)}
              >
                <option value="">띠 선택</option>
                {zodiacList.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            )}
            {personalType === 'birthdate' && (
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  className="personal-method-select"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value)}
                >
                  <option value="">년</option>
                  {yearList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  className="personal-method-select"
                  value={birthMonth}
                  onChange={e => setBirthMonth(e.target.value)}
                >
                  <option value="">월</option>
                  {monthList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="personal-method-select"
                  value={birthDay}
                  onChange={e => setBirthDay(e.target.value)}
                >
                  <option value="">일</option>
                  {dayList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* 반자동 input UI below buttons, centered */}
        {selectedMethod === 'semi' && (
          <div className="flex flex-col gap-4 mb-6 w-full items-center justify-center">
            <div className="number-balls-row" style={{ gap: '0.5rem', marginBottom: 0, justifyContent: 'center' }}>
              {lockedNumbers.map((val, idx) => (
                <input
                  key={idx}
                  type="number"
                  min={1}
                  max={45}
                  value={val}
                  onChange={e => {
                    const v = e.target.value;
                    const n: number | '' = v === '' ? '' : Math.max(1, Math.min(45, Number(v)));
                    // Prevent duplicates
                    if (n !== '' && lockedNumbers.some((num, i) => i !== idx && num === n)) return;
                    const next: (number | '')[] = [...lockedNumbers];
                    next[idx] = n;
                    setLockedNumbers(next);
                  }}
                  placeholder={(idx + 1).toString()}
                  style={{
                    width: '4.5rem',
                    height: '4.5rem',
                    borderRadius: '1.2rem',
                    border: '2.5px solid #b3c1d1',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '2.2rem',
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#222',
                    boxShadow: '0 1px 4px rgba(0,100,255,0.04)',
                    marginRight: idx < 5 ? '0.1rem' : 0,
                    marginLeft: idx > 0 ? '0.1rem' : 0,
                    transition: 'border 0.15s',
                  }}
                  maxLength={2}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLockedNumbers(['', '', '', '', '', ''])}
              style={{
                fontSize: '1.1rem',
                color: '#888',
                background: 'none',
                border: 'none',
                borderBottom: '1.5px solid #bbb',
                padding: '0 0.7rem',
                cursor: 'pointer',
                height: '2.2rem',
                lineHeight: 1.2,
                display: 'inline-block',
                verticalAlign: 'middle',
                outline: 'none',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              tabIndex={0}
            >
              clear
            </button>
          </div>
        )}

        {/* SmartBlend Panel */}
        {selectedMethod === 'smartblend' && (
          <SmartBlendPanel
            riskLevel={riskLevel}
            setRiskLevel={setRiskLevel}
            isGenerating={isGenerating}
            progressPhase={progressPhase}
            progressPercent={progressPercent}
          />
        )}
        <div className="flex gap-2 w-full max-w-xs mb-8" style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
          {selectedMethod === 'smartblend' ? (
            // SmartBlend-specific buttons
            <>
              <button
                className="btn-primary flex-1"
                style={{ marginRight: '0.7rem' }}
                onClick={handleGenerate}
                disabled={isGenerateDisabled || isGenerating}
              >
                <span role="img" aria-label="dice">🎲</span> 5개 번호 생성하기
              </button>
              {smartBlendResults.length > 0 && (
                <button
                  onClick={() => {
                    smartBlendResults.forEach(result => {
                      handleSaveTicket(result.ticket, 'smartblend');
                    });
                  }}
                  className="btn-secondary flex-1"
                  style={{ marginLeft: '0.7rem' }}
                  aria-label="5개 조합 모두 저장"
                >
                  <span role="img" aria-label="save">💾</span> 5개 조합 모두 저장
                </button>
              )}
            </>
          ) : (
            // Regular buttons for other methods
            <>
              <button
                className="btn-primary flex-1"
                style={{ marginRight: '0.7rem' }}
                onClick={handleGenerate}
                disabled={isGenerateDisabled || (selectedMethod === 'smartblend' && isGenerating)}
              >
                <span role="img" aria-label="dice">🎲</span> 번호 생성하기
              </button>
              <button
                className="btn-secondary flex-1"
                style={{ marginLeft: '0.7rem' }}
                onClick={() => {
                  if (currentTicketNumbers.length > 0) {
                    handleSaveTicket(currentTicketNumbers);
                  }
                }}
                disabled={currentTicketNumbers.length === 0}
              >
                <span role="img" aria-label="save">💾</span> 번호 저장하기
              </button>
            </>
          )}
        </div>
      </section>

      {/* SmartBlend Results - Below main generator card */}
      {selectedMethod === 'smartblend' && smartBlendResults.length > 0 && (
        <section
          className="card-generator flex flex-col border border-primary/20"
          style={{
            margin: '0 auto',
            zIndex: 2,
            width: '100%',
            maxWidth: '1280px',
            minWidth: 0,
            padding: '2.5rem',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            borderWidth: 4,
            borderRadius: '2.5rem',
            boxShadow: '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)',
            background: '#fff',
            minHeight: '350px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 16px 56px rgba(0,100,255,0.15), 0 4px 16px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)';
          }}>
            <h2 className="heading-md mb-4 text-center w-full">
              <span role="img" aria-label="sparkles">✨</span> AI 추첨기 추천 조합
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ width: '100%' }}>
              {smartBlendResults.map((result, index) => (
                <div key={index} className="relative">
                  <div className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                    index === highlightedIndex 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`} onClick={() => handleTicketSelect(index)}>
                    {/* Single horizontal row: sub-heading | numbers | save button */}
                    <div className="smartblend-row" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: '0.5rem'
                    }}>
                      {/* Left: Sub-heading */}
                      <div className="flex-shrink-0" style={{ minWidth: '80px', textAlign: 'left' }}>
                        <h3 className={`font-semibold ${
                          index === highlightedIndex ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          추천 {index + 1}
                        </h3>
                      </div>
                      
                      {/* Middle: Number balls */}
                      <div className="flex-1" style={{ 
                        display: 'flex', 
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.35rem',
                        margin: '0 1rem'
                      }}>
                        {result.ticket.map((num) => (
                          <NumberBall 
                            key={num} 
                            number={num} 
                            variant="main" 
                            className="w-8 h-8 text-sm"
                          />
                        ))}
                      </div>
                      
                      {/* Right: Save button */}
                      <div className="flex-shrink-0" style={{ minWidth: '80px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveTicket(result.ticket);
                          }}
                          className="text-xs px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          aria-label="번호 저장"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </section>
      )}

      {/* Centered historicals card at the bottom */}
      <div className="two-col-row max-w-5xl mx-auto mt-2 mb-8" style={{ gap: '1.5rem', maxWidth: '1280px', width: '100%' }}>
        {/* Left: Historical search card, content centered */}
        <div className="card-generator two-col-card flex flex-col justify-center" style={{ borderWidth: 4, borderRadius: '2.5rem', boxShadow: '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)', background: '#fff', padding: '2.5rem', minHeight: '350px' }}>
          <h2 className="heading-md mb-4 text-center w-full">Old Historical Numbers</h2>
          <div className="mb-6" style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
              <input
                ref={inputRef}
                className="search-input"
                placeholder="회차 번호 입력 또는 선택"
                value={searchRound}
                onChange={e => { setSearchRound(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onClick={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                style={{ width: '200px', height: '2.5rem', fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}
                autoComplete="off"
              />
              {showDropdown && filteredRounds.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: '2.7rem',
                    left: 0,
                    width: '200px',
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 10,
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredRounds.slice(0, 15).map(draw => (
                    <div
                      key={draw.round}
                      style={{
                        padding: '0.45rem 1rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        color: '#222',
                        borderBottom: '1px solid #f1f5f9',
                        background: searchRound == draw.round.toString() ? '#e0e7ff' : 'transparent',
                        fontWeight: searchRound == draw.round.toString() ? 600 : 400,
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        setSearchRound(draw.round.toString());
                        setShowDropdown(false);
                        setTimeout(handleSearch, 0);
                      }}
                    >
                      {draw.round}회차 ({draw.date})
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-icon" aria-label="검색" onClick={handleSearch} style={{ height: '2.5rem', width: '2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0, verticalAlign: 'middle', border: 'none', background: 'none' }}>
                <svg width="20" height="20" fill="none" stroke="#0064FF" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
              <button
                type="button"
                onClick={() => { setSearchRound(""); setFiltered(null); setShowDropdown(false); }}
                style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.95rem',
                  color: '#888',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #bbb',
                  padding: '0 0.4rem',
                  cursor: 'pointer',
                  height: '1.8rem',
                  lineHeight: 1.2,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  outline: 'none',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                className="search-clear-btn"
                tabIndex={0}
              >
                clear
              </button>
            </div>
          </div>
          <section className="w-full max-w-md bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center" style={{ alignItems: 'center', textAlign: 'center', minHeight: '220px', borderRadius: '1.5rem', padding: '1.2rem 0.7rem', margin: '0 auto' }}>
            {filtered ? (
              (() => {
                // Find index of selected round in sorted history (descending)
                const sortedHistory = history.slice().sort((a, b) => b.round - a.round);
                const idx = sortedHistory.findIndex(d => d.round === filtered.round);
                // Get one future (more recent) and one previous (older) draw
                const future = sortedHistory[idx - 1];
                const previous = sortedHistory[idx + 1];
                // Helper to render a row
                const renderDraw = (draw: LottoHistoryDraw, highlight = false) => {
                  if (!draw) return (
                    <div style={{ height: '3.2rem', margin: '0.2rem 0' }} />
                  );
                  return (
                    <div
                      className={`flex flex-col items-center w-full ${highlight ? 'historical-selected-row' : ''}`}
                      style={highlight ? { background: '#e0f2ff', borderRadius: '0.8rem', border: '2px solid #38bdf8', boxShadow: '0 2px 12px #38bdf822', padding: '0.4rem 0.3rem', margin: '0.2rem 0' } : { margin: '0.2rem 0' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <div className={highlight ? 'text-blue-700 font-bold' : 'text-xs text-gray-500'} style={{ fontWeight: highlight ? 700 : 500, fontSize: highlight ? '1.05rem' : '0.95rem', marginBottom: '0.1rem', lineHeight: 1.1, textAlign: 'center' }}>
                          {draw.round}회차 | {draw.date}
                        </div>
                        <div className="number-balls-row flex-nowrap justify-center" style={{ marginBottom: 0, gap: '0.18rem', justifyContent: 'center' }}>
                          {draw.numbers.map((n: number) => (
                            <NumberBall key={n} number={n} variant="main" />
                          ))}
                          <NumberBall number={draw.bonus} variant="bonus" />
                        </div>
                      </div>
                    </div>
                  );
                };
                return (
                  <div style={{ width: '100%' }}>
                    {/* One future (more recent) round on top */}
                    {renderDraw(future, false)}
                    {/* Selected round, highlighted */}
                    {renderDraw(filtered, true)}
                    {/* One previous (older) round below */}
                    {renderDraw(previous, false)}
                  </div>
                );
              })()
            ) : (
              <span className="text-gray-400">회차를 선택하거나 입력하세요.</span>
            )}
          </section>
        </div>
        {/* Right: Placeholder card for future content */}
        <div className="card-generator two-col-card" style={{ borderWidth: 4, borderRadius: '2.5rem', boxShadow: '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)', background: '#fff', padding: '2.5rem', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
          <h2 className="heading-md mb-4 text-center w-full">저장한 번호</h2>
          {savedCombos.length === 0 ? (
            <span className="text-gray-300 mt-8">아직 저장된 번호가 없습니다.</span>
          ) : (
            <div style={{ width: '100%', maxHeight: '270px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                              {savedCombos.map((combo) => {
                // Use the selected historical round (filtered) instead of latest
                const selectedDraw = filtered || (history.length > 0 ? history.reduce((a, b) => (a.round > b.round ? a : b)) : null);
                const rank = getLottoRank({ numbers: combo.numbers }, selectedDraw);

                return (
                  <div key={combo.id || combo.saved_at + '-' + combo.numbers.join('-')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', padding: '0.2rem 0.1rem', borderBottom: '1px solid #f1f5f9', minHeight: '2.6rem' }}>
                    {/* Rank on the left */}
                    <span className="text-xs text-gray-500" style={{ minWidth: 80, fontWeight: 600 }}>{rank}</span>
                    
                    {/* Number balls in the middle */}
                    <div className="flex-nowrap flex-1" style={{ display: 'flex', flexDirection: 'row', fontSize: '1.15rem', gap: '0.35rem', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', margin: '0 1rem' }}>
                      {combo.numbers.map((n: number, i: number) => {
                        const mainSet = selectedDraw ? new Set(selectedDraw.numbers) : new Set<number>();
                        const bonus = selectedDraw ? selectedDraw.bonus : null;
                        const isMatch = mainSet.has(n);
                        const isBonus = bonus === n;
                        let ballClass = '';
                        if (isMatch) ballClass = '';
                        else if (isBonus) ballClass = '';
                        else ballClass = 'lotto-miss-ball';
                        return (
                          <NumberBall key={n + '-' + i} number={n} variant={isBonus ? 'bonus' : 'main'} className={ballClass} />
                        );
                      })}
                    </div>
                    
                                        {/* Action buttons on the right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 120 }}>
                      {/* Magnifying glass icon */}
                      <button
                        onClick={() => {
                          setSelectedComboForBacktest({ numbers: combo.numbers, savedAt: combo.saved_at });
                          setShowBacktestModal(true);
                        }}
                        style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '0.4rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                          minWidth: '32px',
                          minHeight: '32px',
                        }}
                        aria-label="백테스트 결과 보기"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (combo.id) {
                          removeSavedCombo(combo.id);
                        }
                        }}
                        style={{
                          fontSize: '0.85rem',
                          color: '#ef4444',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          display: 'inline-block',
                          outline: 'none',
                          transition: 'all 0.15s',
                          fontWeight: '500',
                          minHeight: '32px',
                        }}
                        aria-label="삭제"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                          e.currentTarget.style.borderColor = '#fecaca';
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Backtest Modal */}
    {showBacktestModal && selectedComboForBacktest && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setShowBacktestModal(false)}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            padding: '3.5rem',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowBacktestModal(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              fontSize: '1.8rem',
              cursor: 'pointer',
              color: '#6b7280',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              fontWeight: '300'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
            aria-label="닫기"
          >
            ×
          </button>

          {/* Modal content */}
          <div style={{ textAlign: 'center' }}>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              <span role="img" aria-label="chart">📊</span> 백테스트 결과
            </h2>
            
            {/* Selected combination */}
            <div className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-base font-semibold text-blue-700 mb-4">분석 대상 번호</h3>
              <div className="flex justify-center gap-3" style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {selectedComboForBacktest.numbers.map((num, i) => (
                  <NumberBall 
                    key={i} 
                    number={num} 
                    variant="main" 
                    className="w-12 h-12 text-lg"
                  />
                ))}
              </div>
            </div>

            {/* Backtest results */}
            {(() => {
              const results = getBacktestResults(selectedComboForBacktest!);
              return (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-8">
                    전체 {results.total}회차 분석 결과
                  </h3>
                  
                  <div className="mb-12 rounded-xl border border-gray-200 shadow-sm" style={{ textAlign: 'center', width: '100%', margin: '0 auto' }}>
                    <table className="w-full" style={{ margin: '0 auto', borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{
                          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                          color: 'white'
                        }}>
                          <th className="px-16 py-10 text-center font-semibold" style={{ borderBottom: '2px solid #1e40af', width: '25%' }}>등수</th>
                          <th className="px-16 py-10 text-center font-semibold" style={{ borderBottom: '2px solid #1e40af', width: '40%' }}>회수</th>
                          <th className="px-16 py-10 text-center font-semibold" style={{ borderBottom: '2px solid #1e40af', width: '35%' }}>비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(['1등', '2등', '3등', '4등', '5등'] as const).map((rank, index) => (
                          <tr key={rank} className={`${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-blue-50 transition-colors`} style={{ borderBottom: '1px solid #dbeafe' }}>
                            <td className="px-16 py-10 text-center" style={{ borderRight: '1px solid #dbeafe', width: '25%' }}>
                              <span className={`font-semibold ${
                                rank === '1등' ? 'text-yellow-600' :
                                rank === '2등' ? 'text-gray-600' :
                                rank === '3등' ? 'text-orange-600' :
                                rank === '4등' ? 'text-blue-600' :
                                'text-green-600'
                              }`}>
                                {rank}
                              </span>
                            </td>
                            <td className="px-16 py-10 text-center" style={{ borderRight: '1px solid #dbeafe', width: '40%' }}>
                              <span className="text-4xl font-bold text-blue-600">{results[rank]}</span>
                              <span className="text-lg text-gray-500 ml-3">회</span>
                            </td>
                            <td className="px-16 py-10 text-center" style={{ width: '35%' }}>
                              <span className="text-2xl font-semibold text-gray-700">
                                {((results[rank] / results.total) * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-6 text-xl text-center">📈 성과 요약</h4>
                    <div className="rounded-xl border border-blue-200 shadow-sm" style={{ textAlign: 'center', width: '100%', margin: '0 auto' }}>
                      <table className="w-full" style={{ margin: '0 auto', borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                        <thead>
                          <tr style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                            color: 'white'
                          }}>
                            <th className="px-16 py-10 text-center font-semibold" style={{ borderBottom: '2px solid #1e40af', width: '50%' }}>지표</th>
                            <th className="px-16 py-10 text-center font-semibold" style={{ borderBottom: '2px solid #1e40af', width: '50%' }}>수치</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #dbeafe' }}>
                            <td className="px-16 py-10 text-center font-semibold text-gray-700" style={{ borderRight: '1px solid #dbeafe', width: '50%' }}>총 당첨 횟수</td>
                            <td className="px-16 py-10 text-center" style={{ width: '50%' }}>
                              <span className="text-4xl font-bold text-blue-600">
                                {results['1등'] + results['2등'] + results['3등'] + results['4등'] + results['5등']}
                              </span>
                              <span className="text-lg text-gray-500 ml-3">회</span>
                            </td>
                          </tr>
                          <tr className="bg-gray-50 hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #dbeafe' }}>
                            <td className="px-16 py-10 text-center font-semibold text-gray-700" style={{ borderRight: '1px solid #dbeafe', width: '50%' }}>전체 당첨률</td>
                            <td className="px-16 py-10 text-center" style={{ width: '50%' }}>
                              <span className="text-4xl font-bold text-blue-600">
                                {(((results['1등'] + results['2등'] + results['3등'] + results['4등'] + results['5등']) / results.total) * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                          <tr className="bg-white hover:bg-blue-50 transition-colors">
                            <td className="px-16 py-10 text-center font-semibold text-gray-700" style={{ borderRight: '1px solid #dbeafe', width: '50%' }}>최다 당첨 등수</td>
                            <td className="px-16 py-10 text-center" style={{ width: '50%' }}>
                              <span className="text-4xl font-bold text-blue-600">
                                {['1등', '2등', '3등', '4등', '5등'].reduce((max, rank) => 
                                  results[rank as keyof typeof results] > results[max as keyof typeof results] ? rank : max
                                )}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* Auth Modal */}
    <AuthModal />
  </>
  );
}
