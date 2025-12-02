const JUPITER_LEND_POOLS_URL = 'https://api.solana.fluid.io/v1/lending/tokens';

export type JupiterPool = {
  symbol: string;
  mintAddress: string;
  apy: number;
  apyBase: number;
  tvlUsd: number;
  project: string;
};

type JupiterPoolResponse = Array<{
  assetAddress: string;
  symbol: string;
  decimals: number;
  totalRate?: string | number;
  supplyRate?: string | number;
  rewardsRate?: string | number;
  totalAssets?: string;
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

export async function getJupiterPools(): Promise<JupiterPool[]> {
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
    if (!STABLES.has(assetSymbol)) continue;
    const mint = t.assetAddress || t.asset?.address;
    if (!mint) continue;

    const apyRaw = Number(t.totalRate ?? t.supplyRate);
    if (!isFinite(apyRaw) || apyRaw <= 0) continue;
    const apy = apyRaw > 100 ? apyRaw / 100 : apyRaw;

    const decimals = t.asset?.decimals ?? t.decimals ?? 6;
    const totalAssets = Number(t.totalAssets || 0);
    const price = Number(t.asset?.price || 0);
    const tvlUsd =
      isFinite(totalAssets) && isFinite(price) ? (totalAssets / Math.pow(10, decimals)) * price : 0;
    const confidence =
      tvlUsd >= 100_000_000 ? 3 : tvlUsd >= 10_000_000 ? 2 : tvlUsd > 0 ? 1 : 0;

    pools.push({
      symbol: assetSymbol,
      mintAddress: mint,
      apy,
      apyBase: apy,
      tvlUsd,
      project: 'jupiter-lend',
      predictions: { binnedConfidence: confidence },
    });
  }

  return pools;
}
