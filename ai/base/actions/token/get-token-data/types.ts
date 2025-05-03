import { z } from "zod";
import { GetTokenDataInputSchema } from "./input-schema";
import type { BaseActionResult } from "../../base-action";
import type { TokenOverview } from "@/services/birdeye/types";

export type GetTokenDataArgumentsType = z.infer<typeof GetTokenDataInputSchema>;

export interface GetTokenDataResultBodyType {
  token: TokenOverview;
}

export type GetTokenDataResultType = BaseActionResult<GetTokenDataResultBodyType>; 