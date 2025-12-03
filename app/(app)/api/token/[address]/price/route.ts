import { NextRequest, NextResponse } from 'next/server';

import { getPrice } from '@/services/birdeye';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;

    const price = await getPrice(address);

    return NextResponse.json(price);
  },
);
