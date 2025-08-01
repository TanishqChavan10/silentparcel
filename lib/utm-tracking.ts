/**
 * UTM Tracking System for SilentParcel
 * Tracks incoming traffic with UTM parameters and cleans URLs
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string): UTMParams | null {
  try {
    const urlObj = new URL(url);
    const utmParams: UTMParams = {};
    
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    
    utmKeys.forEach(key => {
      const value = urlObj.searchParams.get(key);
      if (value) {
        utmParams[key as keyof UTMParams] = value;
      }
    });

    // Return null if no UTM params found
    return Object.keys(utmParams).length > 0 ? utmParams : null;
  } catch (error) {
    console.error('Error extracting UTM params:', error);
    return null;
  }
}

/**
 * Clean URL by removing UTM parameters
 */
export function cleanUTMFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    
    utmKeys.forEach(key => {
      urlObj.searchParams.delete(key);
    });

    // Remove trailing ? if no params left
    const cleanUrl = urlObj.toString();
    return cleanUrl.endsWith('?') ? cleanUrl.slice(0, -1) : cleanUrl;
  } catch (error) {
    console.error('Error cleaning UTM from URL:', error);
    return url;
  }
}

/**
 * Track UTM parameters in Google Analytics
 */
export function trackUTMInGA(utmParams: UTMParams): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max wait time

    // Wait for gtag to be available
    const checkGtag = () => {
      if (window.gtag && typeof window.gtag === 'function') {
        try {
          // Send UTM parameters to Google Analytics
          window.gtag('config', 'G-B8B9Y2S6C3', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
              'utm_source': 'source',
              'utm_medium': 'medium', 
              'utm_campaign': 'campaign',
              'utm_content': 'content',
              'utm_term': 'term'
            },
            source: utmParams.utm_source,
            medium: utmParams.utm_medium,
            campaign: utmParams.utm_campaign,
            content: utmParams.utm_content,
            term: utmParams.utm_term
          });

          // Also send as an event for better tracking
          window.gtag('event', 'utm_traffic', {
            event_category: 'traffic_source',
            event_label: utmParams.utm_source,
            source: utmParams.utm_source,
            medium: utmParams.utm_medium,
            campaign: utmParams.utm_campaign,
            content: utmParams.utm_content,
            term: utmParams.utm_term
          });

          // Give Google Analytics time to process the data
          setTimeout(resolve, 1000);
        } catch (error) {
          console.error('Error tracking UTM in GA:', error);
          resolve();
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        // Retry after a short delay
        setTimeout(checkGtag, 100);
      } else {
        console.warn('Google Analytics not available after retries, skipping UTM tracking');
        resolve();
      }
    };

    checkGtag();
  });
}

/**
 * Main function to track UTM and clean URL
 */
export async function trackUTMAndCleanUrl(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const currentUrl = window.location.href;
    const utmParams = extractUTMParams(currentUrl);

    if (utmParams) {
      console.log('UTM Parameters detected:', utmParams);
      
      // Track in Google Analytics and wait for it to complete
      await trackUTMInGA(utmParams);
      
      console.log('UTM tracking completed, cleaning URL...');

      // Clean URL and update browser history
      const cleanUrl = cleanUTMFromUrl(currentUrl);
      if (cleanUrl !== currentUrl) {
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('URL cleaned:', cleanUrl);
      }
    }
  } catch (error) {
    console.error('Error in UTM tracking:', error);
  }
}

// Global type declaration for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
} 