export const SOLANA_STAKE_PROMPT = `Show the staking interface for staking SOL into a liquid staking protocol.

This action displays a UI where users can stake SOL to receive liquid staking tokens (LSTs).

Parameters:
- amount: The amount of SOL to stake (optional - user can input in the UI)
- contractAddress: The contract address of the liquid staking token

CRITICAL - Check the result status and respond accordingly:

When this tool is called, it returns a result with a 'status' field. You MUST check this status and provide the appropriate response:

1. **If status is 'pending'**: The UI is awaiting user confirmation. Provide educational context:
   - **What they're staking**: Specify the amount and token (e.g., "You're staking SOL to get JupSOL")
  - **Expected returns**: Do NOT quote numeric APYs in text. Tell them the live APY is shown in the UI card/position details.
   - **How liquid staking works**: Explain that SOL is converted to LSTs, rewards are earned automatically, LSTs can be used in DeFi, and they maintain liquidity
   - **Transaction details**: Explain that clicking 'Stake' will prompt their wallet, the transaction will swap SOL for LST, they'll start earning immediately, and can unstake anytime
   - **Next steps**: Encourage them to review the details and confirm when ready

2. **If status is 'complete'**: The transaction succeeded. Show success message:
   - Confirm the staking is complete with the amount and LST received
   - Explain what they can do with their LST (use in DeFi, swap back anytime)
   - Encourage them to ask if they have questions

3. **If status is 'cancelled'**: User cancelled the transaction. Acknowledge neutrally:
   - "No problem! Let me know if you'd like to try again or if you have any questions."
   - Keep it brief and friendly

4. **If status is 'failed'**: The transaction failed. Acknowledge the failure and offer help.

IMPORTANT: Always check the status field in the result to determine which response to provide.

Example - what you should do:

**When status equals 'pending' (UI shown, awaiting confirmation):**
User: "I want to stake SOL for JupSOL"
You: [Tool returns with status: 'pending']
"Great! I'm showing you the staking interface.

**What you're doing:** You're staking SOL to get JupSOL (see the live rate in the card).

**How it works:** When you stake SOL, you receive liquid staking tokens (JupSOL). These tokens represent your staked SOL and earn rewards automatically. You can use JupSOL in DeFi protocols while earning staking rewards, maintaining full liquidity.

**Transaction details:** When you click 'Stake', your wallet will prompt you to approve the transaction. This will swap your SOL for JupSOL. You'll start earning immediately after the transaction confirms, and you can unstake anytime by swapping back to SOL.

Review the details in the interface and confirm when you're ready!"

**When status equals 'complete' (transaction succeeded):**
You: "You're all set — your SOL is now staked and you hold [amount] [LST]!

[LST] is a liquid staking token, which means you can:
- ✅ Use it in DeFi protocols to earn extra yield
- 🔁 Swap it instantly for SOL anytime — no waiting required

Need help or have questions? Ask The Hive!"

The UI will handle the actual transaction signing and execution.`;
