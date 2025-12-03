import { NextResponse, NextRequest } from 'next/server';
import { getTokenCandlesticks } from '@/services/hellomoon';
import { getTokenPriceHistory, PriceHistoryItem } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;

    const { timeframe, numDays, chain = 'solana' } = await req.json();

    console.log(
      `Fetching token prices for ${address} on chain ${chain} with timeframe ${timeframe} and numDays ${numDays}`,
    );

    if (chain === 'solana') {
      const prices = await getTokenCandlesticks(address, timeframe, numDays);
      return NextResponse.json(prices);
    } else if (chain === 'bsc' || chain === 'base') {
      const prices = await getTokenPriceHistory(address, numDays, chain as ChainType);

      if (!prices || prices.length === 0) {
        console.log(`No price data found for ${chain.toUpperCase()} token ${address}`);
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
    } else {
      console.error(`Unsupported chain: ${chain}`);
      return NextResponse.json([], { status: 400 });
    }
  },
);
