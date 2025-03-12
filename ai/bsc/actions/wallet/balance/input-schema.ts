import { z } from "zod";

export const BalanceInputSchema = z.object({
    walletAddress: z.string().describe("The wallet address to check balance for"),
    tokenSymbol: z.string().optional().describe("The token symbol or name to check balance for. If not provided, returns BNB balance"),
    tokenAddress: z.string().optional().describe("The token address to check balance for. Takes precedence over tokenSymbol if both are provided"),
}); 