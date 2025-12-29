import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getKaminoPools } from '@/services/lending/get-kamino-pools';
import { getJupiterPools } from '@/services/lending/get-jupiter-pools';
import { getTokenBySymbol } from '@/db/services/tokens';
import { LendingYieldsResultBodyType } from './schema';
import { capitalizeWords } from '@/lib/string-utils';
import { z } from 'zod';
import { LendingYieldsInputSchema } from './input-schema';

let cachedLendingYields: {
  timestamp: number;
  body: LendingYieldsResultBodyType;
} | null = null;

const LENDING_YIELDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getLendingYields(
  args: z.infer<typeof LendingYieldsInputSchema> = {},
): Promise<SolanaActionResult<LendingYieldsResultBodyType>> {
  try {
    if (
      cachedLendingYields &&
      Date.now() - cachedLendingYields.timestamp < LENDING_YIELDS_CACHE_TTL_MS
    ) {
      const filtered = applyLendingYieldsArgs(cachedLendingYields.body, args);
      return {
        message: buildLendingYieldsMessage(filtered, args),
        body: filtered,
      };
    }

    const [defiLlamaResponse, kaminoPools, jupiterPools] = await Promise.all([
      getBestLendingYields(),
      getKaminoPools(),
      getJupiterPools(),
    ]);

    const solanaPools = defiLlamaResponse.data.filter((pool: any) => pool.chain === 'Solana');

    const lendingProtocols = ['kamino-lend', 'jupiter-lend', 'jup-lend'];

    const stableCoins = ['USDC', 'USDT', 'EURC', 'FDUSD', 'PYUSD', 'USDS', 'USDY', 'USDS', 'USDG'];

    const defiLlamaPools = solanaPools.filter((pool: any) => {
      const isLendingProtocol = lendingProtocols.includes(pool.project);
      const isStableCoin = stableCoins.includes(pool.symbol);
      const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');

      const hasAPY = pool.apy && pool.apy > 0;
      const hasUnderlyingToken = pool.underlyingTokens && pool.underlyingTokens.length > 0;

      return isLendingProtocol && !isLPPair && hasAPY && hasUnderlyingToken && isStableCoin;
    });

    const defiLlamaKaminoPools = defiLlamaPools.filter((p: any) => p.project === 'kamino-lend');
    const defiLlamaJupiterPools = defiLlamaPools.filter(
      (p: any) => p.project === 'jupiter-lend' || p.project === 'jup-lend',
    );

    const kaminoPoolsByMint = new Map<string, any>();
    const jupiterPoolsByMint = new Map<string, any>();

    const enrichPool = (basePool: any, defiLlamaPool: any) => ({
      ...basePool,
      predictions: defiLlamaPool?.predictions ?? basePool.predictions,
      rewardTokens: defiLlamaPool?.rewardTokens?.length
        ? defiLlamaPool.rewardTokens
        : basePool.rewardTokens,
      url: defiLlamaPool?.url ?? basePool.url,
    });

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
      projectLogoURI: null,
          poolMeta: null,
          url: null,
          underlyingTokens: [pool.mintAddress],
          predictions: null,
        };

        const matchingDefiLlama = defiLlamaKaminoPools.find(
          (p: any) => p.underlyingTokens?.[0] === mint,
        );

        let enrichedKaminoPool = basePool;

        if (matchingDefiLlama) {
          enrichedKaminoPool = enrichPool(basePool, matchingDefiLlama);
        }

        kaminoPoolsByMint.set(mint, enrichedKaminoPool);
      });

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
      projectLogoURI: null,
        poolMeta: pool.address ?? null,
        url: null,
        underlyingTokens: [pool.mintAddress],
        predictions: pool.predictions || null,
      };

      const matchingDefiLlama = defiLlamaJupiterPools.find(
        (p: any) => p.underlyingTokens?.[0] === mint,
      );

      let enrichedJupiterPool = basePool;

      if (matchingDefiLlama) {
        enrichedJupiterPool = enrichPool(basePool, matchingDefiLlama);
      }

      jupiterPoolsByMint.set(mint, enrichedJupiterPool);
    });

    const solLendingPools = [
      ...Array.from(kaminoPoolsByMint.values()),
      ...Array.from(jupiterPoolsByMint.values()),
    ];

    if (solLendingPools.length === 0) {
      return {
        message: `No Solana lending pools found for the target protocols (Kamino, Jupiter Lend, Marginfi, Maple, Save). Please try again.`,
      };
    }

    const mustIncludePools: any[] = [];
    const preferSymbol = 'USDC';

    const bestFromProjectForSymbol = (pools: any[], project: string, symbol: string) => {
      return pools
        .filter((p) => p.project === project && (p.symbol || '').toUpperCase() === symbol)
        .sort((a, b) => (b.apy || 0) - (a.apy || 0))[0];
    };

    const bestKaminoUSDC = bestFromProjectForSymbol(solLendingPools, 'kamino-lend', preferSymbol);
    const bestJupiterUSDC = bestFromProjectForSymbol(solLendingPools, 'jupiter-lend', preferSymbol);

    if (bestKaminoUSDC) mustIncludePools.push(bestKaminoUSDC);
    if (bestJupiterUSDC) mustIncludePools.push(bestJupiterUSDC);

    const topSolanaPools = solLendingPools.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));
    const combined = [...mustIncludePools, ...topSolanaPools];
    const deduped = combined.filter((pool, index, arr) => {
      const key = `${pool.project}-${pool.tokenMintAddress || pool.underlyingTokens?.[0]}-${pool.symbol}`;
      return (
        index ===
        arr.findIndex(
          (p) =>
            `${p.project}-${p.tokenMintAddress || p.underlyingTokens?.[0]}-${p.symbol}` === key,
        )
      );
    });

    const dedupedSorted = deduped.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));
    const selectedPools = dedupedSorted;

    const body = await Promise.all(
      selectedPools.map(async (pool: any) => {
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
          tokenMintAddress: tokenMintAddress,
          predictions: pool.predictions,
          tokenData: tokenData || null,
          projectLogoURI:
            pool.project === 'kamino-lend'
              ? '/logos/kamino.svg'
              : pool.project === 'jupiter-lend' || pool.project === 'jup-lend'
              ? '/logos/jupiter.png'
              : null,
        };
      }),
    );

    const bestPool =
      selectedPools.reduce(
        (best: any, current: any) => ((current.apy || 0) > (best.apy || 0) ? current : best),
        selectedPools[0],
      ) || null;

    const bestSummary = bestPool
      ? `Best yield: ${bestPool.symbol} via ${capitalizeWords(
          bestPool.project || '',
        )} at ${(bestPool.apy || 0).toFixed(2)}% APY. `
      : 'No yields available yet. ';

    cachedLendingYields = {
      timestamp: Date.now(),
      body,
    };

    const filtered = applyLendingYieldsArgs(body, args);
    return {
      message: buildLendingYieldsMessage(filtered, args),
      body: filtered,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best lending yields: ${error}`,
    };
  }
}

const applyLendingYieldsArgs = (
  pools: LendingYieldsResultBodyType,
  args: z.infer<typeof LendingYieldsInputSchema>,
): LendingYieldsResultBodyType => {
  let filtered = pools.slice();

  if (args.symbol) {
    const symbol = args.symbol.toUpperCase();
    filtered = filtered.filter((p) => (p.symbol || '').toUpperCase() === symbol);
  }

  if (args.project) {
    const project = args.project.toLowerCase();
    filtered = filtered.filter((p) => String(p.project || '').toLowerCase() === project);
  }

  const sortBy = args.sortBy ?? 'apy';
  filtered.sort((a, b) => {
    if (sortBy === 'tvl') return (b.tvlUsd || 0) - (a.tvlUsd || 0);
    return (b.yield || 0) - (a.yield || 0);
  });

  if (typeof args.limit === 'number') {
    filtered = filtered.slice(0, args.limit);
  }

  return filtered;
};

const buildLendingYieldsMessage = (
  pools: LendingYieldsResultBodyType,
  args: z.infer<typeof LendingYieldsInputSchema>,
) => {
  if (!pools.length) return 'No lending pools found.';

  const bestPool =
    pools.reduce(
      (best: any, current: any) => ((current.yield || 0) > (best.yield || 0) ? current : best),
      pools[0],
    ) || null;

  const bestSummary = bestPool
    ? `Best yield: ${bestPool.symbol} via ${capitalizeWords(bestPool.project || '')} at ${(bestPool.yield || 0).toFixed(2)}% APY. `
    : '';

  const isFiltered =
    !!args.symbol ||
    !!args.project ||
    typeof args.limit === 'number' ||
    typeof args.sortBy === 'string';

  if (isFiltered) {
    return `${bestSummary}Found ${pools.length} Solana lending pool${pools.length === 1 ? '' : 's'}.`;
  }

  return `${bestSummary}Found ${pools.length} Solana lending pool${
    pools.length === 1 ? '' : 's'
  }. Compare the cards (APY and TVL are shown in the UI) and pick the best fit to continue.\n\nText rules: keep to one short sentence, do NOT list pool names/symbols/APYs in text, do NOT mention other tokens unless the user asked for them, and if you suggest a different token for higher yield make it clear they must swap first. DO NOT CHECK BALANCES YET - wait for the user to select a specific pool first.`;
};
