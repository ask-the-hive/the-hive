import React, { useEffect } from 'react';
import { Card, Skeleton } from '@/components/ui';
import Swap from '@/app/_components/swap';
import { useTokenDataByAddress, usePrice } from '@/hooks';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import type { StakeArgumentsType, StakeResultBodyType } from '@/ai';
import { saveLiquidStakingPosition } from '@/services/liquid-staking/save';
import PoolEarningPotential from '../../pool-earning-potential';
import StakeResult from './stake-result';
import VarApyTooltip from '@/components/var-apy-tooltip';
import { capitalizeWords } from '@/lib/string-utils';
import * as Sentry from '@sentry/nextjs';

const ReceiveTooltip = () => {
  return (
    <div className="max-w-xs space-y-2">
      <p className="text-sm">
        When you stake SOL, you receive liquid staking tokens (LSTs). LSTs represent your claim on
        the staked SOL and increase in value as rewards accumulate.
      </p>
      <p className="text-sm">
        You may receive fewer LST tokens than SOL staked because each LST is worth more than 1 SOL.
        Over time, each LST becomes backed by more SOL as staking rewards compound.
      </p>
    </div>
  );
};
interface Props {
  toolCallId: string;
  args: StakeArgumentsType;
}

const StakeCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { setCurrentChain, walletAddresses } = useChain();
  const [poolData, setPoolData] = React.useState<any>(null);
  const [outputAmount, setOutputAmount] = React.useState<number>(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [txSignature, setTxSignature] = React.useState<string | null>(null);

  // Set the current chain to Solana for staking
  useEffect(() => {
    setCurrentChain('solana');
  }, [setCurrentChain]);

  const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(
    'So11111111111111111111111111111111111111112',
  );
  const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress(
    args.contractAddress,
  );
  const { data: outputTokenPrice } = usePrice(outputTokenData?.id || '');

  // Fetch pool data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPoolData = sessionStorage.getItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY);
      if (storedPoolData && outputTokenData?.symbol) {
        try {
          const allPools = JSON.parse(storedPoolData);
          const selectedPool = allPools.find(
            (pool: any) => pool.symbol.toLowerCase() === outputTokenData?.symbol.toLowerCase(),
          );
          setPoolData(selectedPool);
        } catch (error) {
          console.error('Error parsing stored pool data:', error);
        }
      }
    }
  }, [outputTokenData?.symbol]);

  const handleStakeSuccess = async (tx: string) => {
    // Use Solana wallet address from chain context, not user.wallet.address
    const solanaAddress = walletAddresses.solana;
    console.log('solanaAddress', solanaAddress);

    if (!solanaAddress || !outputTokenData || !poolData) {
      console.error('Missing required data for creating liquid staking position', {
        solanaAddress,
        hasOutputTokenData: !!outputTokenData,
        hasPoolData: !!poolData,
      });
      return;
    }

    // Set success state immediately for UI feedback
    setIsSuccess(true);
    setTxSignature(tx);
    setErrorMessage(null); // Clear any previous errors

    try {
      await saveLiquidStakingPosition({
        walletAddress: solanaAddress,
        chainId: 'solana',
        amount: outputAmount,
        lstToken: outputTokenData,
        poolData: poolData,
      });
    } catch (error) {
      console.error('Error saving liquid staking position:', error);
    } finally {
      // Also notify the chat system
      addToolResult<StakeResultBodyType>(toolCallId, {
        message: `Stake successful!`,
        body: {
          status: 'complete',
          tx,
          symbol: outputTokenData?.symbol || '',
          outputAmount,
          outputTokenData: outputTokenData || undefined,
          poolData: poolData,
        },
      });
    }
  };

  const handleError = (error: unknown) => {
    console.error('Error staking:', error);
    // Check if user cancelled the transaction
    const errorStr = String(error);
    const isUserCancellation =
      errorStr.toLowerCase().includes('user rejected') ||
      errorStr.toLowerCase().includes('user cancelled') ||
      errorStr.toLowerCase().includes('user denied') ||
      errorStr.toLowerCase().includes('rejected by user') ||
      (error as any)?.code === 4001;

    if (isUserCancellation) {
      addToolResult(toolCallId, {
        message: 'Transaction cancelled by user',
        body: {
          status: 'cancelled',
          tx: '',
          symbol: '',
          outputAmount: 0,
        },
      });
    } else {
      Sentry.captureException(error);
      // Show error message but keep UI visible for retry
      setErrorMessage('There was an issue submitting the transaction. Please try again.');
    }
  };

  // Show success state if transaction completed
  if (isSuccess && txSignature && outputTokenData) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full md:w-[70%]">
          <StakeResult
            outputTokenData={outputTokenData}
            poolData={poolData}
            outputAmount={outputAmount}
            tx={txSignature}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <Card className="p-4 max-w-full">
          {inputTokenLoading || outputTokenLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="w-full">
              <div className="text-center space-y-2 mb-4">
                <h3 className="font-semibold text-lg">
                  Stake to{' '}
                  {capitalizeWords(
                    poolData?.project || outputTokenData?.symbol || 'Solana Liquid Staking Pool',
                  )}
                </h3>
                {poolData && (
                  <div className="flex items-center justify-center text-center gap-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn{' '}
                      <span className="text-green-400 font-medium">
                        {poolData.yield.toFixed(2)}%
                      </span>{' '}
                      APY
                    </p>
                    <VarApyTooltip size="xs" />
                  </div>
                )}
              </div>

              <Swap
                initialInputToken={inputTokenData}
                initialOutputToken={outputTokenData}
                inputLabel="Stake"
                outputLabel="Receive"
                initialInputAmount={args.amount?.toString()}
                swapText="Stake"
                swappingText="Staking..."
                receiveTooltip={<ReceiveTooltip />}
                onOutputChange={(amount) => {
                  setOutputAmount(amount);
                  setErrorMessage(null); // Clear error when user changes amount
                }}
                onSuccess={handleStakeSuccess}
                onError={handleError}
                onCancel={() => {
                  addToolResult(toolCallId, {
                    message: `Stake cancelled`,
                    body: {
                      status: 'cancelled',
                      tx: '',
                      symbol: '',
                    },
                  });
                }}
              />

              {/* Show error message if transaction failed */}
              <div className="flex justify-center w-full h-4 mt-2">
                {errorMessage && (
                  <p className="flex justify-center w-full text-sm text-red-600 dark:text-red-400 text-center">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Display pool information and yield calculator if available */}
              {poolData && (
                <PoolEarningPotential
                  poolData={poolData}
                  outputAmount={outputAmount}
                  outputTokenPrice={outputTokenPrice?.value}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StakeCallBody;
