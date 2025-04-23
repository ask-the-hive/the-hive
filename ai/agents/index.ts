import { marketAgent } from "./market";
import { stakingAgent } from "./staking";
import { walletAgent } from "./wallet";
import { knowledgeAgent } from "./knowledge";
import { tradingAgent } from "./trading";
import { tokenAnalysisAgent } from "./token-analysis";
import { liquidityAgent } from "./liquidity";
import { bscTokenAnalysisAgent } from "./bsc-token-analysis";
import { bscMarketAgent } from "./bsc-market";
import { bscWalletAgent } from "./bsc-wallet";
import { bscKnowledgeAgent } from "./bsc-knowledge";
import { bscLiquidityAgent } from "./bsc-liquidity";
import { bscTradingAgent } from "./bsc-trading";
import { baseTokenAnalysisAgent } from "./base-token-analysis";

export const agents = [
    walletAgent,
    stakingAgent,
    marketAgent,
    tradingAgent,
    knowledgeAgent,
    tokenAnalysisAgent,
    liquidityAgent,
    bscTokenAnalysisAgent,
    bscMarketAgent,
    bscWalletAgent,
    bscKnowledgeAgent,
    bscLiquidityAgent,
    bscTradingAgent,
    baseTokenAnalysisAgent
];