export const SOLANA_BALANCE_PROMPT = `Get the balance of a Solana wallet for a given token.

If no tokenAddress is provided, the balance will be in SOL.

If the user provides a symbol, first use the tokenData tool to get the tokenAddress.

IMPORTANT BEHAVIOR IN LENDING/STAKING FLOWS:
When this tool is called by the Lending Agent or Staking Agent and the balance is 0, the UI will automatically display funding options (onramp/swap) for the user to acquire the token.

**DO NOT** provide any additional text response after calling this tool when balance is 0 in a lending/staking flow. The UI handles showing the funding options automatically. Just call the tool and let the UI take over.

Example of CORRECT behavior:
- User: "I want to lend USDC to Francium"
- Agent: [Calls balance tool for USDC]
- Balance returns: 0 USDC
- Agent: [STOPS here - no additional text]
- UI: [Automatically shows funding options]

Example of INCORRECT behavior:
- User: "I want to lend USDC to Francium"
- Agent: [Calls balance tool for USDC]
- Balance returns: 0 USDC
- Agent: "Would you like assistance with how to obtain USDC?" ❌ WRONG - Don't do this
- UI: [Would show funding options but agent text covers it]`;
