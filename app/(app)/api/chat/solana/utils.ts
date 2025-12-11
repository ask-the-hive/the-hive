import { z } from 'zod';
import { generateObject, LanguageModelV1, Message } from 'ai';
import { agents } from '@/ai/agents';
import { Agent } from '@/ai/agent';
import { LENDING_AGENT_NAME } from '@/ai/agents/lending/name';
import { STAKING_AGENT_NAME } from '@/ai/agents/staking/name';

export const system = `You are the orchestrator of a swarm of blockchain agents that each have specialized tasks.

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

CRITICAL ROUTING RULES:

1. **Knowledge Agent** - Use for truly exploratory/comparison queries:
   - "What are the best DeFi opportunities?" (comparing multiple strategies)
   - "How can I earn on Solana?" (open-ended exploration)
   - "What should I do with my crypto?" (needs guidance)
   - "Compare lending vs staking" (explicit comparison)
   - "Passive income opportunities" (general exploration)
   - "Best APY on Solana" (comparing across all options)
   - Users exploring what they can do without a specific strategy in mind
   - These should trigger the conversational fallback to help users discover features
   - 🚫 DO NOT use Knowledge Agent when the user is asking to take an action (stake, lend, deposit, earn, compare yields with amounts) — route to the action agents so they get live options and CTAs
   - 🚫 NEVER invent or quote specific APY percentages or protocol names when uncertain. Use categories only (e.g., "stablecoin lending", "liquid staking") and invite the user to open the strategy cards in the UI to see live APYs.

2. **Lending Agent** - Use for specific lending requests or stablecoin yield-shopping:
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

3. **Staking Agent** - Use for specific staking requests:
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

4. **Wallet Agent** - Use for:
   - Token transfers
   - Checking wallet balances
   - Wallet operations

5. **Trading Agent** - Use for:
   - Trading or swapping tokens
   - Buying tokens
   - Token exchanges

6. **Market Agent** - Use for:
   - Trending tokens
   - Top traders for a timeframe
   - Trading history for a wallet

7. **Token Analysis Agent** - Use for:
   - Data about a specific token (price, volume, holders)
   - Top holders of a token
   - Price charts
   - Bubble maps (token distribution)
   - Top traders of a specific token

8. **Liquidity Agent** - Use for:
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

  const mentionsStablecoin =
    /\b(stablecoin|stablecoins|usdc|usdt|usdg|eurc|fdusd|pyusd|usds)\b/.test(userText);

  const depositOrYieldIntent =
    /\b(lend|lending|deposit|deposits|earn|earning|park|parking|place|put|apy|yield|yields|rate|rates)\b/.test(
      userText,
    );

  const wantsLending =
    /\b(lend|lending)\b/.test(userText) ||
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

  const contextMessages = messages.slice(-5);

  const { object } = await generateObject({
    model,
    schema: z.object({
      agent: z.enum(['none', ...agents.map((agent) => agent.name)] as [string, ...string[]]),
    }),
    messages: contextMessages,
    system,
  });

  if (object.agent === 'none') {
    return null;
  }

  return agents.find((agent) => agent.name === object.agent) ?? null;
};
