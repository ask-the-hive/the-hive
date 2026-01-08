import { getTokenPairs } from '@/services/moralis';
import { getToken, getTokenBySymbol } from '@/db/services';
import { searchTokens } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import { isEvmAddress } from '@/lib/address';
import type { GetPoolsArgumentsType, GetPoolsResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';

/**
 * Gets the liquidity pools for a Base token.
 *
 * @param args - The input arguments for the action
 * @returns A message containing the token pools data
 */
export async function getPools(
  args: GetPoolsArgumentsType,
): Promise<BaseActionResult<GetPoolsResultBodyType>> {
  try {
    if (args.address) {
      const token = await getToken(args.address);

      if (!token) throw new Error('No token data found');

      const pairs = await getTokenPairs(args.address, 'base');

      return {
        body: {
          pools: pairs,
        },
        message: `Found pools for ${args.address}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
      };
    } else if (args.ticker) {
      try {
        console.log(
          `[Base Liquidity] Searching for token with Birdeye: ${args.ticker} on Base chain`,
        );
        const searchResult = await searchTokens({
          keyword: args.ticker,
          target: 'token',
          sort_by: 'volume_24h_usd',
          sort_type: 'desc',
          offset: 0,
          limit: 10,
          chain: 'base',
        });

        console.log(
          `[Base Liquidity] Birdeye search result:`,
          JSON.stringify(searchResult, null, 2),
        );

        const token = searchResult?.items?.[0]?.result?.[0];
        console.log(`[Base Liquidity] Extracted token:`, token);

        if (token) {
          console.log(
            `[Base Liquidity] Found token via Birdeye: ${token.name} (${token.symbol}) with address: ${token.address} on network: ${token.network}`,
          );

          if (!isEvmAddress(token.address)) {
            console.error(
              `[Base Liquidity] Invalid token address format: ${token.address} (expected Ethereum hex address)`,
            );
            throw new Error(`Invalid token address format: ${token.address}`);
          }

          if (token.network !== 'base') {
            console.error(
              `[Base Liquidity] Token is from wrong network: ${token.network} (expected 'base')`,
            );
            throw new Error(`Token is from wrong network: ${token.network} (expected 'base')`);
          }

          console.log(`[Base Liquidity] Getting token pairs for Base address: ${token.address}`);
          const pairs = await getTokenPairs(token.address, 'base');

          return {
            body: {
              pools: pairs,
            },
            message: `Found pools for ${token.name} (${token.symbol}). The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
          };
        } else {
          console.log(`[Base Liquidity] No token found via Birdeye search for: ${args.ticker}`);
        }
      } catch (searchError) {
        console.error(`[Base Liquidity] Error searching for token with Birdeye:`, searchError);
      }

      try {
        console.log(`[Base Liquidity] Trying database fallback for: ${args.ticker}`);
        const token = await getTokenBySymbol(args.ticker);

        if (token) {
          console.log(`[Base Liquidity] Found token in database:`, token);

          if (token.id && isEvmAddress(token.id)) {
            console.log(`[Base Liquidity] Using database token with Base address: ${token.id}`);
            const pairs = await getTokenPairs(token.id, 'base');

            return {
              body: {
                pools: pairs,
              },
              message: `Found pools for ${args.ticker}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
            };
          } else {
            console.log(`[Base Liquidity] Database token has invalid address format: ${token.id}`);
          }
        }
      } catch (dbError) {
        console.error(`[Base Liquidity] Error getting token from database:`, dbError);
      }

      throw new Error(`No token data found for ${args.ticker}`);
    } else {
      throw new Error('Invalid input');
    }
  } catch (error) {
    console.error(`[Base Liquidity] Error getting pools:`, error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load pools right now.", error),
    };
  }
}
