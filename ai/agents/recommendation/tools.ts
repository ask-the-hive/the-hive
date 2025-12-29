import { Connection } from '@solana/web3.js';

import {
  SolanaAllBalancesAction,
  SolanaGetWalletAddressAction,
  SolanaLiquidStakingYieldsAction,
} from '@/ai/solana/actions';
import { SolanaLendingYieldsAction } from '@/ai/solana/actions/lending';
import { solanaTool } from '@/ai/solana';
import {
  SOLANA_ALL_BALANCES_NAME,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
} from '@/ai/action-names';

export const RECOMMENDATION_TOOLS = {
  [`recommendation-${SOLANA_GET_WALLET_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetWalletAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`recommendation-${SOLANA_ALL_BALANCES_NAME}`]: solanaTool(
    new SolanaAllBalancesAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`recommendation-${SOLANA_LIQUID_STAKING_YIELDS_ACTION}`]: solanaTool(
    new SolanaLiquidStakingYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`recommendation-${SOLANA_LENDING_YIELDS_ACTION}`]: solanaTool(
    new SolanaLendingYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};

