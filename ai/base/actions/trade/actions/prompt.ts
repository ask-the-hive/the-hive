export const BASE_TRADE_PROMPT = `Perform a token swap on Base.

Parameters:
- walletAddress: user wallet address (required)
- inputAmount: amount to swap (optional; user can edit in UI)
- inputTokenAddress: token symbol or 0x address (optional; use "ETH" for native)
- outputTokenAddress: token symbol or 0x address (optional)

Intent mapping:
- "buy X" / "purchase X" => X is outputTokenAddress
- "sell X" => X is inputTokenAddress
- "swap A for B" => A is inputTokenAddress, B is outputTokenAddress

If the user is generic ("trade", "swap") you can omit token fields and open the UI for selection.`;
