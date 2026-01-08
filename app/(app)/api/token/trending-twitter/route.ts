import { searchTokens } from '@/services/birdeye/search-tokens';
import { getTokenMetadata } from '@/services/birdeye/get-token-metadata';
import { ChainType } from '@/app/_contexts/chain-context';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';
import { isStablecoinSymbol } from '@/lib/yield-support';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const chain = (searchParams.get('chain') as ChainType) || 'solana';
  // Get top tokens by volume (for BSC/Base) or liquidity (for Solana)
  const sortBy = chain === 'solana' ? 'liquidity' : 'volume_24h_usd';

  // Fetch tokens in batches to ensure we get enough after filtering
  let allTokens: any[] = [];
  let offset = 0;
  const batchSize = 20; // Birdeye API limit
  const maxBatches = 3; // Fetch up to 60 tokens to ensure we have enough after filtering

  for (let i = 0; i < maxBatches && allTokens.length < 30; i++) {
    const searchRes = await searchTokens({
      keyword: '',
      offset: offset,
      limit: batchSize,
      chain,
      sort_by: sortBy,
      sort_type: 'desc',
      target: 'token',
    });

    const batchTokens = searchRes.items[0]?.result || [];
    if (batchTokens.length === 0) break; // No more tokens available

    allTokens = allTokens.concat(batchTokens);
    offset += batchSize;
  }

  // Fetch token metadata, but do NOT fetch Twitter mentions
  const tokensWithMeta = [];
  for (const token of allTokens) {
    try {
      const meta = await getTokenMetadata(token.address, chain);
      const twitterUrl = meta.extensions?.twitter;
      let username = null;
      if (twitterUrl) {
        try {
          const url = new URL(twitterUrl);
          const parts = url.pathname.split('/').filter(Boolean);
          if (parts.length > 0) username = parts[0];
        } catch {}
      }
      tokensWithMeta.push({
        ...token,
        logoURI: meta.logo_uri,
        twitterUsername: username || null,
      });
    } catch {
      tokensWithMeta.push({
        ...token,
        logoURI: token.logo_uri || '',
        twitterUsername: null,
      });
    }
  }

  // Filter out stablecoins, native token, wrapped native tokens, and other unwanted tokens
  const NATIVE_TOKENS: Record<ChainType, string> = {
    solana: 'SOL',
    bsc: 'BNB',
    base: 'ETH',
  };
  const WRAPPED_NATIVE: Record<ChainType, string> = {
    solana: '', // No common wrapped SOL
    bsc: 'WBNB',
    base: 'WETH',
  };
  const nativeSymbol = NATIVE_TOKENS[chain] || '';
  const wrappedNativeSymbol = WRAPPED_NATIVE[chain] || '';

  // Filter tokens and get more than needed to account for filtered ones
  const filteredTokens = tokensWithMeta
    .filter((t) => t.logoURI && t.logoURI !== '')
    .filter((t) => {
      const symbol = (t.symbol || '').toUpperCase();
      const name = (t.name || '').toLowerCase();

      // Filter out stablecoins, native tokens, wrapped native tokens, and LST
      if (
        isStablecoinSymbol(symbol) ||
        symbol === nativeSymbol ||
        symbol === wrappedNativeSymbol ||
        symbol === 'LST'
      ) {
        return false;
      }

      // Filter out wrapped tokens
      if (symbol.includes('WRAPPED') || symbol.includes('WETH') || name.includes('wrapped')) {
        return false;
      }

      // Filter out Binance Bitcoin, bridged tokens, and specific unwanted tokens
      if (
        name.includes('binance bitcoin') ||
        name.includes('bridged') ||
        name.includes('bridge') ||
        name.includes('shinobi performance pool token')
      ) {
        return false;
      }

      // Filter out common wrapped token patterns
      if (
        name.includes('wrapped') ||
        (symbol.startsWith('W') &&
          (symbol.includes('ETH') ||
            symbol.includes('BTC') ||
            symbol.includes('SOL') ||
            symbol.includes('BNB')))
      ) {
        return false;
      }

      // Filter out tokens with 'SOL' or 'PUMP' in the name/symbol for Solana chain
      if (
        chain === 'solana' &&
        (name.includes('sol') || symbol.includes('SOL') || symbol === 'PUMP')
      ) {
        return false;
      }

      return true;
    });

  // Take the first 9 tokens after filtering
  const topTokens = filteredTokens.slice(0, 9);

  // Log filtering results for debugging
  console.log(
    `[Twitter Trending] Chain: ${chain}, Total tokens fetched: ${allTokens.length}, After filtering: ${filteredTokens.length}, Final result: ${topTokens.length}`,
  );

  return NextResponse.json({
    tokens: topTokens,
    unsupportedChain: false,
  });
});
