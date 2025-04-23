import { BaseTopHoldersAction } from "@/ai/base/actions/token/top-holders";

import type { TokenChatData } from "@/types";
import type { TokenPageTopHoldersArgumentsType, TokenPageTopHoldersResultBodyType } from "../top-holders/types";
import type { TokenPageActionResult } from "../types";

export async function getBaseTokenPageTopHolders(token: TokenChatData, args: TokenPageTopHoldersArgumentsType): Promise<TokenPageActionResult<TokenPageTopHoldersResultBodyType>> {
    try {
        // Use the existing Base top holders action
        const baseAction = new BaseTopHoldersAction();
        
        // Call the action with the token address as search term
        const baseResult = await baseAction.func({
            search: token.address
        });
        
        if (!baseResult.body) {
            return {
                message: baseResult.message || "Could not fetch holder data",
            };
        }
        
        // Calculate concentration metrics from the data
        const topHolders = baseResult.body.topHolders || [];
        
        // Create sorted list
        const sortedHolders = [...topHolders].sort((a, b) => b.percentage - a.percentage);
        
        // Calculate basic metrics
        const top5HoldersPercent = sortedHolders.slice(0, 5).reduce((acc, curr) => acc + curr.percentage, 0);
        const top10HoldersPercent = sortedHolders.slice(0, 10).reduce((acc, curr) => acc + curr.percentage, 0);
        const top20HoldersPercent = sortedHolders.slice(0, 20).reduce((acc, curr) => acc + curr.percentage, 0);
        
        // Since we don't have detailed categorization, use estimates
        const exchangeHoldersPercent = 0;
        const vestedHoldersPercent = 0;
        const largestHolder = sortedHolders[0]?.percentage || 0;
        const remainingSupplyPercent = Math.max(0, 1 - top20HoldersPercent);
        
        // Averages
        const avgTop10Holding = sortedHolders.slice(0, 10).length > 0 ? 
            top10HoldersPercent / sortedHolders.slice(0, 10).length : 0;
        const avgExchangeHolding = 0;
        
        // Determine concentration level
        let concentrationLevel = "Low";
        if (top5HoldersPercent > 0.5) concentrationLevel = "Very High";
        else if (top5HoldersPercent > 0.3) concentrationLevel = "High";
        else if (top5HoldersPercent > 0.15) concentrationLevel = "Medium";
        
        // Format results to match the expected format
        return {
            message: `Analyzed top holders for ${token.name} (${token.symbol})`,
            body: {
                top5HoldersPercent,
                top10HoldersPercent,
                top20HoldersPercent,
                exchangeHoldersPercent,
                vestedHoldersPercent,
                largestHolder,
                remainingSupplyPercent,
                avgTop10Holding,
                avgExchangeHolding,
                concentrationLevel,
                exchangePresence: "Unknown",
                numExchanges: 0,
                numVestingContracts: 0
            }
        };
    } catch (error) {
        console.error("Error in Base token page top holders:", error);
        return {
            message: `Failed to analyze holder data: ${error}`,
        };
    }
} 