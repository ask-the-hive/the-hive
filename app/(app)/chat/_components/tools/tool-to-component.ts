import { 
    GetTrendingTokens as SolanaGetTrendingTokens,
    GetTokenData as SolanaGetTokenData,
    GetTokenAddress as SolanaGetTokenAddress,
    NumHolders as SolanaTokenHolders,
    GetTopHolders as SolanaTopHolders,
    BubbleMaps as SolanaBubbleMaps,
    GetTopTokenTraders as SolanaTopTraders,
    PriceChart as SolanaPriceChart,
    GetTopTraders as SolanaGetTopTraders,
    GetTrades as SolanaGetTraderTrades,
    GetSmartMoneyInflows as SolanaGetSmartMoneyInflows
} from "./solana";

import { 
    GetTrendingTokens as BscGetTrendingTokens,
    GetTrades as BscGetTrades,
    GetTopTraders as BscGetTopTraders,
    GetWalletAddress as BscGetWalletAddress,
    GetBscBalance,
    Transfer as BscTransfer,
    Trade as BscTrade
} from "./bsc";

import Transfer from "./base/transfer";

export const toolToComponent = {
    "tokenanalysis-get-token-data": SolanaGetTokenData,
    "tokenanalysis-get-token-address": SolanaGetTokenAddress,
    "tokenanalysis-token-holders": SolanaTokenHolders,
    "tokenanalysis-top-holders": SolanaTopHolders,
    "tokenanalysis-bubble-maps": SolanaBubbleMaps,
    "tokenanalysis-token-top-traders": SolanaTopTraders,
    "tokenanalysis-price-chart": SolanaPriceChart,
    "market-get-trending-tokens": SolanaGetTrendingTokens,
    "market-get-top-traders": SolanaGetTopTraders,
    "market-get-trader-trades": SolanaGetTraderTrades,
    "market-get-smart-money-inflows": SolanaGetSmartMoneyInflows,
    "bscmarket-get-trending-tokens": BscGetTrendingTokens,
    "bscmarket-bsc-get-trader-trades": BscGetTrades,
    "bscmarket-bsc-get-top-traders": BscGetTopTraders,
    "bscwallet-bsc-get-wallet-address": BscGetWalletAddress,
    "bscwallet-bsc_balance": GetBscBalance,
    "bscwallet-bsc_transfer": BscTransfer,
    "bsctrading-bsc_trade": BscTrade,
    "basewallet-base_transfer": Transfer,
    // ... rest of the mappings
} 