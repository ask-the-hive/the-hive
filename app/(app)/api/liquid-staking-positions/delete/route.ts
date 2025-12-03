import { NextRequest, NextResponse } from 'next/server';

import { deleteLiquidStakingPosition } from '@/db/services/liquid-staking-positions';
import { withErrorHandling } from '@/lib/api-error-handler';

export const DELETE = withErrorHandling(async (req: NextRequest) => {
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
});
