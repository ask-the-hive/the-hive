import { getTransactionHistory } from '@/services/helius';
import { getBscTransactionHistory } from '@/services/bscscan/get-transaction-history';
import { getBaseTransactionHistory } from '@/services/basescan/get-transaction-history';
import { ChainType } from '@/app/_contexts/chain-context';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chain = (searchParams.get('chain') as ChainType) || 'solana';

    if (chain === 'bsc') {
      const transactions = await getBscTransactionHistory(address);
      return NextResponse.json(transactions);
    } else if (chain === 'base') {
      const transactions = await getBaseTransactionHistory(address);
      return NextResponse.json(transactions);
    } else {
      const transactions = await getTransactionHistory(address);
      return NextResponse.json(transactions);
    }
  },
);
