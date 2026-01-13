import type { WithdrawArgumentsType, WithdrawResultType } from './types';

export async function withdraw(args: WithdrawArgumentsType): Promise<WithdrawResultType> {
  try {
    return {
      message:
        "CRITICAL: The withdrawal UI is now showing with status='pending'. The user has NOT initiated the transaction yet. Explain what will happen when they click Withdraw and that they'll confirm in their wallet. Do NOT claim the withdrawal succeeded until the UI returns status='complete'.",
      body: {
        status: 'pending',
        tx: '',
        amount: args.amount ?? 0,
      },
    };
  } catch (error) {
    console.error('Error executing withdraw:', error);
    return {
      message: "Couldn't prepare the withdrawal right now. Next: try again.",
      body: {
        status: 'failed',
        tx: '',
        amount: args.amount ?? 0,
        error: 'Withdrawal failed',
      },
    };
  }
}
