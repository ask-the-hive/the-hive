import { NextRequest, NextResponse } from 'next/server';

const ZEROX_API_URL = 'https://bsc.api.0x.org';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sellToken = searchParams.get('sellToken');
        const buyToken = searchParams.get('buyToken');
        const sellAmount = searchParams.get('sellAmount');
        const buyAmount = searchParams.get('buyAmount');

        if (!sellToken || !buyToken) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const queryParams = new URLSearchParams({
            sellToken,
            buyToken,
            ...(sellAmount ? { sellAmount } : {}),
            ...(buyAmount ? { buyAmount } : {})
        });

        const response = await fetch(`${ZEROX_API_URL}/swap/v1/quote?${queryParams}`, {
            headers: {
                '0x-api-key': process.env.ZEROX_API_KEY || ''
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.reason || 'Failed to get swap quote' },
                { status: response.status }
            );
        }

        const quote = await response.json();
        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error in BSC swap quote:', error);
        return NextResponse.json(
            { error: 'Failed to get swap quote' },
            { status: 500 }
        );
    }
} 