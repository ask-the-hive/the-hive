import { CoreMessage, generateObject, LanguageModelV1 } from 'ai';
import { Intent, IntentSchema } from '@/ai/routing/intent';

export async function classifyIntent(args: {
  model: LanguageModelV1;
  messages: CoreMessage[];
  chain?: string;
}): Promise<Intent> {
  const { model, messages, chain } = args;

  const intentSystem: CoreMessage = {
    role: 'system',
    content: `You are an intent classifier for a crypto assistant.${chain ? ` Chain: ${chain}.` : ''}

Return a single JSON object that matches the provided schema exactly.

Definitions:
- domain: the product area this request belongs to.
- goal:
  - learn: user wants explanations/definitions.
  - explore: user is browsing options without asking you to choose.
  - decide: user asks you to pick/recommend the best/safest/optimal option.
  - execute: user wants to perform an action now (stake/lend/withdraw/swap/transfer).
- decisionStrength:
  - strong: "best/safest/optimal/right now/decide for me/just tell me what to do".
  - weak: "recommend" without forcing a single best answer.
  - none: no decision request.
- assetScope:
  - sol: SOL / liquid staking.
  - stablecoins: USDC/USDT/etc lending.
  - both: explicitly comparing staking vs lending.
  - unknown: not specified.
- explicitTrading: true ONLY if the user explicitly asks to trade/swap/buy/sell.
- explicitExecution: true ONLY if the user explicitly asks to execute a transaction now (stake/lend/withdraw/swap/transfer) versus just viewing options.
- needsWalletForPersonalization: true ONLY if the user is asking to optimize for their holdings/portfolio (e.g., "for my assets", "what should I do with my wallet").

Important rules:
- Never set explicitTrading=true for "earn/yield/help/what should I do" unless the user explicitly requested trading.
- If the user asks for a decision ("best/safest/optimal/right now"), goal must be decide (not learn).
- If the user is only asking to view yields/options, goal must be explore and explicitExecution must be false.

Confidence:
- Set confidence closer to 1 when the intent is explicit; closer to 0 when ambiguous.`,
  };

  try {
    const { object } = await generateObject({
      model,
      schema: IntentSchema,
      messages: [intentSystem, ...messages],
    });
    return object;
  } catch {
    return {
      domain: 'unknown',
      goal: 'explore',
      decisionStrength: 'none',
      assetScope: 'unknown',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 0,
    };
  }
}
