import { ethers } from 'ethers';
import { getToken } from '@/db/services';
import type { BalanceArgumentsType, BalanceResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';
import { getBaseProvider } from '../../../provider';
import { BaseGetTokenAddressAction } from '../../token/get-token-address';
import { getTokenMetadata } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export async function getBalance(
  args: BalanceArgumentsType,
): Promise<BaseActionResult<BalanceResultBodyType>> {
  try {
    const provider = getBaseProvider();
    let balance: number;
    let tokenAddress: string | null = null;
    let tokenSymbol: string;
    let tokenName: string;
    let tokenLogoURI: string;

    if (args.tokenSymbol) {
      console.log(`Getting address for token symbol: ${args.tokenSymbol}`);
      const getTokenAddressAction = new BaseGetTokenAddressAction();
      const result = await getTokenAddressAction.func({ keyword: args.tokenSymbol });

      if (!result.body?.address) {
        return {
          message: `Could not find token address for symbol: ${args.tokenSymbol}`,
        };
      }
      tokenAddress = result.body.address;
      console.log(`Found token address: ${tokenAddress}`);
    } else if (args.tokenAddress) {
      tokenAddress = args.tokenAddress;
    }

    if (!tokenAddress) {
      console.log(`Getting ETH balance for: ${args.walletAddress}`);
      const rawBalance = await provider.getBalance(args.walletAddress);
      balance = Number(ethers.formatEther(rawBalance));
      tokenSymbol = 'ETH';
      tokenName = 'Ethereum';
      tokenLogoURI = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
    } else {
      console.log(`Getting token balance for address: ${tokenAddress}`);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      try {
        const decimals = await contract.decimals();
        const rawBalance = await contract.balanceOf(args.walletAddress);
        balance = Number(ethers.formatUnits(rawBalance, decimals));

        console.log(`Fetching token metadata from Birdeye for: ${tokenAddress}`);
        const tokenMetadata = await getTokenMetadata(tokenAddress, 'base');
        console.log('Birdeye token metadata:', tokenMetadata);

        if (tokenMetadata) {
          tokenSymbol = tokenMetadata.symbol.toUpperCase();
          tokenName = tokenMetadata.name;
          tokenLogoURI = tokenMetadata.logo_uri || '';

          if (!tokenLogoURI) {
            console.log(`No logo from Birdeye, trying database for: ${tokenAddress}`);
            const dbToken = await getToken(tokenAddress);
            if (dbToken?.logoURI) {
              console.log(`Found logo in database: ${dbToken.logoURI}`);
              tokenLogoURI = dbToken.logoURI;
            }
          }

          console.log(
            `Final token data - Symbol: ${tokenSymbol}, Name: ${tokenName}, Logo: ${tokenLogoURI}`,
          );
        } else {
          console.log(`No Birdeye data, falling back to contract for: ${tokenAddress}`);
          tokenSymbol = (await contract.symbol()).toUpperCase();
          tokenName = await contract.name();
          tokenLogoURI = '';

          const dbToken = await getToken(tokenAddress);
          if (dbToken?.logoURI) {
            console.log(`Found logo in database: ${dbToken.logoURI}`);
            tokenLogoURI = dbToken.logoURI;
          }
        }
      } catch (e) {
        console.error('Error getting token data:', e);
        return {
          message: toUserFacingErrorTextWithContext("Couldn't load token data right now.", e),
        };
      }
    }

    return {
      message: `Balance: ${balance} ${tokenSymbol}`,
      body: {
        balance,
        token: tokenSymbol,
        name: tokenName,
        logoURI: tokenLogoURI || '',
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load that balance right now.", error),
    };
  }
}
