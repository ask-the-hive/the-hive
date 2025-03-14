import { getTokenOverview } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import type { ChainType } from "@/app/_contexts/chain-context";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain = (chainParam === 'solana' || chainParam === 'bsc') ? chainParam as ChainType : 'solana';
    
    try {
        const tokenOverview = await getTokenOverview(address, chain);
        return NextResponse.json(tokenOverview);
    } catch (error) {
        console.error('Error fetching token overview:', error);
        return NextResponse.json({}, { status: 500 });
    }
}