import { z } from "zod";

import { BubbleMapsArgumentsSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";

export type BubbleMapsSchemaType = typeof BubbleMapsArgumentsSchema;

export type BubbleMapsArgumentsType = z.infer<BubbleMapsSchemaType>;

export type BubbleMapsResultBodyType = {
    success: boolean;
    url: string;
};

export type BubbleMapsResultType = BaseActionResult<BubbleMapsResultBodyType>; 