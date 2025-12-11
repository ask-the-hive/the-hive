import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Kamino - Testing with WASM webpack config
import { KaminoMarket, KaminoAction, VanillaObligation } from '@kamino-finance/klend-sdk';
import { createSolanaRpc, address as createAddress, Instruction } from '@solana/kit';
import { getMintDecimals } from '@/services/solana/get-mint-decimals';
import { BN } from '@project-serum/anchor';

/**
 * Kamino Lending Market Configuration
 *
 * Kamino has ONE main lending market that contains multiple reserves (one per token).
 * All deposits (USDC, USDT, SOL, etc.) go through this same market address.
 * The tokenMint parameter identifies which specific reserve to deposit into.
 *
 * Reference: https://github.com/Kamino-Finance/klend-sdk
 */
const KAMINO_MAIN_MARKET = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const KAMINO_PROGRAM_ID = new PublicKey('KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD');

/**
 * POST /api/lending/build-transaction
 *
 * Build a lending transaction on the server side (required for SDKs with Node.js dependencies)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, tokenMint, tokenSymbol, amount, protocol } = body;

    if (!walletAddress || !tokenMint || !tokenSymbol || !amount || !protocol) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: walletAddress, tokenMint, tokenSymbol, amount, protocol',
        },
        { status: 400 },
      );
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const walletPubkey = new PublicKey(walletAddress);

    // Route to protocol-specific builder
    const protocolKey = protocol.toLowerCase();
    let transaction: VersionedTransaction;

    switch (protocolKey) {
      case 'jupiter-lend':
      case 'jupiter-lend-earn':
      case 'jup-lend':
        transaction = await buildJupiterLendTx(
          connection,
          walletPubkey,
          tokenMint,
          tokenSymbol,
          amount,
        );
        break;

      // TODO: Solend SDK disabled due to unfixable dependency issues
      // case 'save':
      // case 'solend':
      //   transaction = await buildSolendLendTx(connection, walletPubkey, tokenSymbol, amount);
      //   break;

      case 'kamino-lend':
      case 'kamino':
        transaction = await buildKaminoLendTx(
          connection,
          walletPubkey,
          tokenMint,
          tokenSymbol,
          amount,
        );
        break;
      case 'marginfi-lending':
      case 'marginfi-lend':
      case 'credix':
        return NextResponse.json(
          { error: `Protocol "${protocol}" not yet implemented` },
          { status: 501 },
        );

      case 'save':
      case 'solend':
      default:
        return NextResponse.json(
          {
            error: `Protocol "${protocol}" not supported. Supported: Jupiter Lend, Kamino`,
          },
          { status: 400 },
        );
    }

    // Pre-flight simulate to avoid wallet warnings about unsimulatable TXs
    try {
      const simResult = await connection.simulateTransaction(transaction, {
        sigVerify: false,
      });
      if (simResult.value.err) {
        console.error('Lending build TX simulation failed', simResult.value.err);
        return NextResponse.json(
          {
            error: 'Transaction simulation failed',
            logs: simResult.value.logs,
            simError: simResult.value.err,
          },
          { status: 400 },
        );
      }
    } catch (simErr) {
      console.error('Lending build TX simulation exception', simErr);
      return NextResponse.json(
        {
          error: 'Transaction simulation failed',
          details: simErr instanceof Error ? simErr.message : String(simErr),
        },
        { status: 400 },
      );
    }

    // Serialize the transaction to send to the client
    const serialized = Buffer.from(transaction.serialize()).toString('base64');

    return NextResponse.json({
      transaction: serialized,
      message: `Transaction built successfully for ${protocol}`,
    });
  } catch (error) {
    console.error('Error building lending transaction:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to build transaction',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * Jupiter Lend - Lending Transaction
 * Program: jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9
 * Using Jupiter Lend SDK (https://dev.jup.ag/docs/lend/sdk)
 */
async function buildJupiterLendTx(
  connection: Connection,
  wallet: PublicKey,
  tokenMint: string,
  tokenSymbol: string,
  amount: number,
): Promise<VersionedTransaction> {
  const apiKey = process.env.JUPITER_LEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing JUPITER_LEND_API_KEY');
  }

  // Convert amount using on-chain mint decimals
  const decimals =
    (await getMintDecimals(tokenMint).catch(() => undefined)) ??
    (tokenSymbol.toUpperCase() === 'SOL' ? 9 : 6);
  const amountBase = Math.floor(amount * Math.pow(10, decimals)).toString();

  const res = await fetch('https://api.jup.ag/lend/v1/earn/deposit-instructions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      asset: tokenMint,
      amount: amountBase,
      signer: wallet.toBase58(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    Sentry.captureException(
      new Error(`Jupiter deposit instructions failed: ${res.status} ${text}`),
      {
        extra: {
          status: res.status,
          responseText: text,
          tokenMint,
          tokenSymbol,
          amountBase,
        },
      },
    );
    throw new Error(`Jupiter deposit instructions failed: ${res.status} ${text}`);
  }

  type JupiterInstructionAccount = {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  };

  type JupiterDepositInstruction = {
    programId: string;
    accounts: JupiterInstructionAccount[];
    data: string; // base64 string per Jupiter API
  };

  type JupiterDepositInstructionsResponse = {
    instructions: JupiterDepositInstruction[];
  };

  const json: JupiterDepositInstructionsResponse = await res.json();
  const ixData = json?.instructions || [];
  if (!Array.isArray(ixData) || ixData.length === 0) {
    throw new Error('No deposit instructions returned from Jupiter');
  }

  const instructionSet = ixData.map((ix) => {
    if (!ix.programId || !Array.isArray(ix.accounts) || !ix.data) {
      throw new Error('Invalid instruction format from Jupiter');
    }
    return new TransactionInstruction({
      programId: new PublicKey(ix.programId),
      keys: ix.accounts.map((k) => ({
        pubkey: new PublicKey(k.pubkey),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      data: Buffer.from(ix.data, 'base64'),
    });
  });

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create versioned transaction
  const messageV0 = new TransactionMessage({
    payerKey: wallet,
    recentBlockhash: blockhash,
    instructions: instructionSet,
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);

  return versionedTx;
}

/**
 * Solend (Save) - Lending Transaction
 * Program: So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo
 * Using Solend SDK with proper pool/reserve fetching
 */
// async function buildSolendLendTx(
//   connection: Connection,
//   wallet: PublicKey,
//   tokenSymbol: string,
//   amount: number,
// ): Promise<VersionedTransaction> {
//   try {
//     // Convert amount to base units (lamports/smallest unit)
//     const decimals = tokenSymbol.toUpperCase() === 'SOL' ? 9 : 6;
//     const amountBase = Math.floor(amount * Math.pow(10, decimals));

//     // Get program ID for production environment
//     const programId = getProgramId('production');

//     // Get current slot
//     const currentSlot = await connection.getSlot();

//     // Fetch reserves from the main pool
//     const reserves = await getReservesOfPool(
//       MAIN_POOL_ADDRESS,
//       connection,
//       programId.toBase58(),
//       currentSlot,
//     );

//     // Find the reserve for the token symbol
//     const reserve = reserves.find((r) => r.symbol.toUpperCase() === tokenSymbol.toUpperCase());

//     if (!reserve) {
//       throw new Error(`Reserve not found for token symbol: ${tokenSymbol}`);
//     }

//     // Construct pool object (InputPoolType)
//     const pool = {
//       address: MAIN_POOL_ADDRESS.toBase58(),
//       owner: programId.toBase58(),
//       name: 'Main Pool',
//       authorityAddress: reserve.poolAddress, // Using from reserve data
//       reserves: reserves.map((r) => ({
//         address: r.address,
//         pythOracle: r.pythOracle,
//         switchboardOracle: r.switchboardOracle,
//         mintAddress: r.mintAddress,
//         liquidityFeeReceiverAddress: r.liquidityFeeReceiverAddress,
//         extraOracle: r.extraOracle,
//       })),
//     };

//     // Construct reserve object (InputReserveType)
//     const reserveInput = {
//       address: reserve.address,
//       liquidityAddress: reserve.liquidityAddress,
//       cTokenMint: reserve.cTokenMint,
//       cTokenLiquidityAddress: reserve.cTokenLiquidityAddress,
//       pythOracle: reserve.pythOracle,
//       switchboardOracle: reserve.switchboardOracle,
//       mintAddress: reserve.mintAddress,
//       liquidityFeeReceiverAddress: reserve.liquidityFeeReceiverAddress,
//     };

//     // Build deposit transactions using Solend SDK
//     const solendAction = await SolendActionCore.buildDepositTxns(
//       pool,
//       reserveInput,
//       connection,
//       amountBase.toString(),
//       { publicKey: wallet },
//       { environment: 'production' },
//     );

//     // Get blockhash for transaction

//     const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

//     // Get transactions from the action
//     const txns = await solendAction.getTransactions({ blockhash, lastValidBlockHeight });

//     // Use the lendingTxn (main transaction)
//     if (!txns.lendingTxn) {
//       throw new Error('No lending transaction generated');
//     }

//     return txns.lendingTxn;
//   } catch (err) {
//     console.log('ERROR Solend- ', err);
//     throw new Error('ERror Solend');
//   }
// }

/**
 * Kamino - Lending Transaction
 *
 * Program: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
 * Using Kamino SDK: https://github.com/Kamino-Finance/klend-sdk
 *
 * Architecture:
 * - Kamino has ONE main market (7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF)
 * - This market contains multiple reserves (one for each token: USDC, USDT, SOL, etc.)
 * - The tokenMint parameter automatically selects the correct reserve within the market
 * - All tokens use the same market address, just different reserves
 */
async function buildKaminoLendTx(
  connection: Connection,
  wallet: PublicKey,
  tokenMint: string,
  tokenSymbol: string,
  amount: number,
): Promise<VersionedTransaction> {
  try {
    // Create Kamino-compatible RPC and addresses
    const kaminoRpc = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!) as any;
    const marketAddress = createAddress(KAMINO_MAIN_MARKET.toBase58()) as any;
    const programId = createAddress(KAMINO_PROGRAM_ID.toBase58()) as any;
    const walletAddress = createAddress(wallet.toBase58()) as any;
    const mintAddress = createAddress(tokenMint) as any;

    // Load Kamino market
    const market = await KaminoMarket.load(kaminoRpc, marketAddress, programId);
    if (!market) {
      throw new Error('Failed to load Kamino market');
    }

    // Convert amount to base units (lamports/smallest unit)
    const decimals = tokenSymbol.toUpperCase() === 'SOL' ? 9 : 6;
    const amountBase = Math.floor(amount * Math.pow(10, decimals));

    // Create a transaction signer for Kamino SDK
    const signer: any = {
      address: walletAddress,
      signTransactions: async (txs: any) => txs,
    };

    // Create a vanilla obligation (for first-time users)
    const obligation = new VanillaObligation(programId);

    // Get current slot for Address Lookup Table creation
    const currentSlot = await connection.getSlot();

    // Check if user's obligation account exists using Kamino SDK's official method
    // This ensures we use the correct PDA derivation that Kamino expects
    // Note: getUserVanillaObligation throws an error if obligation doesn't exist
    const walletAddressForObligation = createAddress(wallet.toBase58()) as any;
    let obligationExists = false;

    try {
      await market.getUserVanillaObligation(walletAddressForObligation);
      obligationExists = true;
    } catch {
      // Obligation doesn't exist yet (first-time user)
      obligationExists = false;
    }

    // Build deposit action
    const depositAction = await KaminoAction.buildDepositTxns(
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
        skipInitialization: obligationExists, // Skip only if user already has an obligation account
        skipLutCreation: true, // Skip Address Lookup Table creation - not needed for deposits
      },
      undefined, // referrer
      BigInt(currentSlot), // currentSlot
    );

    // Get all instructions from the action
    const allInstructions = [
      ...(depositAction.setupIxs || []),
      ...depositAction.lendingIxs,
      ...(depositAction.cleanupIxs || []),
    ] as any;

    // Convert Kamino instructions to legacy TransactionInstructions
    const legacyInstructions = allInstructions.map((instruction: any) =>
      convertKaminoInstructionToLegacy(instruction),
    );

    // Build the transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: wallet,
      recentBlockhash: blockhash,
      instructions: legacyInstructions,
    }).compileToV0Message();

    const versionedTx = new VersionedTransaction(messageV0);

    return versionedTx;
  } catch (err: any) {
    console.error('❌ Error building Kamino lending transaction:', err);
    throw new Error(`Failed to build Kamino transaction: ${err.message}`);
  }
}

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
