import { mutate } from 'swr';

/**
 * Clear all SWR caches related to user data
 * This should be called when a user logs out to prevent stale data from persisting
 */
export const clearUserDataCache = () => {
  // Clear all caches that require authentication
  const authRequiredEndpoints = [
    '/api/chats',
    '/api/saved-tokens',
    // Add more authenticated endpoints as needed
  ];

  // Clear each cache
  authRequiredEndpoints.forEach((endpoint) => {
    mutate(endpoint, undefined, { revalidate: false });
  });

  // Also clear any saved token specific caches
  // This is a bit of a hack since we don't know all the token addresses
  // but it will clear any cached data for saved tokens
  mutate((key) => typeof key === 'string' && key.startsWith('/api/saved-tokens/'), undefined, {
    revalidate: false,
  });

  console.log('Cleared user data cache on logout');
};

/**
 * Disconnect external wallets (like Phantom) when user logs out
 * This ensures that external wallet connections are properly cleared
 */
export const disconnectExternalWallets = () => {
  // Disconnect Phantom wallet if it exists
  if (typeof window !== 'undefined' && (window as any).solana) {
    const phantomWallet = (window as any).solana;
    if (phantomWallet.disconnect && typeof phantomWallet.disconnect === 'function') {
      try {
        phantomWallet.disconnect();
        console.log('Disconnected Phantom wallet on logout');
      } catch (error) {
        console.warn('Failed to disconnect Phantom wallet:', error);
      }
    }
  }

  // Disconnect other Solana wallets if they exist
  if (typeof window !== 'undefined' && (window as any).solflare) {
    const solflareWallet = (window as any).solflare;
    if (solflareWallet.disconnect && typeof solflareWallet.disconnect === 'function') {
      try {
        solflareWallet.disconnect();
        console.log('Disconnected Solflare wallet on logout');
      } catch (error) {
        console.warn('Failed to disconnect Solflare wallet:', error);
      }
    }
  }
};
