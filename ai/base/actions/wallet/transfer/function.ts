import { ethers } from "ethers";
import type { TransferArgumentsType, TransferResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";
import { getBaseProvider } from "../../../provider";
import { ERC20_ABI } from "@/lib/config/abis/erc20";
import { BaseGetTokenAddressAction } from "../../token/get-token-address";

export async function transfer(
    args: TransferArgumentsType
): Promise<BaseActionResult<TransferResultBodyType>> {
    try {
        // If we have a token symbol but no address, get the address
        if (args.tokenSymbol && !args.tokenAddress) {
            console.log(`Getting address for token symbol: ${args.tokenSymbol}`);
            const getTokenAddressAction = new BaseGetTokenAddressAction();
            const result = await getTokenAddressAction.func({ keyword: args.tokenSymbol });
            
            if (!result.body?.address) {
                return {
                    message: `Could not find token address for symbol: ${args.tokenSymbol}`,
                    body: {
                        success: false,
                        error: `Could not find token address for symbol: ${args.tokenSymbol}`
                    }
                };
            }
            args.tokenAddress = result.body.address;
        }

        // Return early if we don't have a valid recipient address
        if (!args.to || !args.to.startsWith('0x')) {
            return {
                message: "Invalid recipient address",
                body: {
                    success: false,
                    error: "Invalid recipient address"
                }
            };
        }

        // Return early if we don't have a valid amount
        if (!args.amount || args.amount <= 0) {
            return {
                message: "Invalid amount",
                body: {
                    success: false,
                    error: "Invalid amount"
                }
            };
        }

        return {
            message: "Ready to transfer",
            body: {
                success: false,
                amount: args.amount.toString(),
                to: args.to,
                token: args.tokenAddress || "ETH",
                walletAddress: args.walletAddress
            }
        };
    } catch (error) {
        console.error("Error in transfer function:", error);
        return {
            message: `Error preparing transfer: ${error}`,
            body: {
                success: false,
                error: `Error preparing transfer: ${error}`
            }
        };
    }
} 