import { BaseResponse } from "./types";
import { ChainType } from "@/app/_contexts/chain-context";

export const queryBirdeye = async <T>(
  endpoint: string,
  params?: Record<string, string | number>,
  chain: ChainType = 'solana'
): Promise<T> => {
  const url = new URL(`https://public-api.birdeye.so/${endpoint}`);
  
  url.searchParams.append('chain', chain === 'bsc' ? 'bsc' : 'solana');
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'chain') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const xChainValue = chain === 'bsc' ? 'bsc' : 'solana';
  
  console.log(`Making Birdeye API request to ${url.toString()} with chain ${chain}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
        'accept': 'application/json',
        'x-chain': xChainValue
      }
    });

    const responseData = await response.json();
    console.log(`Birdeye API response for ${endpoint}:`, responseData);

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }

    const data: BaseResponse<T> = responseData;

    if (!data.success) {
      throw new Error(`Birdeye API error: ${data.message || 'Request failed'}`);
    }

    if (!data.data || (Array.isArray(data.data) && data.data.length === 0)) {
      console.log(`No data returned from Birdeye API for ${endpoint}`);
    }

    return data.data;
  } catch (error) {
    console.error(`Birdeye API error for ${endpoint}:`, error);
    throw error;
  }
}