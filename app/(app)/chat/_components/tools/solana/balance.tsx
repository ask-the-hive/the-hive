import React, { useMemo, useCallback, useState } from 'react';
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
  TokenIcon,
} from '@/components/ui';
import { useSwapModal } from '@/app/(app)/portfolio/[address]/_contexts/use-swap-modal';
import { useFundWallet } from '@privy-io/react-auth/solana';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useResolveAssetSymbolToAddress } from '@/hooks/queries/token/use-resolve-asset-symbol-to-address';
import { useTokenMetadata } from '@/hooks/queries/token/use-token-metadata';
import { useTokenBalance as useWalletTokenBalance } from '@/hooks/queries/token/use-token-balance';
import { Info, Loader2 } from 'lucide-react';
import { SOL_MINT } from '@/lib/constants';
import type { ToolInvocation } from 'ai';
import type { BalanceResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

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
  const [isFunding, setIsFunding] = useState(false);
  const { onOpen: openSwapModal } = useSwapModal();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onComplete?.('fundWallet');
    },
  });
  const { wallet } = useSendTransaction();
  const [isOpeningSwap, setIsOpeningSwap] = useState(false);
  const [hasCompletedFlow, setHasCompletedFlow] = useState(false);
  const isTokenSOL = tokenSymbol === 'SOL';

  const { data: resolvedAddress, isLoading: isResolving } = useResolveAssetSymbolToAddress(
    !tokenAddress ? tokenSymbol : '',
  );

  const finalTokenAddress = useMemo(() => {
    if (isTokenSOL) {
      return SOL_MINT;
    }

    if (tokenAddress) {
      return tokenAddress;
    }

    return resolvedAddress;
  }, [isTokenSOL, resolvedAddress, tokenAddress]);

  const shouldFetchMetadata = !logoURI && !!finalTokenAddress;
  const { data: tokenMetadata, isLoading: isLoadingMetadata } = useTokenMetadata(
    shouldFetchMetadata ? finalTokenAddress : '',
  );

  const { balance: liveBalance } = useWalletTokenBalance(
    finalTokenAddress || '',
    wallet?.address || '',
  );

  React.useEffect(() => {
    if (hasCompletedFlow) return;
    if (!onComplete) return;
    if (!finalTokenAddress || !wallet?.address) return;
    if (liveBalance !== null && liveBalance !== undefined && liveBalance > 0.00001) {
      onComplete('swap');
      setHasCompletedFlow(true);
    }
  }, [hasCompletedFlow, liveBalance, finalTokenAddress, wallet?.address, onComplete]);

  const finalLogoURI = useMemo(() => {
    if (logoURI) return logoURI;
    if (tokenMetadata?.logo_uri) return tokenMetadata.logo_uri;
    return undefined;
  }, [logoURI, tokenMetadata]);

  const handleSwap = async () => {
    if (finalTokenAddress) {
      setIsOpeningSwap(true);
      try {
        openSwapModal('buy', finalTokenAddress, () => {
          onComplete?.('swap');
          setHasCompletedFlow(true);
        });
      } finally {
        setIsOpeningSwap(false);
      }
    }
  };

  const handleBuy = async () => {
    setIsFunding(true);
    try {
      if (wallet?.address) {
        await fundWallet(wallet.address, { amount: '1' });
      }
    } catch {
      // no-op; user may cancel funding
    } finally {
      setIsFunding(false);
      onComplete?.('fundWallet');
      setHasCompletedFlow(true);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <Card className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-neutral-800">
          <div className="p-4 pt-8">
            <div className="flex flex-col items-center gap-3 mb-4">
              <TokenIcon
                src={finalLogoURI}
                alt={tokenSymbol}
                tokenSymbol={tokenSymbol}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full"
              />
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
                disabled={!finalTokenAddress || isResolving || isLoadingMetadata || isOpeningSwap}
              >
                {isResolving || isLoadingMetadata || isOpeningSwap ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  `Swap for ${tokenSymbol}`
                )}
              </Button>
              <Button
                onClick={handleBuy}
                className="w-full"
                variant="brandOutline"
                disabled={isFunding}
              >
                {isFunding ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Starting on-ramp...</span>
                  </div>
                ) : (
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
                )}
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
  const tokenAddress = tool?.args?.tokenAddress;
  const walletAddress = tool?.args?.walletAddress;

  const handleFundingComplete = useCallback(
    (type: 'fundWallet' | 'swap', completedTokenSymbol: string) => {
      if (type === 'fundWallet') {
        return;
      }

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
          if (result.body?.token) {
            if (isInStakingOrLendingFlow && result.body?.balance > 0.00001) {
              return `${result.body.balance} ${result.body.token} balance`;
            }
            return `Fetched ${result.body.token} balance`;
          }
          return `No balance found`;
        },
        body: (result: BalanceResultType) => {
          const tokenSymbol = result.body?.token || tool?.args?.tokenSymbol || '';
          const isInFlow = isInStakingOrLendingFlow;
          const hasZeroBalance =
            result.body?.balance !== undefined && result.body.balance <= 0.00001;

          if (!result.body) {
            return (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">No balance found</p>
            );
          }

          if (hasZeroBalance) {
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

          if (isInFlow && !hasZeroBalance) {
            return null;
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
              <TokenBalance
                token={result.body.token}
                balance={result.body.balance}
                logoURI={result.body.logoURI}
                name={result.body.name}
              />
            </div>
          );
        },
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default GetBalance;
