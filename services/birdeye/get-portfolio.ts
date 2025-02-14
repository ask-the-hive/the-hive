import { chunkArray } from "@/lib/utils";
import { queryBirdeye } from "./base";

import { PortfolioResponse, Portfolio, PortfolioItem } from "./types";
import { getPrices } from "./get-prices";
import { getToken } from "@/db/services";
import { getTokenMetadata } from "./get-token-metadata";

const parseAddress = (address: string) => {
  return address === "So11111111111111111111111111111111111111111" ? "So11111111111111111111111111111111111111112" : address;
}

export const getPortfolio = async (wallet: string): Promise<Portfolio> => {
  const response = await queryBirdeye<PortfolioResponse>(`v1/wallet/token_list`, { wallet });

  const prices = (await Promise.all(chunkArray(response.items.map(item => parseAddress(item.address)), 100).map(async (chunk) => {
    return await getPrices(chunk);
  }))).reduce((acc, curr) => ({ ...acc, ...curr }), {});
  
  const items: PortfolioItem[] = await Promise.all(response.items.map(async (item) => {
    const token = await getToken(parseAddress(item.address));
    
    if (!token) {
      try {
        const metadata = await getTokenMetadata(parseAddress(item.address));
        return {
          ...item,
          priceUsd: prices[parseAddress(item.address)]?.value ?? 0,
          valueUsd: item.uiAmount * (prices[parseAddress(item.address)]?.value ?? 0),
          name: metadata.name,
          symbol: metadata.symbol,
          logoURI: metadata.logo_uri
        };
      } catch (error) {
        console.error(`Failed to fetch metadata for token ${item.address}:`, error);
      }
    }

    return {
      ...item,
      priceUsd: prices[parseAddress(item.address)]?.value ?? 0,
      valueUsd: item.uiAmount * (prices[parseAddress(item.address)]?.value ?? 0),
      name: token?.name ?? 'Unknown',
      symbol: token?.symbol ?? 'Unknown',
      logoURI: token?.logoURI ?? ''
    };
  }));

  const sortedItems = items.sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    wallet,
    totalUsd: sortedItems.reduce((acc, curr) => acc + curr.valueUsd, 0),
    items: sortedItems
  };
}