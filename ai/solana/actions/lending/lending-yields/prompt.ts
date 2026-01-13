export const LENDING_YIELDS_PROMPT = `Fetch the best lending pools for supported stablecoins on Solana.

This action retrieves the top performing lending pools from supported Solana lending protocols including:
- Kamino Finance
- Jupiter Lend

The action filters for:
- Solana chain only
- Allow-listed stablecoin tokens (e.g., USDC, USDT, USDG, USDS, USDY, EURC, FDUSD, PYUSD)
- Lending protocols (not LP pairs)
- Pools with positive APY

Returns the top 3 pools sorted by APY, with the highest yielding pool in the center position for optimal UI display.

No parameters required - automatically fetches current market data from DeFiLlama.`;
