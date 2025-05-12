import { NextRequest, NextResponse } from "next/server";
import { getMarketsList } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";
import { MarketItem } from "@/services/birdeye/types";
import { identifyDex } from "@/services/birdeye/utils";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain = (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') ? chainParam as ChainType : 'solana';

    try {
        const markets = await getMarketsList(address, chain);

        // For BSC/Base markets, try to identify the DEX type
        if (chain === 'bsc' || chain === 'base') {
            markets.items = markets.items.map((market: MarketItem) => ({
                ...market,
                source: identifyDex(market.address, market.name, chain)
            }));
        }

        return NextResponse.json(markets);
    } catch (error) {
        console.error('Error fetching token markets:', error);
        return NextResponse.json({ error: 'Failed to fetch token markets' }, { status: 500 });
    }
};