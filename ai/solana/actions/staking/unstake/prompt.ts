export const SOLANA_UNSTAKE_PROMPT =
`Unstake (or guide unstake) from a liquid staking pool.

Parameters:
1. amount (optional) - leave empty if not provided.
2. contractAddress (optional) - if missing, still call this action to return the unstake guidance card.

If the user provides a symbol, you may resolve it to a contract address; otherwise, call this action with an empty contractAddress to render the Portfolio guidance. Do NOT ask the user for symbols or contract addresses—proceed with the action so the UI card can guide them.`;
