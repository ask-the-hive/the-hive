import React, { useMemo } from 'react';
import Image from 'next/image';

import ToolCard from '../tool-card';
import { TokenBalance } from '../utils';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Card, Button, CardHeader } from '@/components/ui';
import { useSwapModal } from '@/app/(app)/portfolio/[address]/_contexts/use-swap-modal';
import { useFundWallet } from '@privy-io/react-auth/solana';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useResolveAssetSymbolToAddress } from '@/hooks/queries/token/use-resolve-asset-symbol-to-address';

import type { ToolInvocation } from 'ai';
import type { BalanceResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface TokenOptionsProps {
  tokenSymbol: string;
  tokenAddress?: string;
  logoURI?: string;
}

const TokenOptions: React.FC<TokenOptionsProps> = ({ tokenSymbol, tokenAddress, logoURI }) => {
  const { onOpen: openSwapModal } = useSwapModal();
  const { fundWallet } = useFundWallet();
  const { wallet } = useSendTransaction();

  const isTokenSOL = tokenSymbol === 'SOL';

  // Use the resolve hook to get token address from symbol
  const { data: resolvedAddress, isLoading: isResolving } = useResolveAssetSymbolToAddress(
    !tokenAddress ? tokenSymbol : '',
  );

  // Determine final token address to use
  const finalTokenAddress = useMemo(() => {
    if (isTokenSOL) {
      return SOL_MINT;
    }

    if (tokenAddress) {
      return tokenAddress;
    }

    // Use provided address first, then resolved address
    return resolvedAddress;
  }, [isTokenSOL, resolvedAddress, tokenAddress]);

  const handleSwap = () => {
    if (finalTokenAddress) {
      openSwapModal('buy', finalTokenAddress);
    }
  };

  const handleBuy = () => {
    if (wallet?.address) {
      fundWallet(wallet.address, { amount: '100' });
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <Card className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-neutral-800">
          <div className="p-4 pt-8">
            <div className="flex flex-col items-center gap-3 mb-4">
              {logoURI && (
                <Image
                  src={logoURI}
                  alt={tokenSymbol}
                  width={50}
                  height={50}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You need {tokenSymbol} to continue
              </p>
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSwap}
                className="w-full"
                variant="brand"
                disabled={!finalTokenAddress || isResolving}
              >
                {isResolving ? 'Loading...' : `Swap for ${tokenSymbol}`}
              </Button>
              <Button
                onClick={handleBuy}
                className="w-full"
                variant="brandOutline"
                disabled={!wallet?.address}
              >
                Buy or Receive {tokenSymbol}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
  const { messages } = useChat();

  // Check if we're in a staking flow by looking for recent staking-related tool invocations
  const isInStakingOrLendingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return (
        part.type === 'tool-invocation' &&
        (part.toolInvocation.toolName.includes(`staking-`) ||
          part.toolInvocation.toolName.includes(`lending-`))
      );
    }),
  );

  // Debug logs
  console.log('isInStakingOrLendingFlow', isInStakingOrLendingFlow);
  console.log('tool.state', tool.state);
  console.log('tool.result', 'result' in tool ? tool.result : 'no result property');
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting ${tool.args.tokenAddress || 'SOL'} balance...`}
      result={{
        heading: (result: BalanceResultType) => {
          if (result.body?.token) {
            if (isInStakingOrLendingFlow && result.body?.balance > 0) {
              // Dont show a heading if a balance exists, we want to continue the flow instead
              return null;
            }
            return `Fetched ${result.body.token} balance`;
          }
          return `Failed to fetch balance`;
        },
        body: (result: BalanceResultType) => {
          const tokenSymbol = result.body?.token || '';
          const isInFlow = isInStakingOrLendingFlow;
          const hasZeroBalance = result.body?.balance === 0;

          if (result.body) {
            // If in staking/lending flow and balance is 0, show options
            if (isInFlow && hasZeroBalance) {
              return (
                <TokenOptions
                  tokenSymbol={tokenSymbol}
                  tokenAddress={tool?.args?.tokenAddress}
                  logoURI={result.body.logoURI}
                />
              );
            }

            // If in flow but balance > 0, hide the balance display
            if (isInFlow && !hasZeroBalance) {
              return null;
            }

            return (
              <div className="flex justify-center w-full">
                <div className="w-full md:w-[70%]">
                  <div className="flex flex-col gap-4">
                    <TokenBalance
                      token={result.body.token}
                      balance={result.body.balance}
                      logoURI={result.body.logoURI}
                      name={result.body.name}
                    />
                  </div>
                </div>
              </div>
            );
          }

          return <p className="text-sm text-neutral-600 dark:text-neutral-400">No balance found</p>;
        },
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default GetBalance;
