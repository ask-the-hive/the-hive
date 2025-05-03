import { logger } from '@/lib/logger';
import { queryBaseScan, TokenTransfer } from './base';

interface BaseTokenTransferResponse {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export async function getTokenTransfers(address: string): Promise<TokenTransfer[]> {
  logger.debug('Fetching Base token transfers', { address });

  const transfers = await queryBaseScan<BaseTokenTransferResponse[]>(
    'account',
    'tokentx',
    address,
    {
      sort: 'desc'
    }
  );

  return transfers.map((transfer) => ({
    hash: transfer.hash,
    from: transfer.from.toLowerCase(),
    to: transfer.to.toLowerCase(),
    contractAddress: transfer.contractAddress.toLowerCase(),
    value: transfer.value,
    tokenName: transfer.tokenName,
    tokenSymbol: transfer.tokenSymbol,
    tokenDecimal: parseInt(transfer.tokenDecimal),
    timestamp: parseInt(transfer.timeStamp),
    type: transfer.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive'
  }));
} 