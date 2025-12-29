import { z } from 'zod';
import { CoreMessage, generateObject, LanguageModelV1, Message } from 'ai';
import { agents } from '@/ai/agents';
import { Agent } from '@/ai/agent';
import { LENDING_AGENT_NAME } from '@/ai/agents/lending/name';
import { STAKING_AGENT_NAME } from '@/ai/agents/staking/name';
import { RECOMMENDATION_AGENT_NAME } from '@/ai/agents/recommendation/name';
import { WALLET_AGENT_NAME } from '@/ai/agents/wallet/name';
import { TRADING_AGENT_NAME } from '@/ai/agents/trading/name';
import { MARKET_AGENT_NAME } from '@/ai/agents/market/name';
import { TOKEN_ANALYSIS_AGENT_NAME } from '@/ai/agents/token-analysis/name';
import { LIQUIDITY_AGENT_NAME } from '@/ai/agents/liquidity/name';
import { KNOWLEDGE_AGENT_NAME } from '@/ai/agents/knowledge/name';

export const system = `You are the orchestrator of a swarm of blockchain agents that each have specialized tasks.

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

CRITICAL ROUTING RULES:

1. **Recommendation Agent** - Use for decision-seeking yield queries that require a concrete answer:
   - "Where should I earn yield right now?"
   - "Best/safest/optimal yield"
   - Global optimization across staking + lending
   - Never respond with "it depends" for these; route to Recommendation Agent.

2. **Knowledge Agent** - Use for truly educational questions:
   - Protocol explanations, definitions, terms, neutral comparisons
   - 🚫 NEVER route "best/safest/optimal/right now" yield decisions to Knowledge Agent.

3. **No Agent (discovery)** - Use for broad, exploratory queries:
   - "What are the best DeFi opportunities?" (comparing multiple strategies)
   - "How can I earn on Solana?" (open-ended exploration)
   - "What should I do with my crypto?" (needs guidance)
   - "Compare lending vs staking" (explicit comparison)
   - "Passive income opportunities" (general exploration)
   - Users exploring what they can do without a specific strategy in mind
   - These should trigger the conversational fallback to help users discover features
   - Return null for these so the conversational discovery flow runs.

4. **Lending Agent** - Use for specific lending requests or stablecoin yield-shopping:
   - "Show me the best lending pools on Solana" ← LENDING AGENT
   - "Best lending yields" / "best stablecoin yields" / "best USDC APY" ← LENDING AGENT
   - "Lending rates for USDC/USDT" ← LENDING AGENT
   - "Where to deposit stablecoins?" / "Where should I park USDC?" / "Best place to deposit USDT" ← LENDING AGENT (these should always show the stablecoin lending list UI)
   - "Lend SOL to Kamino" ← LENDING AGENT (not Staking Agent!)
   - "I want to lend SOL" ← LENDING AGENT (not Staking Agent!)
   - Stablecoin lending (USDC/USDT) operations
   - Lending pools or protocols (Kamino Lend, Jupiter Lend, etc.)
   - "How much can I lend?" (checks token balance)
   - "Lend my USDT/USDC/SOL"
   - If the user already said they want lending and then replies "yes" or "sure", continue with Lending Agent (do not send to Knowledge Agent)
   - If the previous assistant message offered lending and the user responds with a short confirmation ("yes", "yep", "sure", "ok"), route to the Lending Agent to return yields.
   - Queries about "lend"/"lending" or "best APY"/"best yield" for stablecoins should route to Lending Agent (not Knowledge).

5. **Staking Agent** - Use for specific staking requests:
   🚨 CRITICAL: Use Staking Agent for any SOL staking intent, including SOL APY/yield questions
   - "Show me the best staking pools" ← STAKING AGENT
   - "Best staking yields" ← STAKING AGENT
   - "Highest SOL APY" / "best SOL yield" ← STAKING AGENT
   - "Liquid staking rates" ← STAKING AGENT
   - "Stake my SOL" ← STAKING AGENT
   - "I want to stake SOL" ← STAKING AGENT
   - SOL staking/unstaking operations (ONLY when message says "stake", not "lend")
   - Liquid staking pools or tokens (LSTs)
   - "How much can I stake?" (checks SOL balance)
   - Any query with "stake" keyword → Staking Agent

6. **Wallet Agent** - Use for:
   - Token transfers
   - Checking wallet balances
   - Wallet operations

7. **Trading Agent** - Use ONLY when explicitly requested:
   - Trading or swapping tokens
   - Buying tokens
   - Token exchanges
   - 🚫 Do NOT route "earn", "yield", "help", "decide for me", or other default/confused intent to Trading.

8. **Market Agent** - Use for:
   - Trending tokens
   - Top traders for a timeframe
   - Trading history for a wallet

9. **Token Analysis Agent** - Use for:
   - Data about a specific token (price, volume, holders)
   - Top holders of a token
   - Price charts
   - Bubble maps (token distribution)
   - Top traders of a specific token

10. **Liquidity Agent** - Use for:
   - Liquidity pool information
   - Depositing liquidity into pools
   - User's LP tokens
   - Raydium pools

AVAILABLE AGENTS:
${agents.map((agent) => `${agent.name}: ${agent.capabilities}`).join('\n')}

When in doubt between NO AGENT and a specific agent: Return null for exploratory/comparison queries (let the conversational fallback handle it), choose specific agent only for direct actions or specific requests.

IMPORTANT: If the query is exploratory or asks about general opportunities, you MUST return null to trigger the conversational discovery flow. Do NOT force a specific agent selection for these queries.`;

export const chooseAgent = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<Agent | null> => {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const userText = (lastUserMsg?.content as string | undefined)?.toLowerCase() || '';
  const assistantText = (lastAssistantMsg?.content as string | undefined)?.toLowerCase() || '';
  const affirmative = /^(yes|yep|yeah|sure|ok|okay|alright|continue|go ahead)\b/.test(
    userText.trim(),
  );

  const explicitTrading = /\b(trade|trading|swap|buy|sell)\b/.test(userText);

  const exploratoryIntent =
    /\b(best (defi|opportunit|opportunity|strateg|strategy)|how can i (earn|make)|passive income|what should i do|compare|options|opportunit(?:y|ies))\b/.test(
      userText,
    ) && !/\b(trending|trade|swap|buy|sell|transfer|send|stake|unstake|lend|lending|deposit|withdraw)\b/.test(userText);

  const imperativeDecision =
    /\b(just tell me what to do|tell me what to do|decide for me|you decide|pick for me|do it for me|what should i do|what do i do)\b/.test(
      userText,
    );

  const unclearIntent =
    /\b(help|idk|i don't know|not sure|unsure|whatever|what now|recommend something)\b/.test(
      userText,
    );

  if (imperativeDecision || unclearIntent) {
    const recommendation = agents.find((a) => a.name === RECOMMENDATION_AGENT_NAME);
    if (recommendation) return recommendation;
  }

  if (exploratoryIntent) return null;

  const mentionsStablecoin =
    /\b(stablecoin|stablecoins|usdc|usdt|usdg|eurc|fdusd|pyusd|usds)\b/.test(userText);

  const mentionsSolToken = /\bsol\b/.test(userText);
  const yieldIntent = /\b(yield|yields|apy|apr|earn|earning|rate|rates)\b/.test(userText);
  const decisionSeeking =
    /\b(best|safest|optimal|recommend|where should i|what should i|should i|right now)\b/.test(
      userText,
    );

  const mentionsExplicitStrategy = /\b(stake|staking|unstake|lend|lending|borrow)\b/.test(userText);
  const isGlobalDecisionYieldQuery =
    yieldIntent && decisionSeeking && !mentionsStablecoin && !mentionsSolToken && !mentionsExplicitStrategy;

  if (isGlobalDecisionYieldQuery) {
    const recommendation = agents.find((a) => a.name === RECOMMENDATION_AGENT_NAME);
    if (recommendation) return recommendation;
  }

  const mentionsStablecoinBalance =
    mentionsStablecoin &&
    /\b(i\s+have|holding|hold|my)\b/.test(userText) &&
    /\b\d+(\.\d+)?\s*(usdc|usdt|usdg|eurc|fdusd|pyusd|usds)\b/.test(userText);

  const depositOrYieldIntent =
    /\b(lend|lending|deposit|deposits|earn|earning|park|parking|place|put|apy|yield|yields|rate|rates)\b/.test(
      userText,
    );

  const wantsLending =
    /\b(lend|lending)\b/.test(userText) ||
    mentionsStablecoinBalance ||
    (mentionsStablecoin && depositOrYieldIntent) ||
    (affirmative && /\b(lend|lending|stablecoin|apy|yield)\b/.test(assistantText));

  if (wantsLending) {
    const lending = agents.find((a) => a.name === LENDING_AGENT_NAME);
    if (lending) return lending;
  }

  const wantsStaking =
    /\b(stake|staking|unstake|restake)\b/.test(userText) ||
    /\b(sol\s+(apy|yield|yields))\b/.test(userText) ||
    (affirmative && /\b(stake|staking|sol apy|sol yield)\b/.test(assistantText));

  if (wantsStaking) {
    const staking = agents.find((a) => a.name === STAKING_AGENT_NAME);
    if (staking) return staking;
  }

  const wantsTrending =
    /\btrending\b/.test(userText) ||
    /\btrending\b/.test(assistantText) ||
    (affirmative && /\btrending\b/.test(assistantText));

  if (wantsTrending) {
    const market = agents.find((a) => a.name === MARKET_AGENT_NAME);
    if (market) return market;
  }

  const contextMessages = messages.slice(-5);

  const intentMessages: CoreMessage[] = [
    {
      role: 'system',
      content:
        'Classify the intent based on the latest user message. Return one of: recommendation, lending, staking, wallet, trading, market, token-analysis, liquidity, knowledge, none. IMPORTANT: Never choose knowledge for decision-seeking yield queries (best/safest/optimal/recommend/right now).',
    },
    ...contextMessages.map((m) => ({
      role:
        m.role === 'assistant' || m.role === 'user' || m.role === 'system'
          ? m.role
          : 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    })),
  ];

  const { object } = await generateObject({
    model,
    schema: z.object({
      agent: z.enum([
        'recommendation',
        'lending',
        'staking',
        'wallet',
        'trading',
        'market',
        'token-analysis',
        'liquidity',
        'knowledge',
        'none',
      ] as [string, ...string[]]),
    }),
    messages: intentMessages,
  });

  if (object.agent === 'trading' && !explicitTrading) {
    const recommendation = agents.find((a) => a.name === RECOMMENDATION_AGENT_NAME);
    if (recommendation) return recommendation;
    return null;
  }

  const map: Record<string, string> = {
    recommendation: RECOMMENDATION_AGENT_NAME,
    lending: LENDING_AGENT_NAME,
    staking: STAKING_AGENT_NAME,
    wallet: WALLET_AGENT_NAME,
    trading: TRADING_AGENT_NAME,
    market: MARKET_AGENT_NAME,
    'token-analysis': TOKEN_ANALYSIS_AGENT_NAME,
    liquidity: LIQUIDITY_AGENT_NAME,
    knowledge: KNOWLEDGE_AGENT_NAME,
  };

  if (object.agent === 'none') {
    return null;
  }

  if (object.agent === 'knowledge' && isGlobalDecisionYieldQuery) {
    const recommendation = agents.find((a) => a.name === RECOMMENDATION_AGENT_NAME);
    if (recommendation) return recommendation;
  }

  const mapped = map[object.agent];
  if (mapped) {
    const found = agents.find((a) => a.name === mapped) ?? null;
    return found;
  }
  return null;
};
