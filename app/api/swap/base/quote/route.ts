import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

const ZEROX_API_URL = 'https://api.0x.org';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Base WETH

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  let sellToken = searchParams.get('sellToken');
  let buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const taker = searchParams.get('taker');

  if (!sellToken || !buyToken || !sellAmount || !taker) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
  }

  // Check if API key is available
  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  // Convert ETH to WETH address for the API
  if (sellToken === 'ETH') {
    sellToken = WETH_ADDRESS;
  }
  if (buyToken === 'ETH') {
    buyToken = WETH_ADDRESS;
  }

  // Validate token addresses
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(sellToken) || !addressRegex.test(buyToken)) {
    return new Response(JSON.stringify({ error: 'Invalid token address format' }), { status: 400 });
  }

  // Log the request parameters
  const requestUrl =
    `${ZEROX_API_URL}/swap/permit2/quote?` +
    new URLSearchParams({
      chainId: '8453', // Base chain ID
      sellToken,
      buyToken,
      sellAmount,
      taker,
    }).toString();
  console.log('0x API Request:', {
    url: requestUrl,
    sellToken,
    buyToken,
    sellAmount,
    taker,
  });

  // Forward the request to 0x API quote endpoint
  const response = await fetch(requestUrl, {
    headers: {
      '0x-api-key': apiKey,
      Accept: 'application/json',
      '0x-version': 'v2',
    },
  });

  const data = await response.json();
  console.log('0x API Response:', {
    status: response.status,
    data,
  });

  if (!response.ok) {
    console.error('0x API error:', data);
    return new Response(
      JSON.stringify({
        error: 'Failed to get quote',
        reason: data.reason || data.message,
        details: data,
      }),
      { status: response.status },
    );
  }

  // Validate the response has the required transaction data
  if (!data.transaction || !data.transaction.to || !data.transaction.data) {
    console.error('Invalid quote response:', data);
    return new Response(
      JSON.stringify({
        error: 'Invalid quote response',
        reason: 'Missing transaction data',
        details: data,
      }),
      { status: 400 },
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
