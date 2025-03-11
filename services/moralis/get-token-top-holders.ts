import Moralis from 'moralis';

// Track if Moralis has been started
let isMoralisStarted = false;

export interface TokenHolder {
  address: string;
  amount: string;
  amountDecimal: string;
  percentage: number;
  label?: string;
}

interface MoralisTokenOwner {
  balance: string;
  balance_formatted: string;
  is_contract: boolean;
  owner_address: string;
  owner_address_label: string | null;
  entity: any;
  entity_logo: any;
  usd_value: string;
  percentage_relative_to_total_supply: number;
}

/**
 * Gets the top holders for a BSC token using Moralis API
 * @param address The token contract address
 * @returns Array of top token holders
 */
export async function getTokenTopHolders(address: string): Promise<TokenHolder[]> {
  try {
    // Start Moralis only if it hasn't been started yet
    if (!isMoralisStarted) {
      try {
        await Moralis.start({
          apiKey: process.env.MORALIS_API_KEY || ''
        });
        isMoralisStarted = true;
      } catch (error: any) {
        // If the error is because Moralis is already started, just continue
        if (error.message && error.message.includes('Modules are started already')) {
          console.log('Moralis is already started, continuing...');
          isMoralisStarted = true;
        } else {
          // If it's a different error, rethrow it
          throw error;
        }
      }
    }

    // Get token owners
    const response = await Moralis.EvmApi.token.getTokenOwners({
      chain: "0x38", // BSC chain ID
      limit: 20,
      order: "DESC",
      tokenAddress: address
    });

    const result = response.toJSON().result as MoralisTokenOwner[];
    
    if (!result || result.length === 0) {
      return [];
    }
    
    // Map the response to our TokenHolder interface
    return result.map((holder: MoralisTokenOwner) => {
      return {
        address: holder.owner_address,
        amount: holder.balance,
        amountDecimal: holder.balance_formatted,
        percentage: holder.percentage_relative_to_total_supply,
        label: holder.owner_address_label || undefined
      };
    });
  } catch (error) {
    console.error('Error fetching token top holders:', error);
    throw error;
  }
} 