import { normalizeApy } from './apy-utils';

const JUPITER_LEND_POOLS_URL = 'https://api.solana.fluid.io/v1/lending/tokens';
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_STALE_MS = 60 * 60 * 1000;

let cachedPools: JupiterPool[] | null = null;
let cachedAt = 0;
let inFlight: Promise<JupiterPool[]> | null = null;

export type JupiterPool = {
  symbol: string;
  mintAddress: string;
  address?: string;
  apy: number;
  apyBase: number;
  tvlUsd: number;
  project: string;
  predictions?: { binnedConfidence: string; predictedClass: string; predictedProbability: number };
};

type JupiterPoolResponse = Array<{
  assetAddress: string;
  symbol: string;
  decimals: number;
  totalRate?: string | number;
  supplyRate?: string | number;
  rewardsRate?: string | number;
  totalAssets?: string;
  address?: string;
  asset?: {
    address: string;
    symbol?: string;
    decimals?: number;
    price?: string | number;
  };
}>;

const STABLES = new Set([
  'USDC',
  'USDT',
  'USDC.E',
  'USDT.E',
  'USDX',
  'USDS',
  'USDG',
  'FDUSD',
  'PYUSD',
  'DAI',
  'EURC',
  'EUROE',
]);

type Options = {
  forceRefresh?: boolean;
};

async function fetchAndCache(): Promise<JupiterPool[]> {
  const res = await fetch(JUPITER_LEND_POOLS_URL, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter tokens fetch failed: ${res.status} ${text}`);
  }

  const poolsJson = (await res.json()) as JupiterPoolResponse;
  if (!Array.isArray(poolsJson) || poolsJson.length === 0) {
    cachedPools = [];
    cachedAt = Date.now();
    return [];
  }

  const pools: JupiterPool[] = [];

  for (const t of poolsJson) {
    const assetSymbol = (t.asset?.symbol || '').toUpperCase();
    if (!STABLES.has(assetSymbol)) {
      continue;
    }
    const mint = t.assetAddress || t.asset?.address;
    if (!mint) {
      continue;
    }

    const apyRaw = Number(t.totalRate ?? t.supplyRate);
    if (!isFinite(apyRaw) || apyRaw <= 0) {
      continue;
    }

    const apy = apyRaw > 1 ? apyRaw / 100 : apyRaw;

    const decimals = t.asset?.decimals ?? t.decimals ?? 6;
    const totalAssets = Number(t.totalAssets || 0);
    const price = Number(t.asset?.price || 0);
    const tvlUsd =
      isFinite(totalAssets) && isFinite(price) ? (totalAssets / Math.pow(10, decimals)) * price : 0;
    const confidence =
      tvlUsd >= 100_000_000 ? '3' : tvlUsd >= 10_000_000 ? '2' : tvlUsd > 0 ? '1' : '0';
    const predictedClass =
      tvlUsd >= 100_000_000
        ? 'Stable/Up'
        : tvlUsd >= 10_000_000
          ? 'Stable'
          : tvlUsd > 0
            ? 'Down'
            : 'Unstable';
    const predictedProbability =
      tvlUsd >= 100_000_000 ? 100 : tvlUsd >= 10_000_000 ? 75 : tvlUsd > 0 ? 50 : 25;

    pools.push({
      symbol: assetSymbol,
      mintAddress: mint,
      apy,
      apyBase: apy,
      tvlUsd,
      project: 'jupiter-lend',
      address: t.address || undefined,
      predictions: {
        binnedConfidence: confidence,
        predictedClass,
        predictedProbability,
      },
    });
  }

  cachedPools = pools;
  cachedAt = Date.now();
  return pools;
}

async function refreshCache(forceRefresh = false) {
  if (inFlight && !forceRefresh) return inFlight;

  inFlight = fetchAndCache()
    .catch((error) => {
      console.error('Failed to refresh Jupiter pools cache:', error);
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Fetches Jupiter lend pools and caches stablecoin entries for faster repeated access.
 * Uses stale-while-revalidate semantics to avoid blocking users on upstream latency.
 */
export async function getJupiterPools(options: Options = {}): Promise<JupiterPool[]> {
  const now = Date.now();
  const hasCache = Boolean(cachedPools);
  const isFresh = hasCache && now - cachedAt < CACHE_TTL_MS;
  const isUsable = hasCache && now - cachedAt < MAX_STALE_MS;

  if (!options.forceRefresh && isFresh) return cachedPools as JupiterPool[];

  if (options.forceRefresh || !isUsable) {
    return refreshCache(options.forceRefresh);
  }

  refreshCache().catch((error) =>
    console.error('Background Jupiter pools refresh failed:', error),
  );
  return cachedPools as JupiterPool[];
}
