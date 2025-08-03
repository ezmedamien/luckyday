// Helper scorers for SMART_BLEND_V1

/**
 * Returns Bayesian weights for all balls 1-45
 */
export function bayesianWeights(draws: number[][]): number[] {
  // Stub: to be implemented
  return Array(45).fill(1/45);
}

/**
 * Returns mutual information matrix for all balls
 */
export function mutualInfoMatrix(draws: number[][]): number[][] {
  // Stub: to be implemented
  return Array(45).fill(0).map(() => Array(45).fill(0));
}

/**
 * Returns the normalized Shannon entropy of a ticket (spread of numbers)
 */
export function entropyOfTicket(ticket: number[]): number {
  // Sort the ticket
  const sorted = [...ticket].sort((a, b) => a - b);
  // Compute gaps between numbers
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }
  // Normalize gaps to probabilities
  const total = gaps.reduce((a, b) => a + b, 0);
  const probs = gaps.map(g => g / total);
  // Shannon entropy
  const entropy = -probs.reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0);
  // Max entropy for 5 gaps (6 numbers): log2(5) ≈ 2.32
  return entropy / Math.log2(5);
}

/**
 * Simulates payout for a ticket using the Korean Lotto prize table
 */
export function simulatePayout(ticket: number[], draws: number[][], n: number = 1e6): number {
  // Korean Lotto prize table (approximate, in KRW)
  const PRIZES = [0, 0, 0, 5000, 50000, 1500000, 2000000000];
  const BONUS_PRIZE = 50000000; // 5+bonus
  let total = 0;
  for (let i = 0; i < n; i++) {
    // Simulate a random draw
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    for (let j = 0; j < 6; j++) {
      const k = j + Math.floor(Math.random() * (45 - j));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    const draw = pool.slice(0, 6);
    const bonus = pool[6];
    // Count matches
    const mainSet = new Set(draw);
    const match = ticket.filter(n => mainSet.has(n)).length;
    const hasBonus = ticket.includes(bonus);
    let payout = 0;
    if (match === 6) payout = PRIZES[6];
    else if (match === 5 && hasBonus) payout = BONUS_PRIZE;
    else if (match >= 3) payout = PRIZES[match];
    total += payout;
  }
  return total / n;
} 