console.log("🔧 Service Worker loaded");

const CACHE_NAME = "bakersoft-pwa-v1";
const STATIC_CACHE_URLS = ["/", "/manifest.json", "/favicon-icon.jpg"];

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching essential resources");
        return cache.addAll(STATIC_CACHE_URLS);
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

self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "GET" &&
    event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        })
    );
  }
});

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
        icon: "/favicon-icon.jpg",
        badge: "/favicon-icon.jpg",
        tag: "default-notification",
      };
    }
  } catch (error) {
    console.error("❌ Error parsing push data:", error);
    notificationData = {
      title: "BakerSoft",
      body: "You have a new notification",
      icon: "/favicon-icon.jpg",
      badge: "/favicon-icon.jpg",
      tag: "default-notification",
    };
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || "/favicon-icon.jpg",
    badge: notificationData.badge || "/favicon-icon.jpg",
    tag: notificationData.tag || "notification",
    data: notificationData.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log("✅ Push notification displayed successfully");
      })
      .catch((error) => {
        console.error("❌ Error displaying notification:", error);
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked:", event.notification.data);
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});

console.log("✅ Service Worker setup complete");