import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance';
import { getCacheStats } from '@/lib/dynamicImports';

interface PerformanceData {
  memoryUsage: { used: number; total: number; percentage: number };
  bundleSize: number;
  cacheStats: { size: number; keys: string[] };
  metrics: Array<{ name: string; duration?: number }>;
}

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    bundleSize: 0,
    cacheStats: { size: 0, keys: [] },
    metrics: []
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updatePerformanceData = () => {
      setPerformanceData({
        memoryUsage: performanceMonitor.getMemoryUsage(),
        bundleSize: performanceMonitor.getBundleSize(),
        cacheStats: getCacheStats(),
        metrics: performanceMonitor.getMetrics()
      });
    };

    // Update every 5 seconds
    const interval = setInterval(updatePerformanceData, 5000);
    updatePerformanceData(); // Initial update

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-indigo text-white rounded-full shadow-lg hover:bg-indigo-dark transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Memory Usage */}
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="font-mono">
                {Math.round(performanceData.memoryUsage.percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo h-2 rounded-full transition-all"
                style={{ width: `${performanceData.memoryUsage.percentage}%` }}
              />
            </div>

            {/* Bundle Size */}
            <div className="flex justify-between">
              <span>Bundle Size:</span>
              <span className="font-mono">
                {(performanceData.bundleSize / 1024).toFixed(1)}KB
              </span>
            </div>

            {/* Cache Stats */}
            <div className="flex justify-between">
              <span>Cached Components:</span>
              <span className="font-mono">{performanceData.cacheStats.size}</span>
            </div>

            {/* Recent Metrics */}
            <div>
              <span className="font-semibold">Recent Operations:</span>
              <div className="mt-2 space-y-1">
                {performanceData.metrics.slice(-3).map((metric, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{metric.name}</span>
                    {metric.duration && (
                      <span className="font-mono">
                        {metric.duration.toFixed(0)}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => performanceMonitor.clearMetrics()}
                className="px-2 py-1 bg-gray-100 text-xs rounded hover:bg-gray-200"
              >
                Clear Metrics
              </button>
              <button
                onClick={() => {
                  getCacheStats();
                  window.location.reload();
                }}
                className="px-2 py-1 bg-indigo text-white text-xs rounded hover:bg-indigo-dark"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 