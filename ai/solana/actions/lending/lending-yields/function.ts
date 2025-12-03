import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getKaminoPools } from '@/services/lending/get-kamino-pools';
import { getJupiterPools } from '@/services/lending/get-jupiter-pools';
import { getTokenBySymbol } from '@/db/services/tokens';
import { LendingYieldsResultBodyType } from './schema';

export async function getLendingYields(): Promise<SolanaActionResult<LendingYieldsResultBodyType>> {
  try {
    // Fetch from DefiLlama, Kamino SDK, and Jupiter Lend API
    const [defiLlamaResponse, kaminoPools, jupiterPools] = await Promise.all([
      getBestLendingYields(),
      getKaminoPools(),
      getJupiterPools(),
    ]);

    // Filter for Solana chains first
    const solanaPools = defiLlamaResponse.data.filter((pool: any) => pool.chain === 'Solana');

    // Filter for the specific Solana lending protocols
    const lendingProtocols = [
      'kamino-lend', // Kamino Finance - PRIMARY (best yields)
      'jupiter-lend', // Jupiter Lend - fetched via Jupiter API
      'jup-lend', // Jupiter Lend alias
      // 'marginfi-lending', // Marginfi - no pools in DeFiLlama
      // 'credix', // Credix
      // 'maple', // Maple Finance
      // 'save', // Save Finance - SDK has dependency issues
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

    // Split DefiLlama pools by project
    const defiLlamaKaminoPools = defiLlamaPools.filter((p: any) => p.project === 'kamino-lend');
    const defiLlamaJupiterPools = defiLlamaPools.filter(
      (p: any) => p.project === 'jupiter-lend' || p.project === 'jup-lend',
    );

    // Create maps for each protocol (keyed by mint address)
    const kaminoPoolsByMint = new Map<string, any>();
    const jupiterPoolsByMint = new Map<string, any>();

    // Helper to enrich a pool with DefiLlama metadata
    const enrichPool = (basePool: any, defiLlamaPool: any) => ({
      ...basePool,
      // Prefer DefiLlama predictions/metadata, keep base pool's APY data
      predictions: defiLlamaPool?.predictions ?? basePool.predictions,
      rewardTokens: defiLlamaPool?.rewardTokens?.length
        ? defiLlamaPool.rewardTokens
        : basePool.rewardTokens,
      url: defiLlamaPool?.url ?? basePool.url,
    });

    // Process Kamino SDK pools
    kaminoPools
      .filter((pool) => {
        const isStableCoin = stableCoins.includes(pool.symbol);
        const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');
        return pool.apy > 0 && !isLPPair && isStableCoin;
      })
      .forEach((pool) => {
        const mint = pool.mintAddress;
        if (!mint) return;

        const basePool = {
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
        };

        // Find matching DefiLlama pool for enrichment
        const matchingDefiLlama = defiLlamaKaminoPools.find(
          (p: any) => p.underlyingTokens?.[0] === mint,
        );

        let enrichedKaminoPool = basePool;

        if (matchingDefiLlama) {
          enrichedKaminoPool = enrichPool(basePool, matchingDefiLlama);
        }

        kaminoPoolsByMint.set(mint, enrichedKaminoPool);
      });

    // Process Jupiter pools
    jupiterPools.forEach((pool) => {
      const mint = pool.mintAddress;
      if (!mint) return;

      const basePool = {
        project: 'jupiter-lend',
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
      };

      // Find matching DefiLlama pool for enrichment
      const matchingDefiLlama = defiLlamaJupiterPools.find(
        (p: any) => p.underlyingTokens?.[0] === mint,
      );

      let enrichedJupiterPool = basePool;

      if (matchingDefiLlama) {
        enrichedJupiterPool = enrichPool(basePool, matchingDefiLlama);
      }

      jupiterPoolsByMint.set(mint, enrichedJupiterPool);
    });

    // Combine all pools (Kamino + Jupiter as separate entries)
    const solLendingPools = [
      ...Array.from(kaminoPoolsByMint.values()),
      ...Array.from(jupiterPoolsByMint.values()),
    ];

    if (solLendingPools.length === 0) {
      return {
        message: `No Solana lending pools found for the target protocols (Kamino, Jupiter Lend, Marginfi, Maple, Save). Please try again.`,
      };
    }

    // Sort by APY (highest first) and take top 6
    let topSolanaPools = solLendingPools.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));
    topSolanaPools = topSolanaPools.slice(0, 6);
    // Reorder only when showing exactly 3 cards; otherwise leave sorted
    if (topSolanaPools.length >= 3) {
      const [highest, second, third] = topSolanaPools;
      topSolanaPools[0] = second;
      topSolanaPools[1] = highest;
      topSolanaPools[2] = third;
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
