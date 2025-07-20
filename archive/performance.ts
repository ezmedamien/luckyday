interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();

  startTimer(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  endTimer(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Timer "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Notify observers
    this.observers.forEach(observer => observer(metric));

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startTimer(name, metadata);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startTimer(name, metadata);
    try {
      return fn();
    } finally {
      this.endTimer(name);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Memory usage monitoring
  getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }

  // Bundle size monitoring
  getBundleSize(): number {
    if (typeof window !== 'undefined') {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigationEntry?.transferSize || 0;
    }
    return 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React performance hooks
export function usePerformanceTimer(name: string) {
  const start = () => performanceMonitor.startTimer(name);
  const end = () => performanceMonitor.endTimer(name);
  
  return { start, end };
}

export function usePerformanceObserver(callback: (metric: PerformanceMetric) => void) {
  const { useEffect } = require('react');
  useEffect(() => {
    return performanceMonitor.subscribe(callback);
  }, [callback]);
} 