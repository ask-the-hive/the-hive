'use client';

export interface LiquidStakingPoolData {
  project: string;
  symbol: string;
  yield: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  url?: string;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  poolMeta?: string;
  predictions?: any;
}

export async function getLiquidStakingPool(
  project: string,
  symbol: string,
): Promise<LiquidStakingPoolData> {
  const params = new URLSearchParams({
    project,
    symbol,
  });

  const res = await fetch(`/api/liquid-staking-pool?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch pool data');
  }

  return res.json();
}
