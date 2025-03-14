import { NextResponse, NextRequest } from "next/server";
import { getTokenCandlesticks } from "@/services/hellomoon";
import { getTokenPriceHistory, PriceHistoryItem } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export const POST = async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;

    try {
        const { timeframe, numDays, chain = 'solana' } = await req.json();
        
        console.log(`Fetching token prices for ${address} on chain ${chain} with timeframe ${timeframe} and numDays ${numDays}`);
        
        if (chain === 'solana') {
            try {
                const prices = await getTokenCandlesticks(address, timeframe, numDays);
                return NextResponse.json(prices);
            } catch (error) {
                console.error(`Error fetching Solana token prices for ${address}:`, error);
                return NextResponse.json([], { status: 500 });
            }
        } else if (chain === 'bsc') {
            try {
                const prices = await getTokenPriceHistory(address, numDays, chain as ChainType);
                
                if (!prices || prices.length === 0) {
                    console.log(`No price data found for BSC token ${address}`);
                    return NextResponse.json([], { status: 204 });
                }
                
                // Transform Birdeye price history to match the format expected by the chart
                const transformedPrices = prices.map((price: PriceHistoryItem) => ({
                    timestamp: price.unixTime as number,
                    open: price.value,
                    high: price.value,
                    low: price.value,
                    close: price.value,
                    volume: 0,
                }));
                
                return NextResponse.json(transformedPrices);
            } catch (error) {
                console.error(`Error fetching BSC token prices for ${address}:`, error);
                return NextResponse.json([], { status: 500 });
            }
        } else {
            console.error(`Unsupported chain: ${chain}`);
            return NextResponse.json([], { status: 400 });
        }
    } catch (error) {
        console.error(`Error processing request for ${address}:`, error);
        return NextResponse.json([], { status: 500 });
    }
}