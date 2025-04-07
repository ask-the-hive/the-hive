import { z } from "zod";

import { TopTradersByTokenTimeFrame } from "@/services/birdeye/types";

export const TopTokenTradersInputSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the token to check top traders for."),
    timeFrame: z.nativeEnum(TopTradersByTokenTimeFrame).default(TopTradersByTokenTimeFrame.TwentyFourHours).describe("The time frame to check top traders for."),
}); 