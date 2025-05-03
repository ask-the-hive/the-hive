import { z } from "zod";
import { GetTokenAddressArgumentsSchema } from "./input-schema";

export type GetTokenAddressArgumentsType = z.infer<typeof GetTokenAddressArgumentsSchema>;

export type GetTokenAddressResultBodyType = {
    address: string;
}; 