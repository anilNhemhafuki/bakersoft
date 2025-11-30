// PWA utilities for iOS support and badge management

interface PWAInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Navigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
  standalone?: boolean;
}

interface Window {
  navigator: Navigator;
}

class PWAManager {
  private installPrompt: PWAInstallPromptEvent | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  async init() {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupBadgeSupport();
    this.detectStandaloneMode();
    this.setupServerRestartDetection();
  }

  private async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        // Register with explicit type to ensure correct MIME type
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
          type: "classic"
        });

        this.serviceWorkerRegistration = registration;

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          // Service worker update found
        });

        return registration;
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error("Service Worker not supported");
    }
  }

  private setupInstallPrompt() {
    // Listen for PWA install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.installPrompt = e as PWAInstallPromptEvent;
    });

    // Handle PWA installation
    window.addEventListener("appinstalled", () => {
      this.installPrompt = null;
    });
  }

  private setupBadgeSupport() {
    // Badge API is available in iOS 16.4+ PWAs - no logging needed
  }

  // Critical: Check if running in standalone mode
  isStandalone(): boolean {
    // iOS Safari - Primary detection method
    if (window.navigator.standalone === true) {
      return true;
    }

    // Android Chrome and other browsers
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }

    // iOS Safari additional check
    if (window.matchMedia("(display-mode: fullscreen)").matches) {
      return true;
    }

    // Fallback: Check for source parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("source") === "pwa") {
      return true;
    }

    // Additional iOS checks
    const isIOSDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const isStandaloneCapable = window.navigator.standalone !== undefined;

    if (isIOSDevice && isStandaloneCapable) {
      // Check if window height suggests fullscreen mode
      const windowHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      const ratio = windowHeight / screenHeight;

      // iOS Safari in standalone mode typically uses full screen height
      if (ratio > 0.9) {
        return true;
      }
    }

    return false;
  }

  // Force standalone mode detection on page load
  detectStandaloneMode() {
    const standalone = this.isStandalone();

    // Set a flag for CSS targeting
    if (standalone) {
      document.documentElement.setAttribute("data-pwa-standalone", "true");
    } else {
      document.documentElement.setAttribute("data-pwa-standalone", "false");
    }

    return standalone;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;

      if (result.outcome === "accepted") {
        this.installPrompt = null;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  isInstallable(): boolean {
    return this.installPrompt !== null;
  }

  async setBadge(count?: number): Promise<void> {
    try {
      if ("setAppBadge" in navigator) {
        await navigator.setAppBadge!(count);
      } else {
        // Fallback: Send message to service worker
        if (this.serviceWorkerRegistration?.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: "SET_BADGE",
            count: count || 1,
          });
        }
      }
    } catch (error) {
      // Badge setting failed silently
    }
  }

  async clearBadge(): Promise<void> {
    try {
      if ("clearAppBadge" in navigator) {
        await navigator.clearAppBadge!();
      } else {
        // Fallback: Send message to service worker
        if (this.serviceWorkerRegistration?.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: "CLEAR_BADGE",
          });
        }
      }
    } catch (error) {
      // Badge clearing failed silently
    }
  }

  async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
      } catch (error) {
        // Service worker update failed silently
      }
    }
  }

  // iOS-specific PWA checks
  isIOSPWA(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = this.isStandalone();
    return isIOS && isStandalone;
  }

  // Setup server restart detection
  private setupServerRestartDetection() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SERVER_RESTART_DETECTED") {
          // Clear all local storage and caches
          this.clearAppData().then(() => {
            // Force reload the app
            window.location.reload();
          });
        }
      });

      this.startServerHealthMonitoring();
    }
  }

  // Start server health monitoring
  startServerHealthMonitoring() {
    if (typeof window !== "undefined") {
      // Only check server health if user is already authenticated
      // Don't interfere with login process
      setInterval(() => {
        // Skip health check on login page
        if (!window.location.pathname.includes("/login")) {
          this.performHealthCheck();
        }
      }, 60000); // Check every 60 seconds instead of 30
    }
  }

  // Perform server health check
  private async performHealthCheck() {
    try {
      const response = await fetch("/api/auth/user", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok && response.status >= 500) {
        await this.clearAppData();
        window.location.reload();
      }
    } catch (error) {
      // Don't reload immediately on network errors, wait for next check
    }
  }

  // Clear all app data (storage, caches, etc.)
  private async clearAppData() {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }

      // Clear IndexedDB (if React Query uses it)
      if ("indexedDB" in window) {
        // This will clear React Query persistence if enabled
        const databases = ["react-query-offline-cache"];
        databases.forEach((dbName) => {
          indexedDB.deleteDatabase(dbName);
        });
      }
    } catch (error) {
      // Error clearing app data - silently handled
    }
  }

  // Get platform-specific info
  getPlatformInfo() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = this.isStandalone();
    const isInstallable = this.isInstallable();

    return {
      isIOS,
      isAndroid,
      isStandalone,
      isInstallable,
      isPWA: isStandalone,
      supportsNotifications: "Notification" in window,
      supportsBadges: "setAppBadge" in navigator,
      serviceWorkerSupported: "serviceWorker" in navigator,
    };
  }
}

export const pwaManager = new PWAManager();

// Export utilities
// Add PWA installability check
async function checkPWAInstallability() {
  // Check required PWA criteria
  const checks = {
    serviceWorker: "serviceWorker" in navigator,
    manifest: false,
    icon: false,
    https: location.protocol === "https:" || location.hostname === "localhost",
    standalone: false,
  };

  try {
    // Check manifest
    const manifestResponse = await fetch("/manifest.json");
    checks.manifest = manifestResponse.ok;

    // Check icon
    const iconResponse = await fetch("/favicon-icon.png");
    checks.icon = iconResponse.ok;

    // Check if standalone mode is supported
    checks.standalone = window.matchMedia("(display-mode: standalone)").matches;

    const installable =
      checks.serviceWorker && checks.manifest && checks.icon && checks.https;

    return installable;
  } catch (error) {
    return false;
  }
}

export const initPWA = async () => {
  await pwaManager.init();
  await checkPWAInstallability();
};
export const showInstallPrompt = () => pwaManager.showInstallPrompt();
export const setBadge = (count?: number) => pwaManager.setBadge(count);
export const clearBadge = () => pwaManager.clearBadge();
export const isStandalone = () => pwaManager.isStandalone();
export const isIOSPWA = () => pwaManager.isIOSPWA();
export const getPlatformInfo = () => pwaManager.getPlatformInfo();
