import { BSC_TRANSFER_NAME } from "./name";
import { BSC_TRANSFER_PROMPT } from "./prompt";
import { TransferInputSchema } from "./input-schema";
import type { TransferResultBodyType } from "./types";
import type { BscAction } from "../../bsc-action";
import { transfer } from "./function";

export class BscTransferAction implements BscAction<typeof TransferInputSchema, TransferResultBodyType> {
    public name = BSC_TRANSFER_NAME;
    public description = BSC_TRANSFER_PROMPT;
    public argsSchema = TransferInputSchema;
    public func = transfer;
} 