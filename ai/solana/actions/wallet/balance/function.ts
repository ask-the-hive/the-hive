import { LAMPORTS_PER_SOL, PublicKey, Connection } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import type { BalanceArgumentsType, BalanceResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';
import { getToken, getTokenBySymbol } from '@/db/services';
import { getTokenMetadata } from '@/services/birdeye';
import { SOL_LOGO_URL, SOL_MINT } from '@/lib/constants';
import { resolveAssetSymbolToAddress } from '@/services/tokens/resolve-asset-symbol-to-address';

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

    let tokenAddress: string | undefined = args.tokenAddress || undefined;
    if (!tokenAddress && args.tokenSymbol && args.tokenSymbol.toUpperCase() !== 'SOL') {
      const dbToken = await getTokenBySymbol(args.tokenSymbol, 'solana');
      tokenAddress = dbToken?.contractAddress || dbToken?.id || tokenAddress;
      if (!tokenAddress) {
        const resolved = await resolveAssetSymbolToAddress(args.tokenSymbol, 'solana');
        tokenAddress = resolved || undefined;
      }
    }

    const isCheckingSOL = !tokenAddress || tokenAddress === SOL_MINT;

    if (isCheckingSOL) {
      balance = (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
    } else {
      if (!tokenAddress) {
        throw new Error('Token address is required for SPL token balance check');
      }

      let token_address = getAssociatedTokenAddressSync(
        new PublicKey(tokenAddress),
        new PublicKey(args.walletAddress),
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      try {
        const token_account = await connection.getTokenAccountBalance(token_address);
        balance = token_account.value.uiAmount ?? 0;
      } catch {
        token_address = getAssociatedTokenAddressSync(
          new PublicKey(tokenAddress),
          new PublicKey(args.walletAddress),
          false,
          TOKEN_PROGRAM_ID,
        );

        try {
          const token_account = await connection.getTokenAccountBalance(token_address);
          balance = token_account.value.uiAmount ?? 0;
        } catch {
          console.error('❌ No token account found (tried both Token-2022 and SPL Token)');
          console.error(
            '❌ Token-2022 ATA:',
            getAssociatedTokenAddressSync(
              new PublicKey(tokenAddress),
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
        console.error('Error fetching token data from DB, trying Birdeye API:', tokenError);
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
          }
        } catch (birdeyeError) {
          console.error('Error fetching token data from Birdeye:', birdeyeError);
          tokenData = null;
        }
      }
    }

    const tokenSymbol = isCheckingSOL ? 'SOL' : args.tokenSymbol || tokenData?.symbol || undefined;
    const tokenName = isCheckingSOL ? 'Solana' : tokenData?.name || args.tokenSymbol || undefined;
    const tokenLogoURI = tokenData?.logoURI || (isCheckingSOL ? SOL_LOGO_URL : undefined);
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
        tokenAddress: isCheckingSOL ? SOL_MINT : tokenAddress,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balance: ${error}`,
    };
  }
}
