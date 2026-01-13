import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Card, Button, Skeleton, TokenIcon } from '@/components/ui';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY, SOL_MINT } from '@/lib/constants';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import { useTokenBalance } from '@/hooks/queries/token/use-token-balance';
import TokenInput from '@/app/_components/swap/token-input';
import { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';
import { useTokenDataByAddress, usePrice } from '@/hooks';
import PoolEarningPotential from '../../pool-earning-potential';
import { capitalizeWords } from '@/lib/string-utils';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import LendResult from './lend-result';
import { Loader2 } from 'lucide-react';
import type { LendArgumentsType, LendResultBodyType } from '@/ai/solana/actions/lending/lend/types';
import VarApyTooltip from '@/components/var-apy-tooltip';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
import { useChain } from '@/app/_contexts/chain-context';
import { isStablecoinSymbol } from '@/lib/yield-support';
import { resolveLendingProjectKey } from '@/lib/lending';
import { useSwapModal } from '@/app/(app)/portfolio/[address]/_contexts/use-swap-modal';
import { useFundWallet } from '@privy-io/react-auth/solana';
import { useSWRConfig } from 'swr';
import type { Token } from '@/db/types/token';

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
    .replace(/[-\s]+/g, '')
    .trim();
};

/**
 * Check if two protocol names match (handles variations)
 * Returns true if they're the same or if one is a prefix of the other
 */
const protocolsMatch = (protocol1: string, protocol2: string): boolean => {
  const normalized1 = normalizeProtocolName(protocol1);
  const normalized2 = normalizeProtocolName(protocol2);

  if (normalized1 === normalized2) return true;

  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
    return true;
  }

  return false;
};

const SOLANA_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const tokenizeToUpper = (text: string): string[] => {
  const normalized = String(text ?? '');
  const tokens: string[] = [];
  let current = '';

  const isWordChar = (char: string) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122) || // a-z
      char === '_' // underscore
    );
  };

  for (let idx = 0; idx < normalized.length; idx += 1) {
    const char = normalized[idx];
    if (isWordChar(char)) {
      current += char;
      continue;
    }
    if (current) {
      tokens.push(current.toUpperCase());
      current = '';
    }
  }

  if (current) tokens.push(current.toUpperCase());
  return tokens;
};

const parseLendDetailsFromText = (
  text: string,
): { tokenSymbol: string | null; tokenAddress: string | null; protocol: string | null } => {
  const tokens = tokenizeToUpper(text);
  const tokenSymbol = tokens.find((t) => isStablecoinSymbol(t)) ?? null;
  const tokenAddress = text.match(SOLANA_ADDRESS_PATTERN)?.[0] ?? null;
  const protocol = resolveLendingProjectKey(text);
  return { tokenSymbol, tokenAddress, protocol };
};

// Kamino/Jupiter deposit flows may create multiple accounts (ATA + protocol accounts),
// so we need a SOL buffer that covers rent + fees.
const MINIMUM_SOL_BALANCE_FOR_TX = 0.005;
const BALANCE_PRESENT_THRESHOLD = 0.00001;

const makeFallbackToken = (tokenAddress: string, tokenSymbol: string, decimals = 6): Token => {
  return {
    id: tokenAddress,
    symbol: tokenSymbol,
    name: tokenSymbol,
    decimals,
    tags: [],
    logoURI: '',
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {},
  };
};

const formatAmountForInput = (value: number, decimals: number) => {
  if (!Number.isFinite(value) || value <= 0) return '';
  const clampedDecimals = Number.isFinite(decimals) ? Math.max(0, Math.min(18, decimals)) : 6;
  const fixed = value.toFixed(clampedDecimals);
  return fixed.replace(/\.?0+$/, '');
};

const LendCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult, messages } = useChat();
  const { wallet, sendTransaction } = useSendTransaction();
  const { walletAddresses, setCurrentChain, currentChain } = useChain();
  const { onOpen: openSwapModal } = useSwapModal();
  const { mutate } = useSWRConfig();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      // no-op; balances will update via SWR + wallet polling
    },
  });
  const [isLending, setIsLending] = useState(false);
  const [amount, setAmount] = useState(args.amount?.toString() || '');
  const userEditedAmountRef = React.useRef(false);
  const didAutoFillAmountRef = React.useRef(false);
  const autoFillRequestedRef = React.useRef(false);
  const [poolData, setPoolData] = useState<LendingYieldsPoolData | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [isOpeningSwap, setIsOpeningSwap] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const windowSolanaAddress = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    const pk = (window as any)?.solana?.publicKey;
    return pk ? String(pk) : '';
  }, []);

  // Prefer the active signing wallet (used for swaps/tx signing). If the wallet is an external
  // browser wallet, fall back to `window.solana.publicKey` even if Privy hasn't synced yet.
  const resolvedWalletAddress =
    wallet?.address || windowSolanaAddress || walletAddresses.solana || args.walletAddress || '';

  useEffect(() => {
    setCurrentChain('solana');
  }, [setCurrentChain]);

  const latestUserText = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i] as any;
      if (msg?.role !== 'user') continue;
      const annotations = Array.isArray(msg?.annotations) ? msg.annotations : [];
      const isInternal = annotations.some(
        (a: any) => a && typeof a === 'object' && a.internal === true,
      );
      if (isInternal) continue;
      return typeof msg.content === 'string' ? msg.content : '';
    }
    return '';
  }, [messages]);

  const parsed = React.useMemo(() => parseLendDetailsFromText(latestUserText), [latestUserText]);

  const effectiveTokenSymbol = args.tokenSymbol || parsed.tokenSymbol || '';
  const effectiveProtocol = args.protocol || parsed.protocol || '';
  const effectiveTokenAddress =
    args.tokenAddress ||
    parsed.tokenAddress ||
    poolData?.tokenMintAddress ||
    poolData?.tokenData?.id ||
    '';

  const {
    data: tokenData,
    isLoading: tokenDataLoading,
    error: tokenDataError,
  } = useTokenDataByAddress(effectiveTokenAddress);

  const displayTokenData = React.useMemo(() => {
    if (tokenData) return tokenData;
    if (!effectiveTokenAddress || !effectiveTokenSymbol) return null;
    return makeFallbackToken(effectiveTokenAddress, effectiveTokenSymbol, 6);
  }, [tokenData, effectiveTokenAddress, effectiveTokenSymbol]);

  const { data: tokenPrice, error: tokenPriceError } = usePrice(effectiveTokenAddress || '');

  const { balance, isLoading: balanceLoading } = useTokenBalance(
    effectiveTokenAddress || '',
    resolvedWalletAddress || '',
  );
  const { balance: solBalance, isLoading: solBalanceLoading } = useTokenBalance(
    SOL_MINT,
    resolvedWalletAddress || '',
  );

  // Prevent UI flicker during SWR revalidation or transient RPC errors by holding on to
  // the last known non-null balances for this token + wallet.
  const lastKnownTokenBalanceRef = React.useRef<number | null>(null);
  const lastKnownSolBalanceRef = React.useRef<number | null>(null);

  useEffect(() => {
    lastKnownTokenBalanceRef.current = null;
    lastKnownSolBalanceRef.current = null;
  }, [effectiveTokenAddress, resolvedWalletAddress]);

  useEffect(() => {
    if (balance !== null) lastKnownTokenBalanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    if (solBalance !== null) lastKnownSolBalanceRef.current = solBalance;
  }, [solBalance]);

  const stableTokenBalance =
    balance !== null ? balance : lastKnownTokenBalanceRef.current;
  const stableSolBalance = solBalance !== null ? solBalance : lastKnownSolBalanceRef.current;

  const [fundingVisible, setFundingVisible] = useState(false);
  const [fundingReason, setFundingReason] = useState<'sol' | 'token' | null>(null);
  const fundingShownAtRef = React.useRef<number>(0);
  const fundingHideTimerRef = React.useRef<number | null>(null);

  const needsSolForGas =
    stableSolBalance !== null && stableSolBalance < MINIMUM_SOL_BALANCE_FOR_TX;
  const needsTokenBalance =
    stableTokenBalance !== null && stableTokenBalance < BALANCE_PRESENT_THRESHOLD;

  const refreshBalances = React.useCallback(
    async (tokenIds: Array<string | null | undefined>) => {
      const address = wallet?.address || resolvedWalletAddress;
      if (!address) return;
      const chain = currentChain || 'solana';

      const keys = tokenIds
        .filter((id): id is string => !!id)
        .flatMap((id) => [
          `token-balance-${id}-${address}`,
          `token-balance-${chain}-${id}-${address}`,
        ]);

      if (!keys.length) return;
      await Promise.all(keys.map((key) => mutate(key, undefined, { revalidate: true })));
    },
    [currentChain, mutate, resolvedWalletAddress, wallet?.address],
  );

  const refreshBalancesBurst = React.useCallback(
    (tokenIds: Array<string | null | undefined>) => {
      void refreshBalances(tokenIds);
      // Fast re-checks to match "swap complete" UX without UI flicker.
      for (let i = 1; i <= 5; i += 1) {
        window.setTimeout(() => {
          void refreshBalances(tokenIds);
        }, i * 400);
      }
    },
    [refreshBalances],
  );

  const needsFundingNow =
    wallet?.address && !isSuccess && (needsSolForGas || needsTokenBalance);

  useEffect(() => {
    if (!wallet?.address || isSuccess) {
      setFundingVisible(false);
      setFundingReason(null);
    }
  }, [isSuccess, wallet?.address]);

  useEffect(() => {
    // Reset autofill guards when pool/token changes.
    userEditedAmountRef.current = false;
    didAutoFillAmountRef.current = false;
    autoFillRequestedRef.current = false;
    setAmount((prev) => (args.amount !== undefined ? String(args.amount) : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTokenAddress]);

  useEffect(() => {
    if (balanceLoading) return;
    if (balance === null || balance <= 0) return;

    const amountNumber = Number(amount || 0);
    const amountIsEmptyOrZero = !amount || !Number.isFinite(amountNumber) || amountNumber <= 0;
    if (!amountIsEmptyOrZero) return;

    if (userEditedAmountRef.current && !autoFillRequestedRef.current) return;
    if (didAutoFillAmountRef.current) return;

    const decimals = displayTokenData?.decimals ?? 6;
    const next = formatAmountForInput(Number(balance), decimals);
    if (!next) return;
    setAmount(next);
    didAutoFillAmountRef.current = true;
    autoFillRequestedRef.current = false;
  }, [amount, balance, balanceLoading, displayTokenData?.decimals]);

  useEffect(() => {
    if (!needsFundingNow) return;
    fundingShownAtRef.current = Date.now();
    if (fundingHideTimerRef.current) {
      window.clearTimeout(fundingHideTimerRef.current);
      fundingHideTimerRef.current = null;
    }
    setFundingVisible(true);
    // Only update the displayed reason once balances are fully loaded to avoid UI flicker.
    if (!balanceLoading && !solBalanceLoading) {
      setFundingReason(needsSolForGas ? 'sol' : 'token');
    }
  }, [needsFundingNow]);

  useEffect(() => {
    if (!fundingVisible) return;
    if (balanceLoading || solBalanceLoading) return;
    if (!needsFundingNow) return;
    const next = needsSolForGas ? 'sol' : 'token';
    setFundingReason((prev) => (prev === next ? prev : next));
  }, [balanceLoading, fundingVisible, needsFundingNow, needsSolForGas, solBalanceLoading]);

  useEffect(() => {
    if (!fundingVisible) return;
    if (needsFundingNow) return;
    if (balanceLoading || solBalanceLoading) return;

    const minVisibleMs = 1500;
    const elapsed = Date.now() - (fundingShownAtRef.current || 0);
    const delay = Math.max(0, minVisibleMs - elapsed);

    if (fundingHideTimerRef.current) window.clearTimeout(fundingHideTimerRef.current);
    fundingHideTimerRef.current = window.setTimeout(() => {
      setFundingVisible(false);
      fundingHideTimerRef.current = null;
    }, delay);

    return () => {
      if (fundingHideTimerRef.current) {
        window.clearTimeout(fundingHideTimerRef.current);
        fundingHideTimerRef.current = null;
      }
    };
  }, [balanceLoading, fundingVisible, needsFundingNow, solBalanceLoading]);

  useEffect(() => {
    if (!fundingVisible && !needsFundingNow) return;
    if (!wallet?.address) return;
    if (!effectiveTokenAddress) return;

    let attempts = 0;
      const interval = window.setInterval(() => {
      attempts += 1;
      void refreshBalances([effectiveTokenAddress, SOL_MINT]);

      const hasSol =
        stableSolBalance !== null && stableSolBalance >= MINIMUM_SOL_BALANCE_FOR_TX;
      const hasToken =
        stableTokenBalance !== null && stableTokenBalance >= BALANCE_PRESENT_THRESHOLD;
      if ((hasSol && hasToken) || attempts >= 15) {
        window.clearInterval(interval);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [
    effectiveTokenAddress,
    refreshBalances,
    fundingVisible,
    needsFundingNow,
    stableSolBalance,
    stableTokenBalance,
    wallet?.address,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!effectiveTokenSymbol || !effectiveProtocol) return;

    const storedPoolData = sessionStorage.getItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY);
    if (!storedPoolData) return;

    try {
      const allPools = JSON.parse(storedPoolData);

      const matchingPool = allPools.find((pool: LendingYieldsPoolData) => {
        const symbolMatch = pool.symbol?.toLowerCase() === effectiveTokenSymbol.toLowerCase();
        const projectMatch = protocolsMatch(pool.project, effectiveProtocol);
        return symbolMatch && projectMatch;
      });

      if (!matchingPool) {
        setInlineError(
          `Could not find pool details for ${effectiveTokenSymbol} on ${capitalizeWords(
            effectiveProtocol,
          )}.`,
        );
        return;
      }

      // Avoid infinite update loops: only update state if the "identity" changed.
      setPoolData((prev) => {
        const prevKey = prev
          ? `${prev.project}-${prev.symbol}-${prev.tokenMintAddress || prev.tokenData?.id || ''}`
          : '';
        const nextKey = `${matchingPool.project}-${matchingPool.symbol}-${matchingPool.tokenMintAddress || matchingPool.tokenData?.id || ''}`;
        if (prevKey && prevKey === nextKey) return prev;
        return matchingPool;
      });
      setInlineError(null);
    } catch (error) {
      console.error('❌ Error parsing stored pool data:', error);
      setInlineError('Error loading saved pool details.');
    }
  }, [effectiveTokenSymbol, effectiveProtocol]);

  useEffect(() => {
    if (poolData) return;
    if (!effectiveTokenSymbol || !effectiveProtocol) return;

    let cancelled = false;

    const fetchPool = async () => {
      try {
        const res = await fetch(
          `/api/lending-pool?project=${encodeURIComponent(effectiveProtocol)}&symbol=${encodeURIComponent(
            effectiveTokenSymbol,
          )}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        const normalized: LendingYieldsPoolData = {
          name: data.symbol || effectiveTokenSymbol,
          symbol: data.symbol || effectiveTokenSymbol,
          yield: Number(data.yield || 0),
          apyBase: Number(data.apyBase || 0),
          apyReward: Number(data.apyReward || 0),
          tvlUsd: Number(data.tvlUsd || 0),
          project: String(data.project || effectiveProtocol),
          poolMeta: data.poolMeta ? String(data.poolMeta) : undefined,
          url: data.url ? String(data.url) : undefined,
          rewardTokens: Array.isArray(data.rewardTokens) ? data.rewardTokens : undefined,
          underlyingTokens: Array.isArray(data.underlyingTokens)
            ? data.underlyingTokens
            : undefined,
          tokenMintAddress: data.tokenMintAddress ? String(data.tokenMintAddress) : undefined,
          predictions: data.predictions,
          tokenData: data.tokenData ?? null,
        };

        setPoolData(normalized);
        setInlineError(null);
      } catch (error) {
        console.error('Error fetching lending pool data:', error);
      }
    };

    fetchPool();
    return () => {
      cancelled = true;
    };
  }, [effectiveProtocol, effectiveTokenSymbol, poolData]);

  useEffect(() => {
    if (tokenDataError || tokenPriceError) {
      setInlineError('Error loading token data. Please try again.');
    }
  }, [tokenDataError, tokenPriceError]);

  const handleLend = async () => {
    if (!wallet) {
      setInlineError('Connect your wallet to continue.');
      return;
    }
    if (!effectiveTokenAddress || !amount) return;

    // Funding pre-checks: token balance + SOL for gas.
    if (stableSolBalance === null) {
      setInlineError('Unable to load your SOL balance. Please try again.');
      return;
    }
    if (stableSolBalance < MINIMUM_SOL_BALANCE_FOR_TX) {
      setInlineError('You need a small amount of SOL for network fees.');
      return;
    }

    if (stableTokenBalance === null) {
      setInlineError(`Unable to load your ${effectiveTokenSymbol} balance. Please try again.`);
      return;
    }
    if (Number(stableTokenBalance) < Number(amount)) {
      setInlineError(`Insufficient ${effectiveTokenSymbol} balance.`);
      return;
    }

    const protocolName = poolData?.project || effectiveProtocol;

    posthog.capture('lend_initiated', {
      amount: Number(amount),
      tokenSymbol: effectiveTokenSymbol,
      protocol: protocolName,
    });

    setIsLending(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/lending/build-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.address,
          tokenMint: effectiveTokenAddress,
          tokenSymbol: effectiveTokenSymbol,
          amount: Number(amount),
          protocol: protocolName,
        }),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null);
        const errorText =
          typeof (errorData as any)?.error === 'string'
            ? ((errorData as any).error as string)
            : 'Failed to build the transaction. Try again.';
        setErrorMessage(errorText);
        return;
      }

      const { transaction: serializedTx } = await response.json();

      const transactionBuffer = Buffer.from(serializedTx, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);

      const tx = await sendTransaction(transaction);

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      );

      const confirmation = await connection.confirmTransaction(tx, 'confirmed');
      if (confirmation.value.err) {
        setErrorMessage('Transaction failed on-chain. Try again in a moment.');
        setIsLending(false);
        return;
      }

      setIsSuccess(true);
      setTxSignature(tx);

      posthog.capture('lend_confirmed', {
        amount: Number(amount),
        tokenSymbol: effectiveTokenSymbol,
        protocol: protocolName,
      });

      addToolResult<LendResultBodyType>(toolCallId, {
        message: `Successfully deposited ${amount} ${
          effectiveTokenSymbol || displayTokenData?.symbol || 'tokens'
        } into ${capitalizeWords(protocolName)}`,
        body: {
          status: 'complete',
          tx,
          amount: Number(amount),
          tokenData: tokenData || undefined,
          poolData: poolData || undefined,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserCancellation =
        errorMessage.toLowerCase().includes('user rejected') ||
        errorMessage.toLowerCase().includes('user cancelled') ||
        errorMessage.toLowerCase().includes('user denied') ||
        errorMessage.toLowerCase().includes('rejected by user') ||
        (error as any)?.code === 4001;

      if (isUserCancellation) {
        setIsLending(false);
        addToolResult(toolCallId, {
          message: 'Transaction cancelled by user',
          body: {
            status: 'cancelled',
            tx: '',
            amount: Number(amount),
            tokenData: tokenData || undefined,
            poolData: poolData || undefined,
          },
        });
      } else {
        Sentry.captureException(error);
        setErrorMessage('There was an issue submitting the transaction. Please try again.');
        setIsLending(false);
      }
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

  const handleAmountChange = (newAmount: string) => {
    userEditedAmountRef.current = true;
    setAmount(newAmount);
    setErrorMessage(null);
  };

  if (!effectiveTokenSymbol || !effectiveProtocol) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full">
          <Card className="p-4 max-w-full">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              I couldn’t determine which pool to use. Please click a lending pool card to continue.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!effectiveTokenAddress) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full">
          <Card className="p-4 max-w-full">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Missing the token mint address for {effectiveTokenSymbol}. Select a pool card again.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess && txSignature) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full ">
          <LendResult
            tokenData={displayTokenData || undefined}
            poolData={poolData || undefined}
            amount={Number(amount)}
            tx={txSignature}
          />
        </div>
      </div>
    );
  }

  if (tokenDataLoading) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full ">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full">
        <Card className="p-4 max-w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                Lend to {capitalizeWords(poolData?.project || effectiveProtocol)}
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
                token={displayTokenData}
                label="Amount to Lend"
                amount={amount}
                onChange={handleAmountChange}
                address={wallet?.address || resolvedWalletAddress}
                useBalanceFromAmount
                availableBalance={
                  stableTokenBalance === null ? undefined : Number(stableTokenBalance)
                }
              />
              {stableTokenBalance !== null && stableTokenBalance > 0 && (
                <div className="text-md text-right mt-1 text-neutral-400">
                  Balance: {Number(stableTokenBalance).toFixed(6)} {effectiveTokenSymbol}
                </div>
              )}
            </div>

            {/* Funding flows: show Buy SOL (on-ramp) + Swap modal when balances are insufficient */}
            {wallet?.address &&
              !isSuccess &&
              fundingVisible && (
                <Card className="p-4 border rounded-lg bg-blue-50 dark:bg-neutral-800">
                  <div className="flex flex-col items-center gap-2">
                    <TokenIcon
                      src={displayTokenData?.logoURI}
                      alt={effectiveTokenSymbol}
                      tokenSymbol={effectiveTokenSymbol}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                      {fundingReason === 'sol'
                        ? 'You need a small amount of SOL to pay network fees.'
                        : `You need ${effectiveTokenSymbol} to continue.`}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      variant="brand"
                      className="w-full"
                      disabled={isOpeningSwap}
                      onClick={() => {
                        const targetMint = (fundingReason ?? (needsSolForGas ? 'sol' : 'token')) === 'sol'
                          ? SOL_MINT
                          : effectiveTokenAddress;
                        if (!targetMint) return;
                        if (targetMint === effectiveTokenAddress) {
                          autoFillRequestedRef.current = true;
                          didAutoFillAmountRef.current = false;
                        }
                        setIsOpeningSwap(true);
                        try {
                          openSwapModal('buy', targetMint, () => {
                            refreshBalancesBurst([effectiveTokenAddress, SOL_MINT]);
                          });
                        } finally {
                          setIsOpeningSwap(false);
                        }
                      }}
                    >
                      {isOpeningSwap ? 'Opening swap…' : 'Swap'}
                    </Button>
                    <Button
                      variant="brandOutline"
                      className="w-full"
                      disabled={isFunding}
                      onClick={async () => {
                        if (!wallet?.address) return;
                        setIsFunding(true);
                        try {
                          await fundWallet(wallet.address, { amount: '1' });
                        } catch {
                          // user may cancel
                        } finally {
                          setIsFunding(false);
                        }
                      }}
                    >
                      {isFunding ? 'Starting on-ramp…' : 'Buy or Receive SOL'}
                    </Button>
                  </div>
                </Card>
              )}

            <div className="flex flex-col gap-2">
              <Button
                variant="brand"
                className="w-full"
                onClick={handleLend}
                disabled={
                  isLending ||
                  !amount ||
                  !effectiveTokenAddress ||
                  stableTokenBalance === null ||
                  Number(stableTokenBalance) <= 0 ||
                  (stableSolBalance !== null &&
                    stableSolBalance < MINIMUM_SOL_BALANCE_FOR_TX) ||
                  !!errorMessage
                }
              >
                {isLending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Lend'
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            <div className="flex justify-center w-full h-4 -mt-2">
              {errorMessage && (
                <p className="flex justify-center w-full text-sm text-red-600 dark:text-red-400 text-center">
                  {errorMessage}
                </p>
              )}
            </div>

            {inlineError && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                {inlineError}
              </p>
            )}

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
