import { NextRequest, NextResponse } from 'next/server';

import { deleteLiquidStakingPosition } from '@/db/services/liquid-staking-positions';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const walletAddress = searchParams.get('walletAddress');

    if (!id || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and walletAddress' },
        { status: 400 },
      );
    }

    await deleteLiquidStakingPosition(id, walletAddress);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DeleteLiquidStakingPositionAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete liquid staking position' },
      { status: 500 },
    );
  }
}
