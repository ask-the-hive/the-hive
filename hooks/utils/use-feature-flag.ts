'use client';

import { FEATURE_FLAGS, type FeatureFlag } from '@/lib/feature-flags';

/**
 * Simple hook to check if a feature is enabled
 *
 * @param flag - The feature flag name
 * @returns boolean indicating if the feature is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param flags - Array of feature flag names
 * @returns Object with enabled status for each flag and overall status
 */
export function useFeatureFlags(
  flags: FeatureFlag[]
): Record<string, boolean> & { allEnabled: boolean } {
  const result: Record<string, boolean> = {};
  let allEnabled = true;

  flags.forEach(flag => {
    const enabled = FEATURE_FLAGS[flag];
    result[flag] = enabled;
    if (!enabled) {
      allEnabled = false;
    }
  });

  return {
    ...result,
    allEnabled,
  };
}
