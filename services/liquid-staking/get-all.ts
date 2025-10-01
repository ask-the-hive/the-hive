import type { LiquidStakingPosition } from '@/db/types';

export async function getAllLiquidStakingPositions(walletAddress: string) {
  const res = await fetch(`/api/liquid-staking-positions/${walletAddress}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch liquid staking positions');
  }
  return res.json() as Promise<LiquidStakingPosition[]>;
}
