import { Connection } from '@solana/web3.js';

import {
  SolanaLendAction,
  SolanaWithdrawAction,
  SolanaLendingYieldsAction,
} from '@/ai/solana/actions/lending';
import {
  SolanaGetTokenAddressAction,
  SolanaGetWalletAddressAction,
  SolanaBalanceAction,
  SolanaTradeAction,
} from '@/ai/solana/actions';
import {
  SOLANA_LEND_ACTION,
  SOLANA_WITHDRAW_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
} from '@/ai/solana/actions/lending/names';
import {
  SOLANA_GET_TOKEN_ADDRESS_ACTION,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_BALANCE_ACTION,
  SOLANA_TRADE_ACTION,
} from '@/ai/solana/actions/names';
import { solanaTool } from '@/ai/solana';

export const LENDING_TOOLS = {
  [`lending-${SOLANA_LEND_ACTION}`]: solanaTool(
    new SolanaLendAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_WITHDRAW_ACTION}`]: solanaTool(
    new SolanaWithdrawAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_LENDING_YIELDS_ACTION}`]: solanaTool(
    new SolanaLendingYieldsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_GET_TOKEN_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetTokenAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_GET_WALLET_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetWalletAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_BALANCE_ACTION}`]: solanaTool(
    new SolanaBalanceAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`lending-${SOLANA_TRADE_ACTION}`]: solanaTool(
    new SolanaTradeAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};
