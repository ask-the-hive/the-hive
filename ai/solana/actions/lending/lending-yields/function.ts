import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { getBestLendingYields } from '@/services/lending/get-best-lending-yields';
import { getTokenBySymbol } from '@/db/services/tokens';
import { LendingYieldsResultBodyType } from './schema';

export async function getLendingYields(): Promise<SolanaActionResult<LendingYieldsResultBodyType>> {
  try {
    const response = await getBestLendingYields();

    // Filter for Solana chains first
    const solanaPools = response.data.filter((pool: any) => pool.chain === 'Solana');

    // Filter for the specific Solana lending protocols
    const lendingProtocols = [
      'kamino-lend', // Kamino Finance
      'jupiter-lend', // Jupiter Lend
      'marginfi-lending', // Marginfi
      'marginfi-lend',
      'maple', // Maple Finance
      'save', // Save Finance
      'credix', // Credix
      'francium', // Francium
    ];

    // Stablecoin tokens for lending
    // const stablecoinTokens = [
    //   'USDC', // USD Coin
    //   'USDT', // Tether
    // ];

    const solLendingPools = solanaPools.filter((pool: any) => {
      // Check if it's a lending protocol
      const isLendingProtocol = lendingProtocols.includes(pool.project);
      // Check if it's a stablecoin token
      // const isStablecoin = stablecoinTokens.includes(pool.symbol);

      const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');
      const hasAPY = pool.apy && pool.apy > 0;

      // Include lending protocols with stablecoin tokens that aren't LP pairs
      return isLendingProtocol && !isLPPair && hasAPY;
    });

    if (solLendingPools.length === 0) {
      return {
        message: `No Solana lending pools found for the target protocols (Kamino, Jupiter Lend, Marginfi, Maple, Save). Please try again.`,
      };
    }

    // Sort by APY (highest first) and take top 3
    let topSolanaPools = solLendingPools.sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));

    console.log('topSolanaPools', topSolanaPools.slice(0, 10));

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
          predictions: pool.predictions,
          tokenData: tokenData || null,
        };
      }),
    );

    return {
      message: `Found the ${body.length} top Solana lending pools. The user has been shown the options in the UI, ask them which they want to use. DO NOT REITERATE THE OPTIONS IN TEXT.`,
      body,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best lending yields: ${error}`,
    };
  }
}
