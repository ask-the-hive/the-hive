import { Token } from '@/db/types/token';
import { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';

/**
 * Unified lending position type that works across all protocols
 * This is a regular TypeScript type (not a DB type) since we fetch directly from onchain
 */
export interface LendingPosition {
  walletAddress: string;
  chainId: string;
  amount: number; // Deposit amount in human-readable format (current balance)
  token: Token; // Token being lent
  poolData: LendingYieldsPoolData; // Pool metadata (APY, TVL, etc.)
  protocol: string; // Protocol name (e.g., 'kamino-lend')
}
