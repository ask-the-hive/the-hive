import { NextResponse } from 'next/server';
import { getBestLiquidStaking } from '@/services/staking-rewards/get-best-liquid-staking';
import { withErrorHandling } from '@/lib/api-error-handler';
import { getLiquidStakingYields } from '@/ai/solana/actions/staking/liquid-staking-yields/function';

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get('project');
  const symbol = searchParams.get('symbol');

  if (project && symbol && project.toLowerCase() === 'all' && symbol.toLowerCase() === 'all') {
    const result = await getLiquidStakingYields();
    const pools = result.body || [];

    if (!pools.length) {
      return NextResponse.json({ error: 'No liquid staking pools available' }, { status: 404 });
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
    });
  }

  const allPools = await getBestLiquidStaking();
  const solPools = (allPools.data || []).filter((pool: any) => pool.chain === 'Solana');

  let matchingPool: any | undefined;
  if (project && symbol) {
    matchingPool = solPools.find((pool: any) => {
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
});
