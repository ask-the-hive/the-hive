import { BscGetTokenDataAction } from "@/ai/bsc/actions/token/get-token-data";
import { BSC_GET_TOKEN_DATA_NAME } from "@/ai/bsc/actions/token/get-token-data/name";
import { BscGetTokenAddressAction } from "@/ai/bsc/actions/token/get-token-address";
import { BSC_GET_TOKEN_ADDRESS_NAME } from "@/ai/bsc/actions/token/get-token-address/name";
import { BscTokenHoldersAction } from "@/ai/bsc/actions/token/token-holders";
import { BSC_TOKEN_HOLDERS_NAME } from "@/ai/bsc/actions/token/token-holders/name";
import { BscTopTokenTradersAction } from "@/ai/bsc/actions/token/top-traders";
import { BSC_TOKEN_TOP_TRADERS_NAME } from "@/ai/bsc/actions/token/top-traders/name";
import { BscGetBubbleMapsAction } from "@/ai/bsc/actions/token/bubble-maps";
import { BSC_BUBBLE_MAPS_NAME } from "@/ai/bsc/actions/token/bubble-maps/name";
import { BscTopHoldersAction } from "@/ai/bsc/actions/token/top-holders";
import { BSC_TOP_HOLDERS_NAME } from "@/ai/bsc/actions/token/top-holders/name";
import { bscTool } from "@/ai/bsc";

export const BSC_TOKEN_ANALYSIS_TOOLS = {
  [`bsctokenanalysis-${BSC_GET_TOKEN_DATA_NAME}`]: bscTool(new BscGetTokenDataAction()),
  [`bsctokenanalysis-${BSC_GET_TOKEN_ADDRESS_NAME}`]: bscTool(new BscGetTokenAddressAction()),
  [`bsctokenanalysis-${BSC_TOKEN_HOLDERS_NAME}`]: bscTool(new BscTokenHoldersAction()),
  [`bsctokenanalysis-${BSC_TOKEN_TOP_TRADERS_NAME}`]: bscTool(new BscTopTokenTradersAction()),
  [`bsctokenanalysis-${BSC_BUBBLE_MAPS_NAME}`]: bscTool(new BscGetBubbleMapsAction()),
  [`bsctokenanalysis-${BSC_TOP_HOLDERS_NAME}`]: bscTool(new BscTopHoldersAction()),
}; 