import type { TransferArgumentsType, TransferResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";
import { BscGetTokenAddressAction } from "../../token/get-token-address";

export async function transfer(
    args: TransferArgumentsType
): Promise<BscActionResult<TransferResultBodyType>> {
    try {
        let tokenAddress = args.tokenAddress;
        let tokenSymbol = args.tokenSymbol;

        // If tokenSymbol is provided but not tokenAddress, look up the address
        if (!tokenAddress && tokenSymbol) {
            const getTokenAddressAction = new BscGetTokenAddressAction();
            const result = await getTokenAddressAction.func({ keyword: tokenSymbol });
            
            if (!result.body?.address) {
                return {
                    message: `Could not find token address for symbol: ${tokenSymbol}`,
                };
            }
            tokenAddress = result.body.address;
        }

        // Return a message that will trigger the UI component
        return {
            message: `Please confirm the transfer of ${args.amount} ${tokenSymbol || "BNB"} to ${args.to}`,
            body: {
                amount: args.amount,
                recipient: args.to,
                token: tokenSymbol || "BNB",
                transaction: "" // Will be filled by the UI component
            }
        };
    } catch (error) {
        console.error('Transfer error:', error);
        return {
            message: `Error preparing transfer: ${error}`,
        };
    }
} 