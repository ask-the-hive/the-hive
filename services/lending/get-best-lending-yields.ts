import { StakingRewardsResponse } from '../staking-rewards/types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_STALE_MS = 60 * 60 * 1000;

let cachedResponse: StakingRewardsResponse | null = null;
let cachedAt = 0;
let inFlight: Promise<StakingRewardsResponse> | null = null;

type Options = {
  /** Force a refresh even if the cache is still fresh */
  forceRefresh?: boolean;
};

async function fetchAndCache(): Promise<StakingRewardsResponse> {
  const response = await fetch('https://yields.llama.fi/pools', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as StakingRewardsResponse;
  cachedResponse = data;
  cachedAt = Date.now();
  return data;
}

async function refreshCache(forceRefresh = false) {
  if (inFlight && !forceRefresh) return inFlight;

  inFlight = fetchAndCache()
    .catch((err) => {
      console.error('Failed to refresh lending yields cache:', err);
      if (cachedResponse) return cachedResponse;
      cachedResponse = { status: 'error', data: [] };
      cachedAt = Date.now();
      return cachedResponse;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Fetches DeFiLlama lending pools with stale-while-revalidate caching:
 * - Fresh cache (< TTL): return immediately
 * - Stale cache (< MAX_STALE): return stale data and refresh in background
 * - No cache or too stale: block on refresh
 */
export const getBestLendingYields = async (
  options: Options = {},
): Promise<StakingRewardsResponse> => {
  const now = Date.now();
  const hasCache = Boolean(cachedResponse);
  const isFresh = hasCache && now - cachedAt < CACHE_TTL_MS;
  const isUsable = hasCache && now - cachedAt < MAX_STALE_MS;

  if (!options.forceRefresh && isFresh) return cachedResponse as StakingRewardsResponse;

  if (options.forceRefresh || !isUsable) {
    // Either explicitly forced or cache too old — block until we refresh
    return refreshCache(options.forceRefresh);
  }

  // Cache is stale but usable; refresh in background
  refreshCache().catch((err) =>
    console.error('Background lending yields refresh failed:', err),
  );
  return cachedResponse as StakingRewardsResponse;
};
