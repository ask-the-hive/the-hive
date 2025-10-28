import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { Card, Button, Skeleton } from '@/components/ui';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useTokenBalance } from '@/hooks/queries/token/use-token-balance';
import { useFundWallet } from '@privy-io/react-auth/solana';
import TokenInput from '@/app/_components/swap/token-input';
import { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';

import type { ToolInvocation } from 'ai';
import type { LendArgumentsType, LendResultType } from '@/ai/solana/actions/lending/lend/schema';

interface Props {
  tool: ToolInvocation;
  args: LendArgumentsType;
  prevToolAgent?: string;
}

const LendCall: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { sendTransaction, wallet } = useSendTransaction();
  const { fundWallet } = useFundWallet();
  const [isLending, setIsLending] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [poolData, setPoolData] = useState<LendingYieldsPoolData | null>(null);

  // Get token balance
  const { balance, isLoading: balanceLoading } = useTokenBalance(
    selectedToken?.id || '',
    wallet?.address || '',
  );

  useEffect(() => {
    // Load pool data from sessionStorage
    const storedPoolData = sessionStorage.getItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY);
    if (storedPoolData) {
      const pools = JSON.parse(storedPoolData);
      const matchingPool = pools.find(
        (pool: LendingYieldsPoolData) =>
          pool.tokenData?.symbol === args.tokenAddress || pool.symbol === args.tokenAddress,
      );
      if (matchingPool) {
        setPoolData(matchingPool);
        setSelectedToken(matchingPool.tokenData);
      }
    }
  }, [args.tokenAddress]);

  const handleLend = async () => {
    if (!wallet || !selectedToken || !amount) return;

    setIsLending(true);

    try {
      // Check if user has enough balance
      if (!balance || Number(balance) < Number(amount)) {
        addToolResult<LendResultType>(toolCallId, {
          message: `Insufficient balance. You have ${balance || 0} ${selectedToken.symbol} but trying to lend ${amount}`,
          body: {
            success: false,
            error: 'Insufficient balance',
            amount: Number(amount),
            tokenSymbol: selectedToken.symbol,
            protocolName: args.protocolAddress,
          },
        });
        return;
      }

      // TODO: Implement actual lending transaction
      // For now, simulate success
      addToolResult<LendResultType>(toolCallId, {
        message: `Successfully lent ${amount} ${selectedToken.symbol} to ${args.protocolAddress}`,
        body: {
          success: true,
          transactionHash: 'stubbed-transaction-hash',
          amount: Number(amount),
          tokenSymbol: selectedToken.symbol,
          protocolName: args.protocolAddress,
        },
      });
    } catch (error) {
      console.error('Error executing lend:', error);
      addToolResult<LendResultType>(toolCallId, {
        message: `Failed to execute lend: ${error}`,
        body: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          amount: Number(amount),
          tokenSymbol: selectedToken?.symbol || '',
          protocolName: args.protocolAddress,
        },
      });
    } finally {
      setIsLending(false);
    }
  };

  const handleFundWallet = () => {
    if (wallet?.address) {
      fundWallet(wallet.address, { amount: '100' }); // Default to $100 USDT
    }
  };

  if (balanceLoading) {
    return <Skeleton className="h-48 w-96" />;
  }

  // If no stablecoin balance, show fund wallet option
  if (!balance || Number(balance) === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">No Stablecoins Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need stablecoins (USDC or USDT) to lend. Buy some using Coinbase Pay.
          </p>
          <Button onClick={handleFundWallet} className="w-full">
            Buy USDT with Coinbase Pay
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <div className="flex flex-col gap-4 w-96 max-w-full">
        {poolData && (
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Lend to {poolData.project}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earn {poolData.yield.toFixed(2)}% APY
            </p>
          </div>
        )}

        <div className="w-full">
          <TokenInput
            token={selectedToken}
            label="Amount to Lend"
            amount={amount}
            onChange={setAmount}
            onChangeToken={setSelectedToken}
            address={wallet?.address}
          />
          {balance && (
            <div className="text-xs text-right mt-1 text-neutral-500">
              Balance: {Number(balance).toFixed(6)} {selectedToken?.symbol}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="brand"
            className="w-full"
            onClick={handleLend}
            disabled={isLending || !amount || !selectedToken}
          >
            {isLending ? 'Lending...' : 'Lend'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const LendCallBody: React.FC<Props> = ({ tool, args, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Preparing lending interface...`}
      result={{
        heading: () => 'Lending Interface',
        body: () => <LendCall toolCallId={tool.toolCallId} args={args} />,
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default LendCallBody;
