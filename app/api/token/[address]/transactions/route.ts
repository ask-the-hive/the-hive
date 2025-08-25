import { NextRequest, NextResponse } from 'next/server';
import { getTokenTransactions } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') as ChainType || 'solana';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await getTokenTransactions(
      address,
      chain,
      limit,
      offset
    );

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token transactions' },
      { status: 500 }
    );
  }
}
