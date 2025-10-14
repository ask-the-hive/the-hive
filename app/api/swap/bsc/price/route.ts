import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

const ZEROX_API_URL = 'https://bsc.api.0x.org';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');

  if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const queryParams = new URLSearchParams({
    chainId: '56', // BSC chain ID
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
  });

  console.log(
    'Forwarding request to 0x API:',
    `${ZEROX_API_URL}/swap/permit2/price?${queryParams.toString()}`,
  );

  const response = await fetch(`${ZEROX_API_URL}/swap/permit2/price?${queryParams}`, {
    headers: {
      '0x-api-key': process.env.ZEROX_API_KEY || '',
      '0x-version': 'v2',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('0x API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorData,
    });
    return NextResponse.json(
      { error: errorData.reason || 'Failed to get price quote' },
      { status: response.status },
    );
  }

  const price = await response.json();
  return NextResponse.json(price);
});
