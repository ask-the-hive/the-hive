import { 
    KNOWLEDGE_AGENT_NAME, 
    MARKET_AGENT_NAME, 
    STAKING_AGENT_NAME, 
    WALLET_AGENT_NAME,
    TOKEN_ANALYSIS_AGENT_NAME, 
    TRADING_AGENT_NAME, 
    SOCIAL_AGENT_NAME,
    LIQUIDITY_AGENT_NAME,
    BSC_WALLET_AGENT_NAME,
    BSC_KNOWLEDGE_AGENT_NAME,
    BSC_LIQUIDITY_AGENT_NAME,
    BSC_TRADING_AGENT_NAME,
    BASE_KNOWLEDGE_AGENT_NAME,
    BASE_TOKEN_ANALYSIS_AGENT_NAME,
    BASE_WALLET_AGENT_NAME,
    BASE_MARKET_AGENT_NAME
} from "@/ai/agents/names";

import type { IconName } from "@/types";
import type { ToolInvocation } from "ai";

export const toolToAgent = {
    "staking": STAKING_AGENT_NAME,
    "wallet": WALLET_AGENT_NAME,
    "market": MARKET_AGENT_NAME,
    "knowledge": KNOWLEDGE_AGENT_NAME,
    "trading": TRADING_AGENT_NAME,
    "social": SOCIAL_AGENT_NAME,
    "tokenanalysis": TOKEN_ANALYSIS_AGENT_NAME,
    "bsctokenanalysis": TOKEN_ANALYSIS_AGENT_NAME,
    "bscmarket": MARKET_AGENT_NAME,
    "bscwallet": BSC_WALLET_AGENT_NAME,
    "bscknowledge": BSC_KNOWLEDGE_AGENT_NAME,
    "liquidity": LIQUIDITY_AGENT_NAME,
    "bscliquidity": BSC_LIQUIDITY_AGENT_NAME,
    "bsctrading": BSC_TRADING_AGENT_NAME,
    "baseknowledge": BASE_KNOWLEDGE_AGENT_NAME,
    "basetokenanalysis": BASE_TOKEN_ANALYSIS_AGENT_NAME,
    "basewallet": BASE_WALLET_AGENT_NAME,
    "basemarket": BASE_MARKET_AGENT_NAME
}

export const getAgentName = (tool: ToolInvocation) => {
    const toolParts = tool.toolName.split("-");
    const agentName = toolParts[0];
    return toolToAgent[agentName as keyof typeof toolToAgent] || "Unknown Agent";
}

export const getAgentIcon = (agentName: string): IconName => {
    switch(agentName) {
        case STAKING_AGENT_NAME:
            return "Beef";
        case WALLET_AGENT_NAME:
        case BSC_WALLET_AGENT_NAME:
        case BASE_WALLET_AGENT_NAME:
            return "Wallet";
        case MARKET_AGENT_NAME:
        case BASE_MARKET_AGENT_NAME:
            return "ChartLine";
        case KNOWLEDGE_AGENT_NAME:
        case BSC_KNOWLEDGE_AGENT_NAME:
        case BASE_KNOWLEDGE_AGENT_NAME:
            return "Brain";
        case TRADING_AGENT_NAME:
        case BSC_TRADING_AGENT_NAME:
            return "ChartCandlestick";
        case SOCIAL_AGENT_NAME:
            return "Twitter";
        case TOKEN_ANALYSIS_AGENT_NAME:
            return "Coins";
        case LIQUIDITY_AGENT_NAME:
        case BSC_LIQUIDITY_AGENT_NAME:
            return "Droplet";
        case BASE_TOKEN_ANALYSIS_AGENT_NAME:
            return "Coins";
        default:
            return "Brain";
    }
}