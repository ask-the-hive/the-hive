'use client'

import React from 'react'

import {
    Balance,
    GetWalletAddress,
    GetTrendingTokens,
    GetTokenData,
    Trade,
    Stake,
    Unstake,
    AllBalances,
    LiquidStakingYields,
    Transfer as SolanaTransfer,
    GetTokenAddress,
    GetTopHolders,
    BubbleMaps as SolanaBubbleMaps,
    GetPools,
    DepositLiquidity,
    NumHolders,
    GetLpTokens,
    WithdrawLiquidity,
    GetTopTraders,
    GetTrades,
    GetTopTokenTraders,
    PriceChart,
    GetSmartMoneyInflows,
} from './solana'
import {
    BubbleMaps as BscBubbleMaps,
    PriceChart as BscPriceChart,
    GetTokenAddress as BscGetTokenAddress,
    GetTokenData as BscGetTokenData,
    TokenHolders as BscTokenHolders,
    TopHolders as BscTopHolders,
    TopTraders as BscTopTraders,
    GetWalletAddress as BscGetWalletAddress,
    GetBscBalance,
    GetBscAllBalances,
    GetTrendingTokens as BscGetTrendingTokens,
    GetTrades as BscGetTrades,
    Transfer as BscTransfer,
    GetPools as BscGetPools,
    Trade as BscTrade,
    GetTopTraders as BscGetTopTraders
} from './bsc'
import { SearchRecentTweets } from './twitter'
import { SearchKnowledge } from './knowledge'
import { InvokeAgent } from './invoke'
import { GetKnowledge } from './bsc-knowledge'
import { GetKnowledge as BaseGetKnowledge } from './base-knowledge'
import BaseGetTokenData from './base/get-token-data'
import { GetTokenAddress as BaseGetTokenAddress } from './base'
import { BASE_BUBBLE_MAPS_NAME } from '@/ai/base/actions/token/bubble-maps/name'
import { BubbleMaps as BaseBubbleMaps } from './base'
import { BASE_PRICE_CHART_NAME } from '@/ai/base/actions/token/price-chart/name'
import { PriceChart as BasePriceChart } from './base'
import { BASE_TOKEN_HOLDERS_NAME } from '@/ai/base/actions/token/token-holders/name'
import { TokenHolders as BaseTokenHolders } from './base'
import { BASE_TOP_HOLDERS_NAME } from '@/ai/base/actions/token/top-holders/name'
import { TopHolders as BaseTopHolders } from './base'
import { BASE_TOKEN_TOP_TRADERS_NAME } from '@/ai/base/actions/token/top-traders/name'
import BaseTopTraders from './base/top-traders'
import BaseTransfer from './base/transfer'
import { 
    GetTrendingTokens as BaseGetTrendingTokens,
    GetTopTraders as BaseGetTopTraders,
    GetTrades as BaseGetTrades,
} from './base';

import { 
    SOLANA_BALANCE_NAME,
    SOLANA_GET_WALLET_ADDRESS_NAME,
    SOLANA_GET_TRENDING_TOKENS_NAME,
    SOLANA_GET_TOKEN_DATA_NAME,
    SOLANA_TRADE_NAME,
    SOLANA_LIQUID_STAKING_YIELDS_NAME,
    SOLANA_TRANSFER_NAME,
    TWITTER_SEARCH_RECENT_NAME,
    SOLANA_STAKE_NAME,
    SOLANA_UNSTAKE_NAME,
    SOLANA_ALL_BALANCES_NAME,
    SEARCH_KNOWLEDGE_NAME,
    INVOKE_AGENT_NAME,
    SOLANA_GET_TOKEN_ADDRESS_NAME,
    SOLANA_TOP_HOLDERS_NAME,
    SOLANA_BUBBLE_MAPS_NAME,
    SOLANA_TOKEN_HOLDERS_NAME,
    SOLANA_GET_POOLS_NAME,
    SOLANA_DEPOSIT_LIQUIDITY_NAME,
    SOLANA_GET_LP_TOKENS_NAME,
    SOLANA_WITHDRAW_LIQUIDITY_NAME,
    SOLANA_GET_TOP_TRADERS_NAME,
    SOLANA_GET_TRADER_TRADES_NAME,
    SOLANA_TOKEN_TOP_TRADERS_NAME,
    SOLANA_TOKEN_PRICE_CHART_NAME,
    SOLANA_GET_SMART_MONEY_INFLOWS_NAME,
    BSC_GET_KNOWLEDGE_NAME,
    BSC_TRADE_NAME,
    BASE_GET_KNOWLEDGE_NAME,
    BASE_GET_TOKEN_DATA_NAME,
    BASE_BALANCE_NAME,
    BASE_ALL_BALANCES_NAME,
    BASE_TRANSFER_NAME,
    BASE_GET_TRENDING_TOKENS_NAME,
    BASE_GET_TOP_TRADERS_NAME,
    BASE_GET_TRADER_TRADES_NAME,
} from '@/ai/action-names'
import { BSC_BUBBLE_MAPS_NAME } from '@/ai/bsc/actions/token/bubble-maps/name'
import { BSC_TOP_HOLDERS_NAME } from '@/ai/bsc/actions/token/top-holders/name'
import { BSC_PRICE_CHART_NAME } from '@/ai/bsc/actions/token/price-chart/name'
import { BSC_GET_TOKEN_DATA_NAME } from '@/ai/bsc/actions/token/get-token-data/name'
import { BSC_GET_TOKEN_ADDRESS_NAME } from '@/ai/bsc/actions/token/get-token-address/name'
import { BSC_TOKEN_HOLDERS_NAME } from '@/ai/bsc/actions/token/token-holders/name'
import { BSC_TOKEN_TOP_TRADERS_NAME } from '@/ai/bsc/actions/token/top-traders/name'
import { BSC_GET_TRADER_TRADES_NAME } from '@/ai/bsc/actions/market/get-trades/name'
import { BSC_GET_TRENDING_TOKENS_NAME } from '@/ai/bsc/actions/market/get-trending-tokens/name'
import { BSC_GET_TOP_TRADERS_NAME } from '@/ai/bsc/actions/market/get-top-traders/name'
import { BSC_GET_WALLET_ADDRESS_NAME } from '@/ai/bsc/actions/wallet/get-wallet-address/name'
import { BSC_BALANCE_NAME } from '@/ai/bsc/actions/wallet/balance/name'
import { BSC_ALL_BALANCES_NAME } from '@/ai/bsc/actions/wallet/all-balances/name'
import { BSC_TRANSFER_NAME } from '@/ai/bsc/actions/wallet/transfer/name'
import { BSC_GET_POOLS_NAME } from '@/ai/bsc/actions/liquidity/names'
import { BASE_GET_TOKEN_ADDRESS_NAME } from '@/ai/base/actions/token/get-token-address/name'
import { BASE_GET_WALLET_ADDRESS_NAME } from '@/ai/base/actions/wallet/get-wallet-address/name'
import BaseGetWalletAddress from "./base/get-wallet-address"
import GetBalance from "./base/balance"
import GetBaseAllBalances from "./base/all-balances"

import type { ToolInvocation as ToolInvocationType } from 'ai'

interface Props {
    tool: ToolInvocationType,
    prevToolAgent?: string,
}

const ToolInvocation: React.FC<Props> = ({ tool, prevToolAgent }) => {

    const toolParts = tool.toolName.split("-");
    const toolAgent = toolParts[0];
    const toolName = toolParts.slice(1).join("-");
    
    // Handle Base knowledge tools
    if (toolAgent === 'baseknowledge') {
        switch(toolName) {
            case BASE_GET_KNOWLEDGE_NAME:
                return <BaseGetKnowledge tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown Base knowledge tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle BSC wallet tools
    if (toolAgent === 'bscwallet') {
        switch(toolName) {
            case BSC_GET_WALLET_ADDRESS_NAME:
                return <BscGetWalletAddress tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_BALANCE_NAME:
                return <GetBscBalance tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_ALL_BALANCES_NAME:
                return <GetBscAllBalances tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_TRANSFER_NAME:
                return <BscTransfer tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown BSC wallet tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle BSC token analysis tools
    if (toolAgent === 'bsctokenanalysis') {
        switch(toolName) {
            case BSC_BUBBLE_MAPS_NAME:
                return <BscBubbleMaps tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_TOP_HOLDERS_NAME:
                return <BscTopHolders tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_PRICE_CHART_NAME:
                return <BscPriceChart tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_GET_TOKEN_DATA_NAME:
                return <BscGetTokenData tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_GET_TOKEN_ADDRESS_NAME:
                return <BscGetTokenAddress tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_TOKEN_HOLDERS_NAME:
                return <BscTokenHolders tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_TOKEN_TOP_TRADERS_NAME:
                return <BscTopTraders tool={tool} prevToolAgent={prevToolAgent} />
            // Add other BSC tools here as they are implemented
            default:
                console.log(`Unknown BSC tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    if (toolAgent === 'bscmarket') {
        switch(toolName) {
            case BSC_GET_TRENDING_TOKENS_NAME:
                return <BscGetTrendingTokens tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_GET_TRADER_TRADES_NAME:
                return <BscGetTrades tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_GET_TOP_TRADERS_NAME:
                return <BscGetTopTraders tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown BSC market tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle BSC liquidity tools
    if (toolAgent === 'bscliquidity') {
        switch(toolName) {
            case BSC_GET_POOLS_NAME:
                return <BscGetPools tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown BSC liquidity tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle BSC trading tools
    if (toolAgent === 'bsctrading') {
        switch(toolName) {
            case BSC_GET_WALLET_ADDRESS_NAME:
                return <BscGetWalletAddress tool={tool} prevToolAgent={prevToolAgent} />
            case BSC_TRADE_NAME:
                return <BscTrade tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown BSC trading tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle Base token analysis tools
    if (toolAgent === 'basetokenanalysis') {
        switch(toolName) {
            case BASE_BUBBLE_MAPS_NAME:
                return <BaseBubbleMaps tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_TOP_HOLDERS_NAME:
                return <BaseTopHolders tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_PRICE_CHART_NAME:
                return <BasePriceChart tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_GET_TOKEN_DATA_NAME:
                return <BaseGetTokenData tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_GET_TOKEN_ADDRESS_NAME:
                return <BaseGetTokenAddress tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_TOKEN_HOLDERS_NAME:
                return <BaseTokenHolders tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_TOKEN_TOP_TRADERS_NAME:
                return <BaseTopTraders tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown Base tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle Base market tools
    if (toolAgent === 'basemarket') {
        switch(toolName) {
            case BASE_GET_TRENDING_TOKENS_NAME:
                return <BaseGetTrendingTokens tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_GET_TOP_TRADERS_NAME:
                return <BaseGetTopTraders tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_GET_TRADER_TRADES_NAME:
                return <BaseGetTrades tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown Base market tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle Base wallet tools
    if (toolAgent === 'basewallet') {
        switch(toolName) {
            case BASE_GET_WALLET_ADDRESS_NAME:
                return <BaseGetWalletAddress tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_BALANCE_NAME:
                return <GetBalance tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_ALL_BALANCES_NAME:
                return <GetBaseAllBalances tool={tool} prevToolAgent={prevToolAgent} />
            case BASE_TRANSFER_NAME:
                return <BaseTransfer tool={tool} prevToolAgent={prevToolAgent} />
            default:
                console.log(`Unknown Base wallet tool: ${toolName}`);
                return (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(tool, null, 2)}
                    </pre>
                );
        }
    }
    
    // Handle Solana tools
    switch(toolName) {
        case SOLANA_BALANCE_NAME:
            return <Balance tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_WALLET_ADDRESS_NAME:
            return <GetWalletAddress tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_TRENDING_TOKENS_NAME:
            return <GetTrendingTokens tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_TOKEN_DATA_NAME:
            return <GetTokenData tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TRADE_NAME:
            return <Trade tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_LIQUID_STAKING_YIELDS_NAME:
            return <LiquidStakingYields tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TRANSFER_NAME:
            return <SolanaTransfer tool={tool} prevToolAgent={prevToolAgent} />
        case TWITTER_SEARCH_RECENT_NAME:
            return <SearchRecentTweets tool={tool} />
        case SOLANA_STAKE_NAME:
            return <Stake tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_UNSTAKE_NAME:
            return <Unstake tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_ALL_BALANCES_NAME:
            return <AllBalances tool={tool} prevToolAgent={prevToolAgent} />
        case SEARCH_KNOWLEDGE_NAME:
            return <SearchKnowledge tool={tool} prevToolAgent={prevToolAgent} />
        case INVOKE_AGENT_NAME:
            return <InvokeAgent tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_TOKEN_ADDRESS_NAME:
            return <GetTokenAddress tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TOP_HOLDERS_NAME:
            return <GetTopHolders tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_BUBBLE_MAPS_NAME:
            return <SolanaBubbleMaps tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TOKEN_HOLDERS_NAME:
            return <NumHolders tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_POOLS_NAME:
            return <GetPools tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_DEPOSIT_LIQUIDITY_NAME:
            return <DepositLiquidity tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_LP_TOKENS_NAME:
            return <GetLpTokens tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_WITHDRAW_LIQUIDITY_NAME:
            return <WithdrawLiquidity tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_TOP_TRADERS_NAME:
            return <GetTopTraders tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_TRADER_TRADES_NAME:
            return <GetTrades tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TOKEN_TOP_TRADERS_NAME:
            return <GetTopTokenTraders tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_TOKEN_PRICE_CHART_NAME:
            return <PriceChart tool={tool} prevToolAgent={prevToolAgent} />
        case SOLANA_GET_SMART_MONEY_INFLOWS_NAME:
            return <GetSmartMoneyInflows tool={tool} prevToolAgent={prevToolAgent} />
        case BSC_GET_KNOWLEDGE_NAME:
            return <GetKnowledge tool={tool} prevToolAgent={prevToolAgent} />
        default:
            return (
                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(tool, null, 2)}
                </pre>
            );
    }
}

export default ToolInvocation