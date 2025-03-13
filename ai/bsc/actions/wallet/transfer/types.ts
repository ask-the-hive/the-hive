import { z } from "zod";
import { TransferInputSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";

export type TransferSchemaType = typeof TransferInputSchema;

export type TransferArgumentsType = z.infer<TransferSchemaType>;

export type TransferResultBodyType = {
    amount?: number;
    recipient?: string;
    token?: string;
    transaction?: string;
    cancelled?: boolean;
    error?: string;
};

export type TransferResultType = BscActionResult<TransferResultBodyType>; 