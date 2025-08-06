// Korean Lotto 6/45 Smart Generator - Refined Strategy
import { simulatePayout } from './scorers';

/**
 * Returns the Bayesian posterior mean probability for a given ball number (1-45)
 */
function getBayesWeight(num: number, draws: number[][]): number {
  const n = draws.length;
  const k = draws.reduce((acc, draw) => acc + (draw.includes(num) ? 1 : 0), 0);
  return (k + 1) / (n + 2);
}

/**
 * Build co-occurrence matrix from historical draws
 */
function buildCoOccurrenceMatrix(draws: number[][]): number[][] {
  const size = 45;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  
  for (const draw of draws) {
    for (let i = 0; i < draw.length; i++) {
      for (let j = i + 1; j < draw.length; j++) {
        const a = draw[i] - 1;
        const b = draw[j] - 1;
        matrix[a][b]++;
        matrix[b][a]++;
      }
    }
  }
  
  return matrix;
}

/**
 * Build Markov transition matrix - what numbers tend to follow each number
 */
function buildTransitionMatrix(draws: number[][]): Map<number, Map<number, number>> {
  const transitions = new Map<number, Map<number, number>>();
  
  // Initialize transitions for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    transitions.set(i, new Map<number, number>());
  }
  
  // Analyze each draw to build transition frequencies
  for (const draw of draws) {
    for (let i = 0; i < draw.length; i++) {
      const currentNum = draw[i];
      const currentTransitions = transitions.get(currentNum)!;
      
      // Count what numbers appear in the same draw (co-occurrence)
      for (let j = 0; j < draw.length; j++) {
        if (i !== j) {
          const nextNum = draw[j];
          currentTransitions.set(nextNum, (currentTransitions.get(nextNum) || 0) + 1);
        }
      }
    }
  }
  
  return transitions;
}

/**
 * Get top N numbers that historically follow a given number
 */
function getTopFollowers(num: number, transitions: Map<number, Map<number, number>>, topN: number = 3): number[] {
  const followers = transitions.get(num);
  if (!followers) return [];
  
  return Array.from(followers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([num, _]) => num);
}

/**
 * Count how many past draws would give >=3 matches (5th place or higher)
 */
function count5thPlusHits(ticket: number[], pastDraws: number[][]): number {
  let hits = 0;
  for (const draw of pastDraws) {
    const matchCount = ticket.filter(n => draw.includes(n)).length;
    if (matchCount >= 3) hits++;
  }
  return hits;
}

/**
 * Entropy/spread heuristic: variance + gap uniformity
 */
function spreadScore(ticket: number[]): number {
  const sorted = [...ticket].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / sorted.length;
  
  // Gap diversity (higher is better): use variance of consecutive gaps
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }
  const gapMean = gaps.reduce((s, v) => s + v, 0) / gaps.length;
  const gapVar = gaps.reduce((s, v) => s + (v - gapMean) ** 2, 0) / gaps.length;
  
  // Combine: weight variance and gap variance
  return variance + gapVar;
}

/**
 * Check if two tickets are near-duplicates (overlap >=4)
 */
function isTooSimilar(t1: number[], t2: number[]): boolean {
  const overlap = t1.filter(n => t2.includes(n)).length;
  return overlap >= 4;
}

/**
 * Check if numbers are fully sequential (1,2,3,4,5,6)
 */
function isSequential(ticket: number[]): boolean {
  const sorted = [...ticket].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i-1] + 1) return false;
  }
  return true;
}

/**
 * Check if ticket has too many repeated numbers from last week
 */
function hasTooManyRepeats(ticket: number[], lastWeekNumbers: number[]): boolean {
  const repeats = ticket.filter(n => lastWeekNumbers.includes(n)).length;
  return repeats >= 3; // Allow max 2 repeats
}

/**
 * Sample one ticket using weighted sampling without replacement
 */
function sampleTicket(bayesWeights: number[]): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const ticket: number[] = [];
  const weights = bayesWeights.slice();
  
  while (ticket.length < 6) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        ticket.push(pool[i]);
        // remove chosen number
        pool.splice(i, 1);
        weights.splice(i, 1);
        break;
      }
    }
  }
  
  return ticket.sort((a, b) => a - b);
}

/**
 * Generate Markov-style combination based on last week's numbers
 */
function generateMarkovCombination(lastWeekNumbers: number[], transitions: Map<number, Map<number, number>>, coMatrix: number[][]): number[] {
  const pool: number[] = [];
  
  // For each number from last week, get top followers
  for (const num of lastWeekNumbers) {
    const followers = getTopFollowers(num, transitions, 3);
    pool.push(...followers);
  }
  
  // Remove duplicates and add some random numbers for variety
  const uniquePool = [...new Set(pool)];
  while (uniquePool.length < 20) {
    const randomNum = Math.floor(Math.random() * 45) + 1;
    if (!uniquePool.includes(randomNum)) {
      uniquePool.push(randomNum);
    }
  }
  
  // Score combinations from the pool
  const combinations: { numbers: number[], score: number }[] = [];
  
  // Generate multiple combinations from the pool
  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
    const combination = shuffled.slice(0, 6).sort((a, b) => a - b);
    
    // Avoid sequential and too many repeats
    if (isSequential(combination) || hasTooManyRepeats(combination, lastWeekNumbers)) {
      continue;
    }
    
    // Score based on co-occurrence and spread
    const coScore = coOccurrenceScore(combination, coMatrix);
    const spread = spreadScore(combination);
    const totalScore = coScore + spread;
    
    combinations.push({ numbers: combination, score: totalScore });
  }
  
  // Return the best scoring combination
  combinations.sort((a, b) => b.score - a.score);
  return combinations[0]?.numbers || sampleTicket(Array(45).fill(1));
}

/**
 * Score ticket by co-occurrence: sum of top N pair scores
 */
function coOccurrenceScore(ticket: number[], coMatrix: number[][], topN: number = 3): number {
  const pairScores: number[] = [];
  for (let i = 0; i < ticket.length; i++) {
    for (let j = i + 1; j < ticket.length; j++) {
      const a = ticket[i] - 1;
      const b = ticket[j] - 1;
      pairScores.push(coMatrix[a][b]);
    }
  }
  pairScores.sort((a, b) => b - a);
  return pairScores.slice(0, topN).reduce((sum, v) => sum + v, 0);
}

/**
 * Main Korean Lotto 6/45 Smart Generator - Refined Strategy
 * @param draws - historical draws (array of arrays)
 * @param riskLevel - unused in new approach, kept for compatibility
 * @returns Array of 5 ticket objects with explanations
 */
export function generateSmartBlend(draws: number[][], riskLevel: number): { ticket: number[], explain: string }[] {
  if (draws.length === 0) {
    return Array(5).fill(null).map(() => ({
      ticket: Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b),
      explain: "데이터 부족으로 랜덤 생성되었습니다."
    }));
  }
  
  const lastWeekNumbers = draws[draws.length - 1] || [];
  const coMatrix = buildCoOccurrenceMatrix(draws);
  const transitions = buildTransitionMatrix(draws);
  const bayesWeights = Array.from({ length: 45 }, (_, i) => getBayesWeight(i + 1, draws));
  const final: { ticket: number[], explain: string }[] = [];
  
  const maxAttempts = 500;
  let attempts = 0;
  
  // Strategy 1: 안심 전략 (Safe Strategy)
  attempts = 0;
  while (final.length < 1 && attempts < maxAttempts) {
    attempts++;
    const ticket = sampleTicket(bayesWeights);
    
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    if (isSequential(ticket)) continue;
    
    // Safe strategy: require >=1 hit in last 100 draws
    const recent = draws.slice(-100);
    const hits = count5thPlusHits(ticket, recent);
    if (hits >= 1) {
      final.push({
        ticket,
        explain: "안심 전략: 최근 100회 기준 5등 이상 당첨 이력이 있는 안전한 조합입니다."
      });
    }
  }
  
  // Strategy 2: 공격 전략 (Aggressive Strategy)
  attempts = 0;
  while (final.length < 2 && attempts < maxAttempts) {
    attempts++;
    const ticket = sampleTicket(bayesWeights);
    
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    if (isSequential(ticket)) continue;
    
    // Aggressive strategy: focus on high variance and co-occurrence
    const coScore = coOccurrenceScore(ticket, coMatrix);
    const spread = spreadScore(ticket);
    
    if (spread > 100 && coScore > 0) {
      final.push({
        ticket,
        explain: "공격 전략: 높은 분산과 통계적 연관성을 활용한 도전적인 조합입니다."
      });
    }
  }
  
  // Strategy 3-4: 균형 전략 (Balanced Strategy)
  attempts = 0;
  while (final.length < 4 && attempts < maxAttempts) {
    attempts++;
    const ticket = sampleTicket(bayesWeights);
    
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    if (isSequential(ticket)) continue;
    
    // Balanced strategy: moderate requirements
    const recent = draws.slice(-50);
    const hits = count5thPlusHits(ticket, recent);
    const coScore = coOccurrenceScore(ticket, coMatrix);
    
    if (hits >= 1 || coScore > 0) {
      final.push({
        ticket,
        explain: "균형 전략: 안전성과 수익성을 균형있게 조합한 번호입니다."
      });
    }
  }
  
  // Strategy 5: 마르코프 전략 (Markov Strategy)
  if (lastWeekNumbers.length > 0) {
    const markovTicket = generateMarkovCombination(lastWeekNumbers, transitions, coMatrix);
    
    // Create explanation for Markov strategy
    const usedFromLastWeek = markovTicket.filter(n => lastWeekNumbers.includes(n));
    const explainParts = [];
    
    if (usedFromLastWeek.length > 0) {
      explainParts.push(`지난 주 번호 ${usedFromLastWeek.join(', ')}를 기반으로`);
    }
    
    explainParts.push("통계적으로 자주 연속해서 나타나는 숫자들을 조합했습니다.");
    
    final.push({
      ticket: markovTicket,
      explain: explainParts.join(" ")
    });
  } else {
    // Fallback for Markov strategy if no last week data
    const fallbackTicket = sampleTicket(bayesWeights);
    final.push({
      ticket: fallbackTicket,
      explain: "마르코프 전략: 데이터 부족으로 대체 조합을 생성했습니다."
    });
  }
  
  // Fallback: if not enough valid found, fill remaining with high-entropy random ones
  while (final.length < 5) {
    const ticket = sampleTicket(bayesWeights);
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    if (isSequential(ticket)) continue;
    
    final.push({
      ticket: ticket.sort((a, b) => a - b),
      explain: "충분한 검증 조합이 없어서 다양성 높은 대체 조합입니다."
    });
  }
  
  // Ensure we return exactly 5 combinations
  if (final.length > 5) {
    final.splice(5);
  }
  
  return final;
} 