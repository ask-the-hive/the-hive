import { searchTokens } from "@/services/birdeye";
import type { PriceChartArgumentsType, PriceChartResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

export async function getPriceChart(
  args: PriceChartArgumentsType
): Promise<BscActionResult<PriceChartResultBodyType>> {
  try {
    console.log(`Searching for token: ${args.search}`);
    
    // First, search for the token
    const { items } = await searchTokens({
      keyword: args.search,
      target: "token",
      sort_by: "volume_24h_usd",
      sort_type: "desc",
      offset: 0,
      limit: 10,
      chain: 'bsc'
    });

    const token = items?.[0]?.result?.[0];

    if (!token) {
      console.log(`No token found for: ${args.search}`);
      return {
        message: `No token found for ${args.search} on BSC`,
      };
    }

    console.log(`Found token: ${token.name} (${token.symbol}) with address: ${token.address}`);

    // For the price chart, we don't need to fetch any data as the Moralis chart widget
    // will handle fetching and displaying the data directly in the UI
    return {
      message: `The price chart for ${token.name} (${token.symbol}) is displayed in the UI. The chart shows historical price data and trading patterns. You can analyze the chart to understand price movements and trends.`,
      body: {
        tokenAddress: token.address,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        tokenLogo: token.logo_uri
      }
    };
  } catch (error) {
    console.error("Error displaying price chart:", error);
    return {
      message: `Error displaying price chart: ${error}`,
    };
  }
} 