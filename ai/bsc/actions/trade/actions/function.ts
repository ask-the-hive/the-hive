import type { TradeArgumentsType, TradeResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";
import { BscGetTokenDataAction } from "../../token/get-token-data";

export async function trade(
    args: TradeArgumentsType
): Promise<BscActionResult<TradeResultBodyType>> {
    try {
        // Get token data if addresses are provided
        let inputTokenSymbol = "BNB";
        let outputTokenSymbol = "";

        if (args.inputTokenAddress) {
            const getTokenDataAction = new BscGetTokenDataAction();
            const result = await getTokenDataAction.func({ search: args.inputTokenAddress });
            if (result.body?.token?.symbol) {
                inputTokenSymbol = result.body.token.symbol;
            }
        }

        if (args.outputTokenAddress) {
            const getTokenDataAction = new BscGetTokenDataAction();
            const result = await getTokenDataAction.func({ search: args.outputTokenAddress });
            if (result.body?.token?.symbol) {
                outputTokenSymbol = result.body.token.symbol;
            }
        }

        // Return a message that will trigger the UI component
        return {
            message: `Please confirm the swap of ${args.inputAmount || ""} ${inputTokenSymbol} for ${outputTokenSymbol}`,
            body: {
                transaction: "", // Will be filled by the UI component
                inputAmount: args.inputAmount || 0,
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