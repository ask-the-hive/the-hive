import { chunkArray } from "@/lib/utils";
import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";
import { ethers } from "ethers";

import { PortfolioResponse, Portfolio, PortfolioItem } from "./types";
import { getPrices } from "./get-prices";
import { getToken } from "@/db/services";
import { getTokenMetadata } from "./get-token-metadata";

const parseAddress = (address: string) => {
  return address === "So11111111111111111111111111111111111111111" ? "So11111111111111111111111111111111111111112" : address;
}

const getBNBBalance = async (address: string): Promise<PortfolioItem | null> => {
  try {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
    const balance = await provider.getBalance(address);
    
    // Get BNB price using WBNB price since they're 1:1
    const bnbPrice = await getPrices(["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"], "bsc");
    const uiAmount = Number(ethers.formatEther(balance));
    const priceUsd = bnbPrice["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"]?.value ?? 0;

    return {
      address: "BNB",
      balance: Number(balance.toString()),
      decimals: 18,
      uiAmount,
      priceUsd,
      valueUsd: uiAmount * priceUsd,
      name: "BNB",
      symbol: "BNB",
      logoURI: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
      chainId: "bsc"
    };
  } catch (error) {
    console.error("Error fetching BNB balance:", error);
    return null;
  }
}

export const getPortfolio = async (wallet: string, chain: ChainType = 'solana'): Promise<Portfolio> => {
  let items: PortfolioItem[] = [];

  try {
    // For BSC, get BNB balance first
    if (chain === 'bsc') {
      const bnbBalance = await getBNBBalance(wallet);
      if (bnbBalance) {
        items.push(bnbBalance);
      }
    }

    // Get token balances from BirdEye
    const response = await queryBirdeye<PortfolioResponse>(`v1/wallet/token_list`, { wallet }, chain);

    // Filter out WBNB since we're showing native BNB
    const filteredItems = chain === 'bsc' 
      ? response.items.filter(item => item.address.toLowerCase() !== '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c')
      : response.items;

    const prices = (await Promise.all(chunkArray(filteredItems.map(item => parseAddress(item.address)), 100).map(async (chunk) => {
      return await getPrices(chunk, chain);
    }))).reduce((acc, curr) => ({ ...acc, ...curr }), {});
    
    const tokenItems = await Promise.all(filteredItems.map(async (item) => {
      const token = await getToken(parseAddress(item.address));
      
      if (!token) {
        try {
          const metadata = await getTokenMetadata(parseAddress(item.address), chain);
          return {
            ...item,
            priceUsd: prices[parseAddress(item.address)]?.value ?? 0,
            valueUsd: item.uiAmount * (prices[parseAddress(item.address)]?.value ?? 0),
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
        priceUsd: prices[parseAddress(item.address)]?.value ?? 0,
        valueUsd: item.uiAmount * (prices[parseAddress(item.address)]?.value ?? 0),
        name: token?.name ?? 'Unknown',
        symbol: (token?.symbol ?? 'Unknown').toUpperCase(),
        logoURI: token?.logoURI ?? ''
      };
    }));

    // Add valid token items to the list
    items = [...items, ...tokenItems.filter((item): item is PortfolioItem => 
      item !== null && item.priceUsd > 0 && item.valueUsd > 0
    )];
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    // If BirdEye fails but we have BNB balance for BSC, return just that
    if (chain === 'bsc' && items.length > 0) {
      return {
        wallet,
        totalUsd: items.reduce((acc, curr) => acc + curr.valueUsd, 0),
        items
      };
    }
    throw error;
  }

  const sortedItems = items.sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    wallet,
    totalUsd: sortedItems.reduce((acc, curr) => acc + curr.valueUsd, 0),
    items: sortedItems
  };
}