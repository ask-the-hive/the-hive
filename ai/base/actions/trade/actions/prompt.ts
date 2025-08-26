export const BASE_TRADE_PROMPT = `Perform a token swap on the Base Chain.
You can swap ETH for tokens or token-to-token.

Example inputs:
- Swap 0.1 ETH for USDC
- Trade 10 USDC for ETH
- Exchange 50 USDC for BRETT
- Purchase BRETT (just the symbol) → outputTokenAddress = "BRETT"
- Buy BRETT (just the symbol) → outputTokenAddress = "BRETT"
- Buy 0x532f27101965dd16442E59d40670FaF5eBB142E4 (contract address) → outputTokenAddress = "0x532f27101965dd16442E59d40670FaF5eBB142E4"
- Let's trade some tokens (generic request with no specific tokens)

Parameters:
- inputAmount: (Optional) The amount of the input token to swap
- inputTokenAddress: (Optional) The address or symbol of the input token (use 'ETH' for native token)
- outputTokenAddress: (Optional) The address or symbol of the output token
- walletAddress: The user's wallet address to perform the swap

Token Input Guidelines:
- For symbols: Pass the token symbol directly (e.g., "BRETT", "USDC", "DAI")
- For addresses: Pass the full contract address (e.g., "0x532f27101965dd16442E59d40670FaF5eBB142E4")
- The trade component will automatically handle both symbol lookup and address validation

IMPORTANT - Understanding user intent:
- "purchase [TOKEN]" or "buy [TOKEN]" → Set outputTokenAddress = [TOKEN] (user wants to BUY the token)
- "sell [TOKEN]" → Set inputTokenAddress = [TOKEN] (user wants to SELL the token)
- "swap [INPUT] for [OUTPUT]" → Set inputTokenAddress = [INPUT], outputTokenAddress = [OUTPUT]

Note: For generic trade requests like "Let's trade some tokens", you can omit inputAmount, inputTokenAddress, and outputTokenAddress. The trade interface will allow users to select tokens directly.`; 