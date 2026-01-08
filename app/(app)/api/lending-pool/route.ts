import { NextResponse } from 'next/server';
import { getLendingYields } from '@/ai/solana/actions/lending/lending-yields/function';
import { isSupportedSolanaLendingStablecoin } from '@/lib/yield-support';

const normalizeProject = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const symbol = searchParams.get('symbol');

    if (project && symbol && project.toLowerCase() === 'all' && symbol.toLowerCase() === 'all') {
      const result = await getLendingYields({ limit: 50 });
      const pools = result.body || [];

      if (!pools.length) {
        return NextResponse.json({ error: 'No lending pools available' }, { status: 404 });
      }

      const best = pools.reduce(
        (max, pool) => ((pool.yield || 0) > (max.yield || 0) ? pool : max),
        pools[0],
      );

      return NextResponse.json({
        project: best.project,
        symbol: best.symbol,
        yield: best.yield || 0,
        apyBase: best.apyBase || 0,
        apyReward: best.apyReward || 0,
        tvlUsd: best.tvlUsd || 0,
        url: best.url,
        rewardTokens: best.rewardTokens || [],
        underlyingTokens: best.underlyingTokens || [],
        poolMeta: best.poolMeta,
        predictions: best.predictions,
        tokenData: best.tokenData || null,
        tokenMintAddress: best.tokenMintAddress || best.underlyingTokens?.[0] || null,
      });
    }

    const yields = await getLendingYields({ limit: 50 });
    const solLendingPools = (yields.body || []).filter((pool) =>
      isSupportedSolanaLendingStablecoin(pool.symbol),
    );

    let matchingPool: any | undefined;
    if (project && symbol) {
      const normalizedProject = normalizeProject(project);
      matchingPool = solLendingPools.find((pool: any) => {
        const poolProject = normalizeProject(String(pool.project || ''));
        const isProjectMatch =
          poolProject === normalizedProject ||
          poolProject.startsWith(normalizedProject) ||
          normalizedProject.startsWith(poolProject);
        const isSymbolMatch = pool.symbol?.toLowerCase() === symbol.toLowerCase();

        return isProjectMatch && isSymbolMatch;
      });
    }

    if (!matchingPool) {
      return NextResponse.json(
        { error: 'Pool not found for the specified project and symbol' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      project: matchingPool.project,
      symbol: matchingPool.symbol,
      yield: matchingPool.yield || 0,
      apyBase: matchingPool.apyBase || 0,
      apyReward: matchingPool.apyReward || 0,
      tvlUsd: matchingPool.tvlUsd || 0,
      url: matchingPool.url,
      rewardTokens: matchingPool.rewardTokens || [],
      underlyingTokens: matchingPool.underlyingTokens || [],
      poolMeta: matchingPool.poolMeta,
      predictions: matchingPool.predictions,
      tokenData: matchingPool.tokenData || null,
      tokenMintAddress: matchingPool.tokenMintAddress || matchingPool.underlyingTokens?.[0] || null,
    });
  } catch (error) {
    console.error('Error fetching lending pool:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data' }, { status: 500 });
  }
}
