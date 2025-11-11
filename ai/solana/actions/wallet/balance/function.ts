import { LAMPORTS_PER_SOL, PublicKey, Connection } from '@solana/web3.js';

import { getAssociatedTokenAddressSync } from '@solana/spl-token';

import type { BalanceArgumentsType, BalanceResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';
import { getToken } from '@/db/services';

// SOL native mint address - when this is passed, check native SOL balance
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function getBalance(
  connection: Connection,
  args: BalanceArgumentsType,
): Promise<SolanaActionResult<BalanceResultBodyType>> {
  try {
    // Validate wallet address is provided
    if (!args.walletAddress || typeof args.walletAddress !== 'string') {
      return {
        message: `Error: Wallet address is required to check balance. Please connect your wallet first.`,
        body: undefined,
      };
    }

    let balance: number;
    let tokenData = null;

    // Check if we're looking for SOL balance (either no tokenAddress or SOL mint address)
    const isCheckingSOL = !args.tokenAddress || args.tokenAddress === SOL_MINT;

    if (isCheckingSOL) {
      // Get native SOL balance
      balance = (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
      console.log('✅ Native SOL balance:', balance);
      tokenData = {
        symbol: 'SOL',
        name: 'Solana',
        logoURI:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s',
      };
    } else {
      // Get SPL token balance
      if (!args.tokenAddress) {
        throw new Error('Token address is required for SPL token balance check');
      }
      const token_address = getAssociatedTokenAddressSync(
        new PublicKey(args.tokenAddress),
        new PublicKey(args.walletAddress),
      );

      try {
        const token_account = await connection.getTokenAccountBalance(token_address);
        balance = token_account.value.uiAmount ?? 0;
        console.log('✅ Token balance from getBalance:', balance);
      } catch (tokenError) {
        // Token account does not exist, balance is 0
        console.error(tokenError);
        balance = 0;
      }
    }

    // Only fetch token data from DB if it's not SOL
    if (args.tokenAddress && !isCheckingSOL) {
      try {
        tokenData = await getToken(args.tokenAddress);
      } catch (tokenError) {
        console.log('Error fetching token data:', tokenError);
        tokenData = null;
      }
    } else {
      console.log('Skipping token data fetch - checking SOL balance');
    }

    // When no tokenAddress is provided, we're checking SOL balance, so default to SOL metadata
    const tokenSymbol = tokenData?.symbol || 'SOL';
    const tokenName = tokenData?.name || 'Solana';
    const tokenLogoURI =
      tokenData?.logoURI ||
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s';

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
