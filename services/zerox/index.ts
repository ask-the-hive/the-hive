import { createClientV2 } from '@0x/swap-ts-sdk';

const ZEROX_API_URL = 'https://base.api.0x.org';

export interface SwapQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount?: string;
    buyAmount?: string;
}

export const getSwapQuote = async (params: SwapQuoteParams) => {
    try {
        const queryParams = new URLSearchParams({
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            ...(params.sellAmount ? { sellAmount: params.sellAmount } : {}),
            ...(params.buyAmount ? { buyAmount: params.buyAmount } : {})
        });

        const response = await fetch(`${ZEROX_API_URL}/swap/v1/quote?${queryParams}`, {
            headers: {
                '0x-api-key': process.env.ZEROX_API_KEY || ''
            }
        });

        if (!response.ok) {
            throw new Error(`0x API error: ${response.statusText}`);
        }

        const quote = await response.json();
        return quote;
    } catch (error) {
        console.error('Error getting 0x swap quote:', error);
        throw error;
    }
}; 