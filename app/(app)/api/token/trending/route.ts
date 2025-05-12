import { getTrendingTokens } from "@/services/birdeye";
import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    try {
        // Validate chain parameter
        if (chain !== 'solana' && chain !== 'bsc' && chain !== 'base') {
            return NextResponse.json(
                { error: 'Invalid chain parameter. Must be "solana", "bsc", or "base".' }, 
                { status: 400 }
            );
        }
        
        // Use the Birdeye API for all chains
        const trendingTokens = await getTrendingTokens(
            0, 
            9, 
            chain
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
                unsupportedChain: chain === 'bsc' || chain === 'base'
            }, 
            { status: 500 }
        );
    }
} 