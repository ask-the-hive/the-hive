import { z } from "zod";

export type BscActionResult<T = undefined> = {
    message: string;
    body?: T;
};

export interface BscAction<Schema extends z.ZodType<any, any>, ResultBody = undefined> {
    name: string;
    description: string;
    argsSchema: Schema;
    func?: (args: z.infer<Schema>) => Promise<BscActionResult<ResultBody>>;
} 