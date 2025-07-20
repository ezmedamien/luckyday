import React, { ComponentType } from 'react';

// Cache for dynamically imported components
const componentCache = new Map<string, ComponentType<any>>();

// Preload queue for critical components
const preloadQueue: Array<() => Promise<void>> = [];

interface DynamicImportOptions {
  loading?: ComponentType<any>;
  error?: ComponentType<any>;
  preload?: boolean;
  cache?: boolean;
}

export function dynamicImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): T {
  const { preload = false, cache = true } = options;
  
  const cacheKey = importFunc.toString();
  
  // Return cached component if available
  if (cache && componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!;
  }

  // Create dynamic component
  const DynamicComponent = React.lazy(async () => {
    try {
      const module = await importFunc();
      const component = module.default;
      
      // Cache the component
      if (cache) {
        componentCache.set(cacheKey, component);
      }
      
      return module;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  });

  // Preload if requested
  if (preload) {
    preloadQueue.push(async () => {
      try {
        await importFunc();
      } catch (error) {
        console.error('Preload failed:', error);
      }
    });
  }

  return DynamicComponent as T;
}

// Preload critical components
export function preloadCriticalComponents(): void {
  // Preload advanced methods component
  preloadQueue.push(async () => {
    await import('@/components/lazy/AdvancedMethods');
  });

  // Preload sidebar component
  preloadQueue.push(async () => {
    await import('@/components/lazy/Sidebar');
  });

  // Execute preload queue
  Promise.all(preloadQueue.map(fn => fn())).catch(console.error);
}

// Clear component cache
export function clearComponentCache(): void {
  componentCache.clear();
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: componentCache.size,
    keys: Array.from(componentCache.keys())
  };
}

// Lazy load with error boundary
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): T {
  const Component = dynamicImport(importFunc, options);
  
  return React.forwardRef<any, any>((props, ref) => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} ref={ref} />
    </React.Suspense>
  )) as T;
} 