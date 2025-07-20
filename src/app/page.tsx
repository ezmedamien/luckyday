"use client";
import { useState, useEffect, useRef } from "react";
import NumberBall from '@/components/ui/NumberBall';

interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

const ballColors = [
  "bg-blue-500 text-white",
  "bg-green-500 text-white",
  "bg-yellow-400 text-gray-900",
  "bg-red-500 text-white",
  "bg-purple-500 text-white",
  "bg-pink-500 text-white",
  "bg-orange-400 text-white",
  "bg-teal-500 text-white",
  "bg-indigo-500 text-white",
  "bg-lime-400 text-gray-900",
];

export default function Home() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<LottoHistoryDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchRound, setSearchRound] = useState("");
  const [filtered, setFiltered] = useState<LottoHistoryDraw | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [savedCombos, setSavedCombos] = useState<{numbers: number[], savedAt: Date}[]>([]);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lockedNumbers, setLockedNumbers] = useState<(number | '')[]>(['', '', '', '', '', '']);

  // Fetch lotto history on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/lotto")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.draws);
        setLoading(false);
      })
      .catch(() => {
        setError("로또 데이터를 불러올 수 없습니다.");
        setLoading(false);
      });
  }, []);

  // Search handler
  const handleSearch = () => {
    if (!searchRound) {
      setFiltered(null);
      return;
    }
    const result = history.find((d) => d.round === Number(searchRound));
    setFiltered(result || null);
  };

  // Allow Enter key to trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Zodiac and birthday options
  const zodiacList = [
    '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'
  ];
  const yearList = Array.from({ length: 100 }, (_, i) => 2025 - i); // 1925~2025
  const [zodiac, setZodiac] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Personalized method state
  const [personalType, setPersonalType] = useState<'zodiac' | 'birthdate'>('zodiac');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const monthList = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayList = Array.from({ length: 31 }, (_, i) => i + 1);

  // Add personalized method to generatorMethods
  const generatorMethods = [
    {
      id: 'random',
      label: '랜덤',
      description: '1~45 중 6개를 무작위로 선택합니다.'
    },
    {
      id: 'frequency',
      label: '빈도 가중',
      description: '최근 100회차에서 자주 나온 번호일수록 더 잘 뽑힙니다.'
    },
    {
      id: 'hotcold',
      label: '핫-콜드 밸런스',
      description: '최근 100회차에서 가장 많이/적게 나온 번호 3개씩 조합.'
    },
    {
      id: 'sumrange',
      label: '합계 범위',
      description: '6개 합이 100~170 사이가 될 때까지 생성합니다.'
    },
    {
      id: 'cooccur',
      label: '동시출현',
      description: '최근 100회차에서 자주 같이 나온 2~3개 번호로 시작.'
    },
    {
      id: 'personal',
      label: '오늘의 맞춤번호',
      description: '띠 또는 생년월일로 오늘의 고정된 행운 번호를 생성합니다.'
    },
    {
      id: 'semi',
      label: '반자동',
      description: '직접 고른 번호와 나머지는 랜덤으로 조합합니다.'
    },
  ];
  const [selectedMethod, setSelectedMethod] = useState('random');

  // Helper: get last 100 draws
  const last100 = history.slice(-100);

  // Generator functions
  function generateRandom() {
    const nums = new Set<number>();
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

  function generateFrequency() {
    // Count frequency
    const freq = Array(46).fill(0);
    last100.forEach(draw => {
      draw.numbers.forEach(n => freq[n]++);
    });
    // Weighted random
    const pool: number[] = [];
    for (let n = 1; n <= 45; n++) {
      for (let i = 0; i < freq[n]; i++) pool.push(n);
    }
    const nums = new Set<number>();
    while (nums.size < 6 && pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      nums.add(pick);
    }
    // Fallback to random if not enough
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

  function generateHotCold() {
    // Count frequency
    const freq = Array(46).fill(0);
    last100.forEach(draw => {
      draw.numbers.forEach(n => freq[n]++);
    });
    // Find 3 hottest and 3 coldest from the original array
    const numsWithFreq = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, f: freq[i + 1] }));
    // Copy and sort for hot/cold selection
    const hot = [...numsWithFreq].sort((a, b) => b.f - a.f).slice(0, 3).map(x => x.n);
    const cold = [...numsWithFreq].sort((a, b) => a.f - b.f).slice(0, 3).map(x => x.n);
    const combo = [...hot, ...cold];
    // Shuffle
    for (let i = combo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combo[i], combo[j]] = [combo[j], combo[i]];
    }
    return combo;
  }

  function generateSumRange() {
    for (let tries = 0; tries < 50; tries++) {
      const nums = generateRandom();
      const sum = nums.reduce((a, b) => a + b, 0);
      if (sum >= 100 && sum <= 170) return nums;
    }
    return generateRandom();
  }

  function generateCooccur() {
    // Count all pairs
    const pairCount: Record<string, number> = {};
    last100.forEach(draw => {
      const nums = draw.numbers;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
          pairCount[key] = (pairCount[key] || 0) + 1;
        }
      }
    });
    // Find top pair
    const sortedPairs = Object.entries(pairCount) as [string, number][];
    const topPair: number[] = sortedPairs.length > 0 ? sortedPairs.sort((a, b) => b[1] - a[1])[0][0].split('-').map(Number) : [];
    // Fill rest randomly
    const nums = new Set<number>(topPair);
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

  // Seeded random for zodiac/birthday (same result for same input per day)
  function seededRandom(seed: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 100000) / 100000;
    };
  }

  function generatePersonalized() {
    let seed = '';
    if (personalType === 'zodiac' && zodiac) {
      const now = new Date();
      const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const dateStr = kst.toISOString().slice(0, 10);
      seed = `zodiac-${zodiac}-${dateStr}`;
    } else if (personalType === 'birthdate' && birthYear && birthMonth && birthDay) {
      const now = new Date();
      const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const dateStr = kst.toISOString().slice(0, 10);
      seed = `birthdate-${birthYear}-${birthMonth}-${birthDay}-${dateStr}`;
    }
    if (!seed) return [];
    const rand = seededRandom(seed);
    const nums = new Set<number>();
    while (nums.size < 6) {
      nums.add(Math.floor(rand() * 45) + 1);
    }
    return Array.from(nums).sort((a, b) => a - b);
  }

  // Main generator switch
  function handleGenerate() {
    if (selectedMethod === 'semi') {
      // 반자동: Fill in locked numbers, generate the rest randomly
      let locked = lockedNumbers.map(v => (v === '' ? '' : Number(v)));
      let used = new Set<number>(locked.filter(n => n !== '') as number[]);
      let fillCount = locked.filter(n => n === '').length;
      let generated: number[] = [];
      function fillWithNoDupes() {
        let pool = generateRandom().filter(n => !used.has(n));
        let idx = 0;
        while (generated.length < fillCount && idx < pool.length) {
          if (!used.has(pool[idx])) {
            generated.push(pool[idx]);
            used.add(pool[idx]);
          }
          idx++;
        }
        while (generated.length < fillCount) {
          let n = Math.floor(Math.random() * 45) + 1;
          if (!used.has(n)) {
            generated.push(n);
            used.add(n);
          }
        }
      }
      fillWithNoDupes();
      let result: number[] = [];
      let genIdx = 0;
      for (let i = 0; i < 6; i++) {
        if (locked[i] !== '') result.push(Number(locked[i]));
        else result.push(generated[genIdx++]);
      }
      setNumbers(result);
    } else {
      // Other methods: ignore lockedNumbers
      let result: number[] = [];
      if (selectedMethod === 'random') result = generateRandom();
      else if (selectedMethod === 'frequency') result = generateFrequency();
      else if (selectedMethod === 'hotcold') result = generateHotCold();
      else if (selectedMethod === 'sumrange') result = generateSumRange();
      else if (selectedMethod === 'cooccur') result = generateCooccur();
      else if (selectedMethod === 'personal') result = generatePersonalized();
      setNumbers(result);
    }
  }

  // Helper for number ball color class
  function getBallColorClass(n: number, isBonus = false, isHit = false) {
    if (isHit) return 'number-ball-hit';
    if (isBonus) return 'number-ball-bonus';
    return 'number-ball-main';
  }

  // Pick the latest draw (highest round number)
  const latestDraw = history.length > 0 ? history.reduce((a, b) => (a.round > b.round ? a : b)) : null;

  // Get all available rounds for dropdown (sorted descending)
  const availableRounds = history.map(d => d.round).sort((a, b) => b - a);

  // Filtered rounds for dropdown
  const filteredRounds = searchRound
    ? history.filter(d => d.round.toString().includes(searchRound)).sort((a, b) => b.round - a.round)
    : history.slice().sort((a, b) => b.round - a.round);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(event.target) &&
        inputRef.current &&
        !(inputRef.current as any).contains(event.target)
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

  // Official Korean lottery color scheme for balls
  function getLottoBallColor(n: number) {
    if (n >= 1 && n <= 10) return 'bg-[#fbc400] text-gray-900 border-yellow-300';
    if (n >= 11 && n <= 20) return 'bg-[#69c8f2] text-white border-blue-200';
    if (n >= 21 && n <= 30) return 'bg-[#ff7272] text-white border-red-200';
    if (n >= 31 && n <= 40) return 'bg-[#aaa] text-white border-gray-300';
    if (n >= 41 && n <= 45) return 'bg-[#b0d840] text-white border-green-200';
    return 'bg-gray-200 text-gray-700 border-gray-300';
  }

  // Unified, extra-large ball size class
  const ballClass = "w-20 h-20 flex items-center justify-center rounded-full font-extrabold text-3xl leading-none shadow-xl border-4";
  const mainBallClass = `${ballClass} border-yellow-400 shadow-2xl ring-2 ring-yellow-200`;

  // SVG mascot (simple smiling lotto ball)
  const Mascot = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#3583FF"/>
      <ellipse cx="20" cy="28" rx="8" ry="4" fill="#fff"/>
      <circle cx="14" cy="17" r="2" fill="#fff"/>
      <circle cx="26" cy="17" r="2" fill="#fff"/>
      <path d="M15 23c1.5 2 8.5 2 10 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  function getLottoRank(combo: { numbers: number[], savedAt: Date }, latestDraw: LottoHistoryDraw | null) {
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

  return (
    <div className="container-center" style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
      {/* Page Banner with mascot, title, subtitle, and SVG wave */}
      <div style={{ background: '#fff', width: '100vw', position: 'relative', zIndex: 10, marginBottom: 0, paddingBottom: 0 }}>
        <div className="page-banner section-spacing" style={{ background: 'var(--primary)', marginBottom: 0, paddingBottom: '2.5rem', paddingTop: '2.5rem', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <div className="flex flex-col items-center gap-4 mb-2">
            {/* <Mascot /> */}
            <div>
              <div className="banner-title">LuckyDay</div>
              <div className="banner-subtitle">AI 로또 번호 생성기</div>
            </div>
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
                  {latestDraw.numbers.map((n, i) => (
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
        className="main-generator-card card-generator flex flex-col items-center border border-primary/20"
        style={{
          margin: '0 auto',
          zIndex: 2,
          width: '100%',
          maxWidth: '1280px',
          minWidth: 0,
          padding: '1.5rem 1rem',
          boxSizing: 'border-box',
        }}
      >
        <h2 className="generator-title flex items-center gap-2" style={{ fontSize: '2rem' }}>
          <span role="img" aria-label="sparkles">✨</span> 오늘의 행운 번호
        </h2>
        {numbers.length > 0 ? (
          <div
            className="number-balls-row mt-8 mb-8 justify-center flex-nowrap items-center"
            style={{
              fontSize: '3.2rem',
              minHeight: '4.5rem',
              marginBottom: '2.2rem',
              marginTop: selectedMethod === 'semi' ? 0 : '1.2rem',
            }}
          >
            {numbers.map((n, i) => (
              <NumberBall key={n} number={n} variant="main" className={selectedMethod === 'semi' && lockedNumbers[i] === n ? 'locked-ball number-ball-lg' : 'number-ball-lg'} />
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
                onClick={e => {
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
                    let v = e.target.value;
                    let n: number | '' = v === '' ? '' : Math.max(1, Math.min(45, Number(v)));
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
        <div className="flex gap-2 w-full max-w-xs mb-8" style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
          <button
            className="btn-primary flex-1"
            style={{ marginRight: '0.7rem' }}
            onClick={handleGenerate}
            disabled={selectedMethod === 'personal' && (
              (personalType === 'zodiac' && !zodiac) ||
              (personalType === 'birthdate' && (!birthYear || !birthMonth || !birthDay))
            )}
          >
            <span role="img" aria-label="dice">🎲</span> 번호 생성하기
          </button>
          <button
            className="btn-secondary flex-1"
            style={{ marginLeft: '0.7rem' }}
            onClick={() => {
              if (numbers.length > 0) {
                setSavedCombos([{ numbers, savedAt: new Date() }, ...savedCombos]);
              }
            }}
            disabled={numbers.length === 0}
          >
            <span role="img" aria-label="save">💾</span> 번호 저장하기
          </button>
        </div>
      </section>

      {/* Centered historicals card at the bottom */}
      <div className="two-col-row max-w-5xl mx-auto mt-2 mb-8" style={{ gap: '1.5rem', maxWidth: '1280px', width: '100%' }}>
        {/* Left: Historical search card, content centered */}
        <div className="card-generator two-col-card flex flex-col items-center justify-center" style={{ borderWidth: 4, borderRadius: '2.5rem', boxShadow: '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)', background: '#fff', paddingLeft: '2.5rem', paddingRight: '2.5rem', minHeight: '350px' }}>
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
        <div className="card-generator two-col-card" style={{ borderWidth: 4, borderRadius: '2.5rem', boxShadow: '0 12px 48px rgba(0,100,255,0.12), 0 2px 12px rgba(0,0,0,0.06)', background: '#fff', paddingLeft: '2.5rem', paddingRight: '2.5rem', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <h2 className="heading-md mb-4 text-center w-full">저장한 번호</h2>
          {savedCombos.length === 0 ? (
            <span className="text-gray-300 mt-8">아직 저장된 번호가 없습니다.</span>
          ) : (
            <div style={{ width: '100%', maxHeight: '270px', overflowY: 'auto' }}>
              {savedCombos.map((combo, idx) => {
                const latest = history.length > 0 ? history.reduce((a, b) => (a.round > b.round ? a : b)) : null;
                const mainSet = latest ? new Set(latest.numbers) : new Set<number>();
                const bonus = latest ? latest.bonus : null;
                const rank = getLottoRank(combo, latest);
                return (
                  <div key={combo.savedAt.getTime() + '-' + combo.numbers.join('-')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', padding: '0.2rem 0.1rem', borderBottom: '1px solid #f1f5f9', minHeight: '2.6rem' }}>
                    <div className="number-balls-row flex-nowrap" style={{ fontSize: '1.15rem', gap: '0.18rem', flexWrap: 'nowrap' }}>
                      {combo.numbers.map((n: number, i: number) => {
                        let isMatch = mainSet.has(n);
                        let isBonus = bonus === n;
                        let ballClass = '';
                        if (isMatch) ballClass = '';
                        else if (isBonus) ballClass = '';
                        else ballClass = 'lotto-miss-ball';
                        return (
                          <NumberBall key={n + '-' + i} number={n} variant={isBonus ? 'bonus' : 'main'} className={ballClass} />
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-500 ml-2" style={{ minWidth: 36, fontWeight: 600 }}>{rank}</span>
                    <button
                      onClick={() => {
                        setSavedCombos(savedCombos.filter((_, i) => i !== idx));
                      }}
                      style={{
                        marginLeft: '0.7rem',
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
                      aria-label="삭제"
                    >
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
