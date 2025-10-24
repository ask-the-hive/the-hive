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
};
