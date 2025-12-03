const JUPITER_LEND_POOLS_URL = 'https://api.solana.fluid.io/v1/lending/tokens';
const CACHE_TTL_MS = 2 * 60 * 1000;
let cachedPools: JupiterPool[] | null = null;
let cachedAt = 0;

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

/**
 * Fetches Jupiter lend pools and caches stablecoin entries for faster repeated access.
 */
export async function getJupiterPools(): Promise<JupiterPool[]> {
  const now = Date.now();
  if (cachedPools && now - cachedAt < CACHE_TTL_MS) return cachedPools;

  const res = await fetch(JUPITER_LEND_POOLS_URL, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter tokens fetch failed: ${res.status} ${text}`);
  }

  const poolsJson = (await res.json()) as JupiterPoolResponse;
  if (!Array.isArray(poolsJson) || poolsJson.length === 0) return [];

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
  cachedAt = now;
  return pools;
}
