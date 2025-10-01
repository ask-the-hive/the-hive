import { NextResponse } from 'next/server';
import { getBestLiquidStaking } from '@/services/staking-rewards/get-best-liquid-staking';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const symbol = searchParams.get('symbol');

    if (!project || !symbol) {
      return NextResponse.json(
        { error: 'Missing required parameters: project and symbol' },
        { status: 400 },
      );
    }

    // Fetch all pools from DeFiLlama
    const allPools = await getBestLiquidStaking();

    // Filter for Solana liquid staking pools matching the project and symbol
    const matchingPool = allPools.data?.find((pool: any) => {
      const isMatch =
        pool.project?.toLowerCase() === project.toLowerCase() &&
        pool.symbol?.toLowerCase() === symbol.toLowerCase() &&
        pool.chain === 'Solana';

      return isMatch;
    });

    if (!matchingPool) {
      return NextResponse.json(
        { error: 'Pool not found for the specified project and symbol' },
        { status: 404 },
      );
    }

    // Return the fresh pool data
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
    console.error('Error fetching liquid staking pool:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data' }, { status: 500 });
  }
}
