import { NextRequest, NextResponse } from 'next/server';
import { getTokenTransactions } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const chain = (searchParams.get('chain') as ChainType) || 'solana';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await getTokenTransactions(address, chain, limit, offset);

    return NextResponse.json(transactions);
  },
);
