import { BSC_BUBBLE_MAPS_NAME } from "./name";
import { BSC_BUBBLE_MAPS_PROMPT } from "./prompt";
import { BubbleMapsArgumentsSchema } from "./input-schema";
import { BubbleMapsResultBodyType } from "./types";
import { getBubbleMaps } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscGetBubbleMapsAction implements BscAction<typeof BubbleMapsArgumentsSchema, BubbleMapsResultBodyType> {
  public name = BSC_BUBBLE_MAPS_NAME;
  public description = BSC_BUBBLE_MAPS_PROMPT;
  public argsSchema = BubbleMapsArgumentsSchema;
  public func = getBubbleMaps;
} 