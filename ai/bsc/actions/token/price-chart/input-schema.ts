import { z } from "zod";

export const PriceChartInputSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the token to display the price chart for."),
}); 