import type { TradeArgumentsType, TradeResultBodyType } from './types';
import type { BaseActionResult } from '@/ai/base-action';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function trade(
  args: TradeArgumentsType,
): Promise<BaseActionResult<TradeResultBodyType>> {
  try {
    const inputTokenSymbol = args.inputTokenAddress || 'ETH';
    const outputTokenSymbol = args.outputTokenAddress || '';

    return {
      message: `Please confirm the swap of ${args.inputAmount || ''} ${inputTokenSymbol} for ${outputTokenSymbol}`,
      body: {
        transaction: '',
        inputAmount: args.inputAmount || 0,
        inputToken: inputTokenSymbol,
        outputToken: outputTokenSymbol,
        walletAddress: args.walletAddress,
      },
    };
  } catch (error) {
    console.error('Trade error:', error);
    const message = toUserFacingErrorTextWithContext(
      "Couldn't prepare that swap right now.",
      error,
    );
    return {
      message,
      body: {
        transaction: '',
        inputAmount: 0,
        inputToken: '',
        outputToken: '',
        walletAddress: args.walletAddress,
        error: message,
      },
    };
  }
}
