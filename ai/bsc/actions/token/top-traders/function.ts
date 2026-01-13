import { searchTokens, getTopTradersByToken } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import type { TopTokenTradersArgumentsType, TopTokenTradersResultBodyType } from './types';
import type { BscActionResult } from '../../bsc-action';

export async function getTopTokenTraders(
  args: TopTokenTradersArgumentsType,
): Promise<BscActionResult<TopTokenTradersResultBodyType>> {
  try {
    const { items } = await searchTokens({
      keyword: args.search,
      target: 'token',
      sort_by: 'volume_24h_usd',
      sort_type: 'desc',
      offset: 0,
      limit: 10,
      chain: 'bsc',
    });

    const token = items?.[0]?.result?.[0];

    if (!token) {
      return {
        message: `No token found for ${args.search} on BSC`,
      };
    }

    const topTraders = await getTopTradersByToken({
      address: token.address,
      timeFrame: args.timeFrame,
      chain: 'bsc',
    });

    return {
      message: `Found top traders for ${token.name} (${token.symbol}) on BSC. The top traders have been displayed to the user. Now ask them what they want to do next. DO NOT REPEAT THE RESULTS OF THIS TOOL.`,
      body: {
        topTraders: topTraders.items,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load top traders right now.", error),
    };
  }
}
