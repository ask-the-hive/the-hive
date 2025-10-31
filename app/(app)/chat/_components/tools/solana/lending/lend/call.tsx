import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Card, Button, Skeleton } from '@/components/ui';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useTokenBalance } from '@/hooks/queries/token/use-token-balance';
import TokenInput from '@/app/_components/swap/token-input';
import { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';
import { useTokenDataByAddress, usePrice } from '@/hooks';
import PoolEarningPotential from '../../pool-earning-potential';
import { capitalizeWords } from '@/lib/string-utils';

import type { LendArgumentsType, LendResultBodyType } from '@/ai/solana/actions/lending/lend/types';
import VarApyTooltip from '@/components/var-apy-tooltip';

interface Props {
  toolCallId: string;
  args: LendArgumentsType;
}

const LendCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { wallet } = useSendTransaction();
  const [isLending, setIsLending] = useState(false);
  const [amount, setAmount] = useState(args.amount?.toString() || '');
  const [poolData, setPoolData] = useState<LendingYieldsPoolData | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  // Fetch token data from the address
  const { data: tokenData, isLoading: tokenDataLoading } = useTokenDataByAddress(args.tokenAddress);

  // Get token price for earning potential calculation
  const { data: tokenPrice } = usePrice(tokenData?.id || '');

  // Get token balance
  const { balance, isLoading: balanceLoading } = useTokenBalance(
    tokenData?.id || '',
    wallet?.address || '',
  );

  // Fetch pool data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && tokenData?.symbol) {
      const storedPoolData = sessionStorage.getItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY);
      if (storedPoolData) {
        try {
          const allPools = JSON.parse(storedPoolData);
          const matchingPool = allPools.find(
            (pool: LendingYieldsPoolData) =>
              pool.symbol?.toLowerCase() === tokenData.symbol.toLowerCase(),
          );
          if (matchingPool) {
            setPoolData(matchingPool);
          } else {
            // No matching pool found - return error
            console.error('No matching pool found for token:', tokenData.symbol);
            setHasFailed(true);
            addToolResult(toolCallId, {
              message: `Could not find lending pool data for ${tokenData.symbol}. Please use the lending-yields tool first to view available pools.`,
            });
          }
        } catch (error) {
          console.error('Error parsing stored pool data:', error);
          setHasFailed(true);
          addToolResult(toolCallId, {
            message: `Error loading lending pool data. Please try again or use the lending-yields tool first.`,
          });
        }
      } else {
        // No pool data in storage at all
        console.error('No pool data in sessionStorage');
        setHasFailed(true);
        addToolResult(toolCallId, {
          message: `No lending pool data found. Please use the lending-yields tool first to view available pools.`,
        });
      }
    }
  }, [tokenData?.symbol, toolCallId, addToolResult]);

  const handleLend = async () => {
    if (!wallet || !tokenData || !amount || !poolData) return;

    setIsLending(true);

    try {
      // Check if user has enough balance
      if (!balance || Number(balance) < Number(amount)) {
        addToolResult(toolCallId, {
          message: `Insufficient balance. You have ${balance || 0} ${tokenData.symbol} but trying to lend ${amount}`,
        });
        return;
      }

      // TODO: Implement actual lending transaction
      // For now, simulate success
      const tx = 'stubbed-transaction-hash';

      addToolResult<LendResultBodyType>(toolCallId, {
        message: `Lend successful!`,
        body: {
          tx,
          amount: Number(amount),
          tokenData: tokenData,
          poolData: poolData,
        },
      });
    } catch (error) {
      console.error('Error executing lend:', error);
      addToolResult(toolCallId, {
        message: `Lend failed: ${error}`,
      });
    } finally {
      setIsLending(false);
    }
  };

  const handleCancel = () => {
    addToolResult(toolCallId, {
      message: `Lend cancelled`,
    });
  };

  // If we've failed to load data, don't render anything (error already sent to agent)
  if (hasFailed) {
    return null;
  }

  if (tokenDataLoading || balanceLoading || !tokenData || !tokenData.id) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full md:w-[70%]">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Don't render until we have pool data
  if (!poolData) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full md:w-[70%]">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <Card className="p-4 max-w-full">
          <div className="flex flex-col gap-4 w-full">
            {poolData && (
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  Lend to {capitalizeWords(poolData.project)}
                </h3>
                <div className="flex items-center justify-center text-center gap-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Earn{' '}
                    <span className="text-green-400 font-medium">{poolData.yield.toFixed(2)}%</span>{' '}
                    APY
                  </p>
                  <VarApyTooltip size="xs" />
                </div>
              </div>
            )}

            <div className="w-full">
              <TokenInput
                token={tokenData}
                label="Amount to Lend"
                amount={amount}
                onChange={setAmount}
                address={wallet?.address}
              />
              {balance && tokenData && (
                <div className="text-xs text-right mt-1 text-neutral-500">
                  Balance: {Number(balance).toFixed(6)} {tokenData.symbol}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="brand"
                className="w-full"
                onClick={handleLend}
                disabled={isLending || !amount || !tokenData}
              >
                {isLending ? 'Lending...' : 'Lend'}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            {/* Display pool information and yield calculator if available */}
            {poolData && (
              <PoolEarningPotential
                poolData={poolData}
                outputAmount={Number(amount) || 0}
                outputTokenPrice={tokenPrice?.value}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LendCallBody;
