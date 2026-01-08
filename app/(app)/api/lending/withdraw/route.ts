import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
} from '@solana/web3.js';
import BN from 'bn.js';
import { NextRequest, NextResponse } from 'next/server';
import { getMintDecimals } from '@/services/solana/get-mint-decimals';

// Kamino SDK
import {
  KaminoMarket,
  KaminoAction,
  DEFAULT_RECENT_SLOT_DURATION_MS,
} from '@kamino-finance/klend-sdk';
import {
  createSolanaRpc,
  address as createAddress,
  Instruction,
  type Address,
  type Rpc,
} from '@solana/kit';
import * as Sentry from '@sentry/nextjs';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import { toUserFacingSolanaSimulationError } from '@/lib/solana-simulation-error';

const KAMINO_MAIN_MARKET = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const KAMINO_PROGRAM_ID = new PublicKey('KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD');
const JUPITER_LEND_BASE = 'https://api.jup.ag/lend/v1/earn';

/**
 * Helper function to convert Kamino SDK instruction format to legacy TransactionInstruction
 */
function convertKaminoInstructionToLegacy(instruction: Instruction): TransactionInstruction {
  if (!instruction.accounts || !instruction.data) {
    throw new Error('Instruction missing required accounts or data');
  }

  return new TransactionInstruction({
    programId: new PublicKey(instruction.programAddress),
    keys: instruction.accounts.map((account: any) => {
      // Kamino SDK uses numeric roles as a bitfield:
      // 0 = read-only
      // 1 = writable (bit 0)
      // 2 = signer (bit 1)
      // 3 = signer + writable (bits 0 and 1)
      const role = typeof account.role === 'number' ? account.role : 0;
      const isWritable = (role & 1) !== 0; // Check bit 0
      const isSigner = (role & 2) !== 0; // Check bit 1

      return {
        pubkey: new PublicKey(account.address),
        isSigner,
        isWritable,
      };
    }),
    data: Buffer.from(instruction.data),
  });
}

/**
 * Build withdraw transaction for Kamino protocol
 */
async function buildKaminoWithdrawTx(
  connection: Connection,
  wallet: PublicKey,
  tokenMint: string,
  tokenSymbol: string,
  amount: number,
): Promise<VersionedTransaction> {
  try {
    // Create Kamino-compatible RPC and addresses
    const kaminoRpc: Rpc<any> = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const marketAddress: Address = createAddress(KAMINO_MAIN_MARKET.toBase58());
    const programId: Address = createAddress(KAMINO_PROGRAM_ID.toBase58());
    const walletAddress: Address = createAddress(wallet.toBase58());

    // Load Kamino market
    const market = await KaminoMarket.load(
      kaminoRpc,
      marketAddress,
      DEFAULT_RECENT_SLOT_DURATION_MS,
      programId,
    );

    if (!market) {
      throw new Error('Failed to load Kamino market');
    }

    // Find the reserve for this token mint
    let targetReserve = null;
    for (const reserve of market.reserves.values()) {
      const reserveMint = reserve.state?.liquidity?.mintPubkey?.toString();
      if (reserveMint === tokenMint || reserve.symbol.toUpperCase() === tokenSymbol.toUpperCase()) {
        targetReserve = reserve;
        break;
      }
    }

    if (!targetReserve) {
      throw new Error(
        `Reserve not found for token ${tokenSymbol} (${tokenMint}) in Kamino market. Available reserves: ${Array.from(
          market.reserves.values(),
        )
          .map((r) => r.symbol)
          .join(', ')}`,
      );
    }

    // Get the mint address from the reserve (this is the source of truth)
    const tokenMintAddress = targetReserve.state?.liquidity?.mintPubkey?.toString() ?? tokenMint;
    if (!tokenMintAddress) {
      throw new Error(`Could not get mint address from reserve for ${tokenSymbol}`);
    }

    // Use the mint address from the reserve, not from the position data
    const mintAddress: Address = createAddress(tokenMintAddress);

    // Convert amount to base units (lamports/smallest unit)
    const decimals =
      targetReserve.state?.liquidity?.mintDecimals?.toNumber() ||
      (tokenSymbol.toUpperCase() === 'SOL' ? 9 : 6);
    const amountBase = Math.floor(amount * Math.pow(10, decimals));

    // Create a transaction signer for Kamino SDK
    const signer: any = {
      address: walletAddress,
      signTransactions: async (txs: any) => txs,
    };

    // Get user's obligation (required for withdraw)
    const userAddressForObligation: Address = createAddress(wallet.toBase58());
    let obligation: any;

    try {
      obligation = await market.getUserVanillaObligation(userAddressForObligation);
    } catch {
      throw new Error(
        'User does not have an obligation account. Cannot withdraw without a lending position.',
      );
    }

    // Get current slot
    const currentSlot = await connection.getSlot();

    // Build withdraw action
    const withdrawAction = await KaminoAction.buildWithdrawTxns(
      market,
      new BN(amountBase),
      mintAddress,
      signer,
      obligation,
      true, // useV2Ixs
      undefined, // scopeRefreshConfig
      undefined, // extraComputeBudget
      undefined, // includeAtaIxs
      undefined, // requestElevationGroup
      {
        skipInitialization: true, // User already has obligation
        skipLutCreation: true, // Skip Address Lookup Table creation
      },
      undefined, // referrer
      BigInt(currentSlot), // currentSlot
    );

    const allInstructions = [
      ...(withdrawAction.setupIxs || []),
      ...withdrawAction.lendingIxs,
      ...(withdrawAction.cleanupIxs || []),
    ] as any;

    const legacyInstructions = allInstructions.map((instruction: any) =>
      convertKaminoInstructionToLegacy(instruction),
    );

    const { blockhash } = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: wallet,
      recentBlockhash: blockhash,
      instructions: legacyInstructions,
    }).compileToV0Message();

    const versionedTx = new VersionedTransaction(messageV0);

    return versionedTx;
  } catch (err: any) {
    console.error('❌ Error building Kamino withdraw transaction:', err);
    throw new Error(`Failed to build Kamino withdraw transaction: ${err.message}`);
  }
}

/**
 * POST /api/lending/withdraw
 *
 * Build a withdraw transaction on the server side (required for SDKs with Node.js dependencies)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { protocol, tokenMint, tokenSymbol, amount, walletAddress, shares } = body;

    if (!protocol || !tokenMint || !tokenSymbol || !amount || !walletAddress) {
      return NextResponse.json(
        {
          error: 'Missing required fields: protocol, tokenMint, tokenSymbol, amount, walletAddress',
        },
        { status: 400 },
      );
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const wallet = new PublicKey(walletAddress);

    let transaction: VersionedTransaction;

    switch (protocol.toLowerCase()) {
      case 'kamino-lend':
      case 'kamino':
        transaction = await buildKaminoWithdrawTx(
          connection,
          wallet,
          tokenMint,
          tokenSymbol,
          amount,
        );
        break;
      case 'jupiter-lend':
      case 'jupiter-lend-earn':
      case 'jup-lend':
        transaction = await buildJupiterWithdrawTx(connection, wallet, tokenMint, amount, shares);
        break;
      default:
        return NextResponse.json({ error: `Unsupported protocol: ${protocol}` }, { status: 400 });
    }

    const { blockhash } = await connection.getLatestBlockhash();
    (transaction as any).message.recentBlockhash = blockhash;

    try {
      const simResult = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
      if (simResult.value.err) {
        console.error('Withdraw TX simulation failed', simResult.value.err);
        return NextResponse.json(
          {
            error: toUserFacingSolanaSimulationError(
              "We couldn't prepare that withdrawal transaction.",
              simResult.value.logs,
            ),
          },
          { status: 400 },
        );
      }
    } catch (simErr) {
      console.error('Withdraw TX simulation exception', simErr);
      return NextResponse.json(
        {
          error: toUserFacingErrorTextWithContext(
            "We couldn't prepare that withdrawal transaction.",
            simErr,
          ),
        },
        { status: 400 },
      );
    }

    // Serialize transaction to base64 for client
    const serialized = Buffer.from(transaction.serialize()).toString('base64');

    return NextResponse.json({
      transaction: serialized,
      protocol,
    });
  } catch (error: any) {
    console.error('Error building withdraw transaction:', error);
    return NextResponse.json(
      { error: toUserFacingErrorTextWithContext('Failed to build withdraw transaction.', error) },
      { status: 500 },
    );
  }
}

async function buildJupiterWithdrawTx(
  _connection: Connection,
  wallet: PublicKey,
  tokenMint: string,
  amount: number,
  shares?: number,
): Promise<VersionedTransaction> {
  const apiKey = process.env.JUPITER_LEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing JUPITER_LEND_API_KEY');
  }

  const decimals = (await getMintDecimals(tokenMint).catch(() => undefined)) ?? 6;
  const amountBase = Math.floor(amount * Math.pow(10, decimals));

  // If we have share balance, prefer redeem to burn all shares (avoids dust)
  const endpoint = shares ? 'redeem' : 'withdraw';
  const body: any = {
    asset: tokenMint,
    signer: wallet.toBase58(),
  };
  if (shares) {
    body.shares = String(Math.floor(shares));
  } else {
    body.amount = amountBase.toString();
  }

  // Let Jupiter return a fully built transaction (includes compute budget/priority fees)
  const res = await fetch(`${JUPITER_LEND_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    Sentry.captureException(new Error(`Jupiter ${endpoint} failed: ${res.status} ${text}`), {
      extra: {
        status: res.status,
        responseText: text,
        endpoint,
        tokenMint,
        tokenSymbol: 'unknown',
        amountBase,
        wallet: wallet.toBase58(),
        shares,
      },
    });
    throw new Error(`Jupiter ${endpoint} failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { transaction?: string };
  if (!json.transaction) {
    throw new Error('No withdraw transaction returned from Jupiter');
  }

  const txBytes = Buffer.from(json.transaction, 'base64');
  return VersionedTransaction.deserialize(txBytes);
}
