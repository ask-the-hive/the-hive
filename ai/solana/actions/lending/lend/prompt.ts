export const LEND_PROMPT = `Show the lending interface for depositing stablecoins into a Solana lending protocol.

This action displays a UI where users can lend USDC or USDT tokens to lending protocols like Kamino, Jupiter Lend, Marginfi, Maple Finance, or Francium.

Parameters:
- amount: The amount of tokens to lend (optional - user can input in the UI)
- tokenAddress: The contract address of the token being lent (USDC or USDT)
- protocolAddress: The contract address of the lending protocol
- walletAddress: The user's wallet address

NOTE: The Lending Agent should check SOL balance using the balance tool BEFORE calling this action. Users need at least 0.0001 SOL to cover transaction fees. If they don't have enough SOL, direct them to add SOL to their wallet first.

CRITICAL - Check the result status and respond accordingly:

When this tool is called, it returns a result with a 'status' field. You MUST check this status and provide the appropriate response:

1. **If status is 'pending'**: The UI is awaiting user confirmation. Provide educational context:
   - **What they're lending**: Specify the token and protocol (e.g., "You're lending USDT to Francium")
   - **Expected returns**: Mention the APY from lending-yields data (e.g., "currently offering 16.49% APY")
   - **How lending works**: Explain that stablecoins are deposited into a lending pool, the protocol lends to borrowers, interest is shared and compounds automatically, and they maintain full ownership
   - **Transaction details**: Explain that clicking 'Lend' will prompt their wallet for approval, the transaction will transfer tokens to the lending pool, they'll start earning immediately, and can withdraw anytime
   - **Next steps**: Encourage them to review the details in the interface before confirming

2. **If status is 'complete'**: The transaction succeeded. Show success message:
   - Confirm the lending is complete with the amount and token
   - Explain that they're earning APY automatically and can withdraw anytime
   - Encourage them to ask if they have questions

3. **If status is 'cancelled'**: User cancelled the transaction. Acknowledge neutrally:
   - "No problem! Let me know if you'd like to try again or if you have any questions."
   - Keep it brief and friendly

4. **If status is 'failed'**: The transaction failed. Acknowledge the failure and offer help.

IMPORTANT: Always check the status field in the result to determine which response to provide.

Example - what you should do:

**When status equals 'pending' (UI shown, awaiting confirmation):**
User: "I want to lend USDT to Francium"
You: [Tool returns with status: 'pending']
"Great! I'm showing you the lending interface.

**What you're doing:** You're lending USDT to Francium, which is currently offering 16.49% APY.

**How it works:** When you lend stablecoins, your tokens are deposited into Francium's lending pool. The protocol lends these funds to borrowers and shares the interest with you. Your interest compounds automatically, increasing your balance over time.

**Transaction details:** When you click 'Lend', your wallet will prompt you to approve the transaction. This will transfer your USDT to Francium's lending pool. You'll start earning 16.49% APY immediately after the transaction confirms, and you can withdraw your funds anytime.

Review the details in the interface and confirm when you're ready!"

**When status equals 'complete' (transaction succeeded):**
You: "You're all set — your [amount] [token] is now lent to [protocol]!

Your lending position is earning [APY]% APY, which means:
- ✅ Your stablecoins are earning interest automatically
- 🔄 You can withdraw anytime (check protocol terms)
- 📈 Interest compounds automatically

Need help or have questions? Ask The Hive!"

The UI will handle the actual transaction signing and execution.`;
