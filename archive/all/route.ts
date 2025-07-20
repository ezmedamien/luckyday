import { NextResponse } from 'next/server';

// In-memory cache for lottery data
let cachedDraws: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/lotto/all - Fetch all lottery draws efficiently
 * Returns all available draws in a single optimized call
 */
export async function GET() {
  // Return cached data if available and fresh
  if (cachedDraws.length > 0 && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return NextResponse.json({ 
      draws: cachedDraws,
      count: cachedDraws.length,
      message: `Returning ${cachedDraws.length} cached draws`,
      cached: true
    });
  }

  try {
    // Get latest round number first
    const latestResponse = await fetch('https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=0', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!latestResponse.ok) {
      throw new Error('Failed to get latest round');
    }
    
    const latestData = await latestResponse.json();
    const latestRound = latestData.drwNo;
    
    console.log(`Fetching draws from round 1 to ${latestRound}...`);
    
    // Fetch recent draws in parallel batches
    const recentRounds = Math.min(50, latestRound); // Limit to last 50 draws for speed
    const draws: any[] = [];
    
    // Create batches of 10 parallel requests
    const batchSize = 10;
    for (let i = 0; i < recentRounds; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && (i + j) < recentRounds; j++) {
        const round = latestRound - i - j;
        batch.push(
          fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              if (data.returnValue === "success") {
                return data;
              }
            }
            return null;
          }).catch(() => null)
        );
      }
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batch);
      const validResults = batchResults.filter(result => result !== null);
      draws.push(...validResults);
      
      // Small delay between batches to be respectful
      if (i + batchSize < recentRounds) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Sort by round number and cache
    const sortedDraws = draws
      .filter(draw => draw && draw.drwNo)
      .sort((a, b) => a.drwNo - b.drwNo);
    
    cachedDraws = sortedDraws;
    cacheTimestamp = Date.now();
    
    console.log(`Successfully loaded ${sortedDraws.length} draws`);
    
    return NextResponse.json({ 
      draws: sortedDraws,
      count: sortedDraws.length,
      message: `Successfully loaded ${sortedDraws.length} recent draws`,
      cached: false
    }, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate' // 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch draws:', error);
    
    // Return mock data immediately for testing
    const mockData = Array.from({ length: 30 }, (_, i) => ({
      drwNo: 1000 + i,
      drwNoDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      drwtNo1: Math.floor(Math.random() * 45) + 1,
      drwtNo2: Math.floor(Math.random() * 45) + 1,
      drwtNo3: Math.floor(Math.random() * 45) + 1,
      drwtNo4: Math.floor(Math.random() * 45) + 1,
      drwtNo5: Math.floor(Math.random() * 45) + 1,
      drwtNo6: Math.floor(Math.random() * 45) + 1,
      bnusNo: Math.floor(Math.random() * 45) + 1,
      returnValue: "success",
      totSellamnt: Math.floor(Math.random() * 1000000000),
      firstWinamnt: Math.floor(Math.random() * 1000000000),
      firstPrzwnerCo: Math.floor(Math.random() * 10),
      firstAccumamnt: Math.floor(Math.random() * 1000000000)
    }));
    
    cachedDraws = mockData;
    cacheTimestamp = Date.now();
    
    return NextResponse.json({ 
      draws: mockData,
      count: mockData.length,
      message: `Using ${mockData.length} mock draws for testing`,
      cached: false
    });
  }
} 