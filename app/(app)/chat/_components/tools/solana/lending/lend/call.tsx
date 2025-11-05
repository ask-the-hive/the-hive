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
import { VersionedTransaction } from '@solana/web3.js';

import type { LendArgumentsType, LendResultBodyType } from '@/ai/solana/actions/lending/lend/types';
import VarApyTooltip from '@/components/var-apy-tooltip';

interface Props {
  toolCallId: string;
  args: LendArgumentsType;
}

const LendCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { wallet, sendTransaction } = useSendTransaction();
  const [isLending, setIsLending] = useState(false);
  const [amount, setAmount] = useState(args.amount?.toString() || '');
  const [poolData, setPoolData] = useState<LendingYieldsPoolData | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  // Fetch token data from the address
  const {
    data: tokenData,
    isLoading: tokenDataLoading,
    error: tokenDataError,
  } = useTokenDataByAddress(args.tokenAddress);

  // Get token price for earning potential calculation
  const {
    data: tokenPrice,
    isLoading: tokenPriceLoading,
    error: tokenPriceError,
  } = usePrice(args.tokenAddress || '');

  // Get token balance (use args.walletAddress from agent, not wallet context)
  const { balance, isLoading: balanceLoading } = useTokenBalance(
    args.tokenAddress || '',
    args.walletAddress || '',
  );
  // Fetch pool data from sessionStorage (optional - enhances UI with APY data)
  useEffect(() => {
    // Use tokenSymbol from args (reliable) instead of tokenData.symbol (may be undefined)
    if (typeof window !== 'undefined' && args.tokenSymbol) {
      const storedPoolData = sessionStorage.getItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY);
      if (storedPoolData) {
        try {
          const allPools = JSON.parse(storedPoolData);
          const matchingPool = allPools.find(
            (pool: LendingYieldsPoolData) =>
              pool.symbol?.toLowerCase() === args.tokenSymbol.toLowerCase() &&
              pool.project.toLowerCase() === args.protocol.toLowerCase(),
          );
          if (matchingPool) {
            setPoolData(matchingPool);
          } else {
            console.error('No matching pool found for token:', args.tokenSymbol);
            setHasFailed(true);
            addToolResult(toolCallId, {
              message: `Could not find lending pool data for ${args.tokenSymbol}. Please use the lending-yields tool first to view available pools.`,
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
        console.error('No pool data in sessionStorage');
        setHasFailed(true);
        addToolResult(toolCallId, {
          message: `No lending pool data found. Please use the lending-yields tool first to view available pools.`,
        });
      }
    }
  }, [args.tokenSymbol, args.protocol, addToolResult, toolCallId]);

  useEffect(() => {
    if (tokenDataError || tokenPriceError || !balance || balance === 0) {
      setHasFailed(true);
      addToolResult(toolCallId, {
        message: `Error loading data. Please try again or use the lending-yields tool first.`,
      });
    }
  }, [tokenDataError, tokenPriceError, balance, addToolResult, toolCallId]);

  const handleLend = async () => {
    if (!wallet || !tokenData || !amount) return;

    setIsLending(true);

    try {
      // Check if user has enough balance
      if (!balance || Number(balance) < Number(amount)) {
        addToolResult(toolCallId, {
          message: `Insufficient balance. You have ${balance || 0} ${args.tokenSymbol} but trying to lend ${amount}`,
        });
        return;
      }

      // Use poolData.project if available, otherwise use args.protocol
      const protocolName = poolData?.project || args.protocol;

      // Build lending transaction via backend API (Francium SDK requires Node.js)
      const response = await fetch('/api/lending/build-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.address,
          tokenMint: tokenData.id,
          tokenSymbol: args.tokenSymbol, // Use args.tokenSymbol (reliable)
          amount: Number(amount),
          protocol: protocolName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to build transaction');
      }

      const { transaction: serializedTx } = await response.json();

      // Deserialize the transaction
      const transactionBuffer = Buffer.from(serializedTx, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);

      const tx = await sendTransaction(transaction);

      addToolResult<LendResultBodyType>(toolCallId, {
        message: `Successfully lent ${amount} ${args.tokenSymbol} to ${capitalizeWords(protocolName)}`,
        body: {
          status: 'complete',
          tx,
          amount: Number(amount),
          tokenData: tokenData,
          poolData: poolData || undefined, // Convert null to undefined
        },
      });
    } catch (error) {
      console.error('Error executing lend:', error);
      addToolResult(toolCallId, {
        message: `Lend failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLending(false);
    }
  };

  const handleCancel = () => {
    addToolResult(toolCallId, {
      message: `Lend cancelled`,
      body: {
        status: 'cancelled',
        tx: '',
        amount: 0,
      },
    });
  };

  if (hasFailed) {
    return null;
  }

  // Only wait for essential data (tokenData and balance), poolData is optional
  if (tokenDataLoading || tokenPriceLoading || balanceLoading || !tokenData || !tokenData.id) {
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
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                Lend to {capitalizeWords(poolData?.project || args.protocol)}
              </h3>
              {poolData && (
                <div className="flex items-center justify-center text-center gap-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Earn{' '}
                    <span className="text-green-400 font-medium">{poolData.yield.toFixed(2)}%</span>{' '}
                    APY
                  </p>
                  <VarApyTooltip size="xs" />
                </div>
              )}
            </div>

            <div className="w-full">
              <TokenInput
                token={tokenData}
                label="Amount to Lend"
                amount={amount}
                onChange={setAmount}
                address={wallet?.address}
              />
              {balance && (
                <div className="text-xs text-right mt-1 text-neutral-500">
                  Balance: {Number(balance).toFixed(6)} {args.tokenSymbol}
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
