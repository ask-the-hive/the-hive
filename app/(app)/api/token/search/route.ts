import { searchTokens } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/app/_contexts/chain-context";

const PLACEHOLDER_ICON = "https://www.birdeye.so/images/unknown-token-icon.svg";

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    if (!query) {
        return NextResponse.json({ tokens: [] });
    }
    
    try {
        const searchResponse = await searchTokens({
            keyword: query,
            target: "token",
            sort_by: "volume_24h_usd",
            sort_type: "desc",
            offset: 0,
            limit: 10,
            chain: chain === 'bsc' ? 'bsc' : 'solana',
        });

        const allTokens = searchResponse.items.flatMap(item => item.result);

        const formattedTokens = allTokens.map(token => ({
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            logo_uri: token.logo_uri || PLACEHOLDER_ICON,
            price: token.price || 0,
            price_change_24h_percent: token.price_change_24h_percent || 0
        }));

        return NextResponse.json({ tokens: formattedTokens });
    } catch (error) {
        console.error('Error searching tokens:', error);
        return NextResponse.json({ tokens: [], error: 'Failed to search tokens' }, { status: 500 });
    }
}

export const POST = async (req: NextRequest) => {
    const { search, chain = 'solana' } = await req.json();
    
    const tokens = await searchTokens({
        keyword: search,
        target: "token",
        sort_by: "volume_24h_usd",
        sort_type: "desc",
        offset: 0,
        limit: 10,
        chain: chain === 'bsc' ? 'bsc' : 'solana',
    });

    return NextResponse.json(tokens.items);
}