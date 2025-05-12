import type { TradeArgumentsType, TradeResultBodyType } from "./types";
import type { BaseActionResult } from "@/ai/base-action";

export async function trade(
    args: TradeArgumentsType
): Promise<BaseActionResult<TradeResultBodyType>> {
    try {
        // Get token symbols from input
        let inputTokenSymbol = args.inputTokenAddress || "";
        let outputTokenSymbol = args.outputTokenAddress || "";
        let inputAmount = args.inputAmount;

        // Generic trade request
        if (!inputTokenSymbol && !outputTokenSymbol) {
            return {
                message: `Let's set up your token trade. Please select the tokens you want to trade.`,
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress
                }
            };
        }

        // Specific trade request
        return {
            message: `Please confirm the swap${inputAmount ? ` of ${inputAmount}` : ''} ${inputTokenSymbol ? inputTokenSymbol : ''} ${outputTokenSymbol ? `for ${outputTokenSymbol}` : ''}`,
            body: {
                transaction: "", // Will be filled by the UI component
                inputAmount: inputAmount || 0,
                inputToken: inputTokenSymbol,
                outputToken: outputTokenSymbol,
                walletAddress: args.walletAddress
            }
        };
    } catch (error) {
        console.error('Trade error:', error);
        return {
            message: `Error preparing trade: ${error}`,
            body: {
                transaction: "",
                inputAmount: 0,
                inputToken: "",
                outputToken: "",
                walletAddress: args.walletAddress,
                error: error instanceof Error ? error.message : String(error)
            }
        };
    }
} 