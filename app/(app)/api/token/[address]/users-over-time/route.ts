import { NextRequest, NextResponse } from "next/server";
import { getTokenUsersOverTime } from "@/services/hellomoon";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'solana';

    if (chain === 'bsc') {
        return NextResponse.json([]);
    }

    try {
        const usersOverTime = (await getTokenUsersOverTime(address)).reverse();
        return NextResponse.json(usersOverTime);
    } catch (error) {
        console.error('Error fetching users over time:', error);
        return NextResponse.json([], { status: 500 });
    }
}