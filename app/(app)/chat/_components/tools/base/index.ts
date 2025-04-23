import { BASE_BUBBLE_MAPS_NAME } from '@/ai/base/actions/token/bubble-maps/name';
import { BASE_PRICE_CHART_NAME } from '@/ai/base/actions/token/price-chart/name';
import { BASE_TOKEN_HOLDERS_NAME } from '@/ai/base/actions/token/token-holders/name';
import { BASE_GET_TRENDING_TOKENS_NAME } from '@/ai/base/actions/market/get-trending-tokens/name';
import { BASE_GET_TRADER_TRADES_NAME } from '@/ai/base/actions/market/get-trades/name';
import BubbleMaps from './bubble-maps';
import PriceChart from './price-chart';
import TokenHolders from './token-holders';
import GetTrendingTokens from './get-trending-tokens';
import { GetTrades } from './get-trades';

export const BASE_TOOL_COMPONENTS = {
    [BASE_BUBBLE_MAPS_NAME]: BubbleMaps,
    [BASE_PRICE_CHART_NAME]: PriceChart,
    [BASE_TOKEN_HOLDERS_NAME]: TokenHolders,
    [BASE_GET_TRENDING_TOKENS_NAME]: GetTrendingTokens,
    [BASE_GET_TRADER_TRADES_NAME]: GetTrades,
} as const;

export { default as GetTokenAddress } from './get-token-address';
export { BubbleMaps, PriceChart, TokenHolders, GetTrendingTokens };
export { default as TopHolders } from './top-holders';
export { default as GetTopTraders } from './get-top-traders';
export { GetTrades }; 