const CACHE_NAME = 'luckyday-v1';
const STATIC_CACHE = 'luckyday-static-v1';
const API_CACHE = 'luckyday-api-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/lotto/all',
  '/api/lotto/update'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', url.pathname);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return fetch(request);
  }

  try {
    // Try cache first for static files
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for static file:', url.pathname);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Performing background sync...');
  
  // Get all clients
  const clients = await self.clients.matchAll();
  
  // Notify clients about sync
  clients.forEach((client) => {
    client.postMessage({
      type: 'BACKGROUND_SYNC',
      timestamp: Date.now()
    });
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New lottery numbers available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Numbers',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LuckyDay', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_API') {
    event.waitUntil(cacheApiResponse(event.data.url, event.data.response));
  }
});

// Cache API response
async function cacheApiResponse(url, response) {
  const cache = await caches.open(API_CACHE);
  const request = new Request(url);
  await cache.put(request, new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  }));
} 