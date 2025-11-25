import { getAddressIntelligence } from '@/services/arkham';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;

    const addressIntelligence = await getAddressIntelligence(address, 'solana');

    return NextResponse.json(addressIntelligence);
  },
);
