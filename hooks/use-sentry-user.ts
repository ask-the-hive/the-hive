'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import * as Sentry from '@sentry/nextjs';

/**
 * Hook to automatically set user context in Sentry based on Privy authentication
 * Call this in your root layout or app wrapper
 */
export function useSentryUser() {
  const { user, authenticated } = usePrivy();

  useEffect(() => {
    if (authenticated && user) {
      // Set user context in Sentry
      Sentry.setUser({
        id: user.id,
        email: user.email?.address,
        username: user.wallet?.address || user.twitter?.username || user.google?.email,
      });

      // Add wallet address as a tag for easy filtering
      if (user.wallet?.address) {
        Sentry.setTag('wallet_address', user.wallet.address);
      }
    } else {
      // Clear user context when logged out
      Sentry.setUser(null);
    }
  }, [user, authenticated]);
}
