import { getTokenMetadata } from '@/services/birdeye/get-token-metadata';
import { getMintDecimals } from '@/services/solana/get-mint-decimals';
import type { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';

type DefiTunaVault = {
  address: string;
  mint: string;
  deposited_funds: { amount: string; usd: number };
  supply_limit: { amount: string; usd: number };
  interest_rate: string;
  utilization: number;
  supply_apy: number;
  borrow_apy: number;
};

type DefiTunaResponse = { data: DefiTunaVault[] };

export async function getDefiTunaPools(): Promise<LendingYieldsPoolData[]> {
  const res = await fetch('https://api.defituna.com/api/v1/vaults', {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DefiTuna vaults fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as DefiTunaResponse;
  const vaults = Array.isArray(json.data) ? json.data : [];
  const results: LendingYieldsPoolData[] = [];

  for (const v of vaults) {
    if (!v?.mint || !v?.address) continue;

    // Skip obviously empty or ill-formed entries
    const tvlUsd = Number(v.deposited_funds?.usd ?? 0);
    const apy = Number(v.supply_apy ?? 0) * 100;
    if (!isFinite(apy) || apy < 0) continue;

    // Best-effort token metadata
    const meta = await getTokenMetadata(v.mint, 'solana').catch(() => null);
    const decimals = meta?.decimals ?? (await getMintDecimals(v.mint).catch(() => undefined)) ?? 6;
    const symbol = meta?.symbol || (meta?.name ? meta.name.toUpperCase() : 'TUNA');
    const name = meta?.name || symbol;

    // Require TVL >= $1,000,000 to surface
    if (tvlUsd < 1_000_000) {
      continue;
    }

    results.push({
      name,
      symbol,
      yield: apy,
      apyBase: apy,
      apyReward: 0,
      tvlUsd: tvlUsd > 0 ? tvlUsd : 0,
      project: 'defituna',
      poolMeta: v.address,
      url: undefined,
      rewardTokens: [],
      underlyingTokens: [v.mint],
      tokenMintAddress: v.mint,
      predictions: {
        binnedConfidence: tvlUsd >= 100_000_000 ? '3' : tvlUsd >= 10_000_000 ? '2' : '1',
        predictedClass: 'high',
        predictedProbability: 100,
      },
      tokenData: {
        id: v.mint,
        symbol,
        name,
        decimals,
        logoURI: (meta as any)?.logo_uri || (meta as any)?.logo,
      },
    });
  }

  return results;
}
