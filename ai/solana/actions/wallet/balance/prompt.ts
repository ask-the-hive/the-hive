export const SOLANA_BALANCE_PROMPT = `Get the balance of a Solana wallet for a given token.

- If no tokenAddress is provided, return the SOL balance.
- If the user provides a symbol, first resolve it to a tokenAddress using the tokenData tool.

CRITICAL UX RULE (0 balance in lending/staking execution):
When balance = 0 and the UI is showing funding options, explain the next steps using this exact template (replace [TOKEN SYMBOL]):

"You don't have any [TOKEN SYMBOL] in your wallet yet. I'm showing you funding options:

- **Swap for [TOKEN SYMBOL]**: If you have other tokens in your wallet, you can swap them for [TOKEN SYMBOL]
- **Buy or Receive SOL**: Purchase SOL with fiat currency, then swap it for [TOKEN SYMBOL]

Choose the option that works best for you, and once you have [TOKEN SYMBOL], we can continue with lending!"`;
