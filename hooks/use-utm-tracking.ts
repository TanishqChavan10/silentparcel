import { useEffect } from 'react';
import { trackUTMAndCleanUrl } from '@/lib/utm-tracking';

/**
 * React hook for UTM tracking
 * Automatically tracks incoming UTM parameters and cleans URLs
 */
export function useUTMTracking() {
  useEffect(() => {
    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      // Track UTM parameters and clean URL
      trackUTMAndCleanUrl().catch(error => {
        console.error('Error tracking UTM parameters:', error);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);
} 