import { NextRequest, NextResponse } from 'next/server';
import { getTokenUsersOverTime } from '@/services/hellomoon';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    if (chain === 'bsc') {
      return NextResponse.json([]);
    }

    const usersOverTime = (await getTokenUsersOverTime(address)).reverse();
    return NextResponse.json(usersOverTime);
  },
);
