import { seekTradesByTime } from '@/services/birdeye';

import type {
  GetTraderTradesArgumentsType,
  GetTraderTradesResultBodyType,
  TokenTraded,
} from './types';
import type { SolanaActionResult } from '../../solana-action';
import { getToken } from '@/db/services';
import { Token } from '@/db/types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

/**
 * Gets the trending tokens from Birdeye API.
 *
 * @param solanaKit - The Solana agent kit instance
 * @param args - The input arguments for the action
 * @returns A message containing the trending tokens information
 */
export async function getTraderTrades(
  args: GetTraderTradesArgumentsType,
): Promise<SolanaActionResult<GetTraderTradesResultBodyType>> {
  try {
    const response = await seekTradesByTime({
      address: args.address,
      offset: 0,
      limit: 100,
    });

    const tokensTradedData: Record<string, Omit<TokenTraded, 'token'>> = {};

    // Helper function to update token data
    const updateTokenData = (
      tokenAddress: string,
      trade: { ui_change_amount: number; nearest_price: number },
    ) => {
      const amount = trade.ui_change_amount;
      const absoluteAmount = Math.abs(amount);
      const value = absoluteAmount * (trade.nearest_price || 0);

      if (tokensTradedData[tokenAddress]) {
        // Update existing token data
        tokensTradedData[tokenAddress].volume.buy += amount > 0 ? value : 0;
        tokensTradedData[tokenAddress].volume.sell += amount < 0 ? value : 0;
        tokensTradedData[tokenAddress].balanceChange += amount;
        tokensTradedData[tokenAddress].usdChange += amount * trade.nearest_price;
      } else {
        // Create new token data
        tokensTradedData[tokenAddress] = {
          volume: {
            buy: amount > 0 ? value : 0,
            sell: amount < 0 ? value : 0,
          },
          balanceChange: amount,
          usdChange: amount * (trade.nearest_price || 0),
        };
      }
    };

    response.items.forEach((trade) => {
      // Handle quote token
      updateTokenData(trade.quote.address, trade.quote);

      // Handle base token
      updateTokenData(trade.base.address, trade.base);
    });

    const tokensTraded = (
      await Promise.all(
        Object.entries(tokensTradedData).map(async ([address, data]) => {
          try {
            // Try to get token from database first
            const token = (await getToken(address)) as Token;
            if (token) {
              return {
                token,
                ...data,
              };
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${address}:`, error);
          }

          // If database lookup fails, create token from trade data
          // Find token info from trades
          const tradeInfo = response.items.find(
            (item) => item.base.address === address || item.quote.address === address,
          );

          if (!tradeInfo) return null;

          const tokenInfo = tradeInfo.base.address === address ? tradeInfo.base : tradeInfo.quote;
          const token: Token = {
            id: address,
            name: tokenInfo.symbol,
            symbol: tokenInfo.symbol.toUpperCase(),
            decimals: tokenInfo.decimals,
            logoURI: 'https://public-api.birdeye.so/unknown.png',
            tags: [],
            freezeAuthority: null,
            mintAuthority: null,
            permanentDelegate: null,
            extensions: {},
          };

          return {
            token,
            ...data,
          };
        }),
      )
    )
      .filter((item): item is TokenTraded => item !== null) // Filter out null values
      .reduce(
        (acc, curr) => {
          acc[curr.token.id] = curr;
          return acc;
        },
        {} as Record<string, TokenTraded>,
      );

    return {
      message: `Found ${response.items.length} trades for the trader. The user is shown the trades, do not list them. Ask the user what they want to do with the trades.`,
      body: {
        tokensTraded,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load trades right now.", error),
      body: {
        tokensTraded: {},
      },
    };
  }
}
