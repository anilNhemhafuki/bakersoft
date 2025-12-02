import React, { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download } from "lucide-react";

import BakerSoftIcon from "@/public/favicon-icon2.png";

export function PWAInstallPopup() {
  const { isInstallable, isInstalled, installApp, canPromptInstall } =
    usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if popup was previously dismissed
    const dismissed = localStorage.getItem("pwa-popup-dismissed");
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const daysPassed = (Date.now() - dismissTime) / (1000 * 60 * 60 * 24);
      // Show popup again after 7 days
      if (daysPassed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Show popup after 3 seconds delay
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-popup-dismissed", Date.now().toString());
  };

  const handleNotNow = () => {
    setIsVisible(false);
    // Don't set permanent dismiss, will show again on next visit
  };

  const handleInstall = async () => {
    if (canPromptInstall) {
      const success = await installApp();
      if (success) {
        setIsVisible(false);
        setIsDismissed(true);
      }
    }
  };

  // Don't show if already installed, dismissed, or not installable
  if (!isVisible || isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="w-[380px] border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-2xl">
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <img
                src={BakerSoftIcon}
                alt="BakerSoft Logo"
                className="h-6 w-6 object-contain rounded"
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  Install BakerSoft App
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6 -mt-1 -mr-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Add to your home screen for quick access and push notifications
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleInstall}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 px-4 py-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Install
                </Button>
                <Button
                  onClick={handleNotNow}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
