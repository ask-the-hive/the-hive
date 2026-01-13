import { getTrendingTokens as getTrendingTokensBirdeye } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type { GetTrendingTokensArgumentsType, GetTrendingTokensResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';

/**
 * Gets the trending tokens from Birdeye API.
 *
 * @param solanaKit - The Solana agent kit instance
 * @param args - The input arguments for the action
 * @returns A message containing the trending tokens information
 */
export async function getTrendingTokens(
  args: GetTrendingTokensArgumentsType,
): Promise<SolanaActionResult<GetTrendingTokensResultBodyType>> {
  try {
    const response = await getTrendingTokensBirdeye(0, args.limit);

    return {
      message: `Found ${response.tokens.length} trending tokens. The user is shown the tokens, do not list them. Ask the user what they want to do with the coin.`,
      body: {
        tokens: response.tokens,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load trending tokens right now.", error),
      body: {
        tokens: [],
      },
    };
  }
}
