import { bscTokenActions } from "./token";
import { bscMarketActions } from "./market";
import { bscWalletActions } from "./wallet";
import { bscLiquidityActions } from "./liquidity";


export const bscActions = [
  ...bscTokenActions,
  ...bscMarketActions,
  ...bscWalletActions,
  ...bscLiquidityActions,
];

export const getAllBscActions = () => bscActions; 