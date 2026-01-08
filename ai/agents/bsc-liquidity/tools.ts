import { BSC_GET_POOLS_NAME } from '@/ai/bsc/actions/liquidity/names';
import { bscTool } from '@/ai/bsc';
import { BscGetPoolsAction } from '@/ai/bsc/actions/liquidity/get-pools';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BSC_LIQUIDITY_TOOLS = {
  [`bscliquidity-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`bscliquidity-${BSC_GET_POOLS_NAME}`]: bscTool(new BscGetPoolsAction()),
};
