import { NextRequest, NextResponse } from "next/server";
import { getTokenHolders } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    // For BSC tokens, return an empty array with a specific status code
    if (chain === 'bsc') {
        console.log(`BSC chain not supported for top holders: ${address}`);
        return NextResponse.json([], { status: 204 }); // 204 No Content
    }

    console.log(`Fetching top holders for token ${address} on chain ${chain}`);

    try {
        const { items: topHolders } = await getTokenHolders({
            address,
            offset: 0,
            limit: 20,
            chain: chain as ChainType
        });
        
        console.log(`Successfully fetched ${topHolders.length} top holders for token ${address}`);
        return NextResponse.json(topHolders || []);
    } catch (error) {
        console.error(`Error fetching top holders for token ${address}:`, error);
        return NextResponse.json([], { status: 500 });
    }
}


