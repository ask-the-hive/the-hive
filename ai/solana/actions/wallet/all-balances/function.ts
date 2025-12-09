import { LAMPORTS_PER_SOL, PublicKey, Connection } from '@solana/web3.js';
import { getTokenAccountsByOwner } from '@/services/helius';
import type { SolanaActionResult } from '../../solana-action';
import type { AllBalancesArgumentsType, AllBalancesResultBodyType } from './types';
import { getToken } from '@/db/services';
import { getTokenMetadata } from '@/services/birdeye';

export async function getAllBalances(
  connection: Connection,
  args: AllBalancesArgumentsType,
): Promise<SolanaActionResult<AllBalancesResultBodyType>> {
  try {
    const balances: {
      balance: number;
      token: string;
      name: string;
      logoURI: string;
    }[] = [];

    const solBalance =
      (await connection.getBalance(new PublicKey(args.walletAddress))) / LAMPORTS_PER_SOL;
    balances.push({
      balance: solBalance,
      token: 'SOL',
      name: 'Solana',
      logoURI:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX6PYmAiDpUliZWnmCHKPc3VI7QESDKhLndQ&s',
    });

    const tokenAccounts = await getTokenAccountsByOwner(args.walletAddress);

    for await (const account of tokenAccounts) {
      let token = await getToken(account.mint!);
      if (!token) {
        try {
          const metadata = await getTokenMetadata(account.mint!, 'solana');
          if (metadata && metadata.symbol !== 'UNKNOWN') {
            token = {
              id: account.mint!,
              symbol: metadata.symbol,
              name: metadata.name,
              logoURI: metadata.logo_uri || '',
              decimals: metadata.decimals || 6,
              tags: [],
              freezeAuthority: null,
              mintAuthority: null,
              permanentDelegate: null,
              extensions: metadata.extensions || {},
            } as any;
          }
        } catch (error) {
          console.warn('Unable to fetch metadata for mint', account.mint, error);
        }
      }

      const balanceAmount =
        token?.decimals !== undefined && token.decimals !== null
          ? account.amount! / 10 ** token.decimals
          : account.amount!;

      balances.push({
        balance: balanceAmount,
        token: token?.symbol || account.mint!,
        name: token?.name || account.mint!,
        logoURI: token?.logoURI || '',
      });
    }

    return {
      message: 'Balances shown above. Pick a token to swap, lend, stake, or explore next.',
      body: {
        balances: balances,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balances: ${error}`,
      body: {
        balances: [],
      },
    };
  }
}
