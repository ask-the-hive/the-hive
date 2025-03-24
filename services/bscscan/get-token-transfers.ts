import { queryBscScan, TokenTransfer } from './base';

export async function getTokenTransfers(address: string): Promise<TokenTransfer[]> {
  return queryBscScan<TokenTransfer[]>(
    'account',
    'tokentx',
    address,
    {
      startblock: '0',
      endblock: '99999999',
      sort: 'desc'
    }
  );
} 