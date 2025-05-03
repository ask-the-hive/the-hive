import { env } from '@/env.mjs';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const BASE_CHAIN_ID = '8453'; // Base Mainnet Chain ID (decimal format)

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: number;
  timestamp: number;
  type: 'send' | 'receive';
}

interface BaseScanResponse<T> {
  status: string;
  message: string;
  result: T;
}

export async function queryBaseScan<T>(
  module: string,
  action: string,
  address: string,
  additionalParams: Record<string, string> = {}
): Promise<T> {
  if (!BASESCAN_API_KEY) {
    throw new Error('BASESCAN_API_KEY is not defined in environment variables');
  }

  const params = new URLSearchParams({
    chainid: BASE_CHAIN_ID,
    module,
    action,
    address,
    apikey: BASESCAN_API_KEY,
    ...additionalParams
  });

  const url = `${ETHERSCAN_API_URL}?${params}`;
  console.log(`Calling Etherscan API for Base chain: ${url.replace(/apikey=([^&]+)/, 'apikey=HIDDEN')}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Base chain API error: ${response.status} ${response.statusText}`);
  }

  const data: BaseScanResponse<T> = await response.json();
  console.log('Base chain API response status:', data.status);

  if (data.status === '0') {
    throw new Error(`Base chain API error: ${data.message}`);
  }

  return data.result;
} 