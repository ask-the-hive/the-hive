import { NextRequest, NextResponse } from "next/server";

import { getPortfolio } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const chain = searchParams.get('chain') as ChainType || 'solana';
        const address = params.address;

        console.log('[Portfolio API Debug] Request params:', {
            chain,
            address,
            url: request.url
        });

        const portfolio = await getPortfolio(address, chain);
        
        console.log('[Portfolio API Debug] Portfolio response:', {
            chain,
            address,
            itemCount: portfolio?.items?.length || 0,
            totalUsd: portfolio?.totalUsd || 0,
            items: portfolio?.items?.map(item => ({
                symbol: item.symbol,
                balance: item.balance,
                valueUsd: item.valueUsd
            })) || []
        });

        return NextResponse.json(portfolio);
    } catch (error) {
        console.error('[Portfolio API Debug] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch portfolio' },
            { status: 500 }
        );
    }
}