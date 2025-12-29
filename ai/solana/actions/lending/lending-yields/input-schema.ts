import { z } from 'zod';

export const LendingYieldsInputSchema = z.object({
  symbol: z.string().optional(),
  project: z.string().optional(),
  sortBy: z.enum(['apy', 'tvl']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
