import { SolanaTokenPageTopHoldersAction } from "./top-holders";
import { BSCTokenPageTopHoldersAction } from "./bsc-top-holders";
import { BaseTokenPageTopHoldersAction } from "./base-top-holders";
import { BaseTokenPageLiquidityAction } from "./base-liquidity";
import { BaseTokenPagePriceAnalysisAction } from "./base-price-analysis";
import { BaseTokenPageTradingActivityAction } from "./base-trading-activity";
import { TokenPageNumMentionsAction } from "./num-mentions";
import { SolanaTokenPageLiquidityAction } from "./liquidity";
import { BSCTokenPageLiquidityAction } from "./bsc-liquidity";
import { SolanaTokenPagePriceAnalysisAction } from "./price-analysis";
import { BSCTokenPagePriceAnalysisAction } from "./bsc-price-analysis";
import { BSCTokenPageTradingActivityAction } from "./bsc-trading-activity";
import type { TokenPageAction, TokenPageActionSchemaAny } from "./token-page-action";
import { TokenChatData } from "@/types";
import { ChainType } from "@/app/_contexts/chain-context";

// Helper function to validate Twitter URL and extract username
const getValidTwitterUsername = (twitterUrl: string): string | null => {
    try {
        const url = new URL(twitterUrl);
        
        // Check if it's a Twitter/X URL
        if (!url.hostname.includes('twitter.com') && !url.hostname.includes('x.com')) {
            return null;
        }
        
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Valid profile URL should be like: twitter.com/username or twitter.com/username/
        // Invalid URLs would be like: twitter.com/username/status/123456789
        if (pathParts.length === 1 && pathParts[0] && !pathParts[0].includes('status')) {
            return pathParts[0];
        }
        
        return null;
    } catch {
        return null;
    }
};

export function getAllTokenPageActions(extensions: TokenChatData['extensions'], chain: ChainType = 'solana'): TokenPageAction<TokenPageActionSchemaAny, any>[] {
  // Get valid Twitter username if available
  const validTwitterUsername = extensions?.twitter 
    ? getValidTwitterUsername(extensions.twitter)
    : null;

  if (chain === 'bsc') {
    return [
      new BSCTokenPageTopHoldersAction(),
      new BSCTokenPageLiquidityAction(),
      new BSCTokenPagePriceAnalysisAction(),
      new BSCTokenPageTradingActivityAction(),
      ...(validTwitterUsername ? [new TokenPageNumMentionsAction(validTwitterUsername)] : []),
    ];
  }
  
  if (chain === 'base') {
    return [
      new BaseTokenPageTopHoldersAction(),
      new BaseTokenPageLiquidityAction(),
      new BaseTokenPagePriceAnalysisAction(),
      new BaseTokenPageTradingActivityAction(),
      ...(validTwitterUsername ? [new TokenPageNumMentionsAction(validTwitterUsername)] : []),
    ];
  }
  
  return [
    new SolanaTokenPageTopHoldersAction(),
    new SolanaTokenPageLiquidityAction(),
    new SolanaTokenPagePriceAnalysisAction(),
    ...(validTwitterUsername ? [new TokenPageNumMentionsAction(validTwitterUsername)] : []),
  ];
}
export * from './types';

export * from './top-holders';
export * from './bsc-top-holders';
export * from './base-top-holders';
export * from './num-mentions';
export * from './liquidity';
export * from './bsc-liquidity';
export * from './base-liquidity';
export * from './price-analysis';
export * from './bsc-price-analysis';
export * from './base-price-analysis';
export * from './bsc-trading-activity';
export * from './base-trading-activity';
