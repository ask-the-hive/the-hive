import { LAMPORTS_PER_SOL, PublicKey, Connection } from '@solana/web3.js';

import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

import type { BalanceArgumentsType, BalanceResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';
import { getToken } from '@/db/services';
import { getTokenMetadata } from '@/services/birdeye';

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

      console.log('🔍 Getting token balance:', {
        tokenAddress: args.tokenAddress,
        walletAddress: args.walletAddress,
        tokenSymbol: args.tokenSymbol,
      });

      // Try Token-2022 first, then fall back to regular SPL Token
      let token_address = getAssociatedTokenAddressSync(
        new PublicKey(args.tokenAddress),
        new PublicKey(args.walletAddress),
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID,
      );

      console.log('🔍 Derived Token-2022 account address (ATA):', token_address.toBase58());

      try {
        const token_account = await connection.getTokenAccountBalance(token_address);
        balance = token_account.value.uiAmount ?? 0;
        console.log('✅ Token-2022 balance found:', {
          balance,
          rawAmount: token_account.value.amount,
          decimals: token_account.value.decimals,
          uiAmount: token_account.value.uiAmount,
        });
      } catch {
        // Token-2022 account does not exist, try regular SPL Token
        console.log('⚠️ No Token-2022 account found, trying SPL Token...');

        token_address = getAssociatedTokenAddressSync(
          new PublicKey(args.tokenAddress),
          new PublicKey(args.walletAddress),
          false, // allowOwnerOffCurve
          TOKEN_PROGRAM_ID,
        );

        console.log('🔍 Derived SPL Token account address (ATA):', token_address.toBase58());

        try {
          const token_account = await connection.getTokenAccountBalance(token_address);
          balance = token_account.value.uiAmount ?? 0;
          console.log('✅ SPL Token balance found:', {
            balance,
            rawAmount: token_account.value.amount,
            decimals: token_account.value.decimals,
            uiAmount: token_account.value.uiAmount,
          });
        } catch {
          // Neither Token-2022 nor SPL Token account exists
          console.error('❌ No token account found (tried both Token-2022 and SPL Token)');
          console.error(
            '❌ Token-2022 ATA:',
            getAssociatedTokenAddressSync(
              new PublicKey(args.tokenAddress),
              new PublicKey(args.walletAddress),
              false,
              TOKEN_2022_PROGRAM_ID,
            ).toBase58(),
          );
          console.error('❌ SPL Token ATA:', token_address.toBase58());
          balance = 0;
        }
      }
    }

    // Only fetch token data from DB if it's not SOL and tokenSymbol not provided
    if (args.tokenAddress && !isCheckingSOL && !args.tokenSymbol) {
      try {
        tokenData = await getToken(args.tokenAddress);
      } catch (tokenError) {
        console.log('Error fetching token data from DB, trying Birdeye API:', tokenError);
        // Fallback to Birdeye API if DB lookup fails
        try {
          const birdeyeMetadata = await getTokenMetadata(args.tokenAddress, 'solana');
          if (birdeyeMetadata && birdeyeMetadata.symbol !== 'UNKNOWN') {
            tokenData = {
              id: args.tokenAddress,
              symbol: birdeyeMetadata.symbol,
              name: birdeyeMetadata.name,
              logoURI: birdeyeMetadata.logo_uri || '',
              decimals: birdeyeMetadata.decimals || 6,
              tags: [],
              freezeAuthority: null,
              mintAuthority: null,
              permanentDelegate: null,
              extensions: birdeyeMetadata.extensions || {},
            };
            console.log('✅ Fetched token metadata from Birdeye:', tokenData.symbol);
          }
        } catch (birdeyeError) {
          console.log('Error fetching token data from Birdeye:', birdeyeError);
          tokenData = null;
        }
      }
    } else if (isCheckingSOL) {
      console.log('Skipping token data fetch - checking SOL balance');
    }

    // Determine token symbol - use provided symbol, or fetch from tokenData, or default to SOL only if checking SOL
    const tokenSymbol = isCheckingSOL ? 'SOL' : args.tokenSymbol || tokenData?.symbol || undefined;
    const tokenName = isCheckingSOL ? 'Solana' : tokenData?.name || args.tokenSymbol || undefined;

    // Only use logoURI if we have tokenData, otherwise leave it undefined (no default SOL image)
    const tokenLogoURI =
      tokenData?.logoURI ||
      (isCheckingSOL
        ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s'
        : undefined);

    // Debug logging
    if (args.tokenAddress && !isCheckingSOL) {
      console.log('🔍 Token metadata resolution:', {
        tokenAddress: args.tokenAddress,
        tokenSymbolProvided: args.tokenSymbol,
        isCheckingSOL,
        tokenDataFound: !!tokenData,
        finalTokenSymbol: tokenSymbol,
        finalTokenName: tokenName,
      });
    }

    // Ensure we have a token symbol - use tokenAddress as last resort
    const finalTokenSymbol =
      tokenSymbol || (args.tokenAddress ? args.tokenAddress.slice(0, 8) : 'SOL');

    // Add programmatic logic for staking context
    let message = `Balance: ${balance} ${finalTokenSymbol}`;
    if (finalTokenSymbol === 'SOL' && balance > 0.00001) {
      message += ` (Ready for staking)`;
    } else if (finalTokenSymbol === 'SOL' && balance <= 0.00001) {
      message += ` (Need SOL to stake)`;
    } else if (args.tokenAddress && balance === 0) {
      message += ` (Need ${finalTokenSymbol} to continue)`;
    }

    return {
      message,
      body: {
        balance: balance,
        token: finalTokenSymbol,
        name: tokenName,
        logoURI: tokenLogoURI,
        // Add programmatic hints for the agent
        canStake: finalTokenSymbol === 'SOL' && balance > 0.00001,
        needsSOL: finalTokenSymbol === 'SOL' && balance <= 0.00001,
        // Include the token address so TokenFundingOptions can use it
        tokenAddress: isCheckingSOL ? SOL_MINT : args.tokenAddress,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balance: ${error}`,
    };
  }
}
