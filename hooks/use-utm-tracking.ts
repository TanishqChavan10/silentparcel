import { useEffect } from 'react';
import { trackUTMAndCleanUrl } from '@/lib/utm-tracking';

/**
 * React hook for UTM tracking
 * Automatically tracks incoming UTM parameters and cleans URLs
 */
export function useUTMTracking() {
  useEffect(() => {
    // Track UTM parameters and clean URL
    trackUTMAndCleanUrl().catch(error => {
      console.error('Error tracking UTM parameters:', error);
    });
  }, []);
} 