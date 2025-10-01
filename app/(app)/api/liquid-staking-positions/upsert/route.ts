import { NextRequest, NextResponse } from 'next/server';

import { upsertLiquidStakingPosition } from '@/db/services/liquid-staking-positions';
import type { CreateLiquidStakingPositionInput } from '@/db/types';

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error('[UpsertLiquidStakingPositionAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upsert liquid staking position' },
      { status: 500 },
    );
  }
}
