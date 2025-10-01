import { Connection } from '@solana/web3.js';

import {
  SolanaGetBubbleMapsAction,
  SolanaGetTokenAddressAction,
  SolanaGetTokenDataAction,
  SolanaTopHoldersAction,
  SolanaTokenHoldersAction,
  SolanaTopTokenTradersAction,
  SolanaTokenPriceChartAction,
} from '@/ai/solana/actions';

import {
  SOLANA_BUBBLE_MAPS_NAME,
  SOLANA_GET_TOKEN_ADDRESS_ACTION,
  SOLANA_GET_TOKEN_DATA_NAME,
  SOLANA_TOP_HOLDERS_NAME,
  SOLANA_TOKEN_HOLDERS_NAME,
  SOLANA_TOKEN_TOP_TRADERS_NAME,
  SOLANA_TOKEN_PRICE_CHART_NAME,
} from '@/ai/action-names';

import { solanaTool } from '@/ai/solana';

export const TOKEN_ANALYSIS_TOOLS = {
  [`tokenanalysis-${SOLANA_GET_TOKEN_DATA_NAME}`]: solanaTool(
    new SolanaGetTokenDataAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_TOP_HOLDERS_NAME}`]: solanaTool(
    new SolanaTopHoldersAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_TOKEN_HOLDERS_NAME}`]: solanaTool(
    new SolanaTokenHoldersAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_GET_TOKEN_ADDRESS_ACTION}`]: solanaTool(
    new SolanaGetTokenAddressAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_BUBBLE_MAPS_NAME}`]: solanaTool(
    new SolanaGetBubbleMapsAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_TOKEN_TOP_TRADERS_NAME}`]: solanaTool(
    new SolanaTopTokenTradersAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
  [`tokenanalysis-${SOLANA_TOKEN_PRICE_CHART_NAME}`]: solanaTool(
    new SolanaTokenPriceChartAction(),
    new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
  ),
};
