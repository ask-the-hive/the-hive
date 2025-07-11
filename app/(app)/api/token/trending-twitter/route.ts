import { searchTokens } from '@/services/birdeye/search-tokens';
import { getTokenMetadata } from '@/services/birdeye/get-token-metadata';
import { ChainType } from '@/app/_contexts/chain-context';
import { NextRequest, NextResponse } from 'next/server';
import { getNumMentions } from '@/services/twitter/get-num-mentions';

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

    // Fetch Twitter mentions sequentially to avoid rate limits
    const tokensWithMentions = [];
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
        let mentions = 0;
        if (username) {
          try {
            const countRes = await getNumMentions(username);
            mentions = countRes?.meta?.total_tweet_count || 0;
          } catch {
            mentions = 0;
          }
          // Add a delay to avoid rate limits
          await new Promise(res => setTimeout(res, 400));
        }
        tokensWithMentions.push({
          ...token,
          logoURI: meta.logo_uri,
          mentions,
        });
      } catch {
        tokensWithMentions.push({
          ...token,
          logoURI: token.logo_uri || '',
          mentions: 0,
        });
      }
    }

    // Sort by mentions and take top 9, but include tokens with a Twitter account even if mentions is 0
    const topByMentions = tokensWithMentions
      .filter((t) => t.logoURI && t.logoURI !== '' && t.mentions !== undefined && t.mentions !== null && t.mentions >= 0)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 9);

    return NextResponse.json({
      tokens: topByMentions,
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