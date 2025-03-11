import { getPrices, getTokenMetadata } from '@/services/birdeye';
import { getSmartMoneyInflows } from '@/services/hellomoon';
import { NextRequest, NextResponse } from "next/server";
import { Granularity } from '@/services/hellomoon/types';

export const GET = async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';
    
    if (chain !== 'solana' && chain !== 'bsc') {
        return NextResponse.json(
            { error: 'Invalid chain parameter. Must be "solana" or "bsc".' }, 
            { status: 400 }
        );
    }

    if (chain === 'bsc') {
        return NextResponse.json(
            { error: 'Smart Money Inflows are only available for Solana.' }, 
            { status: 400 }
        );
    }
    
    try {
        const tokens = await getSmartMoneyInflows(Granularity.ONE_DAY, 9);

        const [prices, tokenMetadatas] = await Promise.all([
            getPrices(tokens.map((token) => token.mint), 'solana')
                .then((prices) => {
                    return tokens.map((token) => {
                        return prices[token.mint]
                    });
                })
                .catch((error) => {
                    console.error(error);
                    return [];
                }),
            Promise.all(tokens.map(async (token) => {
                const tokenMetadata = await getTokenMetadata(token.mint, 'solana').catch((error) => {
                    console.error(error);
                    return null;
                });
                return tokenMetadata;
            })),
        ]);

        const result = tokens
            .filter((_, index) => prices[index] && tokenMetadatas[index])
            .map((token, index) => ({
                inflow: token,
                price: prices[index],
                token: tokenMetadatas[index]
            }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching smart money tokens:', error);
        return NextResponse.json(
            { error: 'Failed to fetch smart money tokens. Please try again later.'}, 
            { status: 500 }
        );
    }
} 