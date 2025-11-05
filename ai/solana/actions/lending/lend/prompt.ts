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

1. **If status is 'pending'**: The UI is showing and awaiting user confirmation. The transaction has NOT been initiated yet. Provide a clear educational breakdown:

   🚨 IMPORTANT: DO NOT say "transaction is pending" or "your lending transaction is pending" - the user hasn't even clicked Lend yet!

   Instead, explain the PROCESS:
   - **What you're setting up**: "I'm showing you the lending interface for [TOKEN] to [PROTOCOL]"
   - **Expected returns**: "This pool is currently offering [APY]% APY"
   - **How the lending process works** (step-by-step):
     1. Review the amount and APY in the interface
     2. Click the 'Lend' button when you're ready
     3. Your wallet will prompt you to approve the transaction
     4. Once approved, your tokens are deposited into the lending pool
     5. You'll start earning interest immediately after confirmation
     6. You can withdraw your funds anytime
   - **Next steps**: "Review the details and click 'Lend' when you're ready!"

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
"Perfect! I'm showing you the lending interface for USDT to Francium. This pool is currently offering 16.49% APY.

**Here's how the lending process works:**

1. **Review**: Check the amount and APY shown in the interface above
2. **Click 'Lend'**: When you're ready, click the Lend button
3. **Approve**: Your wallet will prompt you to approve the transaction
4. **Confirm**: Once approved, your USDT will be deposited into Francium's lending pool
5. **Earn**: You'll start earning 16.49% APY immediately after confirmation
6. **Withdraw**: You can withdraw your funds anytime

The interface is ready - review the details and click 'Lend' when you're ready!"

**When status equals 'complete' (transaction succeeded):**
You: "You're all set — your [amount] [token] is now lent to [protocol]!

Your lending position is earning [APY]% APY, which means:
- ✅ Your stablecoins are earning interest automatically
- 🔄 You can withdraw anytime (check protocol terms)
- 📈 Interest compounds automatically

Need help or have questions? Ask The Hive!"

The UI will handle the actual transaction signing and execution.`;
