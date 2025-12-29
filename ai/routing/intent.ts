import { z } from 'zod';

export const IntentDomainSchema = z.enum([
  'yield',
  'staking',
  'lending',
  'trading',
  'knowledge',
  'portfolio',
  'market',
  'liquidity',
  'unknown',
]);

export type IntentDomain = z.infer<typeof IntentDomainSchema>;

export const IntentGoalSchema = z.enum(['learn', 'explore', 'decide', 'execute']);

export type IntentGoal = z.infer<typeof IntentGoalSchema>;

export const DecisionStrengthSchema = z.enum(['none', 'weak', 'strong']);

export type DecisionStrength = z.infer<typeof DecisionStrengthSchema>;

export const AssetScopeSchema = z.enum(['sol', 'stablecoins', 'both', 'unknown']);

export type AssetScope = z.infer<typeof AssetScopeSchema>;

export const IntentSchema = z.object({
  domain: IntentDomainSchema,
  goal: IntentGoalSchema,
  decisionStrength: DecisionStrengthSchema,
  assetScope: AssetScopeSchema,
  explicitTrading: z.boolean(),
  explicitExecution: z.boolean(),
  needsWalletForPersonalization: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type Intent = z.infer<typeof IntentSchema>;
