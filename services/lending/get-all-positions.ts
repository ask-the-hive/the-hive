import {
  KaminoMarket,
  KaminoReserve,
  KaminoObligation,
  DEFAULT_RECENT_SLOT_DURATION_MS,
} from '@kamino-finance/klend-sdk';
import { createSolanaRpc, address as createAddress, type Address, type Rpc } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { LendingPosition } from '@/types/lending-position';
import { getKaminoPools, type KaminoPoolData } from './get-kamino-pools';
import { getTokenBySymbol } from '@/db/services/tokens';
import { Token } from '@/db/types/token';
import { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';

const KAMINO_MAIN_MARKET = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const KAMINO_PROGRAM_ID = new PublicKey('KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD');

/**
 * Helper function to build a Token object from token data or reserve info
 */
function buildTokenObject(
  tokenData: Token | null,
  symbol: string,
  mintAddress: string,
  decimals: number,
): Token {
  if (tokenData) {
    return {
      id: tokenData.id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      tags: tokenData.tags || [],
      logoURI: tokenData.logoURI || '',
      freezeAuthority: tokenData.freezeAuthority || null,
      mintAuthority: tokenData.mintAuthority || null,
      permanentDelegate: tokenData.permanentDelegate || null,
      extensions: tokenData.extensions || {},
      contractAddress: mintAddress,
    };
  }

  return {
    id: mintAddress,
    name: symbol,
    symbol: symbol,
    decimals: decimals,
    tags: [],
    logoURI: '',
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {},
    contractAddress: mintAddress,
  };
}

/**
 * Helper function to build pool data object
 * Note: poolData is required (not undefined) - caller should validate before calling
 */
function buildPoolDataObject(
  poolData: KaminoPoolData,
  symbol: string,
  mintAddress: string,
  token: Token,
): LendingYieldsPoolData {
  return {
    name: symbol,
    symbol: symbol,
    yield: poolData.apy,
    apyBase: poolData.apyBase,
    apyReward: 0,
    tvlUsd: poolData.tvlUsd,
    project: 'kamino-lend',
    poolMeta: undefined,
    url: undefined,
    rewardTokens: [],
    underlyingTokens: [mintAddress],
    tokenMintAddress: mintAddress,
    predictions: undefined,
    tokenData: {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI || undefined,
    },
  };
}

/**
 * Fetch lending positions from Kamino protocol
 * Extracts deposits from user obligations and maps them to unified LendingPosition format
 */
async function getKaminoLendingPositions(
  walletAddress: string,
  chainId: string,
): Promise<LendingPosition[]> {
  try {
    const kaminoRpc: Rpc<any> = createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    const marketAddress: Address = createAddress(KAMINO_MAIN_MARKET.toBase58());
    const programId: Address = createAddress(KAMINO_PROGRAM_ID.toBase58());
    const userAddress: Address = createAddress(walletAddress);

    // Load Kamino market
    const market = await KaminoMarket.load(
      kaminoRpc,
      marketAddress,
      DEFAULT_RECENT_SLOT_DURATION_MS,
      programId,
    );
    if (!market) {
      console.error('Failed to load Kamino market');
      return [];
    }

    // Fetch all user obligations
    const allObligations: (KaminoObligation | null)[] =
      await market.getAllUserObligations(userAddress);
    if (!allObligations || allObligations.length === 0) {
      return []; // No obligations = no positions
    }

    // Fetch pool data for matching
    const kaminoPools = await getKaminoPools();

    const positions: LendingPosition[] = [];

    // Extract deposits from all obligations
    // Note: obligation.deposits is a Map<Address, Position> where Address is the reserve address
    for (const obligation of allObligations) {
      if (!obligation) continue;

      // Iterate over deposits (lending positions)
      // deposits is Map<Address, Position> where key is reserve address and value is Position
      for (const [reserveAddress, position] of obligation.deposits.entries()) {
        try {
          // Look up the full reserve from the market using the reserve address
          let fullReserve: KaminoReserve | null = null;

          // Convert Address to string for comparison
          const reserveAddressStr = reserveAddress.toString();

          // Find the reserve in the market by matching address
          for (const reserve of market.reserves.values()) {
            if (reserve.address.toString() === reserveAddressStr) {
              fullReserve = reserve;
              break;
            }
          }

          if (!fullReserve) {
            console.warn(`⚠️ Could not find reserve for address ${reserveAddressStr}`);
            continue;
          }

          // Get reserve info from the full reserve object
          const symbol = fullReserve.symbol;

          // Check if state exists before accessing
          if (!fullReserve.state?.liquidity) {
            console.warn(`⚠️ Reserve ${symbol} does not have state.liquidity loaded`);
            continue;
          }

          const mintAddress = fullReserve.state.liquidity.mintPubkey.toString();
          const decimals = fullReserve.state.liquidity.mintDecimals.toNumber();

          // Convert deposit amount from Decimal (in lamports) to human-readable
          const amountBase = position.amount.toNumber();
          const amount = amountBase / Math.pow(10, decimals);

          // Skip if amount is zero or very small (dust)
          if (amount < 0.000001) {
            continue;
          }

          // Find matching pool data
          const poolData = kaminoPools.find(
            (pool) => pool.mintAddress === mintAddress || pool.symbol === symbol,
          );

          // Skip if no pool data found or APY is 0 - we shouldn't show positions without valid pool data
          if (!poolData || poolData.apy <= 0) {
            console.warn(
              `⚠️ Skipping position for ${symbol}: ${!poolData ? 'no pool data found' : 'APY is 0'}`,
            );
            continue;
          }

          // Get token data from DB
          const tokenData = await getTokenBySymbol(symbol);

          // Build token and pool data objects
          const token = buildTokenObject(tokenData, symbol, mintAddress, decimals);
          const lendingPoolData = buildPoolDataObject(poolData, symbol, mintAddress, token);

          positions.push({
            walletAddress,
            chainId,
            amount,
            token,
            poolData: lendingPoolData,
            protocol: 'kamino-lend',
          });
        } catch (err) {
          console.warn(`⚠️ Failed to process deposit:`, err);
          // Continue to next deposit
        }
      }
    }

    return positions;
  } catch (error) {
    console.error('❌ [SERVER] Error fetching Kamino lending positions:', error);
    return []; // Return empty array on error, don't break the portfolio page
  }
}

/**
 * Fetch all lending positions for a user across all supported protocols (SERVER-SIDE ONLY)
 * Aggregates results from protocol-specific fetching functions
 * This function uses Kamino SDK which requires Node.js, so it must run on the server
 */
export async function getAllLendingPositionsServer(
  walletAddress: string,
  chainId: string = 'solana',
): Promise<LendingPosition[]> {
  try {
    if (chainId !== 'solana') {
      return []; // Only support Solana for now
    }

    // Fetch positions from all supported protocols in parallel
    const [kaminoPositions] = await Promise.all([
      getKaminoLendingPositions(walletAddress, chainId),
      // Add more protocol fetchers here as they're implemented:
      // getJupiterLendPositions(walletAddress, chainId),
      // getMarginfiPositions(walletAddress, chainId),
    ]);

    // Aggregate all positions
    const allPositions = [...kaminoPositions];

    return allPositions;
  } catch (error) {
    console.error('❌ [SERVER] Error fetching lending positions:', error);
    return []; // Return empty array on error, don't break the portfolio page
  }
}
