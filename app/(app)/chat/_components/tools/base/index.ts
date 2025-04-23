import { BASE_BUBBLE_MAPS_NAME } from '@/ai/base/actions/token/bubble-maps/name';
import { BASE_PRICE_CHART_NAME } from '@/ai/base/actions/token/price-chart/name';
import { BASE_TOKEN_HOLDERS_NAME } from '@/ai/base/actions/token/token-holders/name';
import BubbleMaps from './bubble-maps';
import PriceChart from './price-chart';
import TokenHolders from './token-holders';

export const BASE_TOOL_COMPONENTS = {
    [BASE_BUBBLE_MAPS_NAME]: BubbleMaps,
    [BASE_PRICE_CHART_NAME]: PriceChart,
    [BASE_TOKEN_HOLDERS_NAME]: TokenHolders,
} as const;

export { default as GetTokenAddress } from './get-token-address';
export { default as BubbleMaps } from './bubble-maps';
export { default as PriceChart } from './price-chart';
export { default as TokenHolders } from './token-holders';
export { default as TopHolders } from './top-holders'; 