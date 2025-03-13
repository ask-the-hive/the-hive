import { z } from "zod";

import type { AllBalancesInputSchema } from "./input-schema";
import type { BscActionResult } from "../../bsc-action";

export type AllBalancesArgumentsType = z.infer<typeof AllBalancesInputSchema>;

export type AllBalancesResultBodyType = {
    balances: {
        balance: number;
        token: string;
        name: string;
        logoURI: string;
        usdValue: number;
        usdPrice: number;
        percentChange24h: number;
    }[];
}; 