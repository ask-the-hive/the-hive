import { z } from 'zod';
import { CoreMessage, generateObject, LanguageModelV1, Message } from 'ai';
import { Agent } from '@/ai/agent';
import { stakingAgent } from '@/ai/agents/staking';
import { lendingAgent } from '@/ai/agents/lending';
import { yieldAgent } from '@/ai/agents/yield';
import { walletAgent } from '@/ai/agents/wallet';
import { marketAgent } from '@/ai/agents/market';
import { tradingAgent } from '@/ai/agents/trading';
import { knowledgeAgent } from '@/ai/agents/knowledge';
import { tokenAnalysisAgent } from '@/ai/agents/token-analysis';
import { liquidityAgent } from '@/ai/agents/liquidity';

// List of Solana-specific agents
const solanaAgents: Agent[] = [
  stakingAgent,
  lendingAgent,
  yieldAgent,
  walletAgent,
  marketAgent,
  tradingAgent,
  knowledgeAgent,
  tokenAnalysisAgent,
  liquidityAgent,
];

export const system = `You are the orchestrator of a swarm of blockchain agents that each have specialized tasks.

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

CRITICAL ROUTING RULES (CHECK IN THIS ORDER):

1. **Yield Agent** - Use for GLOBAL yield optimization queries (HIGHEST PRIORITY):
   - "Where should I earn yield right now?" ← YIELD AGENT
   - "Best yields on Solana" / "best APY" / "best yield" (without specifying lending/staking) ← YIELD AGENT
   - "Where to earn yield?" / "Where can I earn yield?" ← YIELD AGENT
   - "Compare all yields" / "show me all yields" / "all yield options" ← YIELD AGENT
   - "What are the best yields?" / "show me best yields" ← YIELD AGENT
   - Global yield optimization queries that should consider BOTH lending and staking
   - Queries asking for the best yield opportunity REGARDLESS of strategy type
   - 🚫 DO NOT use Yield Agent if user explicitly mentions "lending" or "staking" (e.g., "best lending yields" → Lending Agent, "best staking yields" → Staking Agent)
   - 🚫 DO NOT use Yield Agent if user mentions specific tokens like "USDC yields" or "SOL staking" → route to specific agents

2. **Lending Agent** - Use for SPECIFIC lending requests or stablecoin yield queries:
   - "What are the best DeFi opportunities?" (comparing multiple strategies)
   - "How can I earn on Solana?" (open-ended exploration)
   - "What should I do with my crypto?" (needs guidance)
   - "Compare lending vs staking" (explicit comparison)
   - "Passive income opportunities" (general exploration)
   - Users exploring what they can do without a specific strategy in mind
   - These should trigger the conversational fallback to help users discover features
   - 🚫 DO NOT use Knowledge Agent when the user is asking to take an action (stake, lend, deposit, earn, compare yields with amounts) — route to the action agents so they get live options and CTAs
   - 🚫 NEVER invent or quote specific APY percentages or protocol names when uncertain. Use categories only (e.g., "stablecoin lending", "liquid staking") and invite the user to open the strategy cards in the UI to see live APYs.

   - "Show me the best lending pools on Solana" ← LENDING AGENT
   - "Best lending yields" / "best stablecoin yields" / "best USDC APY" / "USDC yields" ← LENDING AGENT
   - "Lending rates for USDC/USDT" ← LENDING AGENT
   - "Where to deposit stablecoins?" / "Where should I park USDC?" / "Best place to deposit USDT" ← LENDING AGENT
   - "Lend SOL to Kamino" / "I want to lend SOL" ← LENDING AGENT (not Staking Agent!)
   - Explicit "lend"/"lending" keywords with stablecoins or SOL
   - Lending pools or protocols (Kamino Lend, Jupiter Lend, etc.)
   - "How much can I lend?" (checks token balance)
   - "Lend my USDT/USDC/SOL"
   - If the user already said they want lending and then replies "yes" or "sure", continue with Lending Agent
   - If the previous assistant message offered lending and the user responds with a short confirmation ("yes", "yep", "sure", "ok"), route to the Lending Agent

3. **Staking Agent** - Use for SPECIFIC staking requests:
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

4. **Knowledge Agent** - Use for truly exploratory/comparison queries:
   - "What are the best DeFi opportunities?" (comparing multiple strategies)
   - "How can I earn on Solana?" (open-ended exploration)
   - "What should I do with my crypto?" (needs guidance)
   - "Compare lending vs staking" (explicit comparison)
   - "Passive income opportunities" (general exploration)
   - Users exploring what they can do without a specific strategy in mind
   - These should trigger the conversational fallback to help users discover features
   - 🚫 DO NOT use Knowledge Agent when the user is asking to take an action (stake, lend, deposit, earn, compare yields with amounts) — route to the action agents so they get live options and CTAs
   - 🚫 NEVER invent or quote specific APY percentages or protocol names when uncertain. Use categories only (e.g., "stablecoin lending", "liquid staking") and invite the user to open the strategy cards in the UI to see live APYs.

5. **Wallet Agent** - Use for:
   - Token transfers
   - Checking wallet balances
   - Wallet operations

6. **Trading Agent** - Use for:
   - Trading or swapping tokens
   - Buying tokens
   - Token exchanges

7. **Market Agent** - Use for:
   - Trending tokens
   - Top traders for a timeframe
   - Trading history for a wallet

8. **Token Analysis Agent** - Use for:
   - Data about a specific token (price, volume, holders)
   - Top holders of a token
   - Price charts
   - Bubble maps (token distribution)
   - Top traders of a specific token

9. **Liquidity Agent** - Use for:
   - Liquidity pool information
   - Depositing liquidity into pools
   - User's LP tokens
   - Raydium pools

ROUTING PRIORITY:
1. Yield Agent (global yield queries) - CHECK FIRST
2. Lending Agent (specific lending/stablecoin queries)
3. Staking Agent (specific staking/SOL queries)
4. Other agents (wallet, trading, market, etc.)
5. Knowledge Agent (exploratory queries)
6. None (conversational fallback)

AVAILABLE AGENTS:
${solanaAgents.map((agent) => `${agent.name}: ${agent.capabilities}`).join('\n')}

When choosing an agent, you MUST return the exact agent name as listed above (e.g., "Yield Agent", "Lending Agent", "Staking Agent", etc.). Return "none" if no agent matches the query.

When in doubt between NO AGENT and a specific agent: Return "none" for exploratory/comparison queries (let the conversational fallback handle it), choose specific agent only for direct actions or specific requests.

IMPORTANT: If the query is exploratory or asks about general opportunities, you MUST return "none" to trigger the conversational discovery flow. Do NOT force a specific agent selection for these queries.`;

export const chooseAgent = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<Agent | null> => {
  const contextMessages = messages.slice(-5);

  const intentMessages: CoreMessage[] = [
    {
      role: 'system',
      content: system,
    },
    ...contextMessages.map((m) => ({
      role:
        m.role === 'assistant' || m.role === 'user' || m.role === 'system'
          ? m.role
          : 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    })),
  ];

  // Create enum from agent names
  const agentNames = solanaAgents.map((a) => a.name) as [string, ...string[]];
  const agentEnum = z.enum([...agentNames, 'none']);

  const { object } = await generateObject({
    model,
    schema: z.object({
      agent: agentEnum,
    }),
    messages: intentMessages,
  });

  if (object.agent === 'none') {
    return null;
  }

  // Find agent by name (matches the enum value)
  const found = solanaAgents.find((a) => a.name === object.agent) ?? null;
  return found;
};
