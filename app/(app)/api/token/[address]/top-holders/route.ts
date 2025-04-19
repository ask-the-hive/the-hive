import { NextRequest, NextResponse } from "next/server";
import { getTokenHolders } from "@/services/birdeye";
import { getTokenTopHolders } from "@/services/moralis";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    console.log(`Fetching top holders for token ${address} on chain ${chain}`);

    try {
        if (chain === 'bsc' || chain === 'base') {
            // Use Moralis for BSC and Base tokens
            const topHolders = await getTokenTopHolders(address, chain as ChainType);
            
            // Map Moralis response to match Birdeye format
            const mappedHolders = topHolders.map(holder => ({
                amount: holder.amount,
                decimals: 18, // BSC and Base tokens typically use 18 decimals
                mint: address,
                owner: holder.address,
                token_account: holder.address,
                ui_amount: parseFloat(holder.amountDecimal),
                percentage: holder.percentage // Add the percentage from Moralis
            }));
            
            console.log(`Successfully fetched ${mappedHolders.length} top holders for ${chain.toUpperCase()} token ${address}`);
            return NextResponse.json(mappedHolders);
        } else {
            // Use Birdeye for Solana tokens
            const { items: topHolders } = await getTokenHolders({
                address,
                offset: 0,
                limit: 20,
                chain: chain as ChainType
            });
            
            console.log(`Successfully fetched ${topHolders.length} top holders for token ${address}`);
            return NextResponse.json(topHolders || []);
        }
    } catch (error) {
        console.error(`Error fetching top holders for token ${address}:`, error);
        return NextResponse.json([], { status: 500 });
    }
}


