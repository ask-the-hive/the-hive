import type { AllBalancesArgumentsType, AllBalancesResultBodyType } from './types';
import type { BscActionResult } from '../../bsc-action';
import { getAllBalances as getMoralisBalances } from '@/services/moralis/get-all-balances';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function getAllBalances(
  args: AllBalancesArgumentsType,
): Promise<BscActionResult<AllBalancesResultBodyType>> {
  try {
    console.log('Getting balances for wallet:', args.walletAddress);
    const response = await getMoralisBalances(args.walletAddress);
    console.log('Moralis service response:', response);

    if (!response?.result || response.result.length === 0) {
      console.log('No tokens found');
      return {
        message: `No balances found for wallet: ${args.walletAddress}`,
        body: {
          balances: [],
        },
      };
    }

    console.log('Number of tokens found:', response.result.length);
    const balances = response.result.map((token) => ({
      balance: Number(token.balance_formatted),
      token: token.symbol,
      name: token.name,
      logoURI: token.logo || token.thumbnail || '',
      usdValue: token.usd_value,
      usdPrice: token.usd_price,
      percentChange24h: token.usd_price_24hr_percent_change,
    }));
    console.log('Processed balances:', balances);

    return {
      message: 'Balances shown above. Pick a token to trade or explore next.',
      body: {
        balances,
      },
    };
  } catch (error) {
    console.error('Error in getAllBalances:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load wallet balances right now.", error),
      body: {
        balances: [],
      },
    };
  }
}
