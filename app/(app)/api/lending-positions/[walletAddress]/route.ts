import { NextResponse } from 'next/server';
import { getAllLendingPositionsServer } from '@/services/lending/get-all-positions';

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ walletAddress: string }> },
) => {
  try {
    const { walletAddress } = await params;
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const positions = await getAllLendingPositionsServer(walletAddress, 'solana');

    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error('Error fetching lending positions:', error);
    return NextResponse.json({ error: 'Failed to fetch lending positions' }, { status: 500 });
  }
};
