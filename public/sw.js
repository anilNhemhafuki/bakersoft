
// Cache disabled - no caching will be performed
const CACHE_NAME = null;
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon-icon.png",
  "/offline.html" // We'll create this
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching essential resources");
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log("✅ Service Worker installed");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker install failed:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("🔧 Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;
  
  // Skip chrome extensions and other non-http(s) requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            // Clone the response (can only be consumed once)
            const responseToCache = response.clone();

            // Cache images, CSS, JS, and fonts
            if (
              event.request.destination === "image" ||
              event.request.destination === "style" ||
              event.request.destination === "script" ||
              event.request.destination === "font"
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }

            return response;
          })
          .catch(() => {
            // Network failed, try to serve offline page for navigation requests
            if (event.request.mode === "navigate") {
              return caches.match("/offline.html");
            }
          });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("📨 Push event received:", event);
  let notificationData;

  try {
    if (event.data) {
      notificationData = event.data.json();
    } else {
      notificationData = {
        title: "BakerSoft",
        body: "You have a new notification",
        icon: "/favicon-icon.png",
        badge: "/favicon-icon.png",
        tag: "default-notification",
      };
    }
  } catch (error) {
    console.error("❌ Error parsing push data:", error);
    notificationData = {
      title: "BakerSoft",
      body: "You have a new notification",
      icon: "/favicon-icon.png",
      badge: "/favicon-icon.png",
      tag: "default-notification",
    };
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || "/favicon-icon.png",
    badge: notificationData.badge || "/favicon-icon.png",
    tag: notificationData.tag || "notification",
    data: notificationData.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked");
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});

console.log("✅ Service Worker setup complete");
