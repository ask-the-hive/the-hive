'use client';

import { useChain, ChainType } from '@/app/_contexts/chain-context';
import { getTokenMetadataBySymbol } from '@/services/coingecko/get-token-metadata-by-symbol';
import useSWR from 'swr';

const baseTokens = {
  ETH: '0x4200000000000000000000000000000000000006', // Use WETH address for ETH for CoinGecko compatibility
  WETH: '0x4200000000000000000000000000000000000006',
  USDbC: '0xd9aaEC86B65d86f6A7B5b1b0c42FFA531710b6CA',
  DAI: '0xF14F9596430931E177469715c591513308244e8F',
  WBTC: '0xA2f1CCba9395d7fcb155BBA8BC92DB9bAFaeade7',
  CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  AERO: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
  cbETH: '0x1d1906f909CAe494c7441604DAfDDDbD0485A925',
  wstETH: '0x4e9f683A27a6BdAD3FC2764003759277e93696eA',
  axlUSDC: '0xEB466342C4d449BC9f53A865D5Cb90586f405215',
  crvUSD: '0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93',
  UNI: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
  BAL: '0xF8d2A7A0cE2b2043614eD3A1bC6A0bD984F7b2eD',
  COMP: '0x22D63A26C730D49e5E0bC0b1F1c9e2D1f3B48bA3',
  LINK: '0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196',
  SPX: '0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c',
  FTN: '0xaedf386b755465871ff874e3e37af5976e247064',
  AAVE: '0x63706e401c06ac8513145b7687a14804d17f814b',
  USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  DOT: '0x8d010bf9c26881788b4e6bf5fd1bdc358c8f90b8',
  CBETH: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
  APL: '0xb55fcd62ed44253c45735bde6703c44100935747',
  ZORA: '0x1111111111166b7fe7bd91427724b487980afc69',
  BASED: '0x07d15798a67253D76cea61F0eA6F57AeDC59DffB', // BASED token
};

const solanaTokens = {
  // Canonical SPL mints
  SOL: 'So11111111111111111111111111111111111111112', // wSOL mint
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11yWf3bD1K3mKb',
};

export const ASSET_MAP: Record<string, Record<string, string>> = {
  base: baseTokens,
  solana: solanaTokens,
  bsc: {},
};

function resolveAssetSymbol(symbol: string, networkId: ChainType): string | null {
  return ASSET_MAP[networkId]?.[symbol.toUpperCase()] || null;
}

// In-memory cache for API lookups
const coingeckoCache: Record<string, string> = {};

/**
 * Client-only resolver used by the SWR hook in this file
 */
async function resolveAssetSymbolToAddressClient(
  symbol: string,
  chain: ChainType,
): Promise<string | null> {
  // 1. Check hardcoded map
  const fromMap = resolveAssetSymbol(symbol, chain);
  if (fromMap) return fromMap;

  // 2. Check cache
  const cacheKey = `${chain}:${symbol.toUpperCase()}`;
  if (coingeckoCache[cacheKey]) return coingeckoCache[cacheKey];

  // 3. Query CoinGecko API for Base tokens
  try {
    const data = await getTokenMetadataBySymbol(symbol);
    const contractAddress = (data as any)?.platforms && (data as any)?.platforms?.[chain];
    if (contractAddress && typeof contractAddress === 'string' && contractAddress.length > 0) {
      return contractAddress;
    } else {
      // Gracefully return null when address cannot be resolved
      return null;
    }
  } catch {
    // Silence lookup failures; return null so callers can fall back
    return null;
  }
  return null;
}

/**
 * SWR hook: resolve asset symbol to address with caching
 * Mirrors the pattern used in useTokenMetadata
 */
export function useResolveAssetSymbolToAddress(symbol: string) {
  const { currentChain } = useChain();
  const key = symbol ? ['resolve-asset-address', currentChain, symbol.toUpperCase()] : null;

  const fetcher = async () => {
    try {
      const address = await resolveAssetSymbolToAddressClient(symbol, currentChain);
      return address;
    } catch (error) {
      // Surface the error to SWR
      throw error;
    }
  };

  const { data, isLoading, error } = useSWR<string | null>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
