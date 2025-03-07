import { SolanaTokenPageTopHoldersAction } from "./top-holders";
import { BSCTokenPageTopHoldersAction } from "./bsc-top-holders";
import { TokenPageNumMentionsAction } from "./num-mentions";
import { SolanaTokenPageLiquidityAction } from "./liquidity";
import { BSCTokenPageLiquidityAction } from "./bsc-liquidity";
import { SolanaTokenPagePriceAnalysisAction } from "./price-analysis";
import { BSCTokenPagePriceAnalysisAction } from "./bsc-price-analysis";
import { BSCTokenPageTradingActivityAction } from "./bsc-trading-activity";
import type { TokenPageAction, TokenPageActionSchemaAny } from "./token-page-action";
import { TokenChatData } from "@/types";
import { ChainType } from "@/app/_contexts/chain-context";

export function getAllTokenPageActions(extensions: TokenChatData['extensions'], chain: ChainType = 'solana'): TokenPageAction<TokenPageActionSchemaAny, any>[] {
  if (chain === 'bsc') {
    return [
      new BSCTokenPageTopHoldersAction(),
      new BSCTokenPageLiquidityAction(),
      new BSCTokenPagePriceAnalysisAction(),
      new BSCTokenPageTradingActivityAction(),
      ...(extensions?.twitter ? [new TokenPageNumMentionsAction(extensions.twitter.split("/").pop()!)] : []),
    ];
  }
  
  return [
    new SolanaTokenPageTopHoldersAction(),
    new SolanaTokenPageLiquidityAction(),
    new SolanaTokenPagePriceAnalysisAction(),
    ...(extensions?.twitter ? [new TokenPageNumMentionsAction(extensions.twitter.split("/").pop()!)] : []),
  ];
}
export * from './types';

export * from './top-holders';
export * from './bsc-top-holders';
export * from './num-mentions';
export * from './liquidity';
export * from './bsc-liquidity';
export * from './price-analysis';
export * from './bsc-price-analysis';
export * from './bsc-trading-activity';