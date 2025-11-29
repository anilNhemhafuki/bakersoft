
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Download } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, installApp, canPromptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysPassed = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      // Show banner again after 7 days
      if (daysPassed < 7) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (canPromptInstall) {
      const success = await installApp();
      if (success) {
        setIsDismissed(true);
      }
    }
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900">
                Install BakerSoft App
              </h3>
              <p className="text-xs text-gray-600">
                Add to your home screen for quick access and push notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canPromptInstall && (
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
            )}
            <Button
              onClick={handleInstall}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 text-sm px-3"
            >
              Not now
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
