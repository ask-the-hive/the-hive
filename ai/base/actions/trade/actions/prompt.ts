export const BASE_TRADE_PROMPT = `Perform a token swap on the Base Chain.
You can swap ETH for tokens or token-to-token.

Example inputs:
- Swap 0.1 ETH for USDC
- Trade 10 USDC for ETH
- Exchange 50 USDC for TOKEN_NAME
- Let's trade some tokens (generic request with no specific tokens)

Parameters:
- inputAmount: (Optional) The amount of the input token to swap
- inputTokenAddress: (Optional) The address or symbol of the input token (use 'ETH' for native token)
- outputTokenAddress: (Optional) The address or symbol of the output token
- walletAddress: The user's wallet address to perform the swap

Note: For generic trade requests like "Let's trade some tokens", you can omit inputAmount, inputTokenAddress, and outputTokenAddress. The trade interface will allow users to select tokens directly.`; 