import type { TrendingToken } from "@/services/birdeye/types/trending";

export interface GetTrendingTokensArgumentsType {
    limit?: number;
}

export interface GetTrendingTokensResultBodyType {
    tokens: TrendingToken[];
} 