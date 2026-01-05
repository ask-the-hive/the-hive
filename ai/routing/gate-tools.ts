import { CoreTool } from 'ai';

import {
  SOLANA_DEPOSIT_LIQUIDITY_NAME,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_LEND_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_WITHDRAW_ACTION,
  SOLANA_WITHDRAW_LIQUIDITY_NAME,
} from '@/ai/action-names';

import { BASE_GET_WALLET_ADDRESS_NAME } from '@/ai/base/actions/wallet/get-wallet-address/name';
import { BASE_TRANSFER_NAME } from '@/ai/base/actions/wallet/transfer/name';
import { BASE_TRADE_NAME } from '@/ai/base/actions/trade/actions/name';

import { BSC_GET_WALLET_ADDRESS_NAME } from '@/ai/bsc/actions/wallet/get-wallet-address/name';
import { BSC_TRANSFER_NAME } from '@/ai/bsc/actions/wallet/transfer/name';
import { BSC_TRADE_NAME } from '@/ai/bsc/actions/trade/actions/name';

export type ToolGatingMode = 'explore' | 'decide' | 'execute';

export function gateToolsByMode<TTools extends Record<string, CoreTool<any, any>>>(
  tools: TTools,
  args: {
    mode: ToolGatingMode;
    allowWalletConnect: boolean;
  },
): TTools {
  const walletConnectSuffixes = [
    SOLANA_GET_WALLET_ADDRESS_ACTION,
    BASE_GET_WALLET_ADDRESS_NAME,
    BSC_GET_WALLET_ADDRESS_NAME,
  ];

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

  const next: Record<string, CoreTool<any, any>> = {};

  for (const [key, tool] of Object.entries(tools)) {
    if (!args.allowWalletConnect && walletConnectSuffixes.some((s) => key.endsWith(s))) {
      continue;
    }

    if (args.mode !== 'execute' && executionSuffixes.some((s) => key.endsWith(s))) {
      continue;
    }

    next[key] = tool;
  }

  return next as TTools;
}

