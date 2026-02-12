'use client';

import { useState, useEffect } from 'react';

/**
 * Whether adblock detection is enabled.
 * - Disabled on localhost / 127.0.0.1 (development).
 * - Enabled when the site is served from a real domain (production).
 * Override: NEXT_PUBLIC_ADBLOCK_DETECTION_ENABLED = "true" | "false"
 */
function isAdblockDetectionEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const env = process.env.NEXT_PUBLIC_ADBLOCK_DETECTION_ENABLED;
  if (env === 'false') return false;
  if (env === 'true') return true;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

/**
 * Hook to detect if an adblocker is active.
 * Detection runs only when enabled (production / real domain).
 * On localhost it is disabled so you can develop without adblock prompts.
 */
export function useAdblockDetector() {
  const [isAdblockDetected, setIsAdblockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const enabled = isAdblockDetectionEnabled();
    setIsEnabled(enabled);

    if (!enabled) {
      setIsChecking(false);
      setIsAdblockDetected(false);
      return;
    }

    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const detectAdblock = () => {
      if (!mounted) return;

      let detectionResults: boolean[] = [];
      let checksCompleted = 0;
      const totalChecks = 5; // Increased to 5 methods for better detection

      const checkFinalResults = () => {
        checksCompleted++;
        if (checksCompleted < totalChecks) return;
        if (!mounted) return;

        // Count how many methods detected adblock
        // Element removal/hiding is the most reliable indicator
        const elementBlocked = detectionResults[0] === true; // First check is element-based
        const scriptBlocked = detectionResults[1] === true; // Second check is script-based
        const fetchBlocked = detectionResults[2] === true; // Third check is fetch-based
        const extensionDetected = detectionResults[3] === true; // Fourth check is extension-based
        const iframeBlocked = detectionResults[4] === true; // Fifth check is iframe-based
        
        // More aggressive detection: if ANY method detects adblock, consider it detected
        // This ensures we catch all adblockers, even those that try to evade detection
        const detected = elementBlocked || scriptBlocked || fetchBlocked || extensionDetected || iframeBlocked;
        
        if (mounted) {
          setIsAdblockDetected(detected);
          setIsChecking(false);
        }
      };

      // Method 1: Check if element with ad-related class names gets removed/hidden
      const adElement = document.createElement('div');
      adElement.innerHTML = '&nbsp;';
      adElement.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
      adElement.setAttribute('id', 'adBanner');
      adElement.setAttribute('data-ad-test', 'true');
      adElement.style.position = 'absolute';
      adElement.style.left = '-9999px';
      adElement.style.height = '1px';
      adElement.style.width = '1px';
      adElement.style.visibility = 'hidden';
      document.body.appendChild(adElement);

      // Wait a bit for adblockers to process
      setTimeout(() => {
        if (!mounted) return;

        const elementRemoved = !document.body.contains(adElement);
        let elementHidden = false;
        
        if (document.body.contains(adElement)) {
          const styles = window.getComputedStyle(adElement);
          elementHidden = 
            adElement.offsetHeight === 0 || 
            adElement.offsetWidth === 0 ||
            styles.display === 'none' ||
            styles.visibility === 'hidden' ||
            styles.opacity === '0';
        }

        detectionResults.push(elementRemoved || elementHidden);
        
        // Clean up element
        if (document.body.contains(adElement)) {
          document.body.removeChild(adElement);
        }

        checkFinalResults();
      }, 150);

      // Method 2: Try to load ad script and check if it actually loads
      let scriptLoaded = false;
      let scriptCheckComplete = false;
      
      const testScript = document.createElement('script');
      testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      testScript.async = true;
      testScript.setAttribute('data-adblock-test', 'true');
      
      const scriptTimeout = setTimeout(() => {
        if (!scriptCheckComplete && mounted) {
          scriptCheckComplete = true;
          detectionResults.push(!scriptLoaded); // If not loaded, likely blocked
          if (document.head.contains(testScript)) {
            document.head.removeChild(testScript);
          }
          checkFinalResults();
        }
      }, 2000);
      
      testScript.onerror = () => {
        if (!scriptCheckComplete && mounted) {
          scriptCheckComplete = true;
          scriptLoaded = false;
          detectionResults.push(true); // Script blocked
          clearTimeout(scriptTimeout);
          if (document.head.contains(testScript)) {
            document.head.removeChild(testScript);
          }
          checkFinalResults();
        }
      };
      
      testScript.onload = () => {
        if (!scriptCheckComplete && mounted) {
          scriptCheckComplete = true;
          scriptLoaded = true;
          detectionResults.push(false); // Script loaded successfully
          clearTimeout(scriptTimeout);
          if (document.head.contains(testScript)) {
            document.head.removeChild(testScript);
          }
          checkFinalResults();
        }
      };
      
      document.head.appendChild(testScript);

      // Method 3: Try to fetch ad-related resource
      fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      }).then(() => {
        if (!mounted) return;
        detectionResults.push(false); // Fetch succeeded
        checkFinalResults();
      }).catch(() => {
        if (!mounted) return;
        detectionResults.push(true); // Fetch failed, likely blocked
        checkFinalResults();
      });

      // Method 4: Check for adsbygoogle object and common adblock extensions
      setTimeout(() => {
        if (!mounted) return;
        // If adsbygoogle exists, adblock is likely not active
        const hasAdsByGoogle = typeof (window as any).adsbygoogle !== 'undefined';
        // Check for common adblock extension indicators
        const hasAdblockExtension = 
          typeof (window as any).uBlock !== 'undefined' ||
          typeof (window as any).adblock !== 'undefined' ||
          typeof (window as any).AdBlock !== 'undefined' ||
          typeof (window as any).uBlockOrigin !== 'undefined' ||
          typeof (window as any).AdblockPlus !== 'undefined' ||
          typeof (window as any).Ghostery !== 'undefined';
        
        // If script loaded OR no adblock extension detected, likely no adblock
        const noAdblock = hasAdsByGoogle || !hasAdblockExtension;
        detectionResults.push(!noAdblock);
        checkFinalResults();
      }, 2500);

      // Method 5: Try to create and check iframe with ad-related attributes
      const testIframe = document.createElement('iframe');
      testIframe.src = 'about:blank';
      testIframe.style.position = 'absolute';
      testIframe.style.left = '-9999px';
      testIframe.style.width = '1px';
      testIframe.style.height = '1px';
      testIframe.style.visibility = 'hidden';
      testIframe.setAttribute('data-ad-test', 'true');
      testIframe.setAttribute('id', 'adTestIframe');
      testIframe.className = 'adsbygoogle';
      document.body.appendChild(testIframe);

      setTimeout(() => {
        if (!mounted) return;
        const iframeRemoved = !document.body.contains(testIframe);
        let iframeHidden = false;
        
        if (document.body.contains(testIframe)) {
          const styles = window.getComputedStyle(testIframe);
          iframeHidden = 
            testIframe.offsetHeight === 0 || 
            testIframe.offsetWidth === 0 ||
            styles.display === 'none' ||
            styles.visibility === 'hidden' ||
            styles.opacity === '0';
        }

        detectionResults.push(iframeRemoved || iframeHidden);
        
        // Clean up iframe
        if (document.body.contains(testIframe)) {
          document.body.removeChild(testIframe);
        }
        
        checkFinalResults();
      }, 200);
    };

    // Run initial detection after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      detectAdblock();
    }, 1000);

    // Set up periodic checking every 1.5 seconds to detect when adblock is enabled/disabled
    // More frequent checking ensures we catch adblock immediately when it's enabled
    intervalId = setInterval(() => {
      if (mounted) {
        // Always check, even if currently checking, to ensure we catch changes quickly
        detectAdblock();
      }
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isChecking]);

  return { isAdblockDetected, isChecking, isEnabled };
}
