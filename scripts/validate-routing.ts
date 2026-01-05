import { routingFixtures } from '@/scripts/routing-fixtures';
import { routeIntent } from '@/ai/routing/route-intent';
import { gateToolsByMode } from '@/ai/routing/gate-tools';
import { deriveFlowStateFromIntent } from '@/ai/routing/flow-state';

type FakeTool = Record<string, unknown>;

const makeFakeTools = (chain: 'solana' | 'base' | 'bsc'): Record<string, any> => {
  const t: Record<string, FakeTool> = {};

  if (chain === 'solana') {
    t['knowledge-search_knowledge'] = {};
    t['lending-solana_lending_yields'] = {};
    t['lending-solana_lend'] = {};
    t['lending-solana_withdraw'] = {};
    t['lending-solana_get_wallet_address'] = {};
    t['staking-solana_liquid_staking_yields'] = {};
    t['staking-solana_stake'] = {};
    t['staking-solana_unstake'] = {};
    t['staking-solana_get_wallet_address'] = {};
    t['wallet-solana_get_wallet_address'] = {};
    t['wallet-solana_transfer'] = {};
    t['trading-solana_trade'] = {};
    t['raydium-solana_deposit_liquidity'] = {};
    t['raydium-solana_withdraw_liquidity'] = {};
  }

  if (chain === 'base') {
    t['baseknowledge-search'] = {};
    t['basewallet-base-get-wallet-address'] = {};
    t['basewallet-base_transfer'] = {};
    t['basetrading-base-get-wallet-address'] = {};
    t['basetrading-trade'] = {};
  }

  if (chain === 'bsc') {
    t['bscknowledge-search'] = {};
    t['bscwallet-bsc-get-wallet-address'] = {};
    t['bscwallet-bsc_transfer'] = {};
    t['bsctrading-bsc-get-wallet-address'] = {};
    t['bsctrading-bsc_trade'] = {};
  }

  return t as any;
};

const makeAgentConfig = () => ({
  agents: {
    recommendation: 'recommendation',
    lending: 'lending',
    staking: 'staking',
    wallet: 'wallet',
    trading: 'trading',
    market: 'market',
    'token-analysis': 'token-analysis',
    liquidity: 'liquidity',
    knowledge: 'knowledge',
  } as const,
});

const fail = (message: string) => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
};

const includesSuffix = (keys: string[], suffix: string) => keys.some((k) => k.endsWith(suffix));

const run = () => {
  const failures: string[] = [];

  for (const fixture of routingFixtures) {
    try {
      const flowState = deriveFlowStateFromIntent(fixture.intent);
      const decision = routeIntent(fixture.intent, makeAgentConfig(), flowState);

      assert(
        decision.mode === fixture.expected.mode,
        `[${fixture.name}] expected mode=${fixture.expected.mode}, got ${decision.mode}`,
      );

      assert(
        decision.agentName === fixture.expected.agentKey,
        `[${fixture.name}] expected agent=${fixture.expected.agentKey ?? 'null'}, got ${decision.agentName ?? 'null'}`,
      );

      const tools = makeFakeTools(fixture.chain);
      const gated = gateToolsByMode(tools, {
        mode: decision.mode,
        allowWalletConnect: fixture.gating.allowWalletConnect,
      });

      const gatedKeys = Object.keys(gated);

      if (decision.mode !== 'execute') {
        assert(
          !includesSuffix(gatedKeys, 'solana_lend') &&
            !includesSuffix(gatedKeys, 'solana_withdraw') &&
            !includesSuffix(gatedKeys, 'solana_stake') &&
            !includesSuffix(gatedKeys, 'solana_unstake') &&
            !includesSuffix(gatedKeys, 'solana_trade') &&
            !includesSuffix(gatedKeys, 'solana_transfer') &&
            !includesSuffix(gatedKeys, 'solana_deposit_liquidity') &&
            !includesSuffix(gatedKeys, 'solana_withdraw_liquidity') &&
            !includesSuffix(gatedKeys, 'trade') &&
            !includesSuffix(gatedKeys, 'base_transfer') &&
            !includesSuffix(gatedKeys, 'bsc_trade') &&
            !includesSuffix(gatedKeys, 'bsc_transfer'),
          `[${fixture.name}] execution tools should be gated in mode=${decision.mode}`,
        );
      }

      if (!fixture.gating.allowWalletConnect) {
        assert(
          !includesSuffix(gatedKeys, 'solana_get_wallet_address') &&
            !includesSuffix(gatedKeys, 'base-get-wallet-address') &&
            !includesSuffix(gatedKeys, 'bsc-get-wallet-address'),
          `[${fixture.name}] wallet-connect tools should be gated when allowWalletConnect=false`,
        );
      }

      if (fixture.gating.expectsWalletConnectTool) {
        assert(
          includesSuffix(gatedKeys, 'solana_get_wallet_address') ||
            includesSuffix(gatedKeys, 'base-get-wallet-address') ||
            includesSuffix(gatedKeys, 'bsc-get-wallet-address'),
          `[${fixture.name}] expected a wallet-connect tool to be available`,
        );
      }

      // Read-only tools should remain available.
      if (fixture.chain === 'solana') {
        assert(
          includesSuffix(gatedKeys, 'solana_lending_yields') ||
            includesSuffix(gatedKeys, 'solana_liquid_staking_yields') ||
            gatedKeys.some((k) => k.includes('search')),
          `[${fixture.name}] expected at least one read-only tool to remain available`,
        );
      }
    } catch (error) {
      failures.push((error as Error).message);
    }
  }

  if (failures.length) {
    // eslint-disable-next-line no-console
    console.error(`validate-routing failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`validate-routing passed (${routingFixtures.length} fixtures)`);
};

run();
