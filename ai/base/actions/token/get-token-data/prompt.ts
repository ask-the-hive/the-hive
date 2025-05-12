export const BASE_GET_TOKEN_DATA_PROMPT = 
`Use this function to get the token data for a given token on Base Chain.
The token data function requires an address, ticker, or name of the token.
If a user asks for the native token of Base, call this function with ETH as the search term.

Common scenarios where data might be limited or unavailable:
1. New tokens (< 24 hours old) - Limited data due to indexing delay
2. Inactive tokens - Minimal trading history or liquidity

If data is unavailable, the function will explain why and suggest next steps.`; 