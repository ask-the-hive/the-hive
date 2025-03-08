import { queryBscScan, TokenTransfer } from './base';
import { getTokenTransfers } from './get-token-transfers';
import { getTokenMetadata } from '../birdeye/get-token-metadata';
import { ChainType } from '@/app/_contexts/chain-context';

interface BscTransaction {
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

interface EnrichedBscTransaction {
  signature: string;
  type: string;
  source: string;
  tokenTransfers: {
    token: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      logo?: string;
    };
    amount: number;
    usdValue?: number;
    from: string;
    to: string;
  }[];
}

// Known DEX router addresses
const DEX_ROUTERS = {
  PANCAKESWAP_UNIVERSAL: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'.toLowerCase(), // PancakeSwap Universal Router
  PANCAKESWAP_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E'.toLowerCase(), // PancakeSwap V2 Router
  PANCAKESWAP_V3: '0x1b81D678ffb9C0263b24A97847620C99d213eB14'.toLowerCase(), // PancakeSwap V3 Router
};

// Known DEX contract addresses
const DEX_CONTRACTS = {
  PANCAKESWAP: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'.toLowerCase(), // CAKE token
  PANCAKESWAP_PAIR: '0x0ed7e52944161450477ee417de9cd3a859b14fd0'.toLowerCase(), // PancakeSwap: CAKE-BNB LP
};

export async function getBscTransactionHistory(address: string): Promise<EnrichedBscTransaction[]> {
  try {
    // Get normal transactions
    const transactions = await queryBscScan<BscTransaction[]>(
      'account',
      'txlist',
      address,
      {
        startblock: '0',
        endblock: '99999999',
        sort: 'desc'
      }
    );

    // Get all token transfers for this address
    let allTokenTransfers: TokenTransfer[] = [];
    try {
      allTokenTransfers = await getTokenTransfers(address);
      console.log(`Found ${allTokenTransfers.length} token transfers for address ${address}`);
    } catch (error) {
      console.error('Error fetching token transfers:', error);
    }
    
    // Group token transfers by transaction hash
    const transfersByHash: Record<string, TokenTransfer[]> = {};
    allTokenTransfers.forEach(transfer => {
      const hash = transfer.hash;
      if (!transfersByHash[hash]) {
        transfersByHash[hash] = [];
      }
      transfersByHash[hash].push(transfer);
    });

    // Create a set of unique token addresses to fetch metadata for
    const uniqueTokenAddresses = new Set<string>();
    allTokenTransfers.forEach(transfer => {
      uniqueTokenAddresses.add(transfer.contractAddress.toLowerCase());
    });

    // Fetch token metadata for all unique tokens
    const tokenMetadataMap = new Map<string, any>();
    await Promise.all(
      Array.from(uniqueTokenAddresses).map(async (tokenAddress) => {
        try {
          const metadata = await getTokenMetadata(tokenAddress, 'bsc' as ChainType);
          if (metadata) {
            tokenMetadataMap.set(tokenAddress.toLowerCase(), metadata);
          }
        } catch (error) {
          console.error(`Error fetching metadata for token ${tokenAddress}:`, error);
        }
      })
    );

    // Enrich transactions with token transfers
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx): Promise<EnrichedBscTransaction> => {
        // Get token transfers for this transaction
        const tokenTransfers = transfersByHash[tx.hash] || [];
        console.log(`Transaction ${tx.hash} has ${tokenTransfers.length} token transfers`);

        // Get token metadata for each transfer
        const enrichedTransfers = await Promise.all(
          tokenTransfers.map(async (transfer) => {
            try {
              const decimals = parseInt(transfer.tokenDecimal);
              const rawAmount = parseFloat(transfer.value);
              const amount = rawAmount / Math.pow(10, decimals);
              
              const tokenAddress = transfer.contractAddress.toLowerCase();
              const metadata = tokenMetadataMap.get(tokenAddress);
              
              console.log(`Token transfer: ${transfer.tokenSymbol}, amount: ${amount}, decimals: ${decimals}, raw value: ${transfer.value}`);

              return {
                token: {
                  address: tokenAddress,
                  symbol: transfer.tokenSymbol,
                  name: transfer.tokenName,
                  decimals: decimals,
                  logo: metadata?.logo_uri || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${tokenAddress}/logo.png`
                },
                amount: transfer.from.toLowerCase() === address.toLowerCase() ? -amount : amount,
                from: transfer.from,
                to: transfer.to
              };
            } catch (error) {
              console.error(`Error processing token transfer:`, error);
              return null;
            }
          })
        );

        // Filter out null values
        const validTransfers = enrichedTransfers.filter(transfer => transfer !== null);

        // Determine transaction type and source
        let type = 'UNKNOWN';
        let source = 'SYSTEM_PROGRAM';

        const txTo = tx.to?.toLowerCase() || '';
        const hasTokenTransfers = tokenTransfers.length > 0;
        const isPancakeSwapRouter = Object.values(DEX_ROUTERS).includes(txTo);
        const hasPancakeSwapToken = tokenTransfers.some(
          transfer => transfer.contractAddress.toLowerCase() === DEX_CONTRACTS.PANCAKESWAP
        );

        // Check if this is a DEX transaction
        if (isPancakeSwapRouter || hasPancakeSwapToken) {
          type = 'SWAP';
          source = 'PANCAKESWAP';
        }
        // Check if this is a simple transfer
        else if (tx.input === '0x') {
          type = 'TRANSFER';
          source = 'SYSTEM_PROGRAM';
        }
        // Check function name for swap-related terms
        else if (tx.functionName && (
          tx.functionName.toLowerCase().includes('swap') ||
          tx.functionName.toLowerCase().includes('exacttokens') ||
          tx.functionName.toLowerCase().includes('exacteth')
        )) {
          type = 'SWAP';
          source = 'PANCAKESWAP';
        }

        // If we have token transfers, it's likely a swap or token transfer
        if (hasTokenTransfers) {
          if (tokenTransfers.length >= 2) {
            type = 'SWAP';
            source = 'PANCAKESWAP';
          } else if (type === 'UNKNOWN') {
            type = 'TRANSFER';
          }
        }

        return {
          signature: tx.hash,
          type,
          source,
          tokenTransfers: validTransfers
        };
      })
    );

    return enrichedTransactions;
  } catch (error) {
    console.error('Error in getBscTransactionHistory:', error);
    return [];
  }
} 