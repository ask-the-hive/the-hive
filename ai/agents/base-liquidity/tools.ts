import { GET_POOLS_NAME } from "@/ai/base/actions/liquidity/get-pools/name";
import { baseTool } from "@/ai/base";
import { BaseGetPoolsAction } from "@/ai/base/actions/liquidity/get-pools";

export const BASE_LIQUIDITY_TOOLS = {
  [`baseliquidity-${GET_POOLS_NAME}`]: baseTool(new BaseGetPoolsAction()),
}; 