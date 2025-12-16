import { NextResponse } from 'next/server';
import { getBestLiquidStaking } from '@/services/staking-rewards/get-best-liquid-staking';
import { withErrorHandling } from '@/lib/api-error-handler';
import { getLiquidStakingYields } from '@/ai/solana/actions/staking/liquid-staking-yields/function';
import { getTokenBySymbol } from '@/db/services/tokens';

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
  const normalizedSymbol = symbol?.toLowerCase();
  const normalizedProject = project?.toLowerCase();

  if (normalizedSymbol && normalizedProject) {
    matchingPool = solPools.find(
      (pool: any) =>
        pool.project?.toLowerCase() === normalizedProject &&
        pool.symbol?.toLowerCase() === normalizedSymbol,
    );
  } else if (normalizedSymbol) {
    const candidates = solPools
      .filter((pool: any) => pool.symbol?.toLowerCase() === normalizedSymbol)
      .filter((pool: any) => {
        const poolSymbol = String(pool.symbol || '');
        const isLPPair = poolSymbol.includes('-') || poolSymbol.includes('/');
        return !isLPPair && Number(pool.apy || 0) > 0;
      });

    if (candidates.length > 0) {
      matchingPool = candidates.reduce((best: any, current: any) => {
        const bestApy = Number(best?.apy || 0);
        const currentApy = Number(current?.apy || 0);
        return currentApy > bestApy ? current : best;
      }, candidates[0]);
    }
  }

  if (!matchingPool) {
    return NextResponse.json(
      { error: 'Pool not found for the specified project and symbol' },
      { status: 404 },
    );
  }

  let tokenData = null;
  if (symbol) {
    try {
      tokenData = await getTokenBySymbol(symbol, 'solana');
    } catch (error) {
      console.error('Error fetching tokenData for liquid staking pool:', error);
      tokenData = null;
    }
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
    tokenData: tokenData || null,
  });
});
