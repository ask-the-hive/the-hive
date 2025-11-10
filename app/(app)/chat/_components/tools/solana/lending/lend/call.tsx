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

/**
 * Normalize protocol name for matching
 * Handles variations like "Kamino Lend", "Kamino", "kamino-lend", "Kamino-Lend"
 */
const normalizeProtocolName = (protocol: string): string => {
  return protocol
    .toLowerCase()
    .replace(/[-\s]+/g, '') // Remove hyphens and spaces
    .trim();
};

/**
 * Check if two protocol names match (handles variations)
 * Returns true if they're the same or if one is a prefix of the other
 */
const protocolsMatch = (protocol1: string, protocol2: string): boolean => {
  const normalized1 = normalizeProtocolName(protocol1);
  const normalized2 = normalizeProtocolName(protocol2);

  // Exact match
  if (normalized1 === normalized2) return true;

  // One is a prefix of the other (e.g., "kamino" matches "kaminolend")
  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
    return true;
  }

  return false;
};

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
    console.log('🔍 LendCallBody poolData fetch debug');
    console.log('args.tokenSymbol:', args.tokenSymbol);
    console.log('args.protocol:', args.protocol);

    // Use tokenSymbol from args (reliable) instead of tokenData.symbol (may be undefined)
    if (typeof window !== 'undefined' && args.tokenSymbol) {
      const storedPoolData = sessionStorage.getItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY);
      console.log('storedPoolData exists:', !!storedPoolData);

      if (storedPoolData) {
        try {
          const allPools = JSON.parse(storedPoolData);
          console.log('All pools from sessionStorage:', allPools);
          console.log(
            'Searching for pool with symbol:',
            args.tokenSymbol,
            'and protocol:',
            args.protocol,
          );

          const matchingPool = allPools.find((pool: LendingYieldsPoolData) => {
            const symbolMatch = pool.symbol?.toLowerCase() === args.tokenSymbol.toLowerCase();
            const projectMatch = protocolsMatch(pool.project, args.protocol);
            console.log(
              `Pool: ${pool.symbol} (${pool.project}) - symbol match: ${symbolMatch}, project match: ${projectMatch}`,
            );
            return symbolMatch && projectMatch;
          });

          if (matchingPool) {
            console.log('✅ Found matching pool:', matchingPool);
            setPoolData(matchingPool);
          } else {
            console.error(
              '❌ No matching pool found for token:',
              args.tokenSymbol,
              'protocol:',
              args.protocol,
            );
            setHasFailed(true);
            addToolResult(toolCallId, {
              message: `Could not find lending pool data for ${args.tokenSymbol}. Please use the lending-yields tool first to view available pools.`,
            });
          }
        } catch (error) {
          console.error('❌ Error parsing stored pool data:', error);
          setHasFailed(true);
          addToolResult(toolCallId, {
            message: `Error loading lending pool data. Please try again or use the lending-yields tool first.`,
          });
        }
      } else {
        console.error('❌ No pool data in sessionStorage');
        setHasFailed(true);
        addToolResult(toolCallId, {
          message: `No lending pool data found. Please use the lending-yields tool first to view available pools.`,
        });
      }
    } else {
      console.log('⚠️ Skipping pool data fetch - missing tokenSymbol or not in browser');
    }
  }, [args.tokenSymbol, args.protocol, addToolResult, toolCallId]);

  useEffect(() => {
    console.log('🔍 LendCallBody error check debug');
    console.log('tokenDataError:', tokenDataError);
    console.log('tokenPriceError:', tokenPriceError);

    // Check for data loading errors
    if (tokenDataError || tokenPriceError) {
      console.error('❌ Setting hasFailed due to tokenDataError or tokenPriceError');
      setHasFailed(true);
      addToolResult(toolCallId, {
        message: `Error loading data. Please try again or use the lending-yields tool first.`,
      });
    }
  }, [tokenDataError, tokenPriceError, addToolResult, toolCallId]);

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
      console.log('transaction:', transaction);
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
      // Check if user cancelled the transaction
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserCancellation =
        errorMessage.toLowerCase().includes('user rejected') ||
        errorMessage.toLowerCase().includes('user cancelled') ||
        errorMessage.toLowerCase().includes('user denied') ||
        errorMessage.toLowerCase().includes('rejected by user') ||
        (error as any)?.code === 4001;

      if (isUserCancellation) {
        addToolResult(toolCallId, {
          message: 'Transaction cancelled by user',
          body: {
            status: 'cancelled',
            tx: '',
            amount: Number(amount),
            tokenData: tokenData,
            poolData: poolData || undefined,
          },
        });
      } else {
        addToolResult(toolCallId, {
          message: `Lend failed: ${errorMessage}`,
        });
      }
    } finally {
      setIsLending(false);
    }
  };

  const handleCancel = () => {
    addToolResult(toolCallId, {
      message: 'Transaction cancelled',
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
              {balance && balance > 0 && (
                <div className="text-md text-right mt-1 text-neutral-400">
                  Balance: {Number(balance).toFixed(6)} {args.tokenSymbol}
                </div>
              )}
            </div>
            {/* Show loading message when balance is being fetched after a swap */}
            {balanceLoading && (!balance || balance === 0) && (
              <p className="text-md text-center text-brand-500 pt-2">
                ⏳ Waiting for your {args.tokenSymbol} balance to update...
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="brand"
                className="w-full"
                onClick={handleLend}
                disabled={isLending || !amount || !tokenData || !balance || balance === 0}
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
                actionType="lending"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LendCallBody;
