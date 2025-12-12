import { z } from 'zod';

export const UnstakeInputSchema = z.object({
  amount: z
    .number()
    .positive()
    .optional()
    .describe('The amount of JupSOL to unstake. Must be a positive number but can be left empty.'),
  contractAddress: z
    .string()
    .optional()
    .describe('The contract address of the liquid staking provider to use. Optional for guidance.'),
});
