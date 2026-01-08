export const WITHDRAW_PROMPT = `Execute a withdrawal transaction to withdraw stablecoins from a Solana lending protocol.

This action handles the withdrawal of supported stablecoins from supported lending protocols (e.g., Kamino, Jupiter Lend).

Important:
- Withdrawals come from your lending position (not your wallet token balance). Do not tell the user they "need USDC/USDT/etc in their wallet" to withdraw.

Parameters:
- amount: The amount of tokens to withdraw (in token units, not wei)
- tokenAddress: The contract address of the stablecoin being withdrawn (e.g., USDC, USDT, EURC)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

The action will:
1. Show a withdrawal interface so the user can review details and enter an amount
2. Build a withdraw transaction server-side (protocol SDK / API)
3. Ask the user to confirm the transaction in their wallet
4. Return the final on-chain signature when confirmed`;
