export const SOLANA_STAKE_PROMPT = `Show the staking interface for staking SOL into a liquid staking protocol (SOL -> LST).

The tool returns a result with \`body.status\`. Always respond based on \`body.status\`:

- status === "pending" (UI shown; user has not executed yet):
  - Do NOT say the transaction is pending/initiated.
  - Briefly explain what to do next: review details, enter amount if needed, click Stake, approve in wallet.
  - Do NOT quote numeric APYs in free text; the UI shows live rates.

- status === "complete":
  - Confirm staking completed and that they now hold an LST; mention they can swap/unstake back in the UI.

- status === "cancelled":
  - Respond briefly and neutrally (no step-by-step instructions).

- status === "failed":
  - Explain it didn’t go through in plain language and give one next step (try again / check wallet / pick another pool).

Do not include raw/technical error messages; keep user-facing guidance short.`;
