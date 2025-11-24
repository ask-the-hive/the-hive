export const getQuote = async (inputMint: string, outputMint: string, amount: string | number) => {
  try {
    // Use Jupiter lite API for quotes
    const response = await fetch(
      `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&restrictIntermediateTokens=true`,
    );

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    const quote = await response.json();

    return quote;
  } catch (error) {
    console.error('Error getting Jupiter quote:', error);
    throw error;
  }
};
