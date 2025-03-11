import { BscGetTokenDataAction } from "./get-token-data";
import { BscGetTokenAddressAction } from "./get-token-address";
import { BscTokenHoldersAction } from "./token-holders";
import { BscTopTokenTradersAction } from "./top-traders";
import { BscGetBubbleMapsAction } from "./bubble-maps";
import { BscTopHoldersAction } from "./top-holders";

export const bscTokenActions = [
  new BscGetTokenDataAction(),
  new BscGetTokenAddressAction(),
  new BscTokenHoldersAction(),
  new BscTopTokenTradersAction(),
  new BscGetBubbleMapsAction(),
  new BscTopHoldersAction(),
]; 