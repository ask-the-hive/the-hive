import 'server-only';

import { searchTokens } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { getTokenMetadataBySymbol } from '@/services/coingecko/get-token-metadata-by-symbol';
import type { TokenSearchResult } from '@/services/birdeye/types/search';
import { ASSET_MAP } from '@/services/tokens/asset-map';

// Map ChainType to CoinGecko platforms key
function mapChainToCoingeckoPlatform(chain: ChainType): string {
  switch (chain) {
    case 'solana':
      return 'solana';
    case 'base':
      return 'base';
    case 'bsc':
      return 'binance-smart-chain';
    default:
      return chain;
  }
}

/**
 * Server-only resolver for a canonical/routable contract address by symbol.
 * Order:
 * 1) Canonical map by chain (quick wins)
 * 2) CoinGecko platforms[chain]
 * 3) Birdeye search (Solana only): exact symbol, prefer verified, then highest liquidity
 */
export async function resolveAssetSymbolToAddress(
  symbol: string,
  chain: ChainType = 'solana',
): Promise<string | null> {
  if (!symbol) return null;
  const upper = symbol.toUpperCase();

  // 1) Canonical quick wins
  const canonicalMap = ASSET_MAP[chain];
  if (canonicalMap && canonicalMap[upper]) {
    return canonicalMap[upper];
  }

  // 2) CoinGecko platform address
  try {
    const data = await getTokenMetadataBySymbol(symbol);
    const platformKey = mapChainToCoingeckoPlatform(chain);
    const platformAddress = data?.platforms?.[platformKey];
    if (platformAddress && typeof platformAddress === 'string' && platformAddress.length > 0) {
      return platformAddress;
    }
  } catch (e) {
    console.error('[resolveAssetSymbolToAddress] CoinGecko error:', e);
  }

  // 3) Birdeye fallback
  try {
    const { items } = await searchTokens({
      keyword: upper,
      target: 'token',
      sort_by: 'liquidity',
      sort_type: 'desc',
      offset: 0,
      limit: 20,
      chain,
    });

    const candidates: TokenSearchResult[] = items?.[0]?.result || [];
    const exact = candidates.filter((c) => c.symbol?.toUpperCase() === upper);

    // If there is exactly one exact match, return it immediately
    if (exact.length === 1) {
      return exact[0]?.address;
    }

    const pool: TokenSearchResult[] = exact.length > 0 ? exact : candidates;
    const verified = pool.filter((c) => c.verified);
    const preferred = (verified.length > 0 ? verified : pool).sort(
      (a, b) => (b.liquidity || 0) - (a.liquidity || 0),
    );

    const addr = preferred[0]?.address;
    if (addr && typeof addr === 'string' && addr.length > 30) {
      return addr;
    }
  } catch (e) {
    console.error('[resolveAssetSymbolToAddress] Birdeye search error:', e);
  }

  return null;
}
