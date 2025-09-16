import { Connection } from '@solana/web3.js';

import {
  SolanaStakeAction,
  SolanaUnstakeAction,
  SolanaLiquidStakingYieldsAction,
  SolanaGetTokenAddressAction,
  SolanaGetWalletAddressAction,
} from '@/ai/solana/actions';

import {
  SOLANA_STAKE_NAME,
  SOLANA_UNSTAKE_NAME,
  SOLANA_LIQUID_STAKING_YIELDS_NAME,
  SOLANA_GET_TOKEN_ADDRESS_NAME,
  SOLANA_GET_WALLET_ADDRESS_NAME,
} from '@/ai/action-names';
import { solanaTool } from '@/ai/solana';

export const STAKING_TOOLS = {
  [`staking-${SOLANA_STAKE_NAME}`]: solanaTool(
    new SolanaStakeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_UNSTAKE_NAME}`]: solanaTool(
    new SolanaUnstakeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_LIQUID_STAKING_YIELDS_NAME}`]: solanaTool(
    new SolanaLiquidStakingYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_GET_TOKEN_ADDRESS_NAME}`]: solanaTool(
    new SolanaGetTokenAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`staking-${SOLANA_GET_WALLET_ADDRESS_NAME}`]: solanaTool(
    new SolanaGetWalletAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};
