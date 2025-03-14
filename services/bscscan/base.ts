import { env } from '@/env.mjs';

const BSCSCAN_API_URL = 'https://api.bscscan.com/api';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

export interface BscScanResponse<T> {
  status: string;
  message: string;
  result: T;
}

export interface TokenTransfer {
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

export async function queryBscScan<T>(
  module: string,
  action: string,
  address: string,
  additionalParams: Record<string, string> = {}
): Promise<T> {
  if (!BSCSCAN_API_KEY) {
    throw new Error('BSCSCAN_API_KEY is not defined in environment variables');
  }

  const params = new URLSearchParams({
    module,
    action,
    address,
    apikey: BSCSCAN_API_KEY,
    ...additionalParams
  });

  const url = `${BSCSCAN_API_URL}?${params}`;
  console.log(`Calling BSCScan API: ${url.replace(/apikey=([^&]+)/, 'apikey=HIDDEN')}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BSCScan API error: ${response.status} ${response.statusText}`);
  }

  const data: BscScanResponse<T> = await response.json();
  console.log('BSCScan API response status:', data.status);

  if (data.status === '0') {
    throw new Error(`BSCScan API error: ${data.message}`);
  }

  return data.result;
} 