import type { TokenPriceChartResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";
import { toUserFacingErrorTextWithContext } from "@/lib/user-facing-error";

export async function getPriceChart(): Promise<SolanaActionResult<TokenPriceChartResultBodyType>> {
  try {
    return {
      message: `The price chart has been retrieved and displayed to the user. Do not reiterate the raw data.`,
      body: {}
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load the price chart right now.", error),
    };
  }
} 
