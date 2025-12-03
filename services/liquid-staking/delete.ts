'use client';

export async function deleteLiquidStakingPosition(id: string, walletAddress: string) {
  const params = new URLSearchParams({
    id,
    walletAddress,
  });

  const res = await fetch(`/api/liquid-staking-positions/delete?${params.toString()}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to delete liquid staking position');
  }

  return res.json();
}
