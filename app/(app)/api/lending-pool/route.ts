import { NextResponse } from 'next/server';
import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getLendingYields } from '@/ai/solana/actions/lending/lending-yields/function';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const symbol = searchParams.get('symbol');

    if (project && symbol && project.toLowerCase() === 'all' && symbol.toLowerCase() === 'all') {
      const result = await getLendingYields();
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

    const allPools = await getBestLendingYields();
    const stableSymbols = ['USDC', 'USDT', 'USDG', 'EURC', 'FDUSD', 'PYUSD', 'USDS'];
    const solLendingPools = (allPools.data || []).filter(
      (pool: any) =>
        pool.chain === 'Solana' && stableSymbols.includes((pool.symbol || '').toUpperCase()),
    );

    let matchingPool: any | undefined;
    if (project && symbol) {
      matchingPool = solLendingPools.find((pool: any) => {
        const isMatch =
          pool.project?.toLowerCase() === project.toLowerCase() &&
          pool.symbol?.toLowerCase() === symbol.toLowerCase();

        return isMatch;
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
      yield: matchingPool.apy || 0,
      apyBase: matchingPool.apyBase || 0,
      apyReward: matchingPool.apyReward || 0,
      tvlUsd: matchingPool.tvlUsd || 0,
      url: matchingPool.url,
      rewardTokens: matchingPool.rewardTokens || [],
      underlyingTokens: matchingPool.underlyingTokens || [],
      poolMeta: matchingPool.poolMeta,
      predictions: matchingPool.predictions,
    });
  } catch (error) {
    console.error('Error fetching lending pool:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data' }, { status: 500 });
  }
}
