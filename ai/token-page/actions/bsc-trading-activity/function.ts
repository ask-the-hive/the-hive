import { getTopTradersByToken, getTokenOverview } from '@/services/birdeye';
import {
  TopTradersByTokenTimeFrame,
  TopTradersByTokenSortBy,
  TopTradersByTokenSortType,
} from '@/services/birdeye/types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type { SolanaActionResult } from '../../../solana/actions/solana-action';
import type { TokenChatData } from '@/types';

// Using the same types as the Solana top traders function
export type TokenPageTradingActivityArgumentsType = object;

export interface TokenPageTradingActivityResultBodyType {
  topTraders: any[];
  volume24h: number;
  volumeChange: number;
  tradeCount: number;
  averageTradeSize: number;
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else {
    return num.toFixed(2);
  }
}

// Helper function to describe volume
function describeVolume(volume: number): string {
  if (volume > 1000000) {
    return 'very high trading volume';
  } else if (volume > 500000) {
    return 'high trading volume';
  } else if (volume > 100000) {
    return 'moderate trading volume';
  } else if (volume > 10000) {
    return 'low trading volume';
  } else {
    return 'very low trading volume';
  }
}

export async function getBSCTokenPageTradingActivity(
  token: TokenChatData,
  _: TokenPageTradingActivityArgumentsType,
): Promise<SolanaActionResult<TokenPageTradingActivityResultBodyType>> {
  try {
    // Get token overview for volume data
    const overview = await getTokenOverview(token.address, 'bsc');

    if (!overview) {
      return {
        message: `Could not find trading data for this BSC token.`,
        body: {
          topTraders: [],
          volume24h: 0,
          volumeChange: 0,
          tradeCount: 0,
          averageTradeSize: 0,
        },
      };
    }

    // Get top traders data
    const topTradersResponse = await getTopTradersByToken({
      address: token.address,
      timeFrame: TopTradersByTokenTimeFrame.TwentyFourHours,
      sortBy: TopTradersByTokenSortBy.Volume,
      sortType: TopTradersByTokenSortType.Descending,
      offset: 0,
      limit: 10,
      chain: 'bsc',
    });

    // Ensure we have items array and format trader data
    const topTraders = (topTradersResponse?.items || []).map((trader) => ({
      address: trader.owner || 'Unknown',
      volume: trader.volume || 0,
    }));

    // Calculate metrics
    const volume24h = overview.v24hUSD || 0;
    const volumeChange = overview.v24hChangePercent || 0;
    const tradeCount = overview.trade24h || 0;
    const averageTradeSize = tradeCount > 0 ? volume24h / tradeCount : 0;

    // Format numbers for display
    const formattedVolume = formatNumber(volume24h);
    const formattedAvgSize = formatNumber(averageTradeSize);

    return {
      message: `Trading Activity Analysis for ${token.symbol}:

1. 24h Trading Volume: $${formattedVolume}
2. Volume Change: ${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(2)}%
3. Number of Trades: ${tradeCount}
4. Average Trade Size: $${formattedAvgSize}

The token shows ${describeVolume(volume24h)} with ${describeTraderActivity(tradeCount)} in the last 24 hours.

Note: The top traders for this token are displayed in the UI. DO NOT list or reiterate the top traders in your response.`,
      body: {
        topTraders: topTraders,
        volume24h,
        volumeChange,
        tradeCount,
        averageTradeSize,
      },
    };
  } catch (error) {
    console.error(`Error analyzing trading activity: ${error}`);
    return {
      message: toUserFacingErrorTextWithContext(
        "Couldn't analyze trading activity right now.",
        error,
      ),
      body: {
        topTraders: [],
        volume24h: 0,
        volumeChange: 0,
        tradeCount: 0,
        averageTradeSize: 0,
      },
    };
  }
}

// Helper function to describe trader activity
function describeTraderActivity(tradeCount: number): string {
  if (tradeCount > 1000) {
    return 'very active trading';
  } else if (tradeCount > 500) {
    return 'active trading';
  } else if (tradeCount > 100) {
    return 'moderate trading activity';
  } else if (tradeCount > 10) {
    return 'low trading activity';
  } else {
    return 'very little trading activity';
  }
}
