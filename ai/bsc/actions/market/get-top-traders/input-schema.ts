import { TimeFrame } from "@/services/birdeye/types";
import { z } from "zod";

export const GetTopTradersInputSchema = z.object({
    timeFrame: z.nativeEnum(TimeFrame)
        .default(TimeFrame.Week)
        .describe("The time frame to get the top traders for. Defaults to week"),
}); 