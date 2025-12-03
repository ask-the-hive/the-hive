import { StakingRewardsResponse } from '../staking-rewards/types';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedResponse: StakingRewardsResponse | null = null;
let cachedAt = 0;

/**
 * Fetches DefiLlama lending pools with a short-lived cache to reduce upstream latency.
 */
export const getBestLendingYields = async (): Promise<StakingRewardsResponse> => {
  const now = Date.now();
  if (cachedResponse && now - cachedAt < CACHE_TTL_MS) return cachedResponse;

  const response = await fetch('https://yields.llama.fi/pools', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = (await response.json()) as StakingRewardsResponse;
  cachedResponse = data;
  cachedAt = now;
  return data;
};
