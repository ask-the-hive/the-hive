import { CoreTool } from 'ai';
import {
  SOLANA_DEPOSIT_LIQUIDITY_NAME,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_LEND_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_WITHDRAW_ACTION,
  SOLANA_WITHDRAW_LIQUIDITY_NAME,
} from '@/ai/action-names';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { SOLANA_ALL_BALANCES_NAME } from '@/ai/solana/actions/wallet/all-balances/name';
import { SOLANA_BALANCE_ACTION } from '@/ai/solana/actions/wallet/balance/name';
import { BASE_GET_WALLET_ADDRESS_NAME } from '@/ai/base/actions/wallet/get-wallet-address/name';
import { BASE_ALL_BALANCES_NAME } from '@/ai/base/actions/wallet/all-balances/name';
import { BASE_BALANCE_NAME } from '@/ai/base/actions/wallet/balance/name';
import { BASE_TRANSFER_NAME } from '@/ai/base/actions/wallet/transfer/name';
import { BASE_TRADE_NAME } from '@/ai/base/actions/trade/actions/name';
import { BSC_GET_WALLET_ADDRESS_NAME } from '@/ai/bsc/actions/wallet/get-wallet-address/name';
import { BSC_ALL_BALANCES_NAME } from '@/ai/bsc/actions/wallet/all-balances/name';
import { BSC_BALANCE_NAME } from '@/ai/bsc/actions/wallet/balance/name';
import { BSC_TRANSFER_NAME } from '@/ai/bsc/actions/wallet/transfer/name';
import { BSC_TRADE_NAME } from '@/ai/bsc/actions/trade/actions/name';

export type ToolGatingMode = 'explore' | 'decide' | 'execute';

export function gateToolsByMode<TTools extends Record<string, CoreTool<any, any>>>(
  tools: TTools,
  args: {
    mode: ToolGatingMode;
    allowWalletConnect: boolean;
    hasWalletAddress?: boolean;
  },
): TTools {
  const decisionSuffix = UI_DECISION_RESPONSE_NAME;

  const walletConnectSuffixes = [
    SOLANA_GET_WALLET_ADDRESS_ACTION,
    BASE_GET_WALLET_ADDRESS_NAME,
    BSC_GET_WALLET_ADDRESS_NAME,
  ];

  const yieldSuffixes = [SOLANA_LENDING_YIELDS_ACTION, SOLANA_LIQUID_STAKING_YIELDS_ACTION];

  const executionSuffixes = [
    SOLANA_LEND_ACTION,
    SOLANA_WITHDRAW_ACTION,
    SOLANA_STAKE_ACTION,
    SOLANA_UNSTAKE_ACTION,
    SOLANA_TRANSFER_NAME,
    SOLANA_TRADE_ACTION,
    SOLANA_DEPOSIT_LIQUIDITY_NAME,
    SOLANA_WITHDRAW_LIQUIDITY_NAME,
    BASE_TRADE_NAME,
    BASE_TRANSFER_NAME,
    BSC_TRADE_NAME,
    BSC_TRANSFER_NAME,
  ];

  const walletDependentSuffixes = [
    SOLANA_BALANCE_ACTION,
    SOLANA_ALL_BALANCES_NAME,
    BASE_BALANCE_NAME,
    BASE_ALL_BALANCES_NAME,
    BSC_BALANCE_NAME,
    BSC_ALL_BALANCES_NAME,
  ];

  const next: Record<string, CoreTool<any, any>> = {};

  for (const [key, tool] of Object.entries(tools)) {
    if (args.mode !== 'decide' && key.endsWith(decisionSuffix)) {
      continue;
    }

    if (args.mode === 'execute' && yieldSuffixes.some((s) => key.endsWith(s))) {
      continue;
    }

    if (!args.allowWalletConnect && walletConnectSuffixes.some((s) => key.endsWith(s))) {
      continue;
    }

    if (args.mode !== 'execute' && executionSuffixes.some((s) => key.endsWith(s))) {
      continue;
    }

    if (
      args.mode !== 'execute' &&
      !args.hasWalletAddress &&
      !args.allowWalletConnect &&
      walletDependentSuffixes.some((s) => key.endsWith(s))
    ) {
      continue;
    }

    next[key] = tool;
  }

  return next as TTools;
}
