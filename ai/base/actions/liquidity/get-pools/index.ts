import { GET_POOLS_NAME } from "./name";
import { GET_POOLS_PROMPT } from "./prompt";
import { GetPoolsInputSchema } from "./input-schema";
import { getPools } from "./function";

import type { BaseAction } from "../../base-action";
import type { GetPoolsResultBodyType } from "./types";

export class BaseGetPoolsAction implements BaseAction<typeof GetPoolsInputSchema, GetPoolsResultBodyType> {
  name = GET_POOLS_NAME;
  description = GET_POOLS_PROMPT;
  argsSchema = GetPoolsInputSchema;
  func = getPools;
} 