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
    let balance: number;

    if (!args.tokenAddress) {
      // Get SOL balance
      balance = (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
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

    let tokenData = null;
    if (args.tokenAddress) {
      try {
        tokenData = await getToken(args.tokenAddress);
      } catch (tokenError) {
        console.log('Error fetching token data:', tokenError);
        tokenData = null;
      }
    }

    const tokenSymbol = tokenData?.symbol ?? '';
    const tokenName = tokenData?.name ?? '';
    const tokenLogoURI =
      tokenData?.logoURI ||
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s';

    // Add programmatic logic for staking context
    let message = `Balance: ${balance} ${tokenSymbol}`;
    if (tokenSymbol === 'SOL' && balance > 0) {
      message += ` (Ready for staking)`;
    } else if (tokenSymbol === 'SOL' && balance === 0) {
      message += ` (Need SOL to stake)`;
    } else if (args.tokenAddress && balance === 0) {
      message += ` (Need ${tokenSymbol} to continue)`;
    }

    console.log('getting Balance result', {
      balance,
      tokenSymbol,
      tokenName,
      tokenLogoURI,
    });
    return {
      message,
      body: {
        balance: balance,
        token: tokenSymbol,
        name: tokenName,
        logoURI: tokenLogoURI,
        // Add programmatic hints for the agent
        canStake: tokenSymbol === 'SOL' && balance > 0,
        needsSOL: tokenSymbol === 'SOL' && balance === 0,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balance: ${error}`,
    };
  }
}
