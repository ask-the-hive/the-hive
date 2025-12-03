export const WITHDRAW_PROMPT = `Execute a withdrawal transaction to withdraw stablecoins from a Solana lending protocol.

This action handles the withdrawal of USDC or USDT tokens from lending protocols like Kamino, Jupiter Lend, Marginfi, Maple Finance, or Save Finance.

Parameters:
- amount: The amount of tokens to withdraw (in token units, not wei)
- tokenAddress: The contract address of the token being withdrawn (USDC or USDT)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

The action will:
1. Construct the withdrawal transaction using the protocol's smart contract
2. Sign and send the transaction using the user's wallet
3. Return the transaction hash, success status, and any yield earned
4. Calculate the total yield earned during the lending period

Note: This is currently stubbed and will be implemented with direct smart contract interactions in the next phase.`;
