import { z } from "zod";

export const LiquidStakingYieldsInputSchema = z.object({
  sortBy: z.enum(['apy', 'tvl']).optional(),
  limit: z.number().int().min(1).max(10).optional(),
});
