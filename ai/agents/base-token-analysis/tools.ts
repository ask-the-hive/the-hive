import { BASE_GET_TOKEN_DATA_NAME } from '@/ai/base/actions/token/get-token-data/name';
import { BASE_GET_TOKEN_ADDRESS_NAME } from '@/ai/base/actions/token/get-token-address/name';
import { BASE_BUBBLE_MAPS_NAME } from '@/ai/base/actions/token/bubble-maps/name';
import { BASE_PRICE_CHART_NAME } from '@/ai/base/actions/token/price-chart/name';
import { BASE_TOKEN_HOLDERS_NAME } from '@/ai/base/actions/token/token-holders/name';
import { BASE_TOP_HOLDERS_NAME } from '@/ai/base/actions/token/top-holders/name';
import { BASE_TOKEN_TOP_TRADERS_NAME } from '@/ai/base/actions/token/top-traders/name';
import { baseTool } from '@/ai/base/index';
import { BaseGetTokenDataAction } from '@/ai/base/actions/token/get-token-data';
import { BaseGetTokenAddressAction } from '@/ai/base/actions/token/get-token-address';
import { BaseGetBubbleMapsAction } from '@/ai/base/actions/token/bubble-maps';
import { BaseGetPriceChartAction } from '@/ai/base/actions/token/price-chart';
import { BaseTokenHoldersAction } from '@/ai/base/actions/token/token-holders';
import { BaseTopHoldersAction } from '@/ai/base/actions/token/top-holders';
import { BaseTopTokenTradersAction } from '@/ai/base/actions/token/top-traders';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BASE_TOKEN_ANALYSIS_TOOLS = {
  [`basetokenanalysis-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`basetokenanalysis-${BASE_GET_TOKEN_DATA_NAME}`]: baseTool(new BaseGetTokenDataAction()),
  [`basetokenanalysis-${BASE_GET_TOKEN_ADDRESS_NAME}`]: baseTool(new BaseGetTokenAddressAction()),
  [`basetokenanalysis-${BASE_BUBBLE_MAPS_NAME}`]: baseTool(new BaseGetBubbleMapsAction()),
  [`basetokenanalysis-${BASE_PRICE_CHART_NAME}`]: baseTool(new BaseGetPriceChartAction()),
  [`basetokenanalysis-${BASE_TOKEN_HOLDERS_NAME}`]: baseTool(new BaseTokenHoldersAction()),
  [`basetokenanalysis-${BASE_TOP_HOLDERS_NAME}`]: baseTool(new BaseTopHoldersAction()),
  [`basetokenanalysis-${BASE_TOKEN_TOP_TRADERS_NAME}`]: baseTool(new BaseTopTokenTradersAction()),
};
