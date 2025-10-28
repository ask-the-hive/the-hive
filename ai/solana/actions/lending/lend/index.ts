import { BaseSolanaAction } from '@/ai/solana/actions/solana-action';
import { LendArgumentsType, LendResultType } from './schema';
import { lend } from './function';

export class SolanaLendAction extends BaseSolanaAction {
  async execute(args: LendArgumentsType): Promise<LendResultType> {
    return await lend(args);
  }
}
