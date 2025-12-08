import { KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS } from '@kamino-finance/klend-sdk';
import { createSolanaRpc, address as createAddress } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { normalizeApy } from './apy-utils';

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

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_STALE_MS = 60 * 60 * 1000;

let cachedKaminoPools: KaminoPoolData[] | null = null;
let cachedAt = 0;
let inFlight: Promise<KaminoPoolData[]> | null = null;

type Options = {
  forceRefresh?: boolean;
};

async function fetchAndCache(): Promise<KaminoPoolData[]> {
  const kaminoRpc = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!) as any;
  const marketAddress = createAddress(KAMINO_MAIN_MARKET.toBase58()) as any;
  const programId = createAddress(KAMINO_PROGRAM_ID.toBase58()) as any;
  const market = await KaminoMarket.load(
    kaminoRpc,
    marketAddress,
    DEFAULT_RECENT_SLOT_DURATION_MS,
    programId,
  );
  if (!market) throw new Error('Failed to load Kamino market');

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
  cachedKaminoPools = pools;
  cachedAt = Date.now();
  return pools;
}

async function refreshCache(forceRefresh = false) {
  if (inFlight && !forceRefresh) return inFlight;

  inFlight = fetchAndCache()
    .catch((error) => {
      console.error('❌ Error refreshing Kamino pools cache:', error);
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Fetches Kamino lending pools from on-chain data with stale-while-revalidate caching.
 */
export async function getKaminoPools(options: Options = {}): Promise<KaminoPoolData[]> {
  const now = Date.now();
  const hasCache = Boolean(cachedKaminoPools);
  const isFresh = hasCache && now - cachedAt < CACHE_TTL_MS;
  const isUsable = hasCache && now - cachedAt < MAX_STALE_MS;

  if (!options.forceRefresh && isFresh) return cachedKaminoPools as KaminoPoolData[];

  if (options.forceRefresh || !isUsable) {
    return refreshCache(options.forceRefresh);
  }

  refreshCache().catch((error) =>
    console.error('Background Kamino pools refresh failed:', error),
  );
  return cachedKaminoPools as KaminoPoolData[];
}
