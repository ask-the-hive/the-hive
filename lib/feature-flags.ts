/**
 * Simple Environment-Based Feature Flags
 *
 * Features are disabled by default in production.
 * In development, all features are enabled by default.
 * Set NEXT_PUBLIC_ENV to 'development' or 'production'.
 *
 * Example: NEXT_PUBLIC_ENV=development
 */

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_ENV != 'production';

export const FEATURE_FLAGS = {
  // Design & UI Features
  designV2: isDevelopment,

  // User Flow Features
  userFlowV2: isDevelopment,
  stakingUserFlow: isDevelopment,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
