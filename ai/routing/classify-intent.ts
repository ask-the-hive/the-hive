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
    content: `Return one JSON object matching the schema exactly.${chain ? ` Chain: ${chain}.` : ''}

Enums:
- domain: yield|staking|lending|trading|knowledge|portfolio|market|token-analysis|liquidity|unknown
- goal: learn|explore|decide|execute
- decisionStrength: strong|weak|none
- objective: safest|highest_yield|unknown
- assetScope: sol|stablecoins|both|unknown

Primary: classify the MOST RECENT user message (ignore earlier context unless latest is ambiguous).

Rules:
- Portfolio/balances ("what tokens do I have", "show my balances"): domain=portfolio, goal=explore, confidence>=0.8
- Explicit stake into a specific LST ("stake SOL for DSOL"): domain=staking, goal=execute, explicitExecution=true, confidence>=0.8
- Global yield decision ("where should I earn yield right now"): domain=yield, goal=decide, decisionStrength=strong, objective=highest_yield
- "best/safest/optimal/right now/decide for me" => goal=decide, decisionStrength=strong
- explicitTrading=true ONLY if user explicitly asked to trade/swap/buy/sell
- explicitExecution=true if user says "now/confirm/do it" OR provides amount/protocol/pool
- needsWalletForPersonalization=true ONLY if user explicitly asks "for my assets/portfolio/wallet"
- Short confirmations only ("yes/ok/continue") => domain=unknown, goal=explore, confidence<=0.4

Confidence: higher when explicit.`,
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
      objective: 'unknown',
      assetScope: 'unknown',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 0,
    };
  }
}
