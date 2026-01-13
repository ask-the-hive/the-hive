import { ethers } from 'ethers';
import { getToken } from '@/db/services';
import type { AllBalancesArgumentsType, AllBalancesResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';
import { getBaseProvider } from '../../../provider';
import { getTokenMetadata, getTokenOverview } from '@/services/birdeye';
import type { ChainType } from '@/app/_contexts/chain-context';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function allBalances(
  args: AllBalancesArgumentsType,
): Promise<BaseActionResult<AllBalancesResultBodyType>> {
  try {
    const provider = getBaseProvider();
    const balances: AllBalancesResultBodyType['balances'] = [];

    const ethBalance = await provider.getBalance(args.walletAddress);
    const ethBalanceFormatted = Number(ethers.formatEther(ethBalance));

    const ethMetadata = await getTokenMetadata(
      '0x0000000000000000000000000000000000000000',
      'base' as ChainType,
    );
    const ethOverview = await getTokenOverview(
      '0x0000000000000000000000000000000000000000',
      'base' as ChainType,
    );
    const ethUsdPrice = ethOverview?.price || 0;
    const ethPercentChange = ethOverview?.priceChange24hPercent || 0;

    let ethLogoURI = ethMetadata?.logo_uri || '';
    if (!ethLogoURI) {
      const dbToken = await getToken('0x0000000000000000000000000000000000000000');
      ethLogoURI =
        dbToken?.logoURI || 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
    }

    balances.push({
      balance: ethBalanceFormatted,
      token: 'ETH',
      name: 'Ethereum',
      usdValue: ethBalanceFormatted * ethUsdPrice,
      usdPrice: ethUsdPrice,
      percentChange24h: ethPercentChange,
      logoURI: ethLogoURI,
    });

    return {
      message: 'Balances shown above. Pick a token to trade or explore next.',
      body: {
        balances,
      },
    };
  } catch (error) {
    console.error('Error in allBalances function:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load wallet balances right now.", error),
      body: {
        balances: [],
      },
    };
  }
}
