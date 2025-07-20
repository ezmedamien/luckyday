import { LottoDraw } from './fetchLotto';

// Frequency table for all numbers
export function buildFrequencyTable(allDraws: LottoDraw[]): Record<number, number> {
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
  return frequency;
}

// Gap/skip for each number
export function calculateGaps(allDraws: LottoDraw[]): { gaps: Record<number, number>, avgGaps: Record<number, number> } {
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
  for (let i = 1; i <= 45; i++) {
    gaps[i] = currentGaps[i];
  }
  const avgGaps: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    avgGaps[i] = gapHistory[i].length > 0 
      ? gapHistory[i].reduce((sum, gap) => sum + gap, 0) / gapHistory[i].length 
      : 0;
  }
  return { gaps, avgGaps };
}

// Add more selectors as needed (e.g., getHotNumbers, getColdNumbers, etc.) 