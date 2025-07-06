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

// Global cache for all draws
let allDrawsCache: LottoDraw[] | null = null;

/**
 * Fetches all available lottery draws starting from round 1
 * Caches the results to avoid repeated network calls
 * @returns Promise containing an array of all lottery draws
 */
export async function getAllDraws(): Promise<LottoDraw[]> {
  // Return cached data if available
  if (allDrawsCache !== null) {
    return allDrawsCache;
  }
  
  const draws: LottoDraw[] = [];
  let round = 1;
  
  try {
    while (true) {
      const draw = await getDraw(round);
      draws.push(draw);
      round++;
    }
  } catch (error) {
    // Stop when we reach a round that doesn't exist
    console.log(`Fetched ${draws.length} lottery draws`);
  }
  
  // Cache the results
  allDrawsCache = draws;
  return draws;
} 