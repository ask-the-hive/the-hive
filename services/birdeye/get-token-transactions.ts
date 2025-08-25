import { queryBirdeye } from './base';
import { TransactionsResponse } from './types';
import { ChainType } from '@/app/_contexts/chain-context';

export const getTokenTransactions = async (
  tokenAddress: string,
  chain: ChainType = 'solana',
  limit: number = 20,
  offset: number = 0
): Promise<TransactionsResponse> => {
  return queryBirdeye<TransactionsResponse>(
    'defi/txs/token',
    {
      address: tokenAddress,
      offset,
      limit,
      tx_type: 'swap',
      sort_type: 'desc',
      ui_amount_mode: 'scaled'
    },
    chain
  );
};
