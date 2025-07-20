import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    updateAvailable: false
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if service worker is supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setRegistration(reg);
      setState(prev => ({ ...prev, isRegistered: true }));

      // Listen for service worker updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // Check if service worker is already installed
      if (reg.installing) {
        setState(prev => ({ ...prev, isInstalled: false }));
        reg.installing.addEventListener('statechange', () => {
          if (reg.installing?.state === 'installed') {
            setState(prev => ({ ...prev, isInstalled: true }));
          }
        });
      } else if (reg.waiting) {
        setState(prev => ({ ...prev, isInstalled: true }));
      } else if (reg.active) {
        setState(prev => ({ ...prev, isInstalled: true }));
      }

      return reg;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, [state.isSupported]);

  // Update service worker
  const update = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, isOffline: false }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      register();
    }
  }, [state.isSupported, state.isRegistered, register]);

  // Listen for service worker messages
  useEffect(() => {
    if (!registration) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'BACKGROUND_SYNC':
          console.log('Background sync completed:', data);
          break;
        case 'CACHE_UPDATED':
          console.log('Cache updated:', data);
          break;
        default:
          console.log('Service Worker message:', type, data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [registration]);

  // Cache API response
  const cacheApiResponse = useCallback((url: string, response: any) => {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'CACHE_API',
        url,
        response
      });
    }
  }, [registration]);

  // Request background sync
  const requestBackgroundSync = useCallback(async () => {
    if (registration && 'sync' in registration) {
      try {
        await (registration as any).sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }, [registration]);

  return {
    ...state,
    registration,
    register,
    update,
    cacheApiResponse,
    requestBackgroundSync
  };
} 