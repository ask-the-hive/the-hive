import { BASE_GET_TOKEN_DATA_NAME } from "@/ai/base/actions/token/get-token-data/name";
import { baseTool } from "@/ai/base/index";
import { BaseGetTokenDataAction } from "@/ai/base/actions/token/get-token-data";

export const BASE_TOKEN_ANALYSIS_TOOLS = {
  [`basetokenanalysis-${BASE_GET_TOKEN_DATA_NAME}`]: baseTool(new BaseGetTokenDataAction()),
}; 