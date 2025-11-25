import { NextRequest, NextResponse } from 'next/server';
import { getTopTradersByToken } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    console.log(`Fetching top traders for token ${address} on chain ${chain}`);

    const response = await getTopTradersByToken({
      address,
      offset: 0,
      limit: 10,
      chain: chain as ChainType,
    });

    console.log(`Successfully fetched top traders for ${address} on ${chain}:`, response);

    if (!response.items || response.items.length === 0) {
      console.log(`No top traders found for token ${address} on ${chain}`);
      return NextResponse.json([], { status: 404 });
    }

    return NextResponse.json(response.items);
  },
);
