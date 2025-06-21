import { Connection } from "@solana/web3.js";

import { 
    SolanaGetTrendingTokensAction, 
    SolanaGetTopTradersAction,
    SolanaGetTraderTradesAction
} from "@/ai/solana/actions";

import { 
    SOLANA_GET_TRENDING_TOKENS_NAME, 
    SOLANA_GET_TOP_TRADERS_NAME,
    SOLANA_GET_TRADER_TRADES_NAME
} from "@/ai/action-names";

import { solanaTool } from "@/ai/solana";

export const MARKET_TOOLS = {
    [`market-${SOLANA_GET_TRENDING_TOKENS_NAME}`]: solanaTool(new SolanaGetTrendingTokensAction(), new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)),
    [`market-${SOLANA_GET_TOP_TRADERS_NAME}`]: solanaTool(new SolanaGetTopTradersAction(), new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)),
    [`market-${SOLANA_GET_TRADER_TRADES_NAME}`]: solanaTool(new SolanaGetTraderTradesAction(), new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!))
}