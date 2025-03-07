import { NextRequest, NextResponse } from "next/server";
import { getTopTradersByToken } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    try {
        const { items: topTraders } = await getTopTradersByToken({
            address,
            offset: 0,
            limit: 10,
            chain: chain as ChainType
        });
        
        return NextResponse.json(topTraders);
    } catch (error) {
        console.error('Error fetching top traders:', error);
        return NextResponse.json([], { status: 500 });
    }
}