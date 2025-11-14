import type { LendingPosition } from '@/types/lending-position';
import type { ChainType } from '@/app/_contexts/chain-context';

/**
 * Fetch all lending positions for a user
 * This is a client-side wrapper that calls the API endpoint
 */
export async function getAllLendingPositions(
  walletAddress: string,
  chain: ChainType = 'solana',
): Promise<LendingPosition[]> {
  if (chain !== 'solana') {
    return [];
  }

  try {
    // Fetch positions from API
    const res = await fetch(`/api/lending-positions/${walletAddress}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch lending positions');
    }
    const positions = (await res.json()) as LendingPosition[];

    return positions;
  } catch (error) {
    console.error('Error fetching lending positions:', error);
    return []; // Return empty array on error, don't break the portfolio page
  }
}
