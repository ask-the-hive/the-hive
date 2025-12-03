import { searchTokens, getTokenOverview } from '@/services/birdeye';
import { NextRequest, NextResponse } from 'next/server';
import { ChainType } from '@/app/_contexts/chain-context';
import type { TokenSearchResult } from '@/services/birdeye/types/search';
import { withErrorHandling } from '@/lib/api-error-handler';

const PLACEHOLDER_ICON = 'https://www.birdeye.so/images/unknown-token-icon.svg';

// Helper to check if a string looks like an address
const isAddress = (query: string): boolean => {
  // Solana addresses are base58 encoded and typically 32-44 characters
  const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);
  // BSC/Base addresses are hex and start with 0x
  const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
  return isSolanaAddress || isEvmAddress;
};

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('query');
  const chain = (searchParams.get('chain') as ChainType) || 'solana';

  if (!query) {
    return NextResponse.json({ tokens: [] });
  }

  // If it looks like an address, preserve case. Otherwise, convert to uppercase for symbol search
  const searchQuery = isAddress(query) ? query : query.toUpperCase();
  let allTokens: TokenSearchResult[] = [];

  const searchResponse = await searchTokens({
    keyword: searchQuery,
    target: 'token',
    search_mode: 'fuzzy',
    search_by: 'combination',
    sort_by: 'liquidity',
    sort_type: 'desc',
    offset: 0,
    limit: 10,
    chain: chain,
  });

  allTokens = searchResponse.items.flatMap((item) => item.result);

  // Remove duplicates based on address
  const uniqueTokens = Array.from(
    new Map(allTokens.map((token) => [token.address, token])).values(),
  );

  const formattedTokens = await Promise.all(
    uniqueTokens.map(async (token) => {
      // If the token doesn't have a logo in search results, try to get it from the overview
      let logoUri = token.logo_uri;
      if (!logoUri || logoUri === PLACEHOLDER_ICON) {
        try {
          const overview = await getTokenOverview(token.address, chain);
          logoUri = overview.logoURI || PLACEHOLDER_ICON;
        } catch (error) {
          console.log(`Failed to fetch overview for token ${token.address}:`, error);
          logoUri = PLACEHOLDER_ICON;
        }
      }

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logo_uri: logoUri,
        price: token.price || 0,
        price_change_24h_percent: token.price_change_24h_percent || 0,
        market_cap: token.market_cap || 0,
        fdv: token.fdv || 0,
      };
    }),
  );

  return NextResponse.json({ tokens: formattedTokens });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { search, chain = 'solana' } = await req.json();

  // If it looks like an address, preserve case. Otherwise, convert to uppercase for symbol search
  const searchQuery = isAddress(search) ? search : search.toUpperCase();
  let allTokenResults: TokenSearchResult[] = [];

  const searchResponse = await searchTokens({
    keyword: searchQuery,
    target: 'token',
    search_mode: 'fuzzy',
    search_by: 'combination',
    sort_by: 'liquidity',
    sort_type: 'desc',
    offset: 0,
    limit: 10,
    chain: chain,
  });

  allTokenResults = searchResponse.items.flatMap((item) => item.result);

  // Remove duplicates based on address
  const uniqueTokens = Array.from(
    new Map(allTokenResults.map((token) => [token.address, token])).values(),
  );

  // Enhance tokens with logo information from overview if needed
  const enhancedTokens = await Promise.all(
    uniqueTokens.map(async (token) => {
      // If the token doesn't have a logo in search results, try to get it from the overview
      let logoUri = token.logo_uri;
      if (!logoUri || logoUri === PLACEHOLDER_ICON) {
        try {
          const overview = await getTokenOverview(token.address, chain);
          logoUri = overview.logoURI || PLACEHOLDER_ICON;
        } catch (error) {
          console.log(`Failed to fetch overview for token ${token.address}:`, error);
          logoUri = PLACEHOLDER_ICON;
        }
      }

      return {
        ...token,
        logo_uri: logoUri,
        market_cap: token.market_cap || 0,
        fdv: token.fdv || 0,
      };
    }),
  );

  return NextResponse.json(enhancedTokens);
});
