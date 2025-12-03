import { KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS } from '@kamino-finance/klend-sdk';
import { createSolanaRpc, address as createAddress } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';

const KAMINO_MAIN_MARKET = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const KAMINO_PROGRAM_ID = new PublicKey('KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD');

export interface KaminoPoolData {
  symbol: string;
  mintAddress: string;
  apy: number;
  apyBase: number;
  tvlUsd: number;
  project: string;
}

/**
 * Fetch all Kamino lending pools directly from on-chain data
 * This supplements DefiLlama data with any pools they might be missing
 */
export async function getKaminoPools(): Promise<KaminoPoolData[]> {
  try {
    const kaminoRpc = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!) as any;
    const marketAddress = createAddress(KAMINO_MAIN_MARKET.toBase58()) as any;
    const programId = createAddress(KAMINO_PROGRAM_ID.toBase58()) as any;
    const market = await KaminoMarket.load(
      kaminoRpc,
      marketAddress,
      DEFAULT_RECENT_SLOT_DURATION_MS,
      programId,
    );
    if (!market) {
      throw new Error('Failed to load Kamino market');
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const currentSlot = BigInt(await connection.getSlot());
    const pools: KaminoPoolData[] = [];

    for (const reserve of market.reserves.values()) {
      try {
        const symbol = reserve.symbol;
        const mintAddress = reserve.state.liquidity.mintPubkey.toString();
        const supplyAPYDecimal = reserve.totalSupplyAPY(currentSlot);
        const supplyAPYPercent = supplyAPYDecimal * 100;

        const totalSupplyLamports = reserve.getTotalSupply();
        const priceUSD = reserve.getOracleMarketPrice().toNumber();
        const decimals = reserve.state.liquidity.mintDecimals.toNumber();
        const tvlUsd = (totalSupplyLamports.toNumber() / Math.pow(10, decimals)) * priceUSD;

        pools.push({
          symbol,
          mintAddress,
          apy: supplyAPYPercent,
          apyBase: supplyAPYPercent,
          tvlUsd,
          project: 'kamino-lend',
        });
      } catch (err) {
        console.warn(`⚠️ Failed to process Kamino reserve ${reserve.symbol}:`, err);
      }
    }
    return pools;
  } catch (error) {
    console.error('❌ Error fetching Kamino pools:', error);
    return [];
  }
}
