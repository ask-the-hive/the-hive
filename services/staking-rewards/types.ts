export interface PoolPredictions {
  predictedClass: string;
  predictedProbability: number;
  binnedConfidence: number;
}

export interface Pool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  rewardTokens: string[];
  underlyingTokens: string[];
  poolMeta: string;
  url: string;
  predictions: PoolPredictions;
}

export interface StakingRewardsResponse {
  status: string;
  data: Pool[];
}
