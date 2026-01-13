import { Connection } from '@solana/web3.js';

import {
  SolanaStakeAction,
  SolanaUnstakeAction,
  SolanaLiquidStakingYieldsAction,
  SolanaGetTokenAddressAction,
  SolanaGetWalletAddressAction,
  SolanaBalanceAction,
  SolanaTradeAction,
} from '@/ai/solana/actions';

import {
  SOLANA_STAKE_ACTION,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
  SOLANA_GET_TOKEN_ADDRESS_ACTION,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_BALANCE_ACTION,
  SOLANA_TRADE_ACTION,
} from '@/ai/action-names';
import { solanaTool } from '@/ai/solana';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const STAKING_TOOLS = {
  [`staking-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`staking-${SOLANA_STAKE_ACTION}`]: solanaTool(
    new SolanaStakeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_UNSTAKE_ACTION}`]: solanaTool(
    new SolanaUnstakeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_LIQUID_STAKING_YIELDS_ACTION}`]: solanaTool(
    new SolanaLiquidStakingYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_GET_TOKEN_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetTokenAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_GET_WALLET_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetWalletAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_BALANCE_ACTION}`]: solanaTool(
    new SolanaBalanceAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_TRADE_ACTION}`]: solanaTool(
    new SolanaTradeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};
