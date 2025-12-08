import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getJupiterPools } from '@/services/lending/get-jupiter-pools';
import { getKaminoPools } from '@/services/lending/get-kamino-pools';
import { getBestLiquidStaking } from '@/services/staking-rewards';

const WARM_INTERVAL_MS = 4 * 60 * 1000;

declare global {
  var __cacheWarmersStarted: boolean | undefined;
}

async function warmCaches() {
  await Promise.all([
    getBestLendingYields({ forceRefresh: true }),
    getBestLiquidStaking({ forceRefresh: true }),
    getKaminoPools({ forceRefresh: true }),
    getJupiterPools({ forceRefresh: true }),
  ]);
}

/**
 * Kick off background jobs that keep lending/staking caches warm so users never hit cold upstreams.
 * Safe to call multiple times; the warmer only starts once per process.
 */
export function startCacheWarmers() {
  if (typeof globalThis === 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;
  if (globalThis.__cacheWarmersStarted) return;

  globalThis.__cacheWarmersStarted = true;

  const run = () =>
    warmCaches().catch((error) => {
      console.error('Cache warm-up failed:', error);
    });

  // Warm immediately on boot
  void run();
  // Keep re-warming before caches expire
  setInterval(run, WARM_INTERVAL_MS);
}
