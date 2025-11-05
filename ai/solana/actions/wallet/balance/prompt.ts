export const SOLANA_BALANCE_PROMPT = `Get the balance of a Solana wallet for a given token.

If no tokenAddress is provided, the balance will be in SOL.

If the user provides a symbol, first use the tokenData tool to get the tokenAddress.

🚨🚨🚨 CRITICAL INSTRUCTION - READ THIS FIRST 🚨🚨🚨

WHEN BALANCE = 0 IN LENDING/STAKING FLOW, YOU **MUST** USE THIS EXACT RESPONSE:

"You don't have any [TOKEN SYMBOL] in your wallet yet. I'm showing you funding options:

- **Swap for [TOKEN SYMBOL]**: If you have other tokens in your wallet, you can swap them for [TOKEN SYMBOL]
- **Buy or Receive SOL**: Purchase SOL with fiat currency, then swap it for [TOKEN SYMBOL]

Choose the option that works best for you, and once you have [TOKEN SYMBOL], we can continue with lending!"

❌ **NEVER EVER SAY THIS:**
- "Would you like assistance with how to obtain [TOKEN]?"
- "Is there something else you'd like to explore?"
- "Let me know if you need help"
- "Would you like guidance on how to acquire [TOKEN]?"

✅ **ALWAYS USE THE EXACT TEMPLATE ABOVE - NO EXCEPTIONS**

WHY: The UI automatically shows funding options when balance = 0. Your job is to EXPLAIN those options, NOT ask if they want help.

Example of CORRECT behavior:
User: "I want to lend USDC to Francium"
Agent: [Calls this balance tool for USDC]
Balance returns: 0 USDC
UI: [Automatically shows funding options interface]
Agent: "You don't have any USDC in your wallet yet. I'm showing you funding options:

- **Swap for USDC**: If you have other tokens in your wallet, you can swap them for USDC
- **Buy or Receive SOL**: Purchase SOL with fiat currency, then swap it for USDC

Choose the option that works best for you, and once you have USDC, we can continue with lending!"

Example of INCORRECT behavior (DO NOT DO THIS):
Agent: "Would you like assistance with how to obtain USDC?" ❌ WRONG
Agent: "You need to buy USDC first" ❌ WRONG
Agent: "It looks like you currently have 0 USDC... Would you like assistance?" ❌ WRONG`;
