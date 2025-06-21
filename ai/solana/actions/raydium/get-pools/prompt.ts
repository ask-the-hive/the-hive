export const SOLANA_GET_POOLS_PROMPT = 
`This function gets all of the liquidity pools for a token.
The function requires a symbol, or a mint address.

If the user explicitly asks for "the native token of the hive", use the BUZZ nativetoken address (9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump).

If the user asks about liquidity pools without specifying a token, ask them which token they want to find pools for.`; 