import { NextRequest, NextResponse } from "next/server";

import { getTokenMetadata } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

// SOL token metadata
const SOL_METADATA = {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
    extensions: {},
    logo_uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
};

// SOL token addresses
const SOL_TOKEN_ADDRESSES = [
    'so11111111111111111111111111111111111111112',  // Standard SOL token
    'so11111111111111111111111111111111111111111'   // Alternative SOL token
];

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const normalizedAddress = address.toLowerCase();
    
    // Get chain from query parameters, default to 'bsc'
    const searchParams = request.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'bsc';
    const chain = (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') ? chainParam as ChainType : 'bsc';
    
    console.log(`API route: Fetching metadata for token ${address} on chain ${chain}`);
    
    try {
        // Special handling for SOL token
        if (chain === 'solana' && (
            SOL_TOKEN_ADDRESSES.includes(normalizedAddress) ||
            normalizedAddress === 'sol'
        )) {
            return NextResponse.json({
                ...SOL_METADATA,
                address: 'So11111111111111111111111111111111111111112'
            });
        }

        const metadata = await getTokenMetadata(address, chain);
        console.log(`API route: Successfully fetched metadata for ${address}:`, metadata);
        
        // If the token is SOL (by symbol), use SOL metadata
        if (chain === 'solana' && metadata.symbol?.toUpperCase() === 'SOL') {
            return NextResponse.json({
                ...SOL_METADATA,
                address: 'So11111111111111111111111111111111111111112'
            });
        }
        
        return NextResponse.json(metadata);
    } catch (error) {
        console.error(`API route: Error fetching metadata for ${address}:`, error);
        
        // If error occurs for SOL token, return hardcoded metadata
        if (chain === 'solana' && (
            SOL_TOKEN_ADDRESSES.includes(normalizedAddress) ||
            normalizedAddress === 'sol'
        )) {
            return NextResponse.json({
                ...SOL_METADATA,
                address: 'So11111111111111111111111111111111111111112'
            });
        }

        return NextResponse.json(
            {
                address,
                name: "Unknown Token",
                symbol: "UNKNOWN",
                decimals: 18,
                extensions: {},
                logo_uri: "https://www.birdeye.so/images/unknown-token-icon.svg"
            },
            { status: 200 } // Return 200 with fallback data instead of error
        );
    }
}