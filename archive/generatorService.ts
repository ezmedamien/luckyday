import { GeneratorMethod } from './generators';

interface GenerationRequest {
  method: GeneratorMethod;
  birthday?: string;
  sign?: string;
  selectedPositions?: Record<number, number>;
  fillMethod?: GeneratorMethod;
  allDraws?: any[];
}

interface GenerationResponse {
  numbers: number[];
  method: string;
  timestamp: string;
  metadata?: any;
}

// Cache for generated numbers to avoid redundant API calls
const generationCache = new Map<string, GenerationResponse>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export class GeneratorService {
  private static instance: GeneratorService;
  
  private constructor() {}
  
  static getInstance(): GeneratorService {
    if (!GeneratorService.instance) {
      GeneratorService.instance = new GeneratorService();
    }
    return GeneratorService.instance;
  }

  private generateCacheKey(request: GenerationRequest): string {
    const key = JSON.stringify({
      method: request.method,
      birthday: request.birthday,
      sign: request.sign,
      selectedPositions: request.selectedPositions,
      fillMethod: request.fillMethod,
      // Don't include allDraws in cache key as it's too large
      hasDraws: !!request.allDraws?.length
    });
    return btoa(key); // Base64 encode for shorter keys
  }

  private isCacheValid(timestamp: string): boolean {
    return Date.now() - new Date(timestamp).getTime() < CACHE_DURATION;
  }

  async generateNumbers(request: GenerationRequest): Promise<GenerationResponse> {
    const cacheKey = this.generateCacheKey(request);
    const cached = generationCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate numbers');
      }

      const data = await response.json();
      const result: GenerationResponse = {
        numbers: data.numbers,
        method: request.method,
        timestamp: new Date().toISOString(),
        metadata: {
          request,
          responseTime: Date.now()
        }
      };

      // Cache the result
      generationCache.set(cacheKey, result);
      
      // Clean up old cache entries
      this.cleanupCache();

      return result;
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of generationCache.entries()) {
      if (!this.isCacheValid(value.timestamp)) {
        generationCache.delete(key);
      }
    }
  }

  clearCache(): void {
    generationCache.clear();
  }

  getCacheSize(): number {
    return generationCache.size;
  }
}

export const generatorService = GeneratorService.getInstance(); 