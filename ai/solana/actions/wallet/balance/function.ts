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
import { SOL_LOGO_URL, SOL_MINT } from '@/lib/constants';

/**
 * Resolves native SOL or SPL token balances (Token-2022 first, then SPL) and enriches with metadata when available.
 */
export async function getBalance(
  connection: Connection,
  args: BalanceArgumentsType,
): Promise<SolanaActionResult<BalanceResultBodyType>> {
  try {
    if (!args.walletAddress || typeof args.walletAddress !== 'string') {
      return {
        message: `Error: Wallet address is required to check balance. Please connect your wallet first.`,
        body: undefined,
      };
    }

    let balance: number;
    let tokenData = null;

    const isCheckingSOL = !args.tokenAddress || args.tokenAddress === SOL_MINT;

    if (isCheckingSOL) {
      balance = (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
      console.log('✅ Native SOL balance:', balance);
      tokenData = {
        symbol: 'SOL',
        name: 'Solana',
        logoURI: SOL_LOGO_URL,
      };
    } else {
      if (!args.tokenAddress) {
        throw new Error('Token address is required for SPL token balance check');
      }

      console.log('🔍 Getting token balance:', {
        tokenAddress: args.tokenAddress,
        walletAddress: args.walletAddress,
        tokenSymbol: args.tokenSymbol,
      });

      let token_address = getAssociatedTokenAddressSync(
        new PublicKey(args.tokenAddress),
        new PublicKey(args.walletAddress),
        false,
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
        console.log('⚠️ No Token-2022 account found, trying SPL Token...');

        token_address = getAssociatedTokenAddressSync(
          new PublicKey(args.tokenAddress),
          new PublicKey(args.walletAddress),
          false,
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

    if (args.tokenAddress && !isCheckingSOL && !args.tokenSymbol) {
      try {
        tokenData = await getToken(args.tokenAddress);
      } catch (tokenError) {
        console.log('Error fetching token data from DB, trying Birdeye API:', tokenError);
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

    const tokenSymbol = isCheckingSOL ? 'SOL' : args.tokenSymbol || tokenData?.symbol || undefined;
    const tokenName = isCheckingSOL ? 'Solana' : tokenData?.name || args.tokenSymbol || undefined;

    const tokenLogoURI = tokenData?.logoURI || (isCheckingSOL ? SOL_LOGO_URL : undefined);

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

    const finalTokenSymbol =
      tokenSymbol || (args.tokenAddress ? args.tokenAddress.slice(0, 8) : 'SOL');

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
        canStake: finalTokenSymbol === 'SOL' && balance > 0.00001,
        needsSOL: finalTokenSymbol === 'SOL' && balance <= 0.00001,
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
