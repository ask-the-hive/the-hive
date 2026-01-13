import { GET_POOLS_NAME } from '@/ai/base/actions/liquidity/get-pools/name';
import { baseTool } from '@/ai/base';
import { BaseGetPoolsAction } from '@/ai/base/actions/liquidity/get-pools';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BASE_LIQUIDITY_TOOLS = {
  [`baseliquidity-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`baseliquidity-${GET_POOLS_NAME}`]: baseTool(new BaseGetPoolsAction()),
};
