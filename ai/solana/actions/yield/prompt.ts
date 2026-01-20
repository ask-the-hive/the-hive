export const GLOBAL_YIELDS_PROMPT = `Fetch the best yields across ALL strategies (lending and staking) on Solana, sorted by APY.

This action retrieves and combines yields from:
- Lending protocols (Kamino Finance, Jupiter Lend) for stablecoins (USDC, USDT, etc.)
- Liquid staking protocols (Marinade, Jito, BlazeStake, etc.) for SOL

The action:
- Fetches yields from both lending and staking sources
- Combines them into a unified list
- Sorts by APY (highest first)
- Returns the top opportunities regardless of strategy type

This provides users with a comprehensive view of all yield opportunities on Solana, allowing them to choose the best option based on current market rates.

No parameters required - automatically fetches current market data from multiple sources.`;
