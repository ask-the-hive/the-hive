export const BASE_TRANSFER_PROMPT = `Transfer ETH or BASE tokens to another address.

Required parameters:
- to: The recipient's wallet address (e.g., "0x1234...")
- amount: The amount to transfer (e.g., 1 or 0.01)

Optional parameters:
- tokenAddress: The token's contract address. If not provided, transfers ETH
- tokenSymbol: The token's symbol (e.g., "USDC"). Will be used to look up the token address if tokenAddress is not provided

Note: Either tokenAddress or tokenSymbol can be provided to transfer tokens. If neither is provided, ETH will be transferred.`; 