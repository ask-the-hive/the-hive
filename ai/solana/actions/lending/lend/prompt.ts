export const LEND_PROMPT = `Execute a lending transaction to deposit stablecoins into a Solana lending protocol.

This action handles the actual lending of USDC or USDT tokens to lending protocols like Kamino, Jupiter Lend, Marginfi, Maple Finance, or Save Finance.

Parameters:
- amount: The amount of tokens to lend (in token units, not wei)
- tokenAddress: The contract address of the token being lent (USDC or USDT)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

The action will:
1. Construct the lending transaction using the protocol's smart contract
2. Sign and send the transaction using the user's wallet
3. Return the transaction hash and success status

Note: This is currently stubbed and will be implemented with direct smart contract interactions in the next phase.`;
