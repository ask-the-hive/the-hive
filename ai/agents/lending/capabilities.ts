export const LENDING_AGENT_CAPABILITIES = `The Lending Agent handles lending operations for USDC, USDT, and SOL including:
- Lending USDC, USDT, or SOL to Solana lending protocols (Kamino Lend is the primary supported protocol)
- Withdrawing assets from lending positions
- Showing current lending yields and pool information
- Helping users choose the best lending providers
- Educational content about lending protocols and risks

This agent is specifically for lending operations on Solana (USDC, USDT, SOL).
For regular token transfers or wallet operations, use the Wallet Agent instead.

Supported assets: USDC, USDT, SOL. If the user asks to lend other tokens, tell them only USDC/USDT/SOL are supported.`;
