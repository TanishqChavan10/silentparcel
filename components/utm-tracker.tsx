"use client";

import { useUTMTracking } from '@/hooks/use-utm-tracking';

/**
 * Component that tracks UTM parameters and cleans URLs
 * This component doesn't render anything visible
 */
export function UTMTracker() {
  useUTMTracking();
  return null;
} 