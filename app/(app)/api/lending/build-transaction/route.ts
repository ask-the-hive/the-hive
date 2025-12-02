import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { getDepositIx } from '@jup-ag/lend/earn';
// TODO: Solend SDK has unfixable Node.js dependency issues (jito-ts -> rpc-websockets)
// The dependency chain is: @solendprotocol/solend-sdk -> @pythnetwork/pyth-solana-receiver
// -> @pythnetwork/solana-utils -> jito-ts -> old @solana/web3.js -> rpc-websockets/dist/lib/client
// This path doesn't exist in newer rpc-websockets versions and causes module resolution errors
// even with package resolutions/overrides. Manual implementation needed.
// import {
//   SolendActionCore,
//   MAIN_POOL_ADDRESS,
//   getProgramId,
//   getReservesOfPool,
// } from '@solendprotocol/solend-sdk';
import BN from 'bn.js';
import { NextRequest, NextResponse } from 'next/server';
import { KaminoMarket, KaminoAction, VanillaObligation } from '@kamino-finance/klend-sdk';
import { openLendingPositionAndDepositInstructions } from '@crypticdot/defituna-client';
import { createSolanaRpc, address as createAddress, Instruction } from '@solana/kit';

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
      case 'defituna':
      case 'defi-tuna':
      case 'defi_tuna':
      case 'tuna':
        transaction = await buildDefiTunaLendTx(connection, walletPubkey, tokenMint, amount);
        break;
      case 'marginfi-lending':
      case 'marginfi-lend':
      case 'credix':
        return NextResponse.json(
          { error: `Protocol "${protocol}" not yet implemented` },
          { status: 501 },
        );

      default:
        return NextResponse.json(
          {
            error: `Protocol "${protocol}" not supported. Supported: Kamino Lend, Jupiter Lend, DeFiTuna`,
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
  // Convert token mint string to PublicKey
  const assetMint = new PublicKey(tokenMint);

  // Convert amount to proper decimals (6 for USDT/USDC, 9 for SOL)
  const decimals = tokenSymbol.toUpperCase() === 'SOL' ? 9 : 6;
  const amountBN = new BN(Math.floor(amount * Math.pow(10, decimals)));

  // Get deposit instruction from Jupiter Lend SDK
  const depositIx = await getDepositIx({
    amount: amountBN,
    asset: assetMint,
    signer: wallet,
    connection,
  });

  // Convert the raw instruction to TransactionInstruction
  const instruction = new TransactionInstruction({
    programId: new PublicKey(depositIx.programId),
    keys: depositIx.keys.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(depositIx.data),
  });

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create versioned transaction
  const messageV0 = new TransactionMessage({
    payerKey: wallet,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);

  return versionedTx;
}

async function buildDefiTunaLendTx(
  _connection: Connection,
  wallet: PublicKey,
  tokenMint: string,
  amount: number,
): Promise<VersionedTransaction> {
  const decimals = (await getMintDecimals(tokenMint).catch(() => undefined)) || 6;
  const amountBase = BigInt(Math.floor(amount * Math.pow(10, decimals)));

  // DefiTuna client uses @solana/kit Address and TransactionSigner shapes
  const rpc = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
  const authority = { address: createAddress(wallet.toBase58()) };
  const mintAddress = createAddress(tokenMint);

  let instructions: any[];
  try {
    instructions = await openLendingPositionAndDepositInstructions(
      rpc as any,
      authority as any,
      mintAddress,
      amountBase,
    );
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new Error(
        'DefiTuna client WASM not found at runtime. Ensure fusionamm_core_js_bindings_bg.wasm is bundled.',
      );
    }
    throw err;
  }

  const legacyInstructions = (instructions as any[]).map(convertKitInstructionToLegacy);
  if (!legacyInstructions.length) {
    throw new Error('No deposit instructions returned from DefiTuna client');
  }

  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: wallet,
    recentBlockhash: blockhash,
    instructions: legacyInstructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
}

function convertKitInstructionToLegacy(ix: any): TransactionInstruction {
  if (!ix.programAddress || !ix.accounts || !ix.data) {
    throw new Error('Invalid instruction shape from defituna client');
  }
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys: ix.accounts.map((account: any) => ({
      pubkey: new PublicKey(account.address),
      isSigner: !!account.isSigner,
      isWritable: !!account.isWritable,
    })),
    data: Buffer.from(ix.data),
  });
}

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
