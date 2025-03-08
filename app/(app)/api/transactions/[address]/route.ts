import { getTransactionHistory } from "@/services/helius";
import { getBscTransactionHistory } from "@/services/bscscan/get-transaction-history";
import { ChainType } from "@/app/_contexts/chain-context";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    try {
        const { address } = await params;
        const searchParams = req.nextUrl.searchParams;
        const chain = searchParams.get('chain') as ChainType || 'solana';
        
        console.log(`Fetching transactions for ${address} on ${chain}`);
        
        if (chain === 'bsc') {
            try {
                const transactions = await getBscTransactionHistory(address);
                console.log(`Found ${transactions.length} BSC transactions`);
                return NextResponse.json(transactions);
            } catch (error) {
                console.error('Error fetching BSC transactions:', error);
                return NextResponse.json({ error: 'Failed to fetch BSC transactions' }, { status: 500 });
            }
        } else {
            try {
                const transactions = await getTransactionHistory(address);
                console.log(`Found ${transactions.length} Solana transactions`);
                return NextResponse.json(transactions);
            } catch (error) {
                console.error('Error fetching Solana transactions:', error);
                return NextResponse.json({ error: 'Failed to fetch Solana transactions' }, { status: 500 });
            }
        }
    } catch (error) {
        console.error('Error in transactions API route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}