import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/generators';
import { GeneratorMethod } from '@/lib/generators';

// In-memory cache for generated numbers
const generationCache = new Map<string, { numbers: number[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = {
  window: 60 * 1000, // 1 minute
  maxRequests: 50 // 50 requests per minute
};

interface GenerateRequest {
  method: GeneratorMethod;
  birthday?: string;
  sign?: string;
  selectedPositions?: Record<number, number>;
  fillMethod?: GeneratorMethod;
  allDraws?: any[];
}

// Generate cache key
function generateCacheKey(request: GenerateRequest): string {
  const key = JSON.stringify({
    method: request.method,
    birthday: request.birthday,
    sign: request.sign,
    selectedPositions: request.selectedPositions,
    fillMethod: request.fillMethod,
    hasDraws: !!request.allDraws?.length
  });
  return btoa(key).slice(0, 50);
}

// Check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT.window });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Clean up expired cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of generationCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      generationCache.delete(key);
    }
  }
}

/**
 * POST /api/generate - Generate lottery numbers
 * Body: { method, birthday?, sign?, allDraws?, window?, core?, selectedPositions?, fillMethod? }
 * Returns: { numbers: number[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT.window / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT.window / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT.window).toString()
          }
        }
      );
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    
    // Validate required fields
    if (!body.method) {
      return NextResponse.json(
        { error: 'Method is required' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = generateCacheKey(body);
    
    // Check cache first
    const cached = generationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        { 
          numbers: cached.numbers,
          cached: true,
          timestamp: cached.timestamp
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300',
            'X-Cache': 'HIT'
          }
        }
      );
    }

    // Validate method-specific requirements
    if (body.method === 'birthday' && !body.birthday) {
      return NextResponse.json(
        { error: 'Birthday is required for birthday method' },
        { status: 400 }
      );
    }

    if (body.method === 'zodiac' && !body.sign) {
      return NextResponse.json(
        { error: 'Zodiac sign is required for zodiac method' },
        { status: 400 }
      );
    }

    if (body.method === 'positionalSelect') {
      if (!body.selectedPositions || Object.keys(body.selectedPositions).length === 0) {
        return NextResponse.json(
          { error: 'Selected positions are required for positional select method' },
          { status: 400 }
        );
      }
      if (!body.fillMethod) {
        return NextResponse.json(
          { error: 'Fill method is required for positional select method' },
          { status: 400 }
        );
      }
    }

    // Generate numbers
    const numbers = await generate(body.method, {
      birthday: body.birthday,
      sign: body.sign,
      selectedPositions: body.selectedPositions,
      fillMethod: body.fillMethod,
      allDraws: body.allDraws
    });

    // Cache the result
    generationCache.set(cacheKey, {
      numbers,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    cleanupCache();

    // Return response with compression headers
    return NextResponse.json(
      { 
        numbers,
        method: body.method,
        timestamp: Date.now(),
        cached: false
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'Content-Encoding': 'gzip',
          'X-Cache': 'MISS',
          'X-Generated-At': new Date().toISOString()
        }
      }
    );

  } catch (error) {
    console.error('Generate API error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Prevent caching of generated results
export const revalidate = 0; 