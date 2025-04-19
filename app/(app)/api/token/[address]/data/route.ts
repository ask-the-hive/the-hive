import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/db/services";
import { getTokenOverview } from "@/services/birdeye";
import type { ChainType } from "@/app/_contexts/chain-context";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain = (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') ? chainParam as ChainType : 'solana';
    
    try {
        const token = await getToken(address);
        
        if (!token) {
            const tokenMetadata = await getTokenOverview(address, chain);
            
            if (!tokenMetadata) {
                return NextResponse.json(
                    { error: 'Token not found' },
                    { status: 404 }
                );
            }
            
            // Return token data from Birdeye
            return NextResponse.json({
                id: tokenMetadata.address,
                name: tokenMetadata.name,
                symbol: tokenMetadata.symbol,
                decimals: tokenMetadata.decimals,
                logoURI: tokenMetadata.logoURI,
                extensions: tokenMetadata.extensions,
                tags: [],
                freezeAuthority: null,
                mintAuthority: null,
                permanentDelegate: null,
                overview: tokenMetadata
            });
        }
        
        return NextResponse.json(token);
    } catch (error) {
        console.error('Error fetching token data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch token data' },
            { status: 500 }
        );
    }
}