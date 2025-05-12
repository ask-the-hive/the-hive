import { BaseGetTokenDataAction } from "./get-token-data";
import { BaseGetTokenAddressAction } from "./get-token-address";
import { BaseTokenHoldersAction } from "./token-holders";
import { BaseGetBubbleMapsAction } from "./bubble-maps";
import { BaseTopHoldersAction } from "./top-holders";
import { BaseGetPriceChartAction } from "./price-chart";

export const baseTokenActions = [
  new BaseGetTokenDataAction(),
  new BaseGetTokenAddressAction(),
  new BaseTokenHoldersAction(),
  new BaseGetBubbleMapsAction(),
  new BaseTopHoldersAction(),
  new BaseGetPriceChartAction(),
]; 