import { searchTokens } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import type { BubbleMapsArgumentsType, BubbleMapsResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';

export async function getBubbleMaps(
  args: BubbleMapsArgumentsType,
): Promise<BaseActionResult<BubbleMapsResultBodyType>> {
  try {
    console.log(`[Base Bubble Maps] Searching for token: ${args.search}`);

    const { items } = await searchTokens({
      keyword: args.search,
      target: 'token',
      sort_by: 'volume_24h_usd',
      sort_type: 'desc',
      offset: 0,
      limit: 10,
      chain: 'base',
    });

    const token = items?.[0]?.result?.[0];

    if (!token) {
      console.log(`[Base Bubble Maps] No token found for: ${args.search}`);
      return {
        message: `No token found for ${args.search} on Base`,
      };
    }

    console.log(
      `[Base Bubble Maps] Found token: ${token.name} (${token.symbol}) with address: ${token.address}`,
    );

    const chainName = 'base';

    const partnerId = process.env.BUBBLE_MAPS_PARTNER_ID;
    if (!partnerId) {
      console.error('BUBBLE_MAPS_PARTNER_ID is not set in environment variables');
      return {
        message: "Bubble maps isn't available right now.",
        body: {
          success: false,
          url: '',
        },
      };
    }
    const bubbleMapUrl = `https://iframe.bubblemaps.io/map?address=${token.address}&chain=${chainName}&partnerId=${partnerId}`;
    console.log(`[Base Bubble Maps] Generated bubble map URL: ${bubbleMapUrl}`);

    return {
      message: `Bubble map for ${token.name} (${token.symbol}) on Base.`,
      body: {
        success: true,
        url: bubbleMapUrl,
      },
    };
  } catch (error) {
    console.error('[Base Bubble Maps] Error:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load the bubble map right now.", error),
      body: {
        success: false,
        url: '',
      },
    };
  }
}
