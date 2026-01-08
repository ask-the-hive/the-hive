export const LENDING_AGENT_CAPABILITIES = `The Lending Agent handles stablecoin lending on Solana including:
- Lending supported stablecoins (e.g., USDC, USDT, EURC, USDG, USDS) to supported Solana lending protocols (Kamino Lend, Jupiter Lend)
- Withdrawing assets from lending positions
- Showing current lending yields and pool information
- Helping users choose the best lending providers
- Educational content about lending protocols and risks

This agent is specifically for lending operations on Solana.
For regular token transfers or wallet operations, use the Wallet Agent instead.

Supported assets: stablecoins surfaced by the lending yields tool. If the user asks to lend other tokens for yield (e.g., memecoins), tell them it isn't supported.`;
