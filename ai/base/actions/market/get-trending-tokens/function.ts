import { getTrendingTokens as getTrendingTokensBirdeye } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import type { GetTrendingTokensArgumentsType, GetTrendingTokensResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';

export async function getTrendingTokens(
  args: GetTrendingTokensArgumentsType,
): Promise<BaseActionResult<GetTrendingTokensResultBodyType>> {
  try {
    const response = await getTrendingTokensBirdeye(0, 10, 'base');

    return {
      message: `Found ${response.tokens.length} trending tokens on Base. The user is shown the tokens, do not list them. Ask the user what they want to do with the coin.`,
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
