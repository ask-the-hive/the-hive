import { StakingRewardsResponse } from './types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_STALE_MS = 60 * 60 * 1000;

let cachedResponse: StakingRewardsResponse | null = null;
let cachedAt = 0;
let inFlight: Promise<StakingRewardsResponse> | null = null;

type Options = {
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

  if (!response || !response.ok || response.status !== 200) {
    throw new Error(`HTTP error! status: ${response?.status}`);
  }

  const data = (await response.json()) as StakingRewardsResponse;
  cachedResponse = data;
  cachedAt = Date.now();
  return data;
}

async function refreshCache(forceRefresh = false) {
  if (inFlight && !forceRefresh) return inFlight;

  inFlight = fetchAndCache()
    .catch((error) => {
      console.error('Error refreshing liquid staking cache:', error);
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Fetches liquid staking yields with stale-while-revalidate caching.
 */
export const getBestLiquidStaking = async (
  options: Options = {},
): Promise<StakingRewardsResponse> => {
  const now = Date.now();
  const hasCache = Boolean(cachedResponse);
  const isFresh = hasCache && now - cachedAt < CACHE_TTL_MS;
  const isUsable = hasCache && now - cachedAt < MAX_STALE_MS;

  if (!options.forceRefresh && isFresh) return cachedResponse as StakingRewardsResponse;

  if (options.forceRefresh || !isUsable) {
    return refreshCache(options.forceRefresh);
  }

  refreshCache().catch((error) =>
    console.error('Background liquid staking refresh failed:', error),
  );
  return cachedResponse as StakingRewardsResponse;
};
