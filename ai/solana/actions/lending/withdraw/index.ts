import { BaseSolanaAction } from '@/ai/solana/actions/solana-action';
import { WithdrawArgumentsType, WithdrawResultType } from './schema';
import { withdraw } from './function';

export class SolanaWithdrawAction extends BaseSolanaAction {
  async execute(args: WithdrawArgumentsType): Promise<WithdrawResultType> {
    return await withdraw(args);
  }
}
