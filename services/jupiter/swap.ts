export const getSwapObj = async (userPublicKey: string, quoteResponse: any) => {
  try {
    const response = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: 'veryHigh',
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Jupiter swap:', error);
    throw error;
  }
};
