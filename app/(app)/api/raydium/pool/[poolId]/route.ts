import { NextResponse, NextRequest } from 'next/server';

import { getRaydiumPoolById } from '@/services/raydium';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ poolId: string }> }) => {
    const { poolId } = await params;

    const poolInfo = await getRaydiumPoolById(poolId);

    return NextResponse.json(poolInfo);
  },
);
