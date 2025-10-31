export const LEND_PROMPT = `Show the lending interface for depositing stablecoins into a Solana lending protocol.

This action displays a UI where users can lend USDC or USDT tokens to lending protocols like Kamino, Jupiter Lend, Marginfi, Maple Finance, or Francium.

Parameters:
- amount: The amount of tokens to lend (optional - user can input in the UI)
- tokenAddress: The contract address of the token being lent (USDC or USDT)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

CRITICAL - You MUST provide a text response IN THE SAME MESSAGE as calling this tool:

1. **What they're lending**: Specify the token and protocol (e.g., "You're lending USDT to Francium")

2. **Expected returns**: Mention the APY they'll earn if you know it from lending-yields data (e.g., "currently offering 16.49% APY")

3. **How lending works**: Explain the mechanics:
   - "When you lend stablecoins, your tokens are deposited into a lending pool"
   - "The protocol lends these funds to borrowers and shares the interest with you"
   - "Your interest compounds automatically, increasing your balance over time"
   - "You maintain full ownership and can withdraw your funds anytime"

4. **Transaction details**: Explain what will happen when they confirm:
   - "When you click 'Lend', your wallet will prompt you to approve the transaction"
   - "The transaction will transfer your [TOKEN] to [PROTOCOL]'s lending pool"
   - "You'll start earning interest immediately after the transaction confirms"
   - "Your position will be visible in your portfolio"

5. **Next steps**: Encourage them to review the details and confirm when ready

IMPORTANT: Provide this text response IN THE SAME MESSAGE TURN as the tool invocation. Do not wait for the tool to complete - the text and tool call happen together.

Example - what you should do:
User: "I want to lend USDT to Francium"
You: [Call this lend tool] AND provide text in same message: "Great! I'm showing you the lending interface below.

**What you're doing:** You're lending USDT to Francium, which is currently offering 16.49% APY.

**How it works:** When you lend stablecoins, your tokens are deposited into Francium's lending pool. The protocol lends these funds to borrowers and shares the interest with you. Your interest compounds automatically, increasing your balance over time.

**Transaction details:** When you click 'Lend', your wallet will prompt you to approve the transaction. This will transfer your USDT to Francium's lending pool. You'll start earning 16.49% APY immediately after the transaction confirms, and you can withdraw your funds anytime.

Review the details in the interface below and confirm when you're ready!"

The UI will handle the actual transaction signing and execution.`;
