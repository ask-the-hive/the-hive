import { getTransactionHistory } from "@/services/helius";
import { getBscTransactionHistory } from "@/services/bscscan";
import { ChainType } from "@/app/_contexts/chain-context";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') as ChainType || 'solana';
    
    if (chain === 'bsc') {
        const transactions = await getBscTransactionHistory(address);
        return NextResponse.json(transactions);
    } else {
        const transactions = await getTransactionHistory(address);
        return NextResponse.json(transactions);
    }
}