import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pairAddress = searchParams.get('pairAddress');
        const chain = searchParams.get('chain');

        if (!pairAddress || !chain) {
            return NextResponse.json(
                { error: 'Missing pairAddress or chain parameter' },
                { status: 400 }
            );
        }

        const apiKey = process.env.MORALIS_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Moralis API key not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://deep-index.moralis.io/api/v2.2/${pairAddress}/reserves?chain=${chain}`,
            {
                headers: {
                    'X-API-Key': apiKey
                }
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Moralis API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching reserves:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
