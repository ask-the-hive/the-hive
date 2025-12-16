import { NextResponse, NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';
import { fetchOHLCV } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { OHLCVTimeframe } from '@/services/birdeye/types/ohlcv';
import { CandlestickGranularity } from '@/services/hellomoon/types';

function mapGranularityToOHLCV(timeframe: CandlestickGranularity): OHLCVTimeframe {
  switch (timeframe) {
    case CandlestickGranularity.ONE_MIN:
      return OHLCVTimeframe.OneMinute;
    case CandlestickGranularity.FIVE_MIN:
      return OHLCVTimeframe.FiveMinutes;
    case CandlestickGranularity.ONE_HOUR:
      return OHLCVTimeframe.OneHour;
    case CandlestickGranularity.ONE_WEEK:
      return OHLCVTimeframe.OneWeek;
    case CandlestickGranularity.ONE_DAY:
    default:
      return OHLCVTimeframe.OneDay;
  }
}

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;

    const {
      timeframe = CandlestickGranularity.ONE_DAY,
      numDays = 7,
      chain = 'solana',
    } = await req.json();

    const chainType = chain as ChainType;
    const ohlcvTimeframe = mapGranularityToOHLCV(timeframe as CandlestickGranularity);
    const now = Math.floor(Date.now() / 1000);
    const clampedNumDays = Math.max(1, Math.min(365, Number(numDays) || 7));
    const timeFrom = now - clampedNumDays * 86400;

    try {
      const response = await fetchOHLCV({
        address,
        timeframe: ohlcvTimeframe,
        timeFrom,
        timeTo: now,
        chain: chainType,
      });

      const items = (response?.items || []).sort((a, b) => a.unixTime - b.unixTime);

      if (!items.length) {
        console.log(`No OHLCV data found for ${chainType.toUpperCase()} token ${address}`);
        return NextResponse.json([], { status: 200 });
      }

      const transformed = items.map((item) => ({
        timestamp: item.unixTime,
        open: item.o,
        high: item.h,
        low: item.l,
        close: item.c,
        volume: item.v,
      }));

      return NextResponse.json(transformed);
    } catch (error) {
      console.error(
        `Error fetching ${chainType.toUpperCase()} OHLCV data for token ${address}:`,
        error,
      );
      return NextResponse.json([], { status: 200 });
    }
  },
);
