interface ApiRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timestamp: number;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiClient {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<ApiResponse>>();
  private requestQueue: ApiRequest[] = [];
  private isProcessing = false;
  private rateLimit = {
    requests: 0,
    window: 60000, // 1 minute
    limit: 100, // 100 requests per minute
    resetTime: Date.now() + 60000
  };

  // Cache configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  // Rate limiting
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = now + this.rateLimit.window;
    }

    if (this.rateLimit.requests >= this.rateLimit.limit) {
      return false;
    }

    this.rateLimit.requests++;
    return true;
  }

  // Generate cache key
  private generateCacheKey(request: ApiRequest): string {
    const key = `${request.method}:${request.url}:${JSON.stringify(request.body || {})}`;
    return btoa(key).slice(0, 50); // Base64 encode and truncate
  }

  // Check if cache entry is valid
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Clean up expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }

    // Remove oldest entries if cache is too large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Single request with caching and rate limiting
  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Check rate limit
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.data as ApiResponse<T>;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)! as Promise<ApiResponse<T>>;
    }

    // Create new request
    const requestPromise = this.executeRequest<T>(request);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // Cache successful responses
      if (response.status >= 200 && response.status < 300) {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        });
      }

      return response;
    } finally {
      this.pendingRequests.delete(cacheKey);
      this.cleanupCache();
    }
  }

  // Execute actual HTTP request
  private async executeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Batch multiple requests
  async batchRequests<T = any>(requests: ApiRequest[]): Promise<ApiResponse<T>[]> {
    const results: ApiResponse<T>[] = [];
    const batchSize = 5; // Process 5 requests at a time

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(req => this.request<T>(req));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : 
          { data: null, status: 500, headers: {}, timestamp: Date.now() } as ApiResponse<T>
        ));
      } catch (error) {
        console.error('Batch request failed:', error);
        // Add error responses for failed requests
        const errorResponse: ApiResponse<any> = { data: null, status: 500, headers: {}, timestamp: Date.now() };
        results.push(...batch.map(() => errorResponse));
      }
    }

    return results;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  // Get rate limit status
  getRateLimitStatus(): { requests: number; limit: number; resetTime: number } {
    return {
      requests: this.rateLimit.requests,
      limit: this.rateLimit.limit,
      resetTime: this.rateLimit.resetTime
    };
  }
}

export const apiClient = new ApiClient(); 