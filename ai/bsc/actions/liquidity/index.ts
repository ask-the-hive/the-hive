import { BSC_GET_POOLS_NAME } from "./names";
import { BscGetPoolsAction } from "./get-pools";

export const bscLiquidityActions = [
  {
    name: BSC_GET_POOLS_NAME,
    action: new BscGetPoolsAction(),
  },
];
