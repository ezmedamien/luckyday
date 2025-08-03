import { LOTTO_CONFIG } from './constants';

interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

// Helper function to generate random numbers
export function generateRandomNumbers(): number[] {
  const nums = new Set<number>();
  while (nums.size < LOTTO_CONFIG.TICKET_SIZE) {
    nums.add(Math.floor(Math.random() * LOTTO_CONFIG.MAX_NUMBER) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

// Frequency-based generator
export function generateFrequencyBased(lastDraws: LottoHistoryDraw[]): number[] {
  const freq = Array(LOTTO_CONFIG.MAX_NUMBER + 1).fill(0);
  lastDraws.forEach(draw => {
    draw.numbers.forEach(n => freq[n]++);
  });
  
  // Weighted random
  const pool: number[] = [];
  for (let n = 1; n <= LOTTO_CONFIG.MAX_NUMBER; n++) {
    for (let i = 0; i < freq[n]; i++) pool.push(n);
  }
  
  const nums = new Set<number>();
  while (nums.size < LOTTO_CONFIG.TICKET_SIZE && pool.length > 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    nums.add(pick);
  }
  
  // Fallback to random if not enough
  while (nums.size < LOTTO_CONFIG.TICKET_SIZE) {
    nums.add(Math.floor(Math.random() * LOTTO_CONFIG.MAX_NUMBER) + 1);
  }
  
  return Array.from(nums).sort((a, b) => a - b);
}

// Hot-cold balance generator
export function generateHotColdBalance(lastDraws: LottoHistoryDraw[]): number[] {
  const freq = Array(LOTTO_CONFIG.MAX_NUMBER + 1).fill(0);
  lastDraws.forEach(draw => {
    draw.numbers.forEach(n => freq[n]++);
  });
  
  const numsWithFreq = Array.from({ length: LOTTO_CONFIG.MAX_NUMBER }, (_, i) => ({ 
    n: i + 1, 
    f: freq[i + 1] 
  }));
  
  const hot = [...numsWithFreq].sort((a, b) => b.f - a.f).slice(0, 3).map(x => x.n);
  const cold = [...numsWithFreq].sort((a, b) => a.f - b.f).slice(0, 3).map(x => x.n);
  
  // Ensure uniqueness by using Set
  const combo = new Set([...hot, ...cold]);
  const result = Array.from(combo);
  
  // Shuffle and ensure we have exactly 6 numbers
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  // If we don't have 6 numbers, fill with random
  while (result.length < LOTTO_CONFIG.TICKET_SIZE) {
    const randomNum = Math.floor(Math.random() * LOTTO_CONFIG.MAX_NUMBER) + 1;
    if (!result.includes(randomNum)) {
      result.push(randomNum);
    }
  }
  
  return result.slice(0, LOTTO_CONFIG.TICKET_SIZE).sort((a, b) => a - b);
}

// Sum range generator
export function generateSumRange(): number[] {
  for (let tries = 0; tries < LOTTO_CONFIG.MAX_GENERATION_ATTEMPTS; tries++) {
    const nums = generateRandomNumbers();
    const sum = nums.reduce((a, b) => a + b, 0);
    if (sum >= LOTTO_CONFIG.SUM_RANGE_MIN && sum <= LOTTO_CONFIG.SUM_RANGE_MAX) {
      return nums;
    }
  }
  return generateRandomNumbers(); // Fallback
}

// Co-occurrence generator
export function generateCoOccurrence(lastDraws: LottoHistoryDraw[]): number[] {
  const pairCount: Record<string, number> = {};
  lastDraws.forEach(draw => {
    const nums = draw.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
        pairCount[key] = (pairCount[key] || 0) + 1;
      }
    }
  });
  
  const sortedPairs = Object.entries(pairCount) as [string, number][];
  const topPair: number[] = sortedPairs.length > 0 
    ? sortedPairs.sort((a, b) => b[1] - a[1])[0][0].split('-').map(Number) 
    : [];
  
  const nums = new Set<number>(topPair);
  while (nums.size < LOTTO_CONFIG.TICKET_SIZE) {
    nums.add(Math.floor(Math.random() * LOTTO_CONFIG.MAX_NUMBER) + 1);
  }
  
  return Array.from(nums).sort((a, b) => a - b);
}

// Seeded random generator
export function seededRandom(seed: string) {
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

// Personalized generator
export function generatePersonalized(
  personalType: 'zodiac' | 'birthdate',
  zodiac: string,
  birthYear: string,
  birthMonth: string,
  birthDay: string
): number[] {
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
  
  if (!seed) {
    return generateRandomNumbers(); // Fallback to random
  }
  
  const rand = seededRandom(seed);
  const nums = new Set<number>();
  while (nums.size < LOTTO_CONFIG.TICKET_SIZE) {
    nums.add(Math.floor(rand() * LOTTO_CONFIG.MAX_NUMBER) + 1);
  }
  
  return Array.from(nums).sort((a, b) => a - b);
}

// Semi-automatic generator
export function generateSemiAutomatic(lockedNumbers: (number | '')[]): number[] {
  const locked = lockedNumbers.map(v => (v === '' ? '' : Number(v)));
  const used = new Set<number>(locked.filter(n => n !== '') as number[]);
  const fillCount = locked.filter(n => n === '').length;
  const generated: number[] = [];
  
  // Fill remaining slots with random numbers
  while (generated.length < fillCount) {
    const n = Math.floor(Math.random() * LOTTO_CONFIG.MAX_NUMBER) + 1;
    if (!used.has(n)) {
      generated.push(n);
      used.add(n);
    }
  }
  
  // Combine locked and generated numbers
  const result: number[] = [];
  let genIdx = 0;
  for (let i = 0; i < LOTTO_CONFIG.TICKET_SIZE; i++) {
    if (locked[i] !== '') {
      result.push(Number(locked[i]));
    } else {
      result.push(generated[genIdx++]);
    }
  }
  
  return result.sort((a, b) => a - b);
} 