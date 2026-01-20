import { Connection } from '@solana/web3.js';

import { SolanaGlobalYieldsAction } from '@/ai/solana/actions/yield';
import { SOLANA_GLOBAL_YIELDS_ACTION } from '@/ai/solana/actions/yield/names';
import { solanaTool } from '@/ai/solana';

export const YIELD_TOOLS = {
  [`yield-${SOLANA_GLOBAL_YIELDS_ACTION}`]: solanaTool(
    new SolanaGlobalYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};
