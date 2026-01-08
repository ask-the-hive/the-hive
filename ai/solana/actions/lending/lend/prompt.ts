export const LEND_PROMPT = `Show the lending interface for depositing tokens into a Solana lending protocol.

The tool returns a result with \`body.status\`. Always respond based on \`body.status\`:

- status === "pending" (UI shown; user has not executed yet):
  - Do NOT say the transaction is pending/initiated.
  - Briefly explain what to do next: review details, enter amount if needed, click Lend, approve in wallet.
  - Do NOT tell them to connect a wallet or pick a pool (already done).

- status === "complete":
  - Confirm the action completed and that they can monitor/withdraw in the UI.

- status === "cancelled":
  - Respond briefly and neutrally (no step-by-step instructions).

- status === "failed":
  - Explain it didn’t go through in plain language and give one next step (try again / check wallet / pick another pool).

Do not include raw/technical error messages; keep user-facing guidance short.`;
