import { LAMPORTS_PER_SOL, PublicKey, Connection } from '@solana/web3.js';

import { getAssociatedTokenAddressSync } from '@solana/spl-token';

import type { BalanceArgumentsType, BalanceResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';
import { getToken } from '@/db/services';

export async function getBalance(
  connection: Connection,
  args: BalanceArgumentsType,
): Promise<SolanaActionResult<BalanceResultBodyType>> {
  try {
    console.log('getBalance called with args:', args);
    let balance: number;
    let tokenData = null;

    if (!args.tokenAddress) {
      // Get SOL balance
      console.log('No tokenAddress provided, fetching SOL balance');
      balance = (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
      tokenData = {
        symbol: 'SOL',
        name: 'Solana',
        logoURI:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s',
      };
    } else {
      // Get token balance
      const token_address = getAssociatedTokenAddressSync(
        new PublicKey(args.tokenAddress),
        new PublicKey(args.walletAddress),
      );

      try {
        const token_account = await connection.getTokenAccountBalance(token_address);
        balance = token_account.value.uiAmount ?? 0;
      } catch (tokenError) {
        // Token account doesn't exist, balance is 0
        console.log('Token account does not exist, balance is 0:', tokenError);
        balance = 0;
      }
    }

    if (args.tokenAddress) {
      console.log('Fetching token data for address:', args.tokenAddress);
      try {
        tokenData = await getToken(args.tokenAddress);
        console.log('Token data fetched successfully:', tokenData);
      } catch (tokenError) {
        console.log('Error fetching token data:', tokenError);
        tokenData = null;
      }
    } else {
      console.log('Skipping token data fetch - no tokenAddress provided (checking SOL balance)');
    }

    // When no tokenAddress is provided, we're checking SOL balance, so default to SOL metadata
    const tokenSymbol = tokenData?.symbol || 'SOL';
    const tokenName = tokenData?.name || 'Solana';
    const tokenLogoURI =
      tokenData?.logoURI ||
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s';

    console.log('Final token values:', { tokenSymbol, tokenName, tokenLogoURI, balance });

    // Add programmatic logic for staking context
    let message = `Balance: ${balance} ${tokenSymbol}`;
    if (tokenSymbol === 'SOL' && balance > 0.00001) {
      message += ` (Ready for staking)`;
    } else if (tokenSymbol === 'SOL' && balance <= 0.00001) {
      message += ` (Need SOL to stake)`;
    } else if (args.tokenAddress && balance === 0) {
      message += ` (Need ${tokenSymbol} to continue)`;
    }

    return {
      message,
      body: {
        balance: balance,
        token: tokenSymbol,
        name: tokenName,
        logoURI: tokenLogoURI,
        // Add programmatic hints for the agent
        canStake: tokenSymbol === 'SOL' && balance > 0.00001,
        needsSOL: tokenSymbol === 'SOL' && balance <= 0.00001,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balance: ${error}`,
    };
  }
}
