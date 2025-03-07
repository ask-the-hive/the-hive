import { NextRequest, NextResponse } from "next/server";

import { getPortfolio } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
  const { address } = await params;
  const searchParams = request.nextUrl.searchParams;
  const chain = searchParams.get('chain') || 'solana';

  const portfolio = await getPortfolio(address, chain as ChainType);

  return NextResponse.json(portfolio);
}