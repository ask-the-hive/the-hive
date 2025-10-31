import React, { useEffect } from 'react';
import { Card, Skeleton } from '@/components/ui';
import Swap from '@/app/_components/swap';
import { useTokenDataByAddress, usePrice } from '@/hooks';
import { usePrivy } from '@privy-io/react-auth';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import type { StakeArgumentsType, StakeResultBodyType } from '@/ai';
import { saveLiquidStakingPosition } from '@/services/liquid-staking/save';
import PoolEarningPotential from '../../pool-earning-potential';

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
  const { setCurrentChain } = useChain();
  const { user } = usePrivy();
  const [poolData, setPoolData] = React.useState<any>(null);
  const [outputAmount, setOutputAmount] = React.useState<number>(0);

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
    if (!user?.wallet?.address || !outputTokenData || !poolData) {
      console.error('Missing required data for creating liquid staking position');
      return;
    }

    try {
      await saveLiquidStakingPosition({
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

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
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
                receiveTooltip={<ReceiveTooltip />}
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
                    body: {
                      status: 'cancelled',
                      tx: '',
                      symbol: '',
                    },
                  });
                }}
              />
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
