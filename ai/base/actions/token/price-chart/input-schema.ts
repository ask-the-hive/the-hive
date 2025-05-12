import { z } from "zod";

export const PriceChartArgumentsSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the Base token to get price chart for. Must be a valid Base token."),
}); 