import { BASE_TRANSFER_NAME } from "./name";
import { BASE_TRANSFER_PROMPT } from "./prompt";
import { TransferInputSchema } from "./input-schema";
import type { TransferResultBodyType } from "./types";
import type { BaseAction } from "../../base-action";
import { transfer } from "./function";

export class BaseTransferAction implements BaseAction<typeof TransferInputSchema, TransferResultBodyType> {
    public name = BASE_TRANSFER_NAME;
    public description = BASE_TRANSFER_PROMPT;
    public argsSchema = TransferInputSchema;
    public func = transfer;
} 