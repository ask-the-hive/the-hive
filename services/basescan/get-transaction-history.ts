import { TokenTransfer, queryBaseScan } from './base';
import { getTokenMetadata } from '../birdeye/get-token-metadata';
import type { TokenMetadata } from '../birdeye/types/token-metadata';
import { ChainType } from '@/app/_contexts/chain-context';
import { getTokenTransfers } from './get-token-transfers';
import { logger } from '@/lib/logger';

export interface BaseTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface EnrichedBaseTransaction {
  signature: string;
  type: 'send' | 'receive' | 'contract_interaction' | 'swap';
  tokenTransfers?: {
    token: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      logo?: string;
    };
    amount: number;
    from: string;
    to: string;
  }[];
  source: string;
  chain: ChainType;
}

// Known DEX router addresses for Base
const DEX_ROUTERS = {
  UNISWAP_UNIVERSAL: '0x198EF79F2A516D55D09cB08836459a114cC9E5c5'.toLowerCase(), // Uniswap Universal Router on Base
  AERODROME: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'.toLowerCase(), // Aerodrome Router
  BASESWAP: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86'.toLowerCase(), // BaseSwap Router
};

export async function getBaseTransactionHistory(
  address: string,
  startBlock = '0',
  endBlock = '99999999'
): Promise<EnrichedBaseTransaction[]> {
  try {
    logger.debug('Fetching Base transaction history', { address });

    // Fetch normal transactions
    const transactions = await queryBaseScan<BaseTransaction[]>('account', 'txlist', address, {
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc'
    });

    // Fetch token transfers
    const tokenTransfers = await getTokenTransfers(address);

    // Group token transfers by transaction hash
    const transfersByTx = tokenTransfers.reduce((acc, transfer) => {
      if (!acc[transfer.hash]) {
        acc[transfer.hash] = [];
      }
      acc[transfer.hash].push(transfer);
      return acc;
    }, {} as Record<string, TokenTransfer[]>);

    // Create a set of unique token addresses to fetch metadata for
    const uniqueTokenAddresses = new Set<string>();
    tokenTransfers.forEach(transfer => {
      uniqueTokenAddresses.add(transfer.contractAddress.toLowerCase());
    });

    // Fetch token metadata for all unique tokens
    const tokenMetadataMap = new Map<string, TokenMetadata>();
    await Promise.all(
      Array.from(uniqueTokenAddresses).map(async (tokenAddress) => {
        try {
          const metadata = await getTokenMetadata(tokenAddress, 'base');
          if (metadata && 'address' in metadata) {
            tokenMetadataMap.set(tokenAddress.toLowerCase(), metadata);
          }
        } catch (error) {
          logger.error(`Error fetching metadata for token ${tokenAddress}:`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })
    );

    // Enrich transactions with token transfers and determine type
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        // Get token transfers for this transaction
        const tokenTransfers = transfersByTx[tx.hash] || [];
        logger.debug(`Transaction ${tx.hash} has ${tokenTransfers.length} token transfers`);

        // Get token metadata for each transfer
        const enrichedTransfers = await Promise.all(
          tokenTransfers.map(async (transfer) => {
            try {
              const decimals = transfer.tokenDecimal;
              const rawAmount = parseFloat(transfer.value);
              const amount = rawAmount / Math.pow(10, decimals);
              
              const tokenAddress = transfer.contractAddress.toLowerCase();
              const metadata = tokenMetadataMap.get(tokenAddress);
              
              logger.debug(`Token transfer: ${transfer.tokenSymbol}, amount: ${amount}, decimals: ${decimals}, raw value: ${transfer.value}`);

              return {
                token: {
                  address: tokenAddress,
                  symbol: transfer.tokenSymbol,
                  name: transfer.tokenName,
                  decimals: decimals,
                  logo: metadata?.logo_uri || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${tokenAddress}/logo.png`
                },
                amount: transfer.from.toLowerCase() === address.toLowerCase() ? -amount : amount,
                from: transfer.from,
                to: transfer.to
              };
            } catch (error) {
              logger.error('Error processing token transfer:', {
                error: error instanceof Error ? error.message : String(error)
              });
              return null;
            }
          })
        );

        // Filter out null values
        const validTransfers = enrichedTransfers.filter((transfer): transfer is NonNullable<typeof transfer> => transfer !== null);

        // Determine transaction type and source
        let type: EnrichedBaseTransaction['type'] = 'contract_interaction';
        let source = 'basescan';

        const txTo = tx.to?.toLowerCase() || '';
        const hasTokenTransfers = tokenTransfers.length > 0;
        const isDexRouter = Object.values(DEX_ROUTERS).includes(txTo);

        // Check if this is a DEX transaction
        if (isDexRouter) {
          type = 'swap';
          source = txTo === DEX_ROUTERS.UNISWAP_UNIVERSAL ? 'uniswap' :
                  txTo === DEX_ROUTERS.AERODROME ? 'aerodrome' :
                  txTo === DEX_ROUTERS.BASESWAP ? 'baseswap' : 'dex';
        }
        // Check if this is a simple transfer
        else if (tx.input === '0x' || !hasTokenTransfers) {
          type = tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive';
        }
        // Check function name for swap-related terms
        else if (tx.functionName && (
          tx.functionName.toLowerCase().includes('swap') ||
          tx.functionName.toLowerCase().includes('exacttokens') ||
          tx.functionName.toLowerCase().includes('exacteth')
        )) {
          type = 'swap';
        }

        // If we have multiple token transfers, it's likely a swap
        if (hasTokenTransfers && tokenTransfers.length >= 2) {
          type = 'swap';
        }

        const enrichedTransaction: EnrichedBaseTransaction = {
          signature: tx.hash,
          type,
          source,
          tokenTransfers: validTransfers,
          chain: 'base'
        };

        return enrichedTransaction;
      })
    );

    logger.debug('Base transaction history fetched', {
      address,
      count: enrichedTransactions.length
    });

    return enrichedTransactions;
  } catch (error) {
    logger.error('Error fetching Base transaction history', {
      error: error instanceof Error ? error.message : String(error),
      address
    });
    throw error;
  }
} 