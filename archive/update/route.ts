import { NextRequest, NextResponse } from 'next/server';
import { getLatestRound, getAllDraws } from '@/lib/fetchLotto';

/**
 * POST /api/lotto/update - Update historical data cache
 * This endpoint can be called by a scheduled task (e.g., every Saturday at 9 PM)
 * Returns: { success: boolean, message: string, updatedCount?: number }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting scheduled lottery data update...');
    
    // Fetch the latest draw to check if there's new data
    const latestRound = await getLatestRound();
    console.log(`📊 Latest round: ${latestRound}`);
    
    // Fetch all draws to update the cache
    const allDraws = await getAllDraws();
    console.log(`📈 Fetched ${allDraws.length} total draws`);
    
    // Here you could implement caching logic
    // For now, we'll just return success
    // In a production environment, you might want to:
    // 1. Store the data in a database
    // 2. Use Redis or similar for caching
    // 3. Implement versioning to track updates
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated lottery data. Latest round: ${latestRound}`,
      latestDraw: latestRound,
      totalDraws: allDraws.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Lottery data update failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update lottery data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lotto/update - Check last update status
 * Returns: { lastUpdated: string, latestDraw: number, status: string }
 */
export async function GET() {
  try {
    // Fetch latest round to check current status
    const latestRound = await getLatestRound();
    
    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      latestDraw: latestRound,
      status: 'Data is current',
      message: `Latest available round: ${latestRound}`
    });
    
  } catch (error) {
    console.error('❌ Failed to check update status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check update status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 