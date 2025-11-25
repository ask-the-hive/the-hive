import { NextRequest, NextResponse } from 'next/server';

import { upsertLiquidStakingPosition } from '@/db/services/liquid-staking-positions';
import type { CreateLiquidStakingPositionInput } from '@/db/types';
import { withErrorHandling } from '@/lib/api-error-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = (await req.json()) as Partial<CreateLiquidStakingPositionInput>;

  if (
    !body ||
    !body.walletAddress ||
    !body.chainId ||
    typeof body.amount !== 'number' ||
    !body.lstToken ||
    !body.poolData
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await upsertLiquidStakingPosition(body as CreateLiquidStakingPositionInput);
  return NextResponse.json(result, { status: 200 });
});
