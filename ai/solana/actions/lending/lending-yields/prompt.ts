export const LENDING_YIELDS_PROMPT = `Fetch the best lending pools for stablecoins (USDC/USDT) on Solana.

This action retrieves the top performing lending pools from major Solana lending protocols including:
- Kamino Finance
- Jupiter Lend
- Marginfi
- Maple Finance
- Save Finance

The action filters for:
- Solana chain only
- Stablecoin tokens (USDC, USDT)
- Lending protocols (not LP pairs)
- Pools with positive APY

Returns the top 3 pools sorted by APY, with the highest yielding pool in the center position for optimal UI display.

No parameters required - automatically fetches current market data from DeFiLlama.`;
