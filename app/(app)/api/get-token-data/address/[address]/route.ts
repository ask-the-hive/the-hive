import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';
import { getToken } from '@/db/services';
import { withErrorHandling } from '@/lib/api-error-handler';

interface Params {
  address: string;
}

export const GET = withErrorHandling(
  async (_request: NextRequest, { params }: { params: Promise<Params> }) => {
    const { address } = await params;
    const tokenData = await getToken(address);
    return NextResponse.json(tokenData);
  },
);
