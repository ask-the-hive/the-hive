import { BaseSolanaAction } from '@/ai/solana/actions/solana-action';
import { LendingYieldsResultType } from './schema';
import { getLendingYields } from './function';

export class SolanaLendingYieldsAction extends BaseSolanaAction {
  async execute(): Promise<LendingYieldsResultType> {
    return await getLendingYields();
  }
}
