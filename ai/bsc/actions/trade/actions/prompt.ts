export const BSC_TRADE_PROMPT = 
`Swap tokens using 0x Exchange on BSC.

Required parameters:
- walletAddress: The wallet address to trade from

Optional parameters:
- inputTokenAddress: The token address to swap
- outputTokenAddress: The token address to receive
- inputAmount: The amount of input token to swap
- slippageBps: The slippage tolerance in basis points (e.g., 100 for 1%)

The user will be shown a swapping UI where they can edit the parameters and swap tokens.

If the user does not provide some or any of the optional parameters, leave them undefined.`; 