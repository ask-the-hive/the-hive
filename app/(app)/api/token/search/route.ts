import { searchTokens } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/app/_contexts/chain-context";
import type { TokenSearchResult } from "@/services/birdeye/types/search";

const PLACEHOLDER_ICON = "https://www.birdeye.so/images/unknown-token-icon.svg";

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    if (!query) {
        return NextResponse.json({ tokens: [] });
    }
    
    try {
        // Always use uppercase for search since Birdeye API is case-sensitive
        const searchQuery = query.toUpperCase();
        let allTokens: TokenSearchResult[] = [];

        const searchResponse = await searchTokens({
            keyword: searchQuery,
            target: "token",
            sort_by: "volume_24h_usd",
            sort_type: "desc",
            offset: 0,
            limit: 10,
            chain: chain === 'bsc' ? 'bsc' : 'solana',
        });

        allTokens = searchResponse.items.flatMap(item => item.result);

        // Remove duplicates based on address
        const uniqueTokens = Array.from(new Map(allTokens.map(token => [token.address, token])).values());

        const formattedTokens = uniqueTokens.map(token => ({
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
    
    // Always use uppercase for search since Birdeye API is case-sensitive
    const searchQuery = search.toUpperCase();
    let allTokenResults: TokenSearchResult[] = [];

    const searchResponse = await searchTokens({
        keyword: searchQuery,
        target: "token",
        sort_by: "volume_24h_usd",
        sort_type: "desc",
        offset: 0,
        limit: 10,
        chain: chain === 'bsc' ? 'bsc' : 'solana',
    });

    allTokenResults = searchResponse.items.flatMap(item => item.result);

    // Remove duplicates based on address
    const uniqueTokens = Array.from(new Map(allTokenResults.map(token => [token.address, token])).values());

    return NextResponse.json(uniqueTokens);
}