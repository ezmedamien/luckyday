import { LottoDraw } from './fetchLotto';

/**
 * Available lottery number generation methods
 */
export type GeneratorMethod = 
  | "random" | "birthday" | "zodiac"
  | "windowHot" | "hotColdHybrid"
  | "expectedGap"
  | "hotPairs" | "hotTriplets"
  | "deltaSystem"
  | "positionalFreq"
  | "oddEvenBalanced" | "sumInRange" | "zoneBalanced"
  | "reducedWheel"
  | "markovChain" | "gboostModel"
  | "positionalSelect";

// Module-scope caches for memoization
const frequencyCache = new Map<string, Record<number, number>>();
const pairFrequencyCache = new Map<string, Record<string, number>>();
const tripletFrequencyCache = new Map<string, Record<string, number>>();
const deltaCache = new Map<string, number[][]>();
const positionalCache = new Map<string, Record<number, Record<number, number>>>();

/**
 * Normalizes a ticket to ensure 6 unique numbers 1-45, sorted ascending
 * @param setOrArr - Set or array of numbers
 * @returns Array of 6 unique integers 1-45, sorted
 */
function normalizeTicket(setOrArr: Set<number> | number[]): number[] {
  const numbers = Array.from(setOrArr);
  const unique = [...new Set(numbers)].filter(n => n >= 1 && n <= 45);
  
  if (unique.length < 6) {
    // Fill with random numbers if insufficient
    while (unique.length < 6) {
      const random = Math.floor(Math.random() * 45) + 1;
      if (!unique.includes(random)) {
        unique.push(random);
      }
    }
  } else if (unique.length > 6) {
    // Take first 6 if too many
    unique.splice(6);
  }
  
  return unique.sort((a, b) => a - b);
}

/**
 * Picks numbers with weighted random selection
 * @param weights - Object mapping numbers to weights
 * @param count - Number of numbers to pick
 * @returns Array of picked numbers
 */
function pickWithWeights(weights: Record<number, number>, count: number): number[] {
  const numbers = Object.keys(weights).map(Number);
  const totalWeight = numbers.reduce((sum, num) => sum + weights[num], 0);
  const picked: number[] = [];
  
  while (picked.length < count) {
    let random = Math.random() * totalWeight;
    for (const num of numbers) {
      if (!picked.includes(num)) {
        random -= weights[num];
        if (random <= 0) {
          picked.push(num);
          break;
        }
      }
    }
  }
  
  return picked;
}

/**
 * Calculates frequency table for all numbers
 * @param allDraws - Array of all lottery draws
 * @returns Frequency table
 */
function buildFrequencyTable(allDraws: LottoDraw[]): Record<number, number> {
  const cacheKey = `freq_${allDraws.length}`;
  if (frequencyCache.has(cacheKey)) {
    return frequencyCache.get(cacheKey)!;
  }
  
  const frequency: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    frequency[i] = 0;
  }
  
  allDraws.forEach(draw => {
    frequency[draw.drwtNo1]++;
    frequency[draw.drwtNo2]++;
    frequency[draw.drwtNo3]++;
    frequency[draw.drwtNo4]++;
    frequency[draw.drwtNo5]++;
    frequency[draw.drwtNo6]++;
  });
  
  frequencyCache.set(cacheKey, frequency);
  return frequency;
}

/**
 * Calculates gap/skip for each number
 * @param allDraws - Array of all lottery draws
 * @returns Gap table and average gaps
 */
function calculateGaps(allDraws: LottoDraw[]): { gaps: Record<number, number>, avgGaps: Record<number, number> } {
  const gaps: Record<number, number> = {};
  const gapHistory: Record<number, number[]> = {};
  
  for (let i = 1; i <= 45; i++) {
    gaps[i] = 0;
    gapHistory[i] = [];
  }
  
  let currentGaps: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    currentGaps[i] = 0;
  }
  
  allDraws.forEach(draw => {
    const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6];
    
    // Update gaps for numbers that didn't appear
    for (let i = 1; i <= 45; i++) {
      if (!numbers.includes(i)) {
        currentGaps[i]++;
      } else {
        if (currentGaps[i] > 0) {
          gapHistory[i].push(currentGaps[i]);
        }
        currentGaps[i] = 0;
      }
    }
  });
  
  // Current gaps
  for (let i = 1; i <= 45; i++) {
    gaps[i] = currentGaps[i];
  }
  
  // Average gaps
  const avgGaps: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    avgGaps[i] = gapHistory[i].length > 0 
      ? gapHistory[i].reduce((sum, gap) => sum + gap, 0) / gapHistory[i].length 
      : 0;
  }
  
  return { gaps, avgGaps };
}

/**
 * Generates 6 unique random numbers between 1 and 45
 * @returns Set of 6 unique random integers
 */
export function randomGenerator(): Set<number> {
  const numbers = new Set<number>();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return numbers;
}

/**
 * Generates 6 numbers based on birthday using modulo arithmetic
 * @param birth - Birthday string in YYYY-MM-DD format
 * @returns Set of 6 numbers derived from birthday
 */
export function birthdayGenerator(birth: string): Set<number> {
  const [year, month, day] = birth.split('-').map(Number);
  const numbers = new Set<number>();
  
  // Generate numbers using different combinations of year, month, day
  const combinations = [
    (year + month + day) % 45 + 1,
    (year * month + day) % 45 + 1,
    (year + month * day) % 45 + 1,
    (year * day + month) % 45 + 1,
    (month * day + year % 100) % 45 + 1,
    (year % 100 + month + day) % 45 + 1
  ];
  
  combinations.forEach(num => numbers.add(num));
  
  // If we have duplicates, fill with random numbers
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  
  return numbers;
}

/**
 * Generates 6 numbers based on zodiac sign
 * @param sign - Zodiac sign name
 * @returns Set of 6 numbers mapped to the zodiac sign
 */
export function zodiacGenerator(sign: string): Set<number> {
  const zodiacNumbers: Record<string, number[]> = {
    "Aries": [1, 9, 17, 25, 33, 41],
    "Taurus": [2, 10, 18, 26, 34, 42],
    "Gemini": [3, 11, 19, 27, 35, 43],
    "Cancer": [4, 12, 20, 28, 36, 44],
    "Leo": [5, 13, 21, 29, 37, 45],
    "Virgo": [6, 14, 22, 30, 38, 1],
    "Libra": [7, 15, 23, 31, 39, 2],
    "Scorpio": [8, 16, 24, 32, 40, 3],
    "Sagittarius": [9, 17, 25, 33, 41, 4],
    "Capricorn": [10, 18, 26, 34, 42, 5],
    "Aquarius": [11, 19, 27, 35, 43, 6],
    "Pisces": [12, 20, 28, 36, 44, 7]
  };
  
  const numbers = zodiacNumbers[sign] || zodiacNumbers["Aries"];
  return new Set(numbers);
}

/**
 * Generates numbers weighted by frequency in recent window
 * @param allDraws - Array of all lottery draws
 * @param window - Number of recent draws to consider (default: 20)
 * @returns Array of 6 numbers weighted by recent frequency
 */
export function windowHotGenerator(allDraws: LottoDraw[], window: number = 20): number[] {
  const recent = allDraws.slice(-window);
  const frequency = buildFrequencyTable(recent);
  return normalizeTicket(pickWithWeights(frequency, 6));
}

/**
 * Picks 3 hottest and 3 coldest numbers from full history
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers (3 hottest + 3 coldest)
 */
export function hotColdHybridGenerator(allDraws: LottoDraw[]): number[] {
  const frequency = buildFrequencyTable(allDraws);
  const sorted = Object.entries(frequency).sort(([,a], [,b]) => b - a);
  
  const hottest = sorted.slice(0, 3).map(([num]) => parseInt(num));
  const coldest = sorted.slice(-3).map(([num]) => parseInt(num));
  
  return normalizeTicket([...hottest, ...coldest]);
}

/**
 * Favors numbers whose current skip > historic average skip × 1.2
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers with expected gap analysis
 */
export function expectedGapGenerator(allDraws: LottoDraw[]): number[] {
  const { gaps, avgGaps } = calculateGaps(allDraws);
  const candidates: number[] = [];
  
  for (let i = 1; i <= 45; i++) {
    if (gaps[i] > avgGaps[i] * 1.2) {
      candidates.push(i);
    }
  }
  
  if (candidates.length < 6) {
    // Fill with random if insufficient candidates
    while (candidates.length < 6) {
      const random = Math.floor(Math.random() * 45) + 1;
      if (!candidates.includes(random)) {
        candidates.push(random);
      }
    }
  }
  
  return normalizeTicket(candidates.slice(0, 6));
}

/**
 * Builds pair-frequency table and picks 3 hot pairs
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers from hot pairs
 */
export function hotPairsGenerator(allDraws: LottoDraw[]): number[] {
  const cacheKey = `pairs_${allDraws.length}`;
  let pairFreq: Record<string, number>;
  
  if (pairFrequencyCache.has(cacheKey)) {
    pairFreq = pairFrequencyCache.get(cacheKey)!;
  } else {
    pairFreq = {};
    
    allDraws.forEach(draw => {
      const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6].sort((a, b) => a - b);
      
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = `${numbers[i]}-${numbers[j]}`;
          pairFreq[pair] = (pairFreq[pair] || 0) + 1;
        }
      }
    });
    
    pairFrequencyCache.set(cacheKey, pairFreq);
  }
  
  const hotPairs = Object.entries(pairFreq)
    .filter(([, count]) => count >= 5)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  const result: number[] = [];
  const usedNumbers = new Set<number>();
  
  for (const [pair] of hotPairs) {
    if (result.length >= 6) break;
    
    const [num1, num2] = pair.split('-').map(Number);
    if (!usedNumbers.has(num1)) {
      result.push(num1);
      usedNumbers.add(num1);
    }
    if (result.length < 6 && !usedNumbers.has(num2)) {
      result.push(num2);
      usedNumbers.add(num2);
    }
  }
  
  return normalizeTicket(result);
}

/**
 * Builds triplet-frequency table and picks hot triplets
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers from hot triplets
 */
export function hotTripletsGenerator(allDraws: LottoDraw[]): number[] {
  const cacheKey = `triplets_${allDraws.length}`;
  let tripletFreq: Record<string, number>;
  
  if (tripletFrequencyCache.has(cacheKey)) {
    tripletFreq = tripletFrequencyCache.get(cacheKey)!;
  } else {
    tripletFreq = {};
    
    allDraws.forEach(draw => {
      const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6].sort((a, b) => a - b);
      
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const triplet = `${numbers[i]}-${numbers[j]}-${numbers[k]}`;
            tripletFreq[triplet] = (tripletFreq[triplet] || 0) + 1;
          }
        }
      }
    });
    
    tripletFrequencyCache.set(cacheKey, tripletFreq);
  }
  
  const hotTriplets = Object.entries(tripletFreq)
    .filter(([, count]) => count >= 3)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const result: number[] = [];
  const usedNumbers = new Set<number>();
  
  for (const [triplet] of hotTriplets) {
    if (result.length >= 6) break;
    
    const numbers = triplet.split('-').map(Number);
    for (const num of numbers) {
      if (result.length < 6 && !usedNumbers.has(num)) {
        result.push(num);
        usedNumbers.add(num);
      }
    }
  }
  
  return normalizeTicket(result);
}

/**
 * Derives most common sorted-ticket deltas and rebuilds ticket
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers based on delta patterns
 */
export function deltaSystemGenerator(allDraws: LottoDraw[]): number[] {
  const cacheKey = `deltas_${allDraws.length}`;
  let topDeltas: number[][];
  
  if (deltaCache.has(cacheKey)) {
    topDeltas = deltaCache.get(cacheKey)!;
  } else {
    const deltaFreq: Record<string, number> = {};
    
    allDraws.forEach(draw => {
      const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6].sort((a, b) => a - b);
      const deltas = [];
      
      for (let i = 1; i < numbers.length; i++) {
        deltas.push(numbers[i] - numbers[i-1]);
      }
      
      const deltaKey = deltas.join(',');
      deltaFreq[deltaKey] = (deltaFreq[deltaKey] || 0) + 1;
    });
    
    topDeltas = Object.entries(deltaFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 100)
      .map(([deltaStr]) => deltaStr.split(',').map(Number));
    
    deltaCache.set(cacheKey, topDeltas);
  }
  
  // Pick random delta pattern and rebuild ticket
  const randomDelta = topDeltas[Math.floor(Math.random() * topDeltas.length)];
  const startNum = Math.floor(Math.random() * 20) + 1; // Start between 1-20
  
  const result = [startNum];
  for (const delta of randomDelta) {
    const nextNum = result[result.length - 1] + delta;
    if (nextNum <= 45 && result.length < 6) {
      result.push(nextNum);
    }
  }
  
  return normalizeTicket(result);
}

/**
 * Weights by how often each position hits a value
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers sampled by positional frequency
 */
export function positionalFreqGenerator(allDraws: LottoDraw[]): number[] {
  const cacheKey = `positional_${allDraws.length}`;
  let positionalFreq: Record<number, Record<number, number>>;
  
  if (positionalCache.has(cacheKey)) {
    positionalFreq = positionalCache.get(cacheKey)!;
  } else {
    positionalFreq = {};
    for (let pos = 1; pos <= 6; pos++) {
      positionalFreq[pos] = {};
      for (let num = 1; num <= 45; num++) {
        positionalFreq[pos][num] = 0;
      }
    }
    
    allDraws.forEach(draw => {
      const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6];
      numbers.forEach((num, index) => {
        positionalFreq[index + 1][num]++;
      });
    });
    
    positionalCache.set(cacheKey, positionalFreq);
  }
  
  const result: number[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const weights = positionalFreq[pos];
    const picked = pickWithWeights(weights, 1);
    result.push(picked[0]);
  }
  
  return normalizeTicket(result);
}

/**
 * Resamples RNG until odd:even ratio is 3:3
 * @returns Array of 6 numbers with balanced odd/even ratio
 */
export function oddEvenBalancedGenerator(): number[] {
  let attempts = 0;
  while (attempts < 1000) {
    const numbers = randomGenerator();
    const oddCount = Array.from(numbers).filter(n => n % 2 === 1).length;
    
    if (oddCount === 3) {
      return normalizeTicket(numbers);
    }
    attempts++;
  }
  
  // Fallback to random if no balanced ticket found
  return normalizeTicket(randomGenerator());
}

/**
 * Resamples RNG until ticket sum is between 100-200
 * @returns Array of 6 numbers with sum in specified range
 */
export function sumInRangeGenerator(): number[] {
  let attempts = 0;
  while (attempts < 1000) {
    const numbers = randomGenerator();
    const sum = Array.from(numbers).reduce((a, b) => a + b, 0);
    
    if (sum >= 100 && sum <= 200) {
      return normalizeTicket(numbers);
    }
    attempts++;
  }
  
  // Fallback to random if no valid ticket found
  return normalizeTicket(randomGenerator());
}

/**
 * Resamples RNG until at least 1 number from each zone (1-15, 16-30, 31-45)
 * @returns Array of 6 numbers with zone balance
 */
export function zoneBalancedGenerator(): number[] {
  let attempts = 0;
  while (attempts < 1000) {
    const numbers = randomGenerator();
    const zones = new Set<number>();
    
    Array.from(numbers).forEach(num => {
      if (num <= 15) zones.add(1);
      else if (num <= 30) zones.add(2);
      else zones.add(3);
    });
    
    if (zones.size === 3) {
      return normalizeTicket(numbers);
    }
    attempts++;
  }
  
  // Fallback to random if no balanced ticket found
  return normalizeTicket(randomGenerator());
}

/**
 * Returns first valid 6-number ticket from minimal wheel covering all pairs
 * @param core - Core numbers to build wheel from
 * @returns Array of 6 numbers from reduced wheel
 */
export function reducedWheelGenerator(core: number[]): number[] {
  if (!core || core.length === 0) {
    throw new Error("Core numbers are required for reduced wheel generator");
  }
  
  // Simple implementation: take first 6 unique numbers from core
  const unique = [...new Set(core)].filter(n => n >= 1 && n <= 45);
  return normalizeTicket(unique.slice(0, 6));
}

/**
 * Uses 1-step Markov chain to sample numbers sequentially
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers from Markov chain
 */
export function markovChainGenerator(allDraws: LottoDraw[]): number[] {
  // Build transition matrix P(X|Y in last draw)
  const transitions: Record<number, Record<number, number>> = {};
  
  for (let i = 1; i <= 45; i++) {
    transitions[i] = {};
    for (let j = 1; j <= 45; j++) {
      transitions[i][j] = 0;
    }
  }
  
  allDraws.forEach(draw => {
    const numbers = [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6];
    
    for (let i = 0; i < numbers.length; i++) {
      for (let j = 0; j < numbers.length; j++) {
        if (i !== j) {
          transitions[numbers[i]][numbers[j]]++;
        }
      }
    }
  });
  
  // Sample sequentially
  const result: number[] = [];
  let current = Math.floor(Math.random() * 45) + 1;
  
  while (result.length < 6) {
    result.push(current);
    
    // Find next number based on transitions
    const weights = transitions[current];
    const candidates = Object.keys(weights).map(Number).filter(n => !result.includes(n));
    
    if (candidates.length > 0) {
      const candidateWeights: Record<number, number> = {};
      candidates.forEach(num => {
        candidateWeights[num] = weights[num];
      });
      
      const next = pickWithWeights(candidateWeights, 1)[0];
      current = next;
    } else {
      // Fallback to random if no transitions available
      const available = Array.from({length: 45}, (_, i) => i + 1).filter(n => !result.includes(n));
      current = available[Math.floor(Math.random() * available.length)];
    }
  }
  
  return normalizeTicket(result);
}

/**
 * @deprecated Placeholder for future ML implementation
 * Currently returns random generator result
 * TODO: Implement gradient boosting model
 * @param allDraws - Array of all lottery draws
 * @returns Array of 6 numbers (currently random-based)
 */
export function gboostModelGenerator(allDraws: LottoDraw[]): number[] {
  return normalizeTicket(randomGenerator());
}

/**
 * Generates numbers with user-selected positions and auto-fills the rest
 * @param allDraws - Array of all lottery draws
 * @param selectedPositions - Object mapping position (1-6) to selected number
 * @param fillMethod - Method to use for filling remaining positions
 * @returns Array of 6 numbers with selected positions filled
 */
export function positionalSelectGenerator(
  allDraws: LottoDraw[], 
  selectedPositions: Record<number, number>,
  fillMethod: GeneratorMethod = "random"
): number[] {
  const result: number[] = new Array(6).fill(0);
  
  // Fill in user-selected positions
  Object.entries(selectedPositions).forEach(([posStr, num]) => {
    const pos = parseInt(posStr);
    if (pos >= 1 && pos <= 6 && num >= 1 && num <= 45) {
      result[pos - 1] = num;
    }
  });
  
  // Get available numbers for remaining positions
  const usedNumbers = new Set(result.filter(n => n > 0));
  const availableNumbers = Array.from({length: 45}, (_, i) => i + 1)
    .filter(n => !usedNumbers.has(n));
  
  // Fill remaining positions based on selected method
  const remainingPositions = result.map((num, index) => ({ num, index }))
    .filter(({ num }) => num === 0)
    .map(({ index }) => index);
  
  if (remainingPositions.length === 0) {
    return normalizeTicket(result);
  }
  
  // Generate numbers for remaining positions
  let generatedNumbers: number[];
  
  switch (fillMethod) {
    case "random":
      generatedNumbers = Array.from(randomGenerator());
      break;
    case "windowHot":
      generatedNumbers = windowHotGenerator(allDraws);
      break;
    case "hotColdHybrid":
      generatedNumbers = hotColdHybridGenerator(allDraws);
      break;
    case "expectedGap":
      generatedNumbers = expectedGapGenerator(allDraws);
      break;
    case "hotPairs":
      generatedNumbers = hotPairsGenerator(allDraws);
      break;
    case "hotTriplets":
      generatedNumbers = hotTripletsGenerator(allDraws);
      break;
    case "deltaSystem":
      generatedNumbers = deltaSystemGenerator(allDraws);
      break;
    case "positionalFreq":
      generatedNumbers = positionalFreqGenerator(allDraws);
      break;
    case "oddEvenBalanced":
      generatedNumbers = oddEvenBalancedGenerator();
      break;
    case "sumInRange":
      generatedNumbers = sumInRangeGenerator();
      break;
    case "zoneBalanced":
      generatedNumbers = zoneBalancedGenerator();
      break;
    case "markovChain":
      generatedNumbers = markovChainGenerator(allDraws);
      break;
    case "gboostModel":
      generatedNumbers = gboostModelGenerator(allDraws);
      break;
    default:
      generatedNumbers = Array.from(randomGenerator());
  }
  
  // Filter out already used numbers and fill remaining positions
  const unusedGenerated = generatedNumbers.filter(n => !usedNumbers.has(n));
  let generatedIndex = 0;
  
  for (const posIndex of remainingPositions) {
    if (generatedIndex < unusedGenerated.length) {
      result[posIndex] = unusedGenerated[generatedIndex];
      generatedIndex++;
    } else {
      // Fallback to random if we run out of generated numbers
      const randomAvailable = availableNumbers.filter(n => !result.includes(n));
      if (randomAvailable.length > 0) {
        result[posIndex] = randomAvailable[Math.floor(Math.random() * randomAvailable.length)];
      }
    }
  }
  
  return normalizeTicket(result);
}

/**
 * Main generator function that delegates to specific generators based on method
 * @param method - The generation method to use
 * @param opts - Optional parameters for various generators
 * @returns Array of 6 lottery numbers
 */
export function generate(
  method: GeneratorMethod, 
  opts?: { 
    birthday?: string; 
    sign?: string; 
    allDraws?: LottoDraw[];
    window?: number;
    core?: number[];
    selectedPositions?: Record<number, number>;
    fillMethod?: GeneratorMethod;
  }
): number[] {
  let numbers: Set<number> | number[];
  
  switch (method) {
    case "random":
      numbers = randomGenerator();
      break;
    case "birthday":
      if (!opts?.birthday) {
        throw new Error("Birthday is required for birthday generator");
      }
      numbers = birthdayGenerator(opts.birthday);
      break;
    case "zodiac":
      if (!opts?.sign) {
        throw new Error("Zodiac sign is required for zodiac generator");
      }
      numbers = zodiacGenerator(opts.sign);
      break;
    case "windowHot":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for windowHot generator");
      }
      numbers = windowHotGenerator(opts.allDraws, opts?.window);
      break;
    case "hotColdHybrid":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for hotColdHybrid generator");
      }
      numbers = hotColdHybridGenerator(opts.allDraws);
      break;
    case "expectedGap":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for expectedGap generator");
      }
      numbers = expectedGapGenerator(opts.allDraws);
      break;
    case "hotPairs":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for hotPairs generator");
      }
      numbers = hotPairsGenerator(opts.allDraws);
      break;
    case "hotTriplets":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for hotTriplets generator");
      }
      numbers = hotTripletsGenerator(opts.allDraws);
      break;
    case "deltaSystem":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for deltaSystem generator");
      }
      numbers = deltaSystemGenerator(opts.allDraws);
      break;
    case "positionalFreq":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for positionalFreq generator");
      }
      numbers = positionalFreqGenerator(opts.allDraws);
      break;
    case "oddEvenBalanced":
      numbers = oddEvenBalancedGenerator();
      break;
    case "sumInRange":
      numbers = sumInRangeGenerator();
      break;
    case "zoneBalanced":
      numbers = zoneBalancedGenerator();
      break;
    case "reducedWheel":
      if (!opts?.core) {
        throw new Error("Core numbers are required for reducedWheel generator");
      }
      numbers = reducedWheelGenerator(opts.core);
      break;
    case "markovChain":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for markovChain generator");
      }
      numbers = markovChainGenerator(opts.allDraws);
      break;
    case "gboostModel":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for gboostModel generator");
      }
      numbers = gboostModelGenerator(opts.allDraws);
      break;
    case "positionalSelect":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for positionalSelect generator");
      }
      if (!opts?.selectedPositions) {
        throw new Error("Selected positions are required for positionalSelect generator");
      }
      numbers = positionalSelectGenerator(opts.allDraws, opts.selectedPositions, opts?.fillMethod);
      break;
    default:
      throw new Error(`Unknown generator method: ${method}`);
  }
  
  return Array.isArray(numbers) ? numbers : Array.from(numbers).sort((a, b) => a - b);
} 