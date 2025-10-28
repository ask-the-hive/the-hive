import React, { useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { Card, Button, Skeleton } from '@/components/ui';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useTokenBalance } from '@/hooks/queries/token/use-token-balance';
import TokenInput from '@/app/_components/swap/token-input';

import type { ToolInvocation } from 'ai';
import type {
  WithdrawArgumentsType,
  WithdrawResultType,
} from '@/ai/solana/actions/lending/withdraw/schema';

interface Props {
  tool: ToolInvocation;
  args: WithdrawArgumentsType;
  prevToolAgent?: string;
}

const WithdrawCall: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { sendTransaction, wallet } = useSendTransaction();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // Get token balance (lending position balance)
  const { balance, isLoading: balanceLoading } = useTokenBalance(
    selectedToken?.id || '',
    wallet?.address || '',
  );

  const handleWithdraw = async () => {
    if (!wallet || !selectedToken || !amount) return;

    setIsWithdrawing(true);

    try {
      // Check if user has enough balance
      if (!balance || Number(balance) < Number(amount)) {
        addToolResult<WithdrawResultType>(toolCallId, {
          message: `Insufficient lending position. You have ${balance || 0} ${selectedToken.symbol} but trying to withdraw ${amount}`,
          body: {
            success: false,
            error: 'Insufficient lending position',
            amount: Number(amount),
            tokenSymbol: selectedToken.symbol,
            protocolName: args.protocolAddress,
          },
        });
        return;
      }

      // TODO: Implement actual withdrawal transaction
      // For now, simulate success
      addToolResult<WithdrawResultType>(toolCallId, {
        message: `Successfully withdrew ${amount} ${selectedToken.symbol} from ${args.protocolAddress}`,
        body: {
          success: true,
          transactionHash: 'stubbed-transaction-hash',
          amount: Number(amount),
          tokenSymbol: selectedToken.symbol,
          protocolName: args.protocolAddress,
          yieldEarned: 0, // TODO: Calculate actual yield earned
        },
      });
    } catch (error) {
      console.error('Error executing withdraw:', error);
      addToolResult<WithdrawResultType>(toolCallId, {
        message: `Failed to execute withdraw: ${error}`,
        body: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          amount: Number(amount),
          tokenSymbol: selectedToken?.symbol || '',
          protocolName: args.protocolAddress,
        },
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (balanceLoading) {
    return <Skeleton className="h-48 w-96" />;
  }

  // If no lending position, show message
  if (!balance || Number(balance) === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">No Lending Position Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any lending positions to withdraw from.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <div className="flex flex-col gap-4 w-96 max-w-full">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Withdraw from {args.protocolAddress}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Withdraw your lending position</p>
        </div>

        <div className="w-full">
          <TokenInput
            token={selectedToken}
            label="Amount to Withdraw"
            amount={amount}
            onChange={setAmount}
            onChangeToken={setSelectedToken}
            address={wallet?.address}
          />
          {balance && (
            <div className="text-xs text-right mt-1 text-neutral-500">
              Available: {Number(balance).toFixed(6)} {selectedToken?.symbol}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="brand"
            className="w-full"
            onClick={handleWithdraw}
            disabled={isWithdrawing || !amount || !selectedToken}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const WithdrawCallBody: React.FC<Props> = ({ tool, args, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Preparing withdrawal interface...`}
      result={{
        heading: () => 'Withdrawal Interface',
        body: () => <WithdrawCall toolCallId={tool.toolCallId} args={args} />,
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default WithdrawCallBody;
