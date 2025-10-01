import { NextResponse } from 'next/server';

import { getAllLiquidStakingPositions } from '@/db/services/liquid-staking-positions';

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ walletAddress: string }> },
) => {
  try {
    const { walletAddress } = await params;
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const positions = await getAllLiquidStakingPositions(walletAddress);
    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error('[GetAllLiquidStakingPositionsAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liquid staking positions' },
      { status: 500 },
    );
  }
};
