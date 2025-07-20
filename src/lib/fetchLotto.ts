/**
 * Type definition for lottery draw data returned from the Korean lottery API
 */
export interface LottoDraw {
  /** Total sales amount for this draw */
  totSellamnt: number;
  /** API response status - "success" or "fail" */
  returnValue: string;
  /** Draw date in YYYY-MM-DD format */
  drwNoDate: string;
  /** First prize amount */
  firstWinamnt: number;
  /** Sixth winning number */
  drwtNo6: number;
  /** Fourth winning number */
  drwtNo4: number;
  /** Number of first prize winners */
  firstPrzwnerCo: number;
  /** Fifth winning number */
  drwtNo5: number;
  /** Bonus number */
  bnusNo: number;
  /** First prize accumulated amount */
  firstAccumamnt: number;
  /** Draw round number */
  drwNo: number;
  /** Second winning number */
  drwtNo2: number;
  /** Third winning number */
  drwtNo3: number;
  /** First winning number */
  drwtNo1: number;
}

/**
 * Fetches lottery draw data for a specific round number
 * @param round - The lottery draw round number
 * @returns Promise containing the lottery draw data
 * @throws Error if the API returns a failure response
 */
export async function getDraw(round: number): Promise<LottoDraw> {
  const response = await fetch(
    `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data: LottoDraw = await response.json();
  
  if (data.returnValue === "fail") {
    throw new Error(`Failed to fetch draw data for round ${round}`);
  }
  
  return data;
}

/**
 * Gets the latest lottery round number by calling the API with drwNo=0
 * @returns Promise containing the latest round number
 * @throws Error if the API call fails
 */
export async function getLatestRound(): Promise<number> {
  const response = await fetch('https://www.dhlottery.co.kr/gameResult.do?method=byWin', {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const html = await response.text();
  // The round number is usually in a tag like: <h4><strong>제1179회</strong> 당첨번호</h4>
  const match = html.match(/제(\d+)회/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  throw new Error('Failed to parse latest round from Lotto site');
}

// Global cache for all draws
let allDrawsCache: LottoDraw[] | null = null;

/**
 * Fetches all available lottery draws from round 1 to the latest round
 * Uses reverse iteration for efficiency and includes rate limiting
 * @returns Promise containing an array of all lottery draws (round 1 to latest)
 */
export async function getAllDraws(): Promise<LottoDraw[]> {
  // Return cached data if available
  if (allDrawsCache !== null) {
    return allDrawsCache;
  }
  
  try {
    // Get the latest round number
    const latest = await getLatestRound();
    const draws: LottoDraw[] = [];
    
    // Fetch draws from latest down to round 1 (reverse iteration)
    for (let r = latest; r >= 1; r--) {
      try {
        const draw = await getDraw(r);
        draws.push(draw);
        
        // Rate limiting: 50ms delay between requests (max 20 req/s)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.warn(`Failed to fetch round ${r}:`, error);
        // Continue with other rounds even if one fails
      }
    }
    
    // Reverse the array to get chronological order (round 1 to latest)
    allDrawsCache = draws.reverse();
    console.log(`Fetched ${allDrawsCache.length} lottery draws (rounds 1-${latest})`);
    
    return allDrawsCache;
  } catch (error) {
    console.error('Failed to fetch all draws:', error);
    throw error;
  }
}

// Warm the cache on cold start (non-blocking)
getAllDraws().catch(() => {}); 

import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Excel-based draw type for historical data
export interface LottoHistoryDraw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export function getAllLottoHistory(): LottoHistoryDraw[] {
  const files = [
    path.join(process.cwd(), 'maindata_raw', 'raw', 'lotto_1-600.xls'),
    path.join(process.cwd(), 'maindata_raw', 'raw', 'lotto_601-1180.xls'),
  ];
  let allRows: unknown[] = [];
  for (const file of files) {
    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    allRows = allRows.concat(rows);
  }
  // Remove header rows (first 3 rows)
  allRows = allRows.filter((_, idx) => idx >= 3);
  // Map to LottoHistoryDraw objects
  const draws: LottoHistoryDraw[] = allRows.map((row) => {
    const round = Number((row as string[])[1]); // 회차
    const date = (row as string[])[2]; // 추첨일
    const numbers = [(row as string[])[13], (row as string[])[14], (row as string[])[15], (row as string[])[16], (row as string[])[17], (row as string[])[18]].map(Number); // N-T (1-6)
    const bonus = Number((row as string[])[19]); // T (보너스)
    return { round, date, numbers, bonus };
  }).filter(d => d.round && d.numbers.every(n => !isNaN(n)) && !isNaN(d.bonus));
  return draws;
} 

export function getAllLottoHistoryFromCSV(): LottoHistoryDraw[] {
  const filePath = path.join(process.cwd(), 'maindata_raw', 'raw', 'Lottery_Full_Raw_Data.csv');
  const csv = fs.readFileSync(filePath, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  return records.map((row: unknown) => {
    const round = Number((row as { Round: string })["Round"]);
    const date = (row as { Date: string })["Date"];
    const numbers = [
      Number((row as { "winning_number_first_digit": string })["winning_number_first_digit"]),
      Number((row as { "winning_number_second_digit": string })["winning_number_second_digit"]),
      Number((row as { "winning_number_third_digit": string })["winning_number_third_digit"]),
      Number((row as { "winning_number_fourth_digit": string })["winning_number_fourth_digit"]),
      Number((row as { "winning_number_fifth_digit": string })["winning_number_fifth_digit"]),
      Number((row as { "winning_number_sixth_digit": string })["winning_number_sixth_digit"])
    ];
    const bonus = Number((row as { "winning_number_bonus_digit": string })["winning_number_bonus_digit"]);
    return { round, date, numbers, bonus };
  }).filter(d => d.round && d.numbers.every((n: number) => !isNaN(n)) && !isNaN(d.bonus));
} 
