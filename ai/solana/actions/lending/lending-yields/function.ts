import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getKaminoPools } from '@/services/lending/get-kamino-pools';
import { getJupiterPools } from '@/services/lending/get-jupiter-pools';
import { getDefiTunaPools } from '@/services/lending/get-defituna-pools';
import { getTokenBySymbol } from '@/db/services/tokens';
import { LendingYieldsResultBodyType } from './schema';

export async function getLendingYields(): Promise<SolanaActionResult<LendingYieldsResultBodyType>> {
  try {
    // Fetch from DefiLlama, Kamino SDK, and Jupiter Lend API
    const [defiLlamaResponse, kaminoPools, jupiterPools, defiTunaPools] = await Promise.all([
      getBestLendingYields(),
      getKaminoPools(),
      getJupiterPools(),
      getDefiTunaPools(),
    ]);

    // Filter for Solana chains first
    const solanaPools = defiLlamaResponse.data.filter((pool: any) => pool.chain === 'Solana');

    // Filter for the specific Solana lending protocols
    const lendingProtocols = [
      'kamino-lend', // Kamino Finance
      'jupiter-lend', // Jupiter Lend - fetched via Jupiter API
      'jup-lend', // Jupiter Lend alias
      'defituna', // DefiTuna vaults (API)
    ];

    const stableCoins = ['USDC', 'USDT', 'EURC', 'FDUSD', 'PYUSD', 'USDS', 'USDY', 'USDS', 'USDG'];

    // Filter DefiLlama pools
    const defiLlamaPools = solanaPools.filter((pool: any) => {
      const isLendingProtocol = lendingProtocols.includes(pool.project);
      const isStableCoin = stableCoins.includes(pool.symbol);
      const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');

      const hasAPY = pool.apy && pool.apy > 0;
      const hasUnderlyingToken = pool.underlyingTokens && pool.underlyingTokens.length > 0;

      return isLendingProtocol && !isLPPair && hasAPY && hasUnderlyingToken && isStableCoin;
    });

    // Convert Kamino SDK pools to DefiLlama format
    const kaminoPoolsFormatted = kaminoPools
      .filter((pool) => {
        const isStableCoin = stableCoins.includes(pool.symbol);
        const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');
        return pool.apy > 0 && !isLPPair && isStableCoin;
      })
      .map((pool) => ({
        project: 'kamino-lend',
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd,
        apyBase: pool.apyBase,
        apyReward: null,
        apy: pool.apy,
        rewardTokens: [],
        poolMeta: null,
        url: null,
        underlyingTokens: [pool.mintAddress],
        predictions: null,
      }));

    // Merge pools, preferring Kamino SDK data when there are duplicates (fresher on-chain APY)
    const poolsByMint = new Map<string, any>();

    // Add DefiLlama pools first (they have more metadata like predictions)
    for (const pool of defiLlamaPools) {
      const mintAddress = pool.underlyingTokens?.[0];
      if (mintAddress) {
        poolsByMint.set(mintAddress, pool);
      }
    }

    // Merge with Kamino SDK pools to get the best of both sources
    for (const pool of kaminoPoolsFormatted) {
      const mintAddress = pool.underlyingTokens[0];
      const existingPool = poolsByMint.get(mintAddress);

    // Merge DefiTuna pools
    defiTunaPools.forEach((pool) => {
      mergePool(
        {
          project: pool.project,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd,
          apyBase: pool.apyBase,
          apyReward: pool.apyReward,
          apy: pool.yield,
          rewardTokens: pool.rewardTokens || [],
          poolMeta: pool.poolMeta,
          url: pool.url,
          underlyingTokens: pool.underlyingTokens,
          predictions: pool.predictions || null,
        },
        pool.tokenMintAddress,
      );
    });

    // Merge Jupiter pools (stablecoin-only) - treat as primary source for these mints
    jupiterPools.forEach((pool) => {
      const mintAddress = pool.mintAddress;
      if (!mintAddress) return;
      mergePool(
        {
          project: pool.project,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd,
          apyBase: pool.apyBase,
          apyReward: null,
          apy: pool.apy,
          rewardTokens: [],
          poolMeta: pool.address ?? null,
          url: null,
          underlyingTokens: [pool.mintAddress],
          predictions: pool.predictions || null,
        },
        mintAddress,
      );
    });

    const solLendingPools = Array.from(poolsByMint.values());

    if (solLendingPools.length === 0) {
      return {
        message: `No Solana lending pools found for the target protocols (Kamino, Jupiter Lend, Marginfi, Maple, Save). Please try again.`,
      };
    }

    // Sort by APY (highest first) and take top 3
    let topSolanaPools = solLendingPools.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));

    topSolanaPools = topSolanaPools.slice(0, 3);
    // Reorder so highest APY is in the center (index 1)
    if (topSolanaPools.length === 3) {
      const [highest, second, third] = topSolanaPools;
      topSolanaPools[0] = second; // Second highest on left
      topSolanaPools[1] = highest; // Highest APY in center
      topSolanaPools[2] = third; // Third highest on right
    }

    // Transform to the expected format
    const body = await Promise.all(
      topSolanaPools.map(async (pool: any) => {
        // Use underlyingTokens[0] from DefiLlama as the source of truth for the mint address
        const tokenMintAddress = pool.underlyingTokens?.[0];

        if (!tokenMintAddress) {
          console.warn('⚠️ Pool missing underlyingTokens (should have been filtered):', pool);
        }

        const tokenData = await getTokenBySymbol(pool.symbol);

        return {
          name: pool.symbol,
          symbol: pool.symbol,
          yield: pool.apy || 0,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          tvlUsd: pool.tvlUsd || 0,
          project: pool.project,
          poolMeta: pool.poolMeta,
          url: pool.url,
          rewardTokens: pool.rewardTokens || [],
          underlyingTokens: pool.underlyingTokens || [],
          // Override tokenData.id with the actual mint address from DefiLlama
          tokenMintAddress: tokenMintAddress,
          predictions: pool.predictions,
          tokenData: tokenData || null,
        };
      }),
    );

    return {
      message: `Found the ${body.length} top Solana lending pools. The user has been shown the options in the UI. Tell them to "select a lending pool in the UI to continue". DO NOT REITERATE THE OPTIONS IN TEXT. DO NOT CHECK BALANCES YET - wait for the user to select a specific pool first.`,
      body,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best lending yields: ${error}`,
    };
  }
}
