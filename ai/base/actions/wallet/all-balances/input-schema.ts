import { z } from "zod";

export const AllBalancesInputSchema = z.object({
    walletAddress: z.string().describe("The wallet address to check balances for"),
}); 