import { SolanaTradeAction } from './trade';
import { SolanaGetTrendingTokensAction } from './market';
import {
  SolanaBalanceAction,
  SolanaTransferAction,
  SolanaGetWalletAddressAction,
  SolanaAllBalancesAction,
} from './wallet';
import { SolanaStakeAction, SolanaUnstakeAction, SolanaLiquidStakingYieldsAction } from './staking';
import { SolanaLendingYieldsAction, SolanaLendAction, SolanaWithdrawAction } from './lending';
import {
  SolanaGetTokenDataAction,
  SolanaGetTokenAddressAction,
  SolanaTopHoldersAction,
  SolanaTokenHoldersAction,
} from './token';

import type { SolanaAction, SolanaActionSchemaAny } from './solana-action';

export function getAllSolanaActions(): SolanaAction<SolanaActionSchemaAny, any>[] {
  return [
    new SolanaBalanceAction(),
    new SolanaTransferAction(),
    new SolanaTradeAction(),
    new SolanaGetWalletAddressAction(),
    new SolanaGetTrendingTokensAction(),
    new SolanaGetTokenDataAction(),
    new SolanaStakeAction(),
    new SolanaUnstakeAction(),
    new SolanaAllBalancesAction(),
    new SolanaLiquidStakingYieldsAction(),
    new SolanaGetTokenAddressAction(),
    new SolanaTopHoldersAction(),
    new SolanaTokenHoldersAction(),
    // Lending Actions
    new SolanaLendingYieldsAction(),
    new SolanaLendAction(),
    new SolanaWithdrawAction(),
  ];
}

export const SOLANA_ACTIONS = getAllSolanaActions();

export * from './types';
export * from './solana-action';

export * from './trade';
export * from './market';
export * from './raydium';
export * from './staking';
export * from './wallet';
export * from './token';
export * from './lending';
