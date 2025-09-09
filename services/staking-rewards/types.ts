export interface StakingMetric {
    label: string;
    metricKey: string;
    defaultValue: number;
}

export interface StakingProvider {
    slug: string;
    isVerified: boolean;
}

export interface OutputAsset {
    symbol: string;
    name: string;
    logoUrl: string;
}

export interface RewardOption {
    outputAssets: OutputAsset[];
    providers: StakingProvider[];
    metrics: StakingMetric[];
}

export interface StakingRewardsResponse {
    errors?: string[];
    data: {
        rewardOptions: RewardOption[];
    };
}