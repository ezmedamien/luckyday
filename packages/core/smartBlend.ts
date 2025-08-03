// SMART_BLEND_V1: Advanced lottery generator
import { bayesianWeights, mutualInfoMatrix, entropyOfTicket, simulatePayout } from './scorers';

/**
 * Returns the Bayesian posterior mean probability for a given ball number (1-45)
 */
export function getBayesWeight(num: number, draws: number[][]): number {
  // Jeffreys prior: alpha = 1, beta = 1
  const n = draws.length;
  const k = draws.reduce((acc, draw) => acc + (draw.includes(num) ? 1 : 0), 0);
  return (k + 1) / (n + 2);
}

/**
 * Main smartBlend generator
 * @param draws - historical draws (array of arrays)
 * @param count - number of tickets to return
 * @param luckyNumber - optional lucky number (1-45)
 * @param weights - array of 5 weights for scoring
 * @returns Array of { ticket: number[], explain: string }
 */
export function smartBlend(draws: number[][], count: number, luckyNumber?: number, weights: number[] = [1,1,1,1,1]) {
  // 1. Compute Bayesian weights for all balls
  const bayesWeights = Array.from({ length: 45 }, (_, i) => getBayesWeight(i + 1, draws));

  // 2. Latin-hyper-cube sampling: partition 1-45 into 6 strata
  const strata = Array.from({ length: 6 }, (_, i) => {
    const start = Math.floor(i * 45 / 6) + 1;
    const end = Math.floor((i + 1) * 45 / 6);
    return Array.from({ length: end - start + 1 }, (_, j) => start + j);
  });

  function sampleTicket(): number[] {
    // Sample one ball from each stratum, weighted by Bayesian weights
    const ticket = strata.map((stratum) => {
      const weights = stratum.map(num => bayesWeights[num - 1]);
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < stratum.length; i++) {
        r -= weights[i];
        if (r <= 0) return stratum[i];
      }
      return stratum[stratum.length - 1]; // fallback
    });
    return ticket;
  }

  // 3. Lucky-number injection
  function injectLucky(ticket: number[]): number[] {
    if (!luckyNumber) return ticket;
    const week = Math.floor(Date.now() / 1000 / 60 / 60 / 24 / 7);
    const slotIndex = week % 6;
    // Replace the slotIndex with luckyNumber, ensure no duplicates
    if (ticket.includes(luckyNumber)) return ticket;
    const newTicket = [...ticket];
    newTicket[slotIndex] = luckyNumber;
    return newTicket;
  }

  // Generate tickets (no filtering/scoring yet)
  const candidateTickets: number[][] = [];
  while (candidateTickets.length < count * 10) { // oversample for filtering
    let t = sampleTicket();
    t = injectLucky(t);
    t = Array.from(new Set(t)); // ensure uniqueness
    if (t.length === 6) candidateTickets.push(t.sort((a, b) => a - b));
  }

  // 4. Payout risk filter
  // Simulate payouts for all candidates
  const payouts = candidateTickets.map(ticket => simulatePayout(ticket, draws, 1e6));
  const sorted = [...payouts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // Filter tickets by median payout
  const filteredTickets = candidateTickets.filter((_, i) => payouts[i] >= median);

  // Take up to 'count' tickets
  const tickets = filteredTickets.slice(0, count);

  // 5. Aesthetic/ritual filter
  function isAesthetic(ticket: number[]): boolean {
    // Reject tickets with all numbers the same (impossible, but for completeness)
    if (new Set(ticket).size < 6) return false;
    // Reject tickets with all numbers ending in the same digit (e.g., 11, 21, 31, ...)
    const lastDigits = ticket.map(n => n % 10);
    if (new Set(lastDigits).size === 1) return false;
    // Reject tickets with variance < 50
    const mean = ticket.reduce((a, b) => a + b, 0) / ticket.length;
    const variance = ticket.reduce((a, b) => a + (b - mean) ** 2, 0) / ticket.length;
    if (variance < 50) return false;
    return true;
  }

  const aestheticTickets = tickets.filter(isAesthetic);

  // 6. Composite scoring & ranking
  // Compute BayesianHotness, Entropy, PayoutPercentile, LuckyNumberPresent
  function bayesianHotness(ticket: number[]): number {
    // Mean Bayesian weight of the ticket
    return ticket.reduce((a, b) => a + bayesWeights[b - 1], 0) / ticket.length;
  }
  function payoutPercentile(payout: number, allPayouts: number[]): number {
    const sorted = [...allPayouts].sort((a, b) => a - b);
    const idx = sorted.findIndex(v => v >= payout);
    return idx === -1 ? 1 : idx / sorted.length;
  }
  function luckyBoost(ticket: number[]): number {
    return luckyNumber && ticket.includes(luckyNumber) ? 1 : 0;
  }

  // Compute all scores
  const allPayouts = aestheticTickets.map(ticket => simulatePayout(ticket, draws, 1e6));
  const scored = aestheticTickets.map((ticket, i) => {
    const bayes = bayesianHotness(ticket);
    const entropy = entropyOfTicket(ticket);
    const payout = payoutPercentile(allPayouts[i], allPayouts);
    const lucky = luckyBoost(ticket);
    const score = 0.40 * bayes + 0.30 * entropy + 0.20 * payout + 0.10 * lucky;
    return { ticket, score, bayes, entropy, payout, lucky };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate: drop near-duplicates (≥4 overlaps)
  const final: typeof scored = [];
  for (const s of scored) {
    if (final.every(f => f.ticket.filter(n => s.ticket.includes(n)).length < 4)) {
      final.push(s);
    }
    if (final.length >= count) break;
  }

  // Return top N with detailed explain
  return final.slice(0, count).map((s, idx) => ({
    ticket: s.ticket,
    explain: `AI가 분석한 최적 조합입니다. 베이지안 통계, 엔트로피, 당첨 확률을 종합적으로 고려하여 생성되었습니다.`
  }));
} 