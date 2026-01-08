import { SolanaRouterContext, SolanaRouterDecision } from '@/ai/routing/solana-router';
import {
  SOLANA_LEND_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_TRANSFER_NAME,
} from '@/ai/action-names';

export type RouterFixture = {
  name: string;
  lastUserText: string;
  context: SolanaRouterContext;
  expected: SolanaRouterDecision;
};

export const routerFixtures: RouterFixture[] = [
  {
    name: 'All pools uses lending yields with limit 50',
    lastUserText: 'Give me all pools',
    context: { lastYield: null, lastAction: null },
    expected: {
      agent: 'lending',
      mode: 'explore',
      ui: 'cards',
      toolPlan: [{ tool: SOLANA_LENDING_YIELDS_ACTION, args: { limit: 50 } }],
      stopCondition: 'when_first_yields_result_received',
    },
  },
  {
    name: 'All pools TVL sorts by tvl',
    lastUserText: 'Show all pools by TVL',
    context: { lastYield: null, lastAction: null },
    expected: {
      agent: 'lending',
      mode: 'explore',
      ui: 'cards_then_text',
      toolPlan: [{ tool: SOLANA_LENDING_YIELDS_ACTION, args: { limit: 50, sortBy: 'tvl' } }],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'All pools TVL uses staking yields when last yield was staking',
    lastUserText: 'Show all pools by TVL',
    context: {
      lastYield: {
        tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION,
        args: { limit: 3 },
        pools: [],
      },
      lastAction: null,
    },
    expected: {
      agent: 'staking',
      mode: 'explore',
      ui: 'cards_then_text',
      toolPlan: [
        { tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION, args: { limit: 50, sortBy: 'tvl' } },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Out of these highest TVL uses last yield context',
    lastUserText: 'Out of these, highest TVL',
    context: {
      lastYield: {
        tool: SOLANA_LENDING_YIELDS_ACTION,
        args: { limit: 50 },
        pools: [],
      },
      lastAction: null,
    },
    expected: {
      agent: 'lending',
      mode: 'explore',
      ui: 'cards_then_text',
      toolPlan: [
        {
          tool: SOLANA_LENDING_YIELDS_ACTION,
          args: { limit: 50, sortBy: 'tvl' },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Out of these defaults to lending yields without context',
    lastUserText: 'Out of these',
    context: { lastYield: null, lastAction: null },
    expected: {
      agent: 'lending',
      mode: 'explore',
      ui: 'cards',
      toolPlan: [{ tool: SOLANA_LENDING_YIELDS_ACTION, args: { limit: 50 } }],
      stopCondition: 'when_first_yields_result_received',
    },
  },
  {
    name: 'Out of these uses staking yields when last yield was staking',
    lastUserText: 'Out of these',
    context: {
      lastYield: {
        tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION,
        args: { limit: 3 },
        pools: [],
      },
      lastAction: null,
    },
    expected: {
      agent: 'staking',
      mode: 'explore',
      ui: 'cards',
      toolPlan: [{ tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION, args: { limit: 50 } }],
      stopCondition: 'when_first_yields_result_received',
    },
  },
  {
    name: 'Highest yield uses staking yields with prior limit',
    lastUserText: 'Which has the highest yield?',
    context: {
      lastYield: {
        tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION,
        args: { limit: 3 },
        pools: [],
      },
      lastAction: null,
    },
    expected: {
      agent: 'staking',
      mode: 'explore',
      ui: 'cards_then_text',
      toolPlan: [
        {
          tool: SOLANA_LIQUID_STAKING_YIELDS_ACTION,
          args: { sortBy: 'apy' },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Try again resumes failed lend action',
    lastUserText: 'try again',
    context: {
      lastYield: null,
      lastAction: {
        tool: `lending-${SOLANA_LEND_ACTION}`,
        args: { tokenSymbol: 'USDC', tokenAddress: 'mint', protocol: 'kamino' },
        status: 'failed',
      },
    },
    expected: {
      agent: 'lending',
      mode: 'execute',
      ui: 'text',
      toolPlan: [
        {
          tool: `lending-${SOLANA_LEND_ACTION}`,
          args: { tokenSymbol: 'USDC', tokenAddress: 'mint', protocol: 'kamino' },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Try again resumes cancelled lend action',
    lastUserText: 'try again',
    context: {
      lastYield: null,
      lastAction: {
        tool: `lending-${SOLANA_LEND_ACTION}`,
        args: { tokenSymbol: 'USDT', tokenAddress: 'mint', protocol: 'jupiter' },
        status: 'cancelled',
      },
    },
    expected: {
      agent: 'lending',
      mode: 'execute',
      ui: 'text',
      toolPlan: [
        {
          tool: `lending-${SOLANA_LEND_ACTION}`,
          args: { tokenSymbol: 'USDT', tokenAddress: 'mint', protocol: 'jupiter' },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Try again resumes failed trade action',
    lastUserText: 'try again',
    context: {
      lastYield: null,
      lastAction: {
        tool: `trading-${SOLANA_TRADE_ACTION}`,
        args: { inputMint: 'mint-in', outputMint: 'mint-out', inputAmount: 1 },
        status: 'failed',
      },
    },
    expected: {
      agent: 'trading',
      mode: 'execute',
      ui: 'text',
      toolPlan: [
        {
          tool: `trading-${SOLANA_TRADE_ACTION}`,
          args: { inputMint: 'mint-in', outputMint: 'mint-out', inputAmount: 1 },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
  {
    name: 'Try again resumes cancelled transfer action',
    lastUserText: 'try again',
    context: {
      lastYield: null,
      lastAction: {
        tool: `wallet-${SOLANA_TRANSFER_NAME}`,
        args: { to: 'recipient', amount: 1, mint: 'mint' },
        status: 'cancelled',
      },
    },
    expected: {
      agent: 'wallet',
      mode: 'execute',
      ui: 'text',
      toolPlan: [
        {
          tool: `wallet-${SOLANA_TRANSFER_NAME}`,
          args: { to: 'recipient', amount: 1, mint: 'mint' },
        },
      ],
      stopCondition: 'after_tool_plan_complete',
    },
  },
];
