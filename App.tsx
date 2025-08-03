import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  StatusBar,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';

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

interface SavedCombo {
  numbers: number[];
  savedAt: Date;
}

const { width } = Dimensions.get('window');

// Constants matching web version
const ZODIAC_LIST = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const YEAR_LIST = Array.from({ length: 50 }, (_, i) => (2024 - i).toString());
const MONTH_LIST = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const DAY_LIST = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

export default function App() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [history, setHistory] = useState<LottoHistoryDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('random');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMethod, setTooltipMethod] = useState('');
  const [searchRound, setSearchRound] = useState('');
  const [filtered, setFiltered] = useState<LottoHistoryDraw | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lockedNumbers, setLockedNumbers] = useState<(number | '')[]>(['', '', '', '', '', '']);
  const [personalType, setPersonalType] = useState<'zodiac' | 'birthdate'>('zodiac');
  const [zodiac, setZodiac] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  // SmartBlend state
  const [riskLevel, setRiskLevel] = useState<number>(1);
  const [smartBlendResults, setSmartBlendResults] = useState<SmartBlendResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPhase, setProgressPhase] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Backtest modal state
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [selectedComboForBacktest, setSelectedComboForBacktest] = useState<SavedCombo | null>(null);

  // Generator methods - updated to match web version
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
    {
      id: 'smartblend',
      label: 'AI 추첨기',
      description: 'AI가 분석한 최적의 조합을 5개 생성합니다.'
    },
  ];

  // Fetch lotto history from API
  useEffect(() => {
    setLoading(true);
    
    // Try different URLs for the API endpoint
    const apiUrls = [
      'https://luckyday-42vznxk88-ezmedamiens-projects.vercel.app/api/lotto', // Vercel production API
      'http://localhost:3000/api/lotto', // Local dev
      'http://172.29.96.241:3000/api/lotto', // Local network dev
      'http://10.0.2.2:3000/api/lotto', // Android emulator
      'http://127.0.0.1:3000/api/lotto', // Localhost fallback
    ];
    
    const tryFetch = async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ExpoApp'
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched data from:', url, data);
        setHistory(data.draws || []);
        setLoading(false);
        return true;
      } catch (error) {
        console.error('Failed to fetch from:', url, error);
        return false;
      }
    };
    
    // Try each URL until one works
    const attemptFetch = async () => {
      for (const url of apiUrls) {
        const success = await tryFetch(url);
        if (success) return;
      }
      
      // If all URLs fail, show error
      setError("로또 데이터를 불러올 수 없습니다. 서버가 실행 중인지 확인하세요.");
      setLoading(false);
    };
    
    attemptFetch();
  }, []);

  const [error, setError] = useState("");

  // Helper: get last 100 draws
  const last100 = history.slice(-100);

  // SmartBlend generation function
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
      
      // Generate SmartBlend results (simplified version for mobile)
      const results: SmartBlendResult[] = [];
      for (let i = 0; i < 5; i++) {
        const ticket = generateSmartBlendTicket(history, riskLevel);
        results.push({
          ticket,
          explain: `AI 추첨기 추천 조합 ${i + 1}`
        });
      }
      
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
  }, [riskLevel]);

  // SmartBlend ticket generation (simplified)
  const generateSmartBlendTicket = (history: LottoHistoryDraw[], riskLevel: number): number[] => {
    if (history.length === 0) {
      return generateRandom();
    }

    const freq = Array(46).fill(0);
    history.slice(-100).forEach(draw => {
      draw.numbers.forEach(n => freq[n]++);
    });

    // Different strategies based on risk level
    let pool: number[] = [];
    
    if (riskLevel === 0) { // Safe
      // Use most frequent numbers
      const sorted = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, f: freq[i + 1] }))
        .sort((a, b) => b.f - a.f)
        .slice(0, 20)
        .map(x => x.n);
      pool = sorted;
    } else if (riskLevel === 1) { // Balanced
      // Mix of frequent and random
      const frequent = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, f: freq[i + 1] }))
        .sort((a, b) => b.f - a.f)
        .slice(0, 15)
        .map(x => x.n);
      const random = Array.from({ length: 30 }, () => Math.floor(Math.random() * 45) + 1);
      pool = [...frequent, ...random];
    } else { // Aggressive
      // Use less frequent numbers
      const sorted = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, f: freq[i + 1] }))
        .sort((a, b) => a.f - b.f)
        .slice(0, 25)
        .map(x => x.n);
      pool = sorted;
    }

    const nums = new Set<number>();
    while (nums.size < 6 && pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      nums.add(pick);
    }
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  };

  // Generator functions
  function generateRandom() {
    const nums = new Set<number>();
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

  function generateFrequency() {
    const freq = Array(46).fill(0);
    last100.forEach(draw => {
      draw.numbers.forEach(n => freq[n]++);
    });
    const pool: number[] = [];
    for (let n = 1; n <= 45; n++) {
      for (let i = 0; i < freq[n]; i++) pool.push(n);
    }
    const nums = new Set<number>();
    while (nums.size < 6 && pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      nums.add(pick);
    }
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

  function generateHotCold() {
    const freq = Array(46).fill(0);
    last100.forEach(draw => {
      draw.numbers.forEach(n => freq[n]++);
    });
    
    // Create array of numbers with their frequencies
    const numsWithFreq = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, f: freq[i + 1] }));
    
    // Get 3 hottest and 3 coldest
    const hot = [...numsWithFreq].sort((a, b) => b.f - a.f).slice(0, 3).map(x => x.n);
    const cold = [...numsWithFreq].sort((a, b) => a.f - b.f).slice(0, 3).map(x => x.n);
    
    // Combine all 6 numbers and ensure no duplicates
    const allNumbers = [...hot, ...cold];
    const uniqueNumbers = [...new Set(allNumbers)];
    
    // If we have less than 6 unique numbers, fill with random numbers
    while (uniqueNumbers.length < 6) {
      const randomNum = Math.floor(Math.random() * 45) + 1;
      if (!uniqueNumbers.includes(randomNum)) {
        uniqueNumbers.push(randomNum);
      }
    }
    
    // Shuffle the final 6 numbers
    for (let i = uniqueNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueNumbers[i], uniqueNumbers[j]] = [uniqueNumbers[j], uniqueNumbers[i]];
    }
    
    return uniqueNumbers.slice(0, 6).sort((a, b) => a - b);
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
    const sortedPairs = Object.entries(pairCount) as [string, number][];
    const topPair: number[] = sortedPairs.length > 0 ? sortedPairs.sort((a, b) => b[1] - a[1])[0][0].split('-').map(Number) : [];
    const nums = new Set<number>(topPair);
    while (nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }

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

  const handleGenerate = useCallback(async () => {
    if (selectedMethod === 'smartblend') {
      await generateSmartBlend(history);
      if (smartBlendResults.length > 0) {
        setNumbers(smartBlendResults[highlightedIndex]?.ticket || []);
      }
      return;
    }

    let result: number[] = [];
    
    switch (selectedMethod) {
      case 'random':
        result = generateRandom();
        break;
      case 'frequency':
        result = generateFrequency();
        break;
      case 'hotcold':
        result = generateHotCold();
        break;
      case 'sumrange':
        result = generateSumRange();
        break;
      case 'cooccur':
        result = generateCooccur();
        break;
      case 'personal':
        result = generatePersonalized();
        break;
      case 'semi':
        result = generateSemiAutomatic();
        break;
      default:
        result = generateRandom();
    }
    
    setNumbers(result);
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

  function generateSemiAutomatic() {
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
    return result;
  }

  // Handle SmartBlend ticket selection
  const handleTicketSelect = useCallback((index: number) => {
    setHighlightedIndex(index);
    setNumbers(smartBlendResults[index]?.ticket || []);
  }, [smartBlendResults]);

  const saveCombo = () => {
    if (numbers.length === 6) {
      setSavedCombos([...savedCombos, { numbers: [...numbers], savedAt: new Date() }]);
    }
  };

  const deleteCombo = (index: number) => {
    setSavedCombos(savedCombos.filter((_, i) => i !== index));
  };

  const getBallColor = (num: number) => {
    if (num >= 1 && num <= 10) return '#fbc400';
    if (num >= 11 && num <= 20) return '#69c8f2';
    if (num >= 21 && num <= 30) return '#ff7272';
    if (num >= 31 && num <= 40) return '#aaa';
    if (num >= 41 && num <= 45) return '#b0d840';
    return '#ccc';
  };

  const getBallTextColor = (num: number) => {
    if (num >= 1 && num <= 10) return '#000';
    return '#fff';
  };

  const showTooltip = (method: string) => {
    setTooltipMethod(method);
    setTooltipVisible(true);
    setTimeout(() => setTooltipVisible(false), 3000);
  };

  const handleSearch = () => {
    if (!searchRound) {
      setFiltered(null);
      return;
    }
    const result = history.find((d) => d.round === Number(searchRound));
    setFiltered(result || null);
  };

  const latestDraw = history.length > 0 ? history.reduce((a, b) => (a.round > b.round ? a : b)) : null;

  const getLottoRank = (combo: SavedCombo, latestDraw: LottoHistoryDraw | null) => {
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
  };

  const getBacktestResults = (combo: SavedCombo) => {
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
  };

  // Get available rounds for dropdown (sorted descending)
  const availableRounds = history.map(d => d.round).sort((a, b) => b - a);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎰 LuckyDay</Text>
        <Text style={styles.subtitle}>AI 추첨기</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Generator Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>번호 생성기</Text>
          
          {/* Method Selection */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodScroll}>
            {generatorMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  selectedMethod === method.id && styles.methodButtonActive
                ]}
                onPress={() => setSelectedMethod(method.id)}
                onLongPress={() => showTooltip(method.id)}
              >
                <Text style={[
                  styles.methodButtonText,
                  selectedMethod === method.id && styles.methodButtonTextActive
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Method Description */}
          <Text style={styles.methodDescription}>
            {generatorMethods.find(m => m.id === selectedMethod)?.description}
          </Text>

          {/* SmartBlend Risk Level Selection */}
          {selectedMethod === 'smartblend' && (
            <View style={styles.smartBlendContainer}>
              <Text style={styles.smartBlendTitle}>전략 선택</Text>
              <View style={styles.riskButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.riskButton,
                    riskLevel === 0 && styles.riskButtonActive
                  ]}
                  onPress={() => setRiskLevel(0)}
                >
                  <Text style={styles.riskButtonText}>안심</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.riskButton,
                    riskLevel === 1 && styles.riskButtonActive
                  ]}
                  onPress={() => setRiskLevel(1)}
                >
                  <Text style={styles.riskButtonText}>균형</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.riskButton,
                    riskLevel === 2 && styles.riskButtonActive
                  ]}
                  onPress={() => setRiskLevel(2)}
                >
                  <Text style={styles.riskButtonText}>공격</Text>
                </TouchableOpacity>
              </View>
              
              {/* Progress for SmartBlend */}
              {isGenerating && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>{progressPhase}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
              )}
            </View>
          )}

          {/* Semi-auto inputs */}
          {selectedMethod === 'semi' && (
            <View style={styles.semiAutoContainer}>
              <Text style={styles.semiAutoTitle}>고정할 번호 입력:</Text>
              <View style={styles.semiAutoInputs}>
                {lockedNumbers.map((num, index) => (
                  <TextInput
                    key={index}
                    style={styles.semiAutoInput}
                    value={num === '' ? '' : num.toString()}
                    onChangeText={(text) => {
                      const newLocked = [...lockedNumbers];
                      newLocked[index] = text === '' ? '' : Number(text);
                      setLockedNumbers(newLocked);
                    }}
                    placeholder=""
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Personalized inputs */}
          {selectedMethod === 'personal' && (
            <View style={styles.personalContainer}>
              <View style={styles.personalTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.personalTypeButton,
                    personalType === 'zodiac' && styles.personalTypeButtonActive
                  ]}
                  onPress={() => setPersonalType('zodiac')}
                >
                  <Text style={styles.personalTypeButtonText}>띠</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.personalTypeButton,
                    personalType === 'birthdate' && styles.personalTypeButtonActive
                  ]}
                  onPress={() => setPersonalType('birthdate')}
                >
                  <Text style={styles.personalTypeButtonText}>생년월일</Text>
                </TouchableOpacity>
              </View>
              
              {personalType === 'zodiac' ? (
                <TextInput
                  style={styles.personalInput}
                  value={zodiac}
                  onChangeText={setZodiac}
                  placeholder="띠 입력 (쥐, 소, 호랑이...)"
                />
              ) : (
                <View style={styles.birthdateInputs}>
                  <TextInput
                    style={styles.birthdateInput}
                    value={birthYear}
                    onChangeText={setBirthYear}
                    placeholder="년도"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.birthdateInput}
                    value={birthMonth}
                    onChangeText={setBirthMonth}
                    placeholder="월"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.birthdateInput}
                    value={birthDay}
                    onChangeText={setBirthDay}
                    placeholder="일"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.generateButton} 
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              <Text style={styles.buttonText}>
                {selectedMethod === 'smartblend' ? '5개 번호 생성하기' : '번호 생성'}
              </Text>
            </TouchableOpacity>
            
            {numbers.length > 0 && (
              <TouchableOpacity style={styles.saveButton} onPress={saveCombo}>
                <Text style={styles.buttonText}>저장하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Generated Numbers */}
          <View style={styles.numbersContainer}>
            {numbers.map((num, index) => (
              <View key={index} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SmartBlend Results */}
        {selectedMethod === 'smartblend' && smartBlendResults.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ AI 추첨기 추천 조합</Text>
            {smartBlendResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.smartBlendResult,
                  highlightedIndex === index && styles.smartBlendResultActive
                ]}
                onPress={() => handleTicketSelect(index)}
              >
                <View style={styles.smartBlendResultHeader}>
                  <Text style={styles.smartBlendResultTitle}>추천 {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.smartBlendSaveButton}
                    onPress={() => {
                      setSavedCombos([...savedCombos, { numbers: result.ticket, savedAt: new Date() }]);
                    }}
                  >
                    <Text style={styles.smartBlendSaveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.numbersContainer}>
                  {result.ticket.map((num, numIndex) => (
                    <View key={numIndex} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                      <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Historical Search */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>역대 당첨 번호</Text>
          
          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={styles.searchInputContainer}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <TextInput
                style={styles.searchInput}
                value={searchRound}
                onChangeText={setSearchRound}
                placeholder="회차 검색"
                keyboardType="numeric"
                editable={false}
              />
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>

          {/* Dropdown */}
          {showDropdown && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                {availableRounds.slice(0, 20).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSearchRound(item.toString());
                      setShowDropdown(false);
                      const result = history.find((d) => d.round === item);
                      setFiltered(result || null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}회차</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {filtered && (
            <View style={styles.historicalResult}>
              <Text style={styles.historicalTitle}>
                {filtered.round}회차 ({filtered.date})
              </Text>
              <View style={styles.numbersContainer}>
                {filtered.numbers.map((num, index) => (
                  <View key={index} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                    <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.bonusText}>보너스: {filtered.bonus}</Text>
            </View>
          )}

          {latestDraw && !filtered && (
            <View style={styles.historicalResult}>
              <Text style={styles.historicalTitle}>
                최신 {latestDraw.round}회차 ({latestDraw.date})
              </Text>
              <View style={styles.numbersContainer}>
                {latestDraw.numbers.map((num, index) => (
                  <View key={index} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                    <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.bonusText}>보너스: {latestDraw.bonus}</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Saved Combos */}
        {savedCombos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>저장된 조합</Text>
            {savedCombos.map((combo, index) => {
              // Use the selected historical round (filtered) instead of latest
              const selectedDraw = filtered || latestDraw;
              const rank = getLottoRank(combo, selectedDraw);

              return (
                <View key={index} style={styles.savedCombo}>
                  <View style={styles.savedComboHeader}>
                    <Text style={styles.savedComboDate}>
                      {combo.savedAt.toLocaleDateString()}
                    </Text>
                    {rank && (
                      <View style={[
                        styles.rankBadge,
                        rank === '1등' && styles.rankBadge1st,
                        rank === '2등' && styles.rankBadge2nd,
                        rank === '3등' && styles.rankBadge3rd,
                        rank === '4등' && styles.rankBadge4th,
                        rank === '5등' && styles.rankBadge5th,
                        rank === '낙첨' && styles.rankBadgeFail
                      ]}>
                        <Text style={styles.rankText}>{rank}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.numbersContainer}>
                    {combo.numbers.map((num, numIndex) => (
                      <View key={numIndex} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                        <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.savedComboActions}>
                    <TouchableOpacity
                      style={styles.backtestButton}
                      onPress={() => {
                        setSelectedComboForBacktest(combo);
                        setShowBacktestModal(true);
                      }}
                    >
                      <Text style={styles.backtestButtonText}>백테스트</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => deleteCombo(index)}
                    >
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Tooltip Modal */}
        <Modal
          visible={tooltipVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.tooltipOverlay}>
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {generatorMethods.find(m => m.id === tooltipMethod)?.description}
              </Text>
            </View>
          </View>
        </Modal>

        {/* Backtest Modal */}
        <Modal
          visible={showBacktestModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.backtestModalOverlay}>
            <View style={styles.backtestModal}>
              <View style={styles.backtestModalHeader}>
                <Text style={styles.backtestModalTitle}>📊 백테스트 결과</Text>
                <TouchableOpacity
                  style={styles.backtestModalCloseButton}
                  onPress={() => setShowBacktestModal(false)}
                >
                  <Text style={styles.backtestModalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {selectedComboForBacktest && (
                <ScrollView style={styles.backtestModalContent}>
                  {/* Selected combination */}
                  <View style={styles.backtestSelectedCombo}>
                    <Text style={styles.backtestSelectedComboTitle}>분석 대상 번호</Text>
                    <View style={styles.numbersContainer}>
                      {selectedComboForBacktest.numbers.map((num, i) => (
                        <View key={i} style={[styles.ball, { backgroundColor: getBallColor(num) }]}>
                          <Text style={[styles.ballText, { color: getBallTextColor(num) }]}>{num}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Backtest results */}
                  {(() => {
                    const results = getBacktestResults(selectedComboForBacktest);
                    return (
                      <View>
                        <Text style={styles.backtestResultsTitle}>
                          전체 {results.total}회차 분석 결과
                        </Text>
                        
                        <View style={styles.backtestTable}>
                          <View style={styles.backtestTableHeader}>
                            <Text style={styles.backtestTableHeaderText}>등수</Text>
                            <Text style={styles.backtestTableHeaderText}>회수</Text>
                            <Text style={styles.backtestTableHeaderText}>비율</Text>
                          </View>
                          
                          {(['1등', '2등', '3등', '4등', '5등'] as const).map((rank, index) => (
                            <View key={rank} style={[
                              styles.backtestTableRow,
                              index % 2 === 0 && styles.backtestTableRowAlt
                            ]}>
                              <Text style={styles.backtestTableCell}>{rank}</Text>
                              <Text style={styles.backtestTableCell}>{results[rank]}회</Text>
                              <Text style={styles.backtestTableCell}>
                                {((results[rank] / results.total) * 100).toFixed(1)}%
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Summary */}
                        <View style={styles.backtestSummary}>
                          <Text style={styles.backtestSummaryTitle}>📈 성과 요약</Text>
                          <View style={styles.backtestSummaryTable}>
                            <View style={styles.backtestSummaryRow}>
                              <Text style={styles.backtestSummaryLabel}>총 당첨 횟수</Text>
                              <Text style={styles.backtestSummaryValue}>
                                {results['1등'] + results['2등'] + results['3등'] + results['4등'] + results['5등']}회
                              </Text>
                            </View>
                            <View style={styles.backtestSummaryRow}>
                              <Text style={styles.backtestSummaryLabel}>전체 당첨률</Text>
                              <Text style={styles.backtestSummaryValue}>
                                {(((results['1등'] + results['2등'] + results['3등'] + results['4등'] + results['5등']) / results.total) * 100).toFixed(1)}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
  },
  methodScroll: {
    marginBottom: 10,
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: 'white',
  },
  methodDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 16,
  },
  semiAutoContainer: {
    marginBottom: 15,
  },
  semiAutoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  semiAutoInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  semiAutoInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 25,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'white',
  },
  personalContainer: {
    marginBottom: 15,
  },
  personalTypeButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  personalTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
  },
  personalTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  personalTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  personalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  birthdateInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  birthdateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  ball: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ballText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  dropdownArrow: {
    paddingRight: 12,
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 10,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historicalResult: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
  },
  historicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
    textAlign: 'center',
  },
  bonusText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  savedCombo: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  savedComboHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedComboDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankBadge1st: {
    backgroundColor: '#F59E0B',
  },
  rankBadge2nd: {
    backgroundColor: '#10B981',
  },
  rankBadge3rd: {
    backgroundColor: '#3B82F6',
  },
  rankBadge4th: {
    backgroundColor: '#8B5CF6',
  },
  rankBadge5th: {
    backgroundColor: '#EF4444',
  },
  rankBadgeFail: {
    backgroundColor: '#9CA3AF',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  smartBlendContainer: {
    marginBottom: 15,
  },
  smartBlendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  riskButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 5,
  },
  riskButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  riskButtonActive: {
    backgroundColor: '#3B82F6',
  },
  riskButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  smartBlendResult: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  smartBlendResultActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  smartBlendResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  smartBlendResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  smartBlendSaveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  smartBlendSaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backtestModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backtestModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
  },
  backtestModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backtestModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  backtestModalCloseButton: {
    padding: 5,
  },
  backtestModalCloseText: {
    fontSize: 24,
    color: '#6B7280',
  },
  backtestModalContent: {
    padding: 15,
  },
  backtestSelectedCombo: {
    marginBottom: 15,
  },
  backtestSelectedComboTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  backtestResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  backtestTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  backtestTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 12,
  },
  backtestTableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  backtestTableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backtestTableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  backtestTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  backtestSummary: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  backtestSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  backtestSummaryTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  backtestSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backtestSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  backtestSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  savedComboActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  backtestButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  backtestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 