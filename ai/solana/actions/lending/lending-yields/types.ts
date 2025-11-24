export type LendingYieldsResultBodyType = {
  name: string;
  symbol: string;
  yield: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  project: string;
  poolMeta?: string;
  url?: string;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  tokenMintAddress?: string; // Mint address from DefiLlama's underlyingTokens[0] - source of truth
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: string;
  };
  tokenData: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  } | null;
}[];
