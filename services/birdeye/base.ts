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

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
        'accept': 'application/json',
        'x-chain': xChainValue
      }
    });

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
    }

    const data: BaseResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(`Birdeye API error: Request failed`);
    }

    return data.data;
  } catch (error) {
    console.error(`Birdeye API error:`, error);
    throw error;
  }
}