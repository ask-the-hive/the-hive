import { StakingRewardsResponse } from '@/db/types';

export const getBestLendingYields = async (): Promise<StakingRewardsResponse> => {
  try {
    const response = await fetch('https://yields.llama.fi/pools', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response || !response.ok || response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lending yields data:', error);
    throw error;
  }
};
