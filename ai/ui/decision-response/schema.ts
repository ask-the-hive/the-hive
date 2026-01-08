import { z } from 'zod';

export const DecisionOutputSchema = z.object({
  primaryRecommendation: z.string().min(1),
  rationale: z.string().min(1),
  cta: z.enum([
    'Connect wallet',
    'View safest pool',
    'Stake now',
    'Lend now',
    'Swap now',
    'Withdraw now',
    'Transfer now',
    'Add liquidity',
  ]),
  alternatives: z
    .array(
      z.object({
        recommendation: z.string().min(1),
        rationale: z.string().min(1).optional(),
      }),
    )
    .optional(),
});

export type DecisionOutput = z.infer<typeof DecisionOutputSchema>;
