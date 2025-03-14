import { BSC_GET_POOLS_NAME } from "@/ai/bsc/actions/liquidity/names";
import { bscTool } from "@/ai/bsc";
import { BscGetPoolsAction } from "@/ai/bsc/actions/liquidity/get-pools";

export const BSC_LIQUIDITY_TOOLS = {
  [`bscliquidity-${BSC_GET_POOLS_NAME}`]: bscTool(new BscGetPoolsAction()),
}; 