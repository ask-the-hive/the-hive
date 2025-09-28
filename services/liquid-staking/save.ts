import type { CreateLiquidStakingPositionInput } from '@/db/types';

export async function saveLiquidStakingPosition(input: CreateLiquidStakingPositionInput) {
  const res = await fetch('/api/liquid-staking-positions/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to save position');
  }

  return res.json();
}
