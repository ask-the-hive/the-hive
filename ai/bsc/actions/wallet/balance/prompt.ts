export const BSC_BALANCE_PROMPT = `Get the balance of a BSC wallet for a given token.

If no token is specified, the balance will be in BNB (the native token).

If a token symbol is provided, the function will first get the token's address using the get-token-address action, and then get the balance for that token.

You can specify a token either by:
1. Using tokenSymbol - the symbol or name of the token (e.g. "CAKE" for PancakeSwap)
2. Using tokenAddress - the contract address of the token

If both are provided, the function will still try to resolve the tokenSymbol first.`; 