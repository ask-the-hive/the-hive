import { searchTokens } from '@/services/birdeye/search-tokens';
import { getTokenMetadata } from '@/services/birdeye/get-token-metadata';
import { ChainType } from '@/app/_contexts/chain-context';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const chain = (searchParams.get('chain') as ChainType) || 'solana';

  try {
    // Get top 50 tokens by volume for the chain
    const searchRes = await searchTokens({
      keyword: '',
      offset: 0,
      limit: 20, // Birdeye API only allows 1-20
      chain,
      sort_by: 'volume_24h_usd',
      sort_type: 'desc',
      target: 'token',
    });
    const tokens = searchRes.items[0]?.result || [];

    // Fetch token metadata, but do NOT fetch Twitter mentions
    const tokensWithMeta = [];
    for (const token of tokens) {
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

    // Filter out stablecoins, native token, and wrapped native tokens
    const STABLECOINS = ['USDT', 'USDC'];
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
    const topTokens = tokensWithMeta
      .filter((t) => t.logoURI && t.logoURI !== '')
      .filter((t) => {
        const symbol = (t.symbol || '').toUpperCase();
        return !STABLECOINS.includes(symbol) && symbol !== nativeSymbol && symbol !== wrappedNativeSymbol;
      })
      .slice(0, 9);

    return NextResponse.json({
      tokens: topTokens,
      unsupportedChain: false,
    });
  } catch (error) {
    console.error('Error fetching Twitter trending tokens:', error);
    return NextResponse.json(
      {
        tokens: [],
        error: 'Failed to fetch Twitter trending tokens.',
        unsupportedChain: false,
      },
      { status: 500 }
    );
  }
}; 