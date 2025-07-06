import { LottoDraw } from './fetchLotto';

/**
 * Available lottery number generation methods
 */
export type GeneratorMethod = "random" | "stats" | "birthday" | "zodiac";

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
 * Generates 6 numbers that appeared least frequently in the last 50 draws
 * @param allDraws - Array of all lottery draws
 * @returns Set of 6 numbers with lowest frequency
 */
export function statsGenerator(allDraws: LottoDraw[]): Set<number> {
  const frequency: Record<number, number> = {};
  
  // Initialize frequency counter for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequency[i] = 0;
  }
  
  // Count frequency in last 50 draws
  const last50 = allDraws.slice(-50);
  last50.forEach(draw => {
    frequency[draw.drwtNo1]++;
    frequency[draw.drwtNo2]++;
    frequency[draw.drwtNo3]++;
    frequency[draw.drwtNo4]++;
    frequency[draw.drwtNo5]++;
    frequency[draw.drwtNo6]++;
  });
  
  // Sort by frequency (ascending) and take the 6 least frequent
  const sortedNumbers = Object.entries(frequency)
    .sort(([,a], [,b]) => a - b)
    .slice(0, 6)
    .map(([num]) => parseInt(num));
  
  return new Set(sortedNumbers);
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
 * Main generator function that delegates to specific generators based on method
 * @param method - The generation method to use
 * @param opts - Optional parameters (birthday for birthday method, sign for zodiac method, allDraws for stats method)
 * @returns Array of 6 lottery numbers
 */
export function generate(
  method: GeneratorMethod, 
  opts?: { birthday?: string; sign?: string; allDraws?: LottoDraw[] }
): number[] {
  let numbers: Set<number>;
  
  switch (method) {
    case "random":
      numbers = randomGenerator();
      break;
    case "stats":
      if (!opts?.allDraws) {
        throw new Error("All draws data is required for stats generator");
      }
      numbers = statsGenerator(opts.allDraws);
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
    default:
      throw new Error(`Unknown generator method: ${method}`);
  }
  
  return Array.from(numbers).sort((a, b) => a - b);
} 