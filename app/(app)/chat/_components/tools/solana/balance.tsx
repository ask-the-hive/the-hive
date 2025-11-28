import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';

import ToolCard from '../tool-card';
import { TokenBalance } from '../utils';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import {
  Card,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Skeleton,
} from '@/components/ui';
import { useSwapModal } from '@/app/(app)/portfolio/[address]/_contexts/use-swap-modal';
import { useFundWallet } from '@privy-io/react-auth/solana';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useResolveAssetSymbolToAddress } from '@/hooks/queries/token/use-resolve-asset-symbol-to-address';
import { Info } from 'lucide-react';

import type { ToolInvocation } from 'ai';
import type { BalanceResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface TokenFundingOptionsProps {
  tokenSymbol: string;
  tokenAddress?: string;
  logoURI?: string;
  onComplete?: (type: 'fundWallet' | 'swap') => void;
}

const TokenFundingOptions: React.FC<TokenFundingOptionsProps> = ({
  tokenSymbol,
  tokenAddress,
  logoURI,
  onComplete,
}) => {
  const { onOpen: openSwapModal } = useSwapModal();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onComplete?.('fundWallet');
    },
  });
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
      openSwapModal('buy', finalTokenAddress, () => onComplete?.('swap'));
    }
  };

  const handleBuy = async () => {
    if (wallet?.address) {
      try {
        await fundWallet(wallet.address, { amount: '1' });
      } catch {
        // no-op; user may cancel funding
      }
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <Card className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-neutral-800">
          <div className="p-4 pt-8">
            <div className="flex flex-col items-center gap-3 mb-4">
              {logoURI ? (
                <Image
                  src={logoURI}
                  alt={tokenSymbol}
                  width={50}
                  height={50}
                  className="w-12 h-12 rounded-full"
                  onError={(ev) => {
                    ev.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    {tokenSymbol?.toUpperCase()}
                  </span>
                </div>
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
              <Button onClick={handleBuy} className="w-full" variant="brandOutline">
                <div className="flex items-center gap-2">
                  Buy or Receive SOL
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className="inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3 w-3 text-brand-600 cursor-help" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2 flex flex-col">
                          <p className="text-sm">
                            We currently only support buying SOL with fiat on-ramps.
                          </p>
                          <p className="text-sm">
                            Buy or receive SOL then swap for the token needed for your action.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
  const { messages, sendMessage } = useChat();

  // Check if we're in a staking or lending flow
  const isInStakingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return part.type === 'tool-invocation' && part.toolInvocation.toolName.includes(`staking-`);
    }),
  );

  const isInLendingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return part.type === 'tool-invocation' && part.toolInvocation.toolName.includes(`lending-`);
    }),
  );

  const isInStakingOrLendingFlow = isInStakingFlow || isInLendingFlow;

  // Extract context from tool args to include in completion message
  const tokenAddress = tool?.args?.tokenAddress;
  const walletAddress = tool?.args?.walletAddress;

  // Handler for when user completes funding options
  const handleFundingComplete = useCallback(
    (type: 'fundWallet' | 'swap', completedTokenSymbol: string) => {
      console.log('handleFundingComplete', type, completedTokenSymbol);
      if (type === 'fundWallet') {
        // Different message based on flow context
        if (isInLendingFlow) {
          sendMessage(`I have closed the onramp in the lending flow.`);
        } else if (isInStakingFlow) {
          sendMessage(`I have closed the onramp in the staking flow.`);
        } else {
          sendMessage(`I have closed the onramp.`);
        }
      } else {
        // User completed swap - include all context for agent to continue
        if (isInLendingFlow) {
          sendMessage(
            `I have acquired ${completedTokenSymbol} (${tokenAddress}) and I'm ready to lend. My wallet address is ${walletAddress}. Please show me the lending interface now.`,
          );
        } else if (isInStakingFlow) {
          sendMessage(
            `I have acquired ${completedTokenSymbol} (${tokenAddress}) and I'm ready to stake. My wallet address is ${walletAddress}. Please show me the staking interface now.`,
          );
        } else {
          sendMessage(`I have the required ${completedTokenSymbol}.`);
        }
      }
    },
    [sendMessage, isInLendingFlow, isInStakingFlow, tokenAddress, walletAddress],
  );

  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting ${tool.args.tokenAddress || 'SOL'} balance...`}
      call={{
        heading: 'Checking balance...',
        body: () => (
          <div className="flex w-full">
            <Skeleton className="h-6 w-1/4" />
          </div>
        ),
      }}
      result={{
        heading: (result: BalanceResultType) => {
          console.log('result in balance heading', result);
          if (result.body?.token) {
            if (isInStakingOrLendingFlow && result.body?.balance > 0.00001) {
              return `${result.body.balance} ${result.body.token} balance`;
            }
            return `Fetched ${result.body.token} balance`;
          }
          return `No balance found`;
        },
        body: (result: BalanceResultType) => {
          const tokenSymbol = result.body?.token || '';
          const isInFlow = isInStakingOrLendingFlow;
          const hasZeroBalance =
            result.body?.balance !== undefined && result.body.balance <= 0.00001;

          if (result.body) {
            // If in staking/lending flow and balance is 0, show options
            if (isInFlow && hasZeroBalance) {
              // Prefer tokenAddress from result.body, fallback to tool.args
              const tokenAddress = result.body?.tokenAddress || tool?.args?.tokenAddress;

              return (
                <TokenFundingOptions
                  tokenSymbol={tokenSymbol}
                  tokenAddress={tokenAddress}
                  logoURI={result.body.logoURI}
                  onComplete={(type) => handleFundingComplete(type, tokenSymbol)}
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
