import { z } from "zod";

export const GetTokenAddressArgumentsSchema = z.object({
    keyword: z.string().describe("The keyword to search for. This can be the ticker or name of the token on BSC."),
}); 