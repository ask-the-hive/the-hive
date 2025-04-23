import { z } from "zod";
import type { BaseActionResult } from "../../base-action";
import { TransferInputSchema } from "./input-schema";

export type TransferArgumentsType = z.infer<typeof TransferInputSchema>;

export interface TransferResultBodyType {
    success: boolean;
    error?: string;
    txHash?: string;
    amount?: string;
    symbol?: string;
    to?: string;
    token?: string;
    walletAddress?: string;
} 