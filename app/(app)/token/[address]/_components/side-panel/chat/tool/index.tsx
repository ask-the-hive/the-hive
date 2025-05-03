'use client'

import React from 'react'

import { 
    LiquidityAnalysis, 
    NumMentions, 
    PriceAnalysis, 
    TopHolders,
    TradingActivity
} from './tools';

import { 
    SOLANA_TOKEN_PAGE_LIQUIDITY_NAME, 
    SOLANA_TOKEN_PAGE_PRICE_ANALYSIS_NAME, 
    SOLANA_TOKEN_PAGE_TOP_HOLDERS_NAME, 
    TOKEN_PAGE_NUM_MENTIONS_NAME,
    BSC_TOKEN_PAGE_LIQUIDITY_NAME,
    BSC_TOKEN_PAGE_PRICE_ANALYSIS_NAME,
    BSC_TOKEN_PAGE_TOP_HOLDERS_NAME,
    BSC_TOKEN_PAGE_TRADING_ACTIVITY_NAME,
    BASE_TOKEN_PAGE_TOP_HOLDERS_NAME,
    BASE_TOKEN_PAGE_LIQUIDITY_NAME,
    BASE_TOKEN_PAGE_PRICE_ANALYSIS_NAME,
    BASE_TOKEN_PAGE_TRADING_ACTIVITY_NAME
} from '@/ai/action-names';

import type { ToolInvocation } from 'ai'
import type { TokenChatData } from '@/types';

interface Props {
    tool: ToolInvocation,
    token: TokenChatData
}

const Tool: React.FC<Props> = ({ tool, token }) => {
    // Check if this is a Base specific tool by the name
    const isBaseAction = tool.toolName.startsWith('base-');

    switch (tool.toolName) {
        case SOLANA_TOKEN_PAGE_TOP_HOLDERS_NAME:
        case BSC_TOKEN_PAGE_TOP_HOLDERS_NAME:
        case BASE_TOKEN_PAGE_TOP_HOLDERS_NAME:
            return <TopHolders tool={tool} />;
        case TOKEN_PAGE_NUM_MENTIONS_NAME:
            return <NumMentions tool={tool} />;
        case SOLANA_TOKEN_PAGE_LIQUIDITY_NAME:
        case BSC_TOKEN_PAGE_LIQUIDITY_NAME:
        case BASE_TOKEN_PAGE_LIQUIDITY_NAME:
            return <LiquidityAnalysis tool={tool} />;
        case SOLANA_TOKEN_PAGE_PRICE_ANALYSIS_NAME:
        case BSC_TOKEN_PAGE_PRICE_ANALYSIS_NAME:
        case BASE_TOKEN_PAGE_PRICE_ANALYSIS_NAME:
            return <PriceAnalysis tool={tool} token={token} />;
        case BSC_TOKEN_PAGE_TRADING_ACTIVITY_NAME:
        case BASE_TOKEN_PAGE_TRADING_ACTIVITY_NAME:
            return <TradingActivity tool={tool} />;
        default:
            if (isBaseAction) {
                console.log("Unhandled Base action:", tool.toolName);
            }
            return <pre>{JSON.stringify(tool, null, 2)}</pre>;
    }
}

export default Tool