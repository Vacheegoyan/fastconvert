'use client';

import React, { useState, useEffect } from 'react';
import { useAdblockDetector } from '@/hooks/use-adblock-detector';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Adblock warning is temporarily disabled. Set to true to re-enable. */
const ADBLOCK_FEATURE_ENABLED = false;

export default function AdblockWarning() {
  const { isAdblockDetected, isChecking, isEnabled } = useAdblockDetector();
  const [isOpen, setIsOpen] = useState(false);
  const [canShowWarning, setCanShowWarning] = useState(false);

  // Wait 1 minute (60000ms) after page load before showing warning
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setCanShowWarning(true);
    }, 60000); // 1 minute = 60000 milliseconds

    return () => {
      clearTimeout(delayTimer);
    };
  }, []);

  // Show dialog when adblock is detected and block body scroll (only after 1 minute)
  useEffect(() => {
    if (!isChecking && isAdblockDetected && canShowWarning) {
      setIsOpen(true);
      // Block body scroll and pointer events
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else if (!isChecking && !isAdblockDetected) {
      setIsOpen(false);
      // Restore body scroll and pointer events
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [isAdblockDetected, isChecking, canShowWarning]);

  // Prevent closing the dialog
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if adblock is no longer detected
    if (!isAdblockDetected) {
      setIsOpen(open);
    } else {
      // Force it to stay open if adblock is still detected
      setIsOpen(true);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Adblock feature is temporarily disabled — modal never shows
  if (!ADBLOCK_FEATURE_ENABLED) {
    return null;
  }

  // Adblock detection is disabled in development; only active when deployed with a real domain
  if (isEnabled === false) {
    return null;
  }

  // Block the entire site if adblock is detected (only after 1 minute delay)
  if (isChecking) {
    return null;
  }

  if (!isAdblockDetected || !canShowWarning) {
    return null;
  }

  return (
    <>
      {/* Full screen overlay to block the site */}
      <div 
        className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.preventDefault()}
      />
      
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent 
          className="sm:max-w-lg z-[10000]"
          style={{ pointerEvents: 'auto' }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <AlertDialogTitle className="text-2xl">
                Ad Blocker Detected
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base space-y-4 pt-2">
              <p className="text-foreground">
                We have detected that you are using an ad blocker extension in your browser.
              </p>
              <p className="text-foreground">
                Our website relies on advertising revenue to provide free services. Please disable your ad blocker for this website to continue using our services.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm text-foreground">How to disable ad blocker:</p>
                <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Click on the ad blocker icon in your browser&apos;s address bar</li>
                  <li>Select &quot;Disable on this site&quot; or &quot;Allow ads on this site&quot;</li>
                  <li>Refresh this page</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Thank you for your understanding. We appreciate your support!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleRefresh}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
