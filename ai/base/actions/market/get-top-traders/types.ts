import type { TopTrader } from "@/services/birdeye/types/top-traders";
import type { TimeFrame } from "@/services/birdeye/types/top-traders";

export interface GetTopTradersArgumentsType {
    timeFrame: TimeFrame;
}

export interface GetTopTradersResultBodyType {
    traders: TopTrader[];
} 