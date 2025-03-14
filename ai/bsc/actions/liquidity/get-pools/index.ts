import { GET_POOLS_NAME } from "./name";
import { GET_POOLS_PROMPT } from "./prompt";
import { GetPoolsInputSchema } from "./input-schema";
import { getPools } from "./function";

import type { BscAction } from "../../bsc-action";
import type { GetPoolsResultBodyType } from "./types";

export class BscGetPoolsAction implements BscAction<typeof GetPoolsInputSchema, GetPoolsResultBodyType> {
  name = GET_POOLS_NAME;
  description = GET_POOLS_PROMPT;
  argsSchema = GetPoolsInputSchema;
  func = getPools;
} 