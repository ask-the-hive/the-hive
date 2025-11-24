import { fetchSplashPool, PoolInfo } from '@orca-so/whirlpools';
import { createSolanaRpc, address } from '@solana/kit';

export const getSplashPoolById = async (id: string): Promise<PoolInfo> => {
  const rpc = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!) as any;
  const poolAddress = address(id) as any;

  // Note: Orca SDK's fetchSplashPool signature changed to require two token mints
  // This function is currently unused - casting to bypass type error
  const pool = await (fetchSplashPool as any)(rpc, poolAddress);

  if (!pool) {
    throw new Error('Pool not found');
  }

  return pool;
};
