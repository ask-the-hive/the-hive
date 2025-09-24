import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';

import { Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import Swap from '../../../utils/swap';

import { useTokenDataByAddress, usePrice } from '@/hooks';
import { usePrivy } from '@privy-io/react-auth';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import { useChain } from '@/app/_contexts/chain-context';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { upsertLiquidStakingPosition } from '@/db/services/liquid-staking-positions';

import type { StakeArgumentsType, StakeResultBodyType } from '@/ai';
import StakeResult from './stake-result';

interface Props {
  toolCallId: string;
  args: StakeArgumentsType;
}

const StakeCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { setCurrentChain } = useChain();
  const { user } = usePrivy();
  const [poolData, setPoolData] = React.useState<any>(null);
  const [selectedTimespan, setSelectedTimespan] = React.useState<number>(3);
  const [outputAmount, setOutputAmount] = React.useState<number>(0);
  const preHoverTimespanRef = useRef<number | null>(null);

  // Set the current chain to Solana for staking
  useEffect(() => {
    setCurrentChain('solana');
  }, [setCurrentChain]);

  // Fetch pool data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPoolData = sessionStorage.getItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY);
      if (storedPoolData) {
        try {
          const parsedData = JSON.parse(storedPoolData);
          setPoolData(parsedData);
          // Clear the stored data after retrieving it
          sessionStorage.removeItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY);
        } catch (error) {
          console.error('Error parsing stored pool data:', error);
        }
      }
    }
  }, []);

  const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(
    'So11111111111111111111111111111111111111112',
  );
  const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress(
    args.contractAddress,
  );
  const { data: outputTokenPrice } = usePrice(outputTokenData?.id || '');

  // Calculate yield earnings based on current timespan
  const yieldEarnings = useMemo(() => {
    if (!outputAmount || !outputTokenPrice || !poolData) return 0;
    return (
      ((outputAmount * outputTokenPrice.value * poolData.yield) / 100) * (selectedTimespan / 12)
    );
  }, [outputAmount, outputTokenPrice, poolData, selectedTimespan]);

  const handleStakeSuccess = async (tx: string) => {
    if (!user?.wallet?.address || !outputTokenData || !poolData) {
      console.error('Missing required data for creating liquid staking position');
      return;
    }

    try {
      // Create or update liquid staking position record
      await upsertLiquidStakingPosition({
        walletAddress: user.wallet.address,
        chainId: 'solana',
        amount: outputAmount,
        lstToken: outputTokenData,
        poolData: poolData,
      });
    } catch (error) {
      console.error('Error saving liquid staking position:', error);
    } finally {
      addToolResult<StakeResultBodyType>(toolCallId, {
        message: `Stake successful!`,
        body: {
          tx,
          symbol: outputTokenData?.symbol || '',
          outputAmount,
          outputTokenData: outputTokenData || undefined,
          poolData: poolData,
        },
      });
    }
  };

  return (
    <Card className="p-4 max-w-full">
      {inputTokenLoading || outputTokenLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="w-full">
          <Swap
            initialInputToken={inputTokenData}
            initialOutputToken={outputTokenData}
            inputLabel="Stake"
            outputLabel="Receive"
            initialInputAmount={args.amount?.toString()}
            swapText="Stake"
            swappingText="Staking..."
            onOutputChange={setOutputAmount}
            onSuccess={handleStakeSuccess}
            onError={(error) => {
              console.error('Error staking:', error);
              addToolResult(toolCallId, {
                message: `Stake failed: ${error}`,
              });
            }}
            onCancel={() => {
              addToolResult(toolCallId, {
                message: `Stake cancelled`,
              });
            }}
          />
          <StakeResult
            outputTokenData={outputTokenData || undefined}
            poolData={poolData}
            outputAmount={outputAmount}
          />
          {/* Display pool information and yield calculator if available */}
          {poolData && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src={poolData.tokenData?.logoURI || ''}
                  alt={poolData.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <h3 className="font-semibold text-lg">{poolData.name}</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({poolData.yield.toFixed(2)}% APY)
                </span>
              </div>

              {/* Timespan cards and yield calculator */}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {[3, 6, 12, 24].map((months) => (
                    <div
                      key={months}
                      className={cn(
                        'box-border px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 border',
                        selectedTimespan === months
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white border-transparent',
                      )}
                      onMouseEnter={() => {
                        if (preHoverTimespanRef.current === null) {
                          preHoverTimespanRef.current = selectedTimespan;
                        }
                        setSelectedTimespan(months);
                      }}
                      onMouseLeave={() => {
                        if (preHoverTimespanRef.current !== null) {
                          setSelectedTimespan(preHoverTimespanRef.current);
                          preHoverTimespanRef.current = null;
                        }
                      }}
                      onClick={() => {
                        preHoverTimespanRef.current = null;
                        setSelectedTimespan(months);
                      }}
                    >
                      {months}M
                    </div>
                  ))}
                </div>

                <div className="flex-1 max-w-xs">
                  <div className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                    <p className="text-gray-600 dark:text-gray-400">
                      {outputAmount > 0 && outputTokenPrice
                        ? `$${yieldEarnings.toFixed(2)} yield`
                        : 'Projected yield'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default StakeCallBody;
