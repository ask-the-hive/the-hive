import Moralis from 'moralis';
import { ChainType } from '@/app/_contexts/chain-context';

export interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  thumbnail: string | null;
  decimals: number;
  balance: string;
  balance_formatted: string;
  possible_spam: boolean;
  verified_contract: boolean;
  total_supply: string | null;
  total_supply_formatted: string | null;
  percentage_relative_to_total_supply: number | null;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  usd_value: number;
  usd_value_24hr_usd_change: number;
  native_token: boolean;
  portfolio_percentage: number;
}

export interface TokenBalancesResponse {
  cursor: string | null;
  page: number;
  page_size: number;
  result: TokenBalance[];
}

// Chain ID mapping
const CHAIN_IDS = {
  bsc: "0x38",    // BSC Mainnet
  base: "0x2105"  // Base Mainnet
} as const;

export const getAllBalances = async (address: string, chain: ChainType = 'bsc'): Promise<TokenBalancesResponse> => {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY
      });
    }

    // Only proceed for EVM chains (BSC and Base)
    if (chain !== 'bsc' && chain !== 'base') {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const chainId = CHAIN_IDS[chain];
    console.log(`Fetching balances from Moralis for address: ${address} on chain: ${chain} (${chainId})`);
    
    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: chainId,
      address: address
    });

    console.log('Raw Moralis response:', JSON.stringify(response.toJSON(), null, 2));
    const jsonResponse = response.toJSON();
    
    // Convert the response to match our interface
    return {
      cursor: jsonResponse.cursor || null,
      page: jsonResponse.page || 0,
      page_size: jsonResponse.page_size || 100,
      result: jsonResponse.result.map(token => ({
        ...token,
        token_address: token.token_address || '',
        verified_contract: !!token.verified_contract,
        logo: token.logo || null,
        thumbnail: token.thumbnail || null,
        total_supply: token.total_supply || null,
        total_supply_formatted: token.total_supply_formatted || null,
        percentage_relative_to_total_supply: token.percentage_relative_to_total_supply !== undefined ? token.percentage_relative_to_total_supply : null,
        usd_price: typeof token.usd_price === 'string' ? parseFloat(token.usd_price) : token.usd_price || 0,
        usd_price_24hr_percent_change: typeof token.usd_price_24hr_percent_change === 'string' ? parseFloat(token.usd_price_24hr_percent_change) : token.usd_price_24hr_percent_change || 0,
        usd_price_24hr_usd_change: typeof token.usd_price_24hr_usd_change === 'string' ? parseFloat(token.usd_price_24hr_usd_change) : token.usd_price_24hr_usd_change || 0,
        usd_value: typeof token.usd_value === 'string' ? parseFloat(token.usd_value) : token.usd_value || 0,
        usd_value_24hr_usd_change: typeof token.usd_value_24hr_usd_change === 'string' ? parseFloat(token.usd_value_24hr_usd_change) : token.usd_value_24hr_usd_change || 0,
        portfolio_percentage: typeof token.portfolio_percentage === 'string' ? parseFloat(token.portfolio_percentage) : token.portfolio_percentage || 0
      }))
    };
  } catch (error) {
    console.error('Moralis API error:', error);
    throw error;
  }
} 