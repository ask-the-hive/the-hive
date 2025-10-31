export const LEND_PROMPT = `Show the lending interface for depositing stablecoins into a Solana lending protocol.

This action displays a UI where users can lend USDC or USDT tokens to lending protocols like Kamino, Jupiter Lend, Marginfi, Maple Finance, or Francium.

Parameters:
- amount: The amount of tokens to lend (optional - user can input in the UI)
- tokenAddress: The contract address of the token being lent (USDC or USDT)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

IMPORTANT - When calling this action:
1. Provide context about what the user is lending (e.g., "You're lending USDT to Francium")
2. Mention the APY they'll earn (if you know it from the lending-yields data)
3. Explain briefly what will happen (e.g., "You'll earn interest automatically and can withdraw anytime")
4. Encourage them to review the details in the interface before confirming

Example response when showing the interface:
"Great! Let me show you the lending interface. You'll be lending USDT to Francium, which is currently offering 16.49% APY. Your stablecoins will earn interest automatically, and you can withdraw anytime. Please review the details below and confirm when ready."

The UI will handle the actual transaction signing and execution.`;
