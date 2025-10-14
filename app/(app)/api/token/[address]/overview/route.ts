import { getTokenOverview } from '@/services/birdeye';
import { NextRequest, NextResponse } from 'next/server';
import type { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain =
      chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base'
        ? (chainParam as ChainType)
        : 'solana';

    const tokenOverview = await getTokenOverview(address, chain);
    return NextResponse.json(tokenOverview);
  },
);
