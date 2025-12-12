export const SOLANA_ALL_BALANCES_PROMPT = `Get all token balances (including SOL and SPL tokens) for a given Solana wallet address.

This tool returns structured balance data that is rendered as wallet balance cards in the UI. The UI is responsible for showing the individual tokens and amounts.

When you decide to call this tool:
- Do it only when the user explicitly asks to see their Solana wallet balances or token holdings.
- After the tool returns successfully with a non-empty list of balances, the **only** natural-language message you should send for that turn is:
  "Balances shown above. Pick a token to swap, lend, stake, or explore next."
- Do **not** enumerate or describe the balances in text, and do not add extra sentences or bullet lists.`;
