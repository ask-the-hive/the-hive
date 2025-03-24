import { NextRequest, NextResponse } from "next/server";
import { getTopTradersByToken } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    console.log(`Fetching top traders for token ${address} on chain ${chain}`);

    try {
        const response = await getTopTradersByToken({
            address,
            offset: 0,
            limit: 10,
            chain: chain as ChainType
        });

        console.log(`Successfully fetched top traders for ${address} on ${chain}:`, response);
        
        if (!response.items || response.items.length === 0) {
            console.log(`No top traders found for token ${address} on ${chain}`);
            return NextResponse.json([], { status: 404 });
        }
        
        return NextResponse.json(response.items);
    } catch (error: any) {
        console.error(`Error fetching top traders for ${address} on ${chain}:`, error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch top traders' }, { status: 500 });
    }
}