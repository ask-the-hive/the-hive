import { bscTokenActions } from "./token";
import { bscMarketActions } from "./market";
import { bscWalletActions } from "./wallet";

export const bscActions = [
  ...bscTokenActions,
  ...bscMarketActions,
  ...bscWalletActions,
];

export const getAllBscActions = () => bscActions; 