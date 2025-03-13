import Moralis from 'moralis';

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

export const getAllBalances = async (address: string): Promise<TokenBalancesResponse> => {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY
      });
    }

    console.log('Fetching balances from Moralis for address:', address);
    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: "0x38",
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
        logo: token.logo || null,
        thumbnail: token.thumbnail || null
      }))
    };
  } catch (error) {
    console.error('Moralis API error:', error);
    throw error;
  }
} 