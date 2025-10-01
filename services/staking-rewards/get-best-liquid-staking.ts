import { StakingRewardsResponse } from './types';

export const getBestLiquidStaking = async (): Promise<StakingRewardsResponse> => {
  try {
    const response = await fetch('https://yields.llama.fi/pools', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'X-API-KEY': process.env.STAKING_REWARDS_API_KEY!,
      },
    });

    if (!response || !response.ok || response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching liquid staking data:', error);
    throw error;
  }
};
