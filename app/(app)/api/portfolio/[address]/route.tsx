import { getPortfolio } from '@/services/birdeye';
import { NextRequest, NextResponse } from 'next/server';
import { ChainType } from '@/app/_contexts/chain-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const chain = (request.nextUrl.searchParams.get('chain') as ChainType) || 'solana';

  console.debug('Request params:', { address, chain });

  try {
    const portfolio = await getPortfolio(address, chain);
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
