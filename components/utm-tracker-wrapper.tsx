"use client";

import dynamic from 'next/dynamic';

const UTMTracker = dynamic(() => import('@/components/utm-tracker').then(mod => ({ default: mod.UTMTracker })), {
  ssr: false
});

/**
 * Client component wrapper for UTM tracking
 * This component handles the dynamic import with ssr: false
 */
export function UTMTrackerWrapper() {
  return <UTMTracker />;
} 