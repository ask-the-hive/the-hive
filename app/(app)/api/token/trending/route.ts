import { getTrendingTokens } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    try {
        // Validate chain parameter
        if (chain !== 'solana' && chain !== 'bsc') {
            return NextResponse.json(
                { error: 'Invalid chain parameter. Must be "solana" or "bsc".' }, 
                { status: 400 }
            );
        }
        
        // Use the Birdeye API for both chains
        const trendingTokens = await getTrendingTokens(
            0, 
            9, 
            chain === 'bsc' ? 'bsc' : 'solana'
        );
        
        return NextResponse.json({
            tokens: trendingTokens.tokens,
            unsupportedChain: false
        });
    } catch (error) {
        console.error(`Error fetching trending tokens for ${chain} chain:`, error);
        return NextResponse.json(
            { 
                tokens: [], 
                error: `Failed to fetch trending tokens for ${chain} chain.`,
                unsupportedChain: chain === 'bsc'
            }, 
            { status: 500 }
        );
    }
} 