'use client';

import { useSentryUser } from '@/hooks/use-sentry-user';

/**
 * Component that automatically syncs Privy user data to Sentry
 * Place this inside the PrivyProvider in your app
 */
export function SentryUserSync() {
  useSentryUser();
  return null;
}
