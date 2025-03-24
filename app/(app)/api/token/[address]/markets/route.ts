import { NextRequest, NextResponse } from "next/server";
import { getMarketsList } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";
import { MarketsResponseData } from "@/services/birdeye/types";
import { identifyBscDex } from "@/services/birdeye/utils";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    try {
        const markets = await getMarketsList(address, chain as ChainType);
        
        // For BSC chain, try to identify the market type from the address and name
        if (chain === 'bsc') {
            const processedMarkets: MarketsResponseData = {
                ...markets,
                items: markets.items.map(market => {
                    // If the source is the same as the address, it means Birdeye didn't identify the DEX
                    if (market.source === market.address) {
                        return {
                            ...market,
                            source: identifyBscDex(market.address, market.name)
                        };
                    }
                    return market;
                })
            };
            
            return NextResponse.json(processedMarkets);
        }
        
        return NextResponse.json(markets);
    } catch (error) {
        console.error('Error fetching markets:', error);
        return NextResponse.json({ items: [], total: 0 }, { status: 500 });
    }
}