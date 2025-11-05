import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import FranciumSDK from 'francium-sdk';
import BN from 'bn.js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/lending/build-transaction
 *
 * Build a lending transaction on the server side (required for SDKs with Node.js dependencies)
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, tokenMint, tokenSymbol, amount, protocol } = await req.json();

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
      case 'francium':
        transaction = await buildFranciumLendTx(connection, walletPubkey, tokenSymbol, amount);
        break;

      case 'kamino-lend':
      case 'jupiter-lend':
      case 'jupiter-lend-earn':
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
            error: `Protocol "${protocol}" not supported. ` + `Supported: Francium`,
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
 * Francium - Lending Transaction
 * Program: FC81tbGt6JWRXidaWYFXxGnTk4VgobhJHATvTRVMqgWj
 * Using Francium SDK (https://github.com/Francium-DeFi/francium-sdk)
 */
async function buildFranciumLendTx(
  connection: Connection,
  wallet: PublicKey,
  tokenSymbol: string,
  amount: number,
): Promise<VersionedTransaction> {
  // Initialize Francium SDK
  const fr = new FranciumSDK({ connection });

  // Convert amount to proper decimals (assuming 6 decimals for USDT/USDC)
  const amountBN = new BN(Math.floor(amount * 1_000_000));

  // Use Francium SDK to build the deposit transaction
  const { trx, signers } = await fr.getLendingDepositTransaction(
    tokenSymbol,
    amountBN,
    wallet,
    {}, // Empty options object
  );

  // Set transaction parameters
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  trx.recentBlockhash = blockhash;
  trx.lastValidBlockHeight = lastValidBlockHeight;
  trx.feePayer = wallet;

  // Sign with PDAs if needed
  if (signers && signers.length > 0) {
    trx.partialSign(...signers);
  }

  // Convert legacy Transaction to VersionedTransaction and preserve signatures
  const legacyMessage = trx.compileMessage();
  const message = TransactionMessage.decompile(legacyMessage);
  const versionedTx = new VersionedTransaction(message.compileToV0Message());

  // Copy over the PDA signatures from the legacy transaction
  if (trx.signatures && trx.signatures.length > 0) {
    versionedTx.signatures = trx.signatures
      .filter((sig) => sig.signature !== null)
      .map((sig) => new Uint8Array(sig.signature!));
  }

  return versionedTx;
}
