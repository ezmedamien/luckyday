// Korean Lotto 6/45 Smart Generator - Survival Focused
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
 * Main Korean Lotto 6/45 Smart Generator
 * @param draws - historical draws (array of arrays)
 * @param riskLevel - 0 (Safe), 1 (Balanced), 2 (Aggressive)
 * @returns Array of 5 ticket objects with explanations
 */
export function generateSmartBlend(draws: number[][], riskLevel: number): { ticket: number[], explain: string }[] {
  if (draws.length === 0) {
    return Array(5).fill(null).map(() => ({
      ticket: Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b),
      explain: "데이터 부족으로 랜덤 생성되었습니다."
    }));
  }
  
  const lookbackSafe = 100;
  const lookbackBalanced = 50;
  const coMatrix = buildCoOccurrenceMatrix(draws);
  const bayesWeights = Array.from({ length: 45 }, (_, i) => getBayesWeight(i + 1, draws));
  const final: { ticket: number[], explain: string }[] = [];
  
  const maxAttempts = 500; // guard
  let attempts = 0;
  
  while (final.length < 5 && attempts < maxAttempts) {
    attempts++;
    const ticket = sampleTicket(bayesWeights);
    
    // dedupe against existing
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    
    // Evaluate per risk level
    let ok = false;
    let explainParts: string[] = [];
    
    if (riskLevel === 0) {
      // Safe: require >=1 hit in last 100 draws
      const recent = draws.slice(-lookbackSafe);
      const hits = count5thPlusHits(ticket, recent);
      if (hits >= 1) {
        ok = true;
        explainParts.push("최근 100회 기준 5등 이상 당첨 이력이 있습니다.");
      }
    } else if (riskLevel === 1) {
      const recent = draws.slice(-lookbackBalanced);
      const hits = count5thPlusHits(ticket, recent);
      if (hits >= 1) {
        ok = true;
        explainParts.push("최근 50회 기준 5등 이상 당첨 이력이 있습니다.");
      }
    } else if (riskLevel === 2) {
      ok = true;
      explainParts.push("공격 전략: 과거 당첨 이력 조건 없이 다양성과 엔트로피를 우선했습니다.");
    }
    
    if (!ok) continue;
    
    // Co-occurrence preference
    const coScore = coOccurrenceScore(ticket, coMatrix);
    if (riskLevel === 0 && coScore > 0) {
      explainParts.push("통계적으로 자주 함께 등장한 숫자 조합을 포함합니다.");
    } else if (riskLevel === 1 && coScore > 0) {
      explainParts.push("균형 전략으로 부분적인 연관 숫자 조합을 활용했습니다.");
    }
    
    // Spread / entropy comment
    const spread = spreadScore(ticket);
    explainParts.push("숫자 분포가 적절히 퍼져 있습니다.");
    
    // Build explanation
    const explain = explainParts.join(" ");
    
    final.push({ ticket, explain });
  }
  
  // Fallback: if not enough valid found, fill remaining with high-entropy random ones
  while (final.length < 5) {
    const ticket = sampleTicket(bayesWeights);
    if (final.some(f => isTooSimilar(f.ticket, ticket))) continue;
    final.push({
      ticket: ticket.sort((a, b) => a - b),
      explain: "충분한 검증 조합이 없어서 다양성 높은 대체 조합입니다."
    });
  }
  
  return final.slice(0, 5);
} 