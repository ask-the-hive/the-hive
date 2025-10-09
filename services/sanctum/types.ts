export interface SanctumLST {
  symbol: string;
  mint: string;
  tokenProgram: string;
  name: string;
  logoUri: string;
  decimals: number;
  pool: {
    program: string;
  };
  holders: number;
  launchDate: string;
  mainValueProposition: string;
  oneLiner: string;
  bulletPoints: string[];
  twitter: string;
  website: string;
  telegramGroupLink: string;
  categories: string[];
  featureId: number;
  sanctumAutomated: boolean;
  managerFeeConfig: {
    dst: string;
    withholdRate: number;
  };
  tvl: number;
  latestApy: number;
  avgApy: number;
  solValue: number;
}

export interface SanctumAPIResponse {
  data: SanctumLST[];
}
