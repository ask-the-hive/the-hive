import { chunkArray } from "@/lib/utils";
import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import { PortfolioResponse, Portfolio, PortfolioItem } from "./types";
import { getPrices } from "./get-prices";
import { getToken } from "@/db/services";
import { getTokenMetadata } from "./get-token-metadata";

const parseAddress = (address: string) => {
  return address === "So11111111111111111111111111111111111111111" ? "So11111111111111111111111111111111111111112" : address;
}

export const getPortfolio = async (wallet: string, chain: ChainType = 'solana'): Promise<Portfolio> => {
  let items: PortfolioItem[] = [];

  try {
    // Get token balances from BirdEye
    const response = await queryBirdeye<PortfolioResponse>(`v1/wallet/token_list`, { wallet }, chain);

    // Get prices for all tokens except native BNB (which uses WBNB price)
    const nonNativeTokens = response.items.filter(item => 
      item.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    );

    const priceAddresses = chain === 'bsc' 
      ? [...nonNativeTokens.map(item => item.address), '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'] // Add WBNB for BNB price
      : nonNativeTokens.map(item => item.address);

    const prices = (await Promise.all(chunkArray(priceAddresses.map(parseAddress), 100).map(async (chunk) => {
      return await getPrices(chunk, chain);
    }))).reduce((acc, curr) => ({ ...acc, ...curr }), {});
    
    const tokenItems = await Promise.all(response.items.map(async (item) => {
      // For native BNB, use WBNB price
      const priceAddress = item.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
        : parseAddress(item.address);

      const priceUsd = prices[priceAddress]?.value ?? 0;
      const valueUsd = item.uiAmount * priceUsd;

      // For native BNB, use predefined metadata
      if (item.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        return {
          ...item,
          priceUsd,
          valueUsd,
          name: "BNB",
          symbol: "BNB",
          logoURI: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
        };
      }

      // For other tokens, try to get metadata from cache or API
      const token = await getToken(parseAddress(item.address));
      
      if (!token) {
        try {
          const metadata = await getTokenMetadata(parseAddress(item.address), chain);
          return {
            ...item,
            priceUsd,
            valueUsd,
            name: metadata.name,
            symbol: metadata.symbol.toUpperCase(),
            logoURI: metadata.logo_uri
          };
        } catch (error) {
          console.error(`Failed to fetch metadata for token ${item.address}:`, error);
          return null;
        }
      }

      return {
        ...item,
        priceUsd,
        valueUsd,
        name: token?.name ?? 'Unknown',
        symbol: (token?.symbol ?? 'Unknown').toUpperCase(),
        logoURI: token?.logoURI ?? ''
      };
    }));

    // Add valid token items to the list
    items = tokenItems.filter((item): item is PortfolioItem => 
      item !== null && item.priceUsd > 0 && item.valueUsd > 0
    );
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }

  const sortedItems = items.sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    wallet,
    totalUsd: sortedItems.reduce((acc, curr) => acc + curr.valueUsd, 0),
    items: sortedItems
  };
}