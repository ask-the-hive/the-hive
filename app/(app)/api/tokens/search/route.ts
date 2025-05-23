import {NextRequest} from "next/server";

import { searchForTokens } from "@/services/search";

export const GET = async (req: NextRequest) => {
    const q = req.nextUrl.searchParams.get("q");
    if(!q) return Response.json([]);
    return Response.json(await searchForTokens(q));
}