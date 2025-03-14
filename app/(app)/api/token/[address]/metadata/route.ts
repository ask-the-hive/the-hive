import { NextRequest, NextResponse } from "next/server";

import { getTokenMetadata } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

// BNB/WBNB metadata
const BNB_METADATA = {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
    extensions: {},
    logo_uri: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
};

const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c".toLowerCase();

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const normalizedAddress = address.toLowerCase();
    
    // Get chain from query parameters, default to 'bsc'
    const searchParams = request.nextUrl.searchParams;
    const chain = (searchParams.get('chain') || 'bsc') as ChainType;
    
    console.log(`API route: Fetching metadata for token ${address} on chain ${chain}`);
    
    try {
        // Special handling for BNB and WBNB
        if (normalizedAddress === "bnb" || normalizedAddress === WBNB_ADDRESS) {
            return NextResponse.json({
                ...BNB_METADATA,
                address: WBNB_ADDRESS,
                name: normalizedAddress === WBNB_ADDRESS ? "Wrapped BNB" : "Binance Coin",
                symbol: normalizedAddress === WBNB_ADDRESS ? "WBNB" : "BNB"
            });
        }

        const metadata = await getTokenMetadata(address, chain);
        console.log(`API route: Successfully fetched metadata for ${address}:`, metadata);
        
        // Special case: If the token is reporting itself as WBNB, use the same icon as BNB
        if (metadata.symbol?.toUpperCase() === "WBNB" || 
            metadata.address?.toLowerCase() === WBNB_ADDRESS) {
            return NextResponse.json({
                ...metadata,
                logo_uri: BNB_METADATA.logo_uri
            });
        }
        
        // Ensure we have a logo_uri
        if (!metadata.logo_uri) {
            console.log(`No logo found for ${address}, attempting to find from token list`);
            // You could implement additional fallback sources for logos here
            metadata.logo_uri = 'https://www.birdeye.so/images/unknown-token-icon.svg';
        }
        
        return NextResponse.json(metadata);
    } catch (error) {
        console.error(`API route: Error fetching metadata for ${address}:`, error);
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