import { NextRequest } from 'next/server';

const ZEROX_API_URL = 'https://api.0x.org';
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let sellToken = searchParams.get('sellToken');
        let buyToken = searchParams.get('buyToken');
        const sellAmount = searchParams.get('sellAmount');
        const taker = searchParams.get('taker');

        if (!sellToken || !buyToken || !sellAmount || !taker) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400 }
            );
        }

        // Check if API key is available
        const apiKey = process.env.ZEROX_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'API key not configured' }),
                { status: 500 }
            );
        }

        // Convert BNB to WBNB address for the API
        if (sellToken === 'BNB') {
            sellToken = WBNB_ADDRESS;
        }
        if (buyToken === 'BNB') {
            buyToken = WBNB_ADDRESS;
        }

        // Validate token addresses
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(sellToken) || !addressRegex.test(buyToken)) {
            return new Response(
                JSON.stringify({ error: 'Invalid token address format' }),
                { status: 400 }
            );
        }

        // Forward the request to 0x API quote endpoint
        const response = await fetch(
            `${ZEROX_API_URL}/swap/permit2/quote?` + new URLSearchParams({
                chainId: '56',
                sellToken,
                buyToken,
                sellAmount,
                taker
            }).toString(),
            {
                headers: {
                    '0x-api-key': apiKey,
                    '0x-version': 'v2'
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('0x API error:', data);
            return new Response(
                JSON.stringify({ error: 'Failed to get quote', reason: data.reason }),
                { status: response.status }
            );
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in BSC swap quote:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
} 