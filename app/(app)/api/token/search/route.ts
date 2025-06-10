import { searchTokens } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/app/_contexts/chain-context";
import type { TokenSearchResult } from "@/services/birdeye/types/search";

const PLACEHOLDER_ICON = "https://www.birdeye.so/images/unknown-token-icon.svg";

// Helper to check if a string looks like an address
const isAddress = (query: string): boolean => {
    // Solana addresses are base58 encoded and typically 32-44 characters
    const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);
    // BSC/Base addresses are hex and start with 0x
    const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
    return isSolanaAddress || isEvmAddress;
};

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    if (!query) {
        return NextResponse.json({ tokens: [] });
    }
    
    try {
        // If it looks like an address, preserve case. Otherwise, convert to uppercase for symbol search
        const searchQuery = isAddress(query) ? query : query.toUpperCase();
        let allTokens: TokenSearchResult[] = [];

        const searchResponse = await searchTokens({
            keyword: searchQuery,
            target: "token",
            sort_by: "volume_24h_usd",
            sort_type: "desc",
            offset: 0,
            limit: 10,
            chain: chain,
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
    
    // If it looks like an address, preserve case. Otherwise, convert to uppercase for symbol search
    const searchQuery = isAddress(search) ? search : search.toUpperCase();
    let allTokenResults: TokenSearchResult[] = [];

    const searchResponse = await searchTokens({
        keyword: searchQuery,
        target: "token",
        sort_by: "volume_24h_usd",
        sort_type: "desc",
        offset: 0,
        limit: 10,
        chain: chain,
    });

    allTokenResults = searchResponse.items.flatMap(item => item.result);

    // Remove duplicates based on address
    const uniqueTokens = Array.from(new Map(allTokenResults.map(token => [token.address, token])).values());

    return NextResponse.json(uniqueTokens);
}