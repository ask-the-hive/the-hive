import { ethers } from "ethers";
import { getToken } from "@/db/services";
import type { BalanceArgumentsType, BalanceResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";
import { getBscProvider } from "../../provider";
import { BscGetTokenAddressAction } from "../../token/get-token-address";
import { BscGetTokenDataAction } from "../../token/get-token-data";
import { getTokenMetadata } from "@/services/birdeye";

// ERC20 Token ABI for balanceOf function
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

export async function getBalance(
  args: BalanceArgumentsType
): Promise<BscActionResult<BalanceResultBodyType>> {
  try {
    const provider = getBscProvider();
    let balance: number;
    let tokenAddress: string | null = null;
    let tokenSymbol: string;
    let tokenName: string;
    let tokenLogoURI: string;
  
    // Step 1: If we have a token symbol, get its address first
    if (args.tokenSymbol) {
      console.log(`Getting address for token symbol: ${args.tokenSymbol}`);
      const getTokenAddressAction = new BscGetTokenAddressAction();
      const result = await getTokenAddressAction.func({ keyword: args.tokenSymbol });
      
      if (!result.body?.address) {
        return {
          message: `Could not find token address for symbol: ${args.tokenSymbol}`,
        };
      }
      tokenAddress = result.body.address;
      console.log(`Found token address: ${tokenAddress}`);
    } else if (args.tokenAddress) {
      // If no symbol but we have an address, use it directly
      tokenAddress = args.tokenAddress;
    }

    // Step 2: Get the balance
    if (!tokenAddress) {
      // Get BNB balance
      console.log(`Getting BNB balance for: ${args.walletAddress}`);
      const rawBalance = await provider.getBalance(args.walletAddress);
      balance = Number(ethers.formatEther(rawBalance));
      tokenSymbol = "BNB";
      tokenName = "Binance Coin";
      tokenLogoURI = "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png";
    } else {
      // Get token balance using ERC20 contract
      console.log(`Getting token balance for address: ${tokenAddress}`);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      try {
        const decimals = await contract.decimals();
        const rawBalance = await contract.balanceOf(args.walletAddress);
        balance = Number(ethers.formatUnits(rawBalance, decimals));
        
        // Get token metadata from Birdeye
        console.log(`Fetching token metadata from Birdeye for: ${tokenAddress}`);
        const tokenMetadata = await getTokenMetadata(tokenAddress, 'bsc');
        console.log('Birdeye token metadata:', tokenMetadata);
        
        if (tokenMetadata) {
          tokenSymbol = tokenMetadata.symbol.toUpperCase();
          tokenName = tokenMetadata.name;
          tokenLogoURI = tokenMetadata.logo_uri || "";
          
          // If no logo from Birdeye, try getting from database
          if (!tokenLogoURI) {
            console.log(`No logo from Birdeye, trying database for: ${tokenAddress}`);
            const dbToken = await getToken(tokenAddress);
            if (dbToken?.logoURI) {
              console.log(`Found logo in database: ${dbToken.logoURI}`);
              tokenLogoURI = dbToken.logoURI;
            }
          }
          
          console.log(`Final token data - Symbol: ${tokenSymbol}, Name: ${tokenName}, Logo: ${tokenLogoURI}`);
        } else {
          // Fallback to contract if no Birdeye data
          console.log(`No Birdeye data, falling back to contract for: ${tokenAddress}`);
          tokenSymbol = (await contract.symbol()).toUpperCase();
          tokenName = await contract.name();
          tokenLogoURI = "";
          
          // Try getting logo from database as last resort
          const dbToken = await getToken(tokenAddress);
          if (dbToken?.logoURI) {
            console.log(`Found logo in database: ${dbToken.logoURI}`);
            tokenLogoURI = dbToken.logoURI;
          }
        }
      } catch (e) {
        console.error("Error getting token data:", e);
        return {
          message: `Error getting token data: ${e}`,
        };
      }
    }

    return {
      message: `Balance: ${balance} ${tokenSymbol}`,
      body: {
        balance,
        token: tokenSymbol,
        name: tokenName,
        logoURI: tokenLogoURI || ""
      }
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting balance: ${error}`,
    };
  }
} 