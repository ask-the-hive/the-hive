import { BSC_GET_TOKEN_DATA_NAME } from "./get-token-data/name";
import { BSC_GET_TOKEN_ADDRESS_NAME } from "./get-token-address/name";
import { BSC_TOKEN_HOLDERS_NAME } from "./token-holders/name";
import { BSC_TOKEN_TOP_TRADERS_NAME } from "./top-traders/name";
import { BSC_BUBBLE_MAPS_NAME } from "./bubble-maps/name";
import { BSC_TOP_HOLDERS_NAME } from "./top-holders/name";

export const BSC_TOKEN_ACTION_NAMES = {
  GET_TOKEN_DATA: BSC_GET_TOKEN_DATA_NAME,
  GET_TOKEN_ADDRESS: BSC_GET_TOKEN_ADDRESS_NAME,
  TOKEN_HOLDERS: BSC_TOKEN_HOLDERS_NAME,
  TOKEN_TOP_TRADERS: BSC_TOKEN_TOP_TRADERS_NAME,
  BUBBLE_MAPS: BSC_BUBBLE_MAPS_NAME,
  TOP_HOLDERS: BSC_TOP_HOLDERS_NAME,
} as const; 