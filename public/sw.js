// Cache disabled - no caching strategy
const CACHE_NAME = 'bakersoft-no-cache';
const STATIC_CACHE_URLS = [];

// Install event - skip caching and activate immediately
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");
  // Skip caching - activate immediately
  self.skipWaiting();
  console.log("✅ Service Worker installed (caching skipped)");
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("🔧 Service Worker activating...");
  // Delete all caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
  console.log("✅ Service Worker activated (all caches cleared)");
});

// Fetch event - always fetch from network, no cache
self.addEventListener("fetch", (event) => {
  // Skip chrome extensions and other non-http(s) requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      // Network failed, try to serve offline page for navigation requests
      if (event.request.mode === "navigate") {
        return caches.match("/offline.html");
      }
      // Return a network error response for other failed requests
      return new Response('Network error', { status: 503 });
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

console.log("✅ Service Worker setup complete (caching disabled)");