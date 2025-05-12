import { BASE_BUBBLE_MAPS_NAME } from "./name";
import { BASE_BUBBLE_MAPS_PROMPT } from "./prompt";
import { BubbleMapsArgumentsSchema } from "./input-schema";
import { getBubbleMaps } from "./function";

import type { BaseAction } from "../../base-action";
import type { BubbleMapsResultBodyType } from "./types";

export class BaseGetBubbleMapsAction implements BaseAction<typeof BubbleMapsArgumentsSchema, BubbleMapsResultBodyType> {
  public name = BASE_BUBBLE_MAPS_NAME;
  public description = BASE_BUBBLE_MAPS_PROMPT;
  public argsSchema = BubbleMapsArgumentsSchema;
  public func = getBubbleMaps;
} 