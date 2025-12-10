'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import ChatInput from './input';
import Logo from '@/components/ui/logo';
import { Card, TokenIcon, Skeleton } from '@/components/ui';
import { usePrice } from '@/hooks/queries/price/use-price';
import { SOL_MINT, SOL_LOGO_URL } from '@/lib/constants';
import { useChain } from '@/app/_contexts/chain-context';
import { usePriceChart } from '@/hooks/queries/price/use-price-chart';
import { CandlestickGranularity } from '@/services/hellomoon/types';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, YAxis } from 'recharts';
import { capitalizeWords } from '@/lib/string-utils';
import { useChat } from '../_contexts/chat';
import { cn } from '@/lib/utils';
import OnboardingModal from './onboarding-modal';

type BestPool = {
  symbol: string;
  project: string;
  apy: number;
  tvlUsd?: number;
  tokenMintAddress?: string | null;
  tokenLogoURI?: string | null;
};

async function fetchBestStakingPool(): Promise<BestPool | null> {
  const res = await fetch('/api/liquid-staking-pool?project=all&symbol=all');
  if (!res.ok) return null;
  const best = await res.json();
  if (!best) return null;
  return {
    symbol: best.symbol,
    project: best.project,
    apy: best.yield || best.apy || 0,
    tvlUsd: best.tvlUsd,
    tokenMintAddress: best.tokenMintAddress ?? best.underlyingTokens?.[0] ?? null,
    tokenLogoURI: best.tokenData?.logoURI ?? null,
  };
}

async function fetchBestLendingPool(): Promise<BestPool | null> {
  const res = await fetch('/api/lending-pool?project=all&symbol=all');
  if (!res.ok) return null;
  const best = await res.json();
  if (!best) return null;
  return {
    symbol: best.symbol,
    project: best.project,
    apy: best.yield || best.apy || 0,
    tvlUsd: best.tvlUsd,
    tokenLogoURI: best.tokenData?.logoURI ?? null,
  };
}

const ONBOARDING_STORAGE_KEY = 'the-hive-onboarded';

const EmptyChat: React.FC = () => {
  const { currentChain } = useChain();
  const { sendMessage, isLoading: chatIsLoading, isResponseLoading } = useChat();

  const [staking, setStaking] = React.useState<BestPool | null>(null);
  const [lending, setLending] = React.useState<BestPool | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Check onboarding status on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasBeenOnboarded = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!hasBeenOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const handleOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowOnboarding(false);
  };

  React.useEffect(() => {
    if (currentChain !== 'solana') return;

    let mounted = true;
    (async () => {
      try {
        const [bestStaking, bestLending] = await Promise.allSettled([
          fetchBestStakingPool(),
          fetchBestLendingPool(),
        ]);
        if (!mounted) return;
        if (bestStaking.status === 'fulfilled') {
          setStaking(bestStaking.value);
        }
        if (bestLending.status === 'fulfilled') {
          setLending(bestLending.value);
        }
      } catch {
        // ignore; hero cards are non-critical
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentChain]);

  const { data: solPrice, isLoading: solPriceLoading } = usePrice(SOL_MINT);
  const { data: solPriceCandles, isLoading: solChartLoading } = usePriceChart(
    SOL_MINT,
    CandlestickGranularity.ONE_HOUR,
    7,
  );

  const formattedSolPrice = useMemo(() => {
    if (!solPrice || typeof solPrice.value !== 'number') return null;
    return solPrice.value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
  }, [solPrice]);

  const sparklineData = useMemo(() => {
    if (!Array.isArray(solPriceCandles)) return [];
    return solPriceCandles.map((candle) => ({
      time: candle.timestamp,
      price: candle.close,
    }));
  }, [solPriceCandles]);

  return (
    <div className="flex flex-col items-center justify-start md:justify-center w-full flex-1 px-4 pt-0 relative">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-6 lg:right-10 md:translate-x-0 z-20 flex items-center gap-3 rounded-xl bg-neutral-900/80 border border-neutral-700 px-4 py-2 shadow-sm min-w-[200px]">
        <TokenIcon
          src={SOL_LOGO_URL}
          alt="Solana"
          tokenSymbol="SOL"
          width={20}
          height={20}
          className="w-5 h-5 rounded-full"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs text-neutral-400">Solana</span>
          {solPriceLoading || !formattedSolPrice ? (
            <Skeleton className="h-4 w-16 mt-1" />
          ) : (
            <span className="text-sm font-medium text-neutral-50 mt-1">{formattedSolPrice}</span>
          )}
        </div>
        <div className="w-24">
          {solChartLoading || sparklineData.length === 0 ? (
            <Skeleton className="w-full aspect-video rounded-md" />
          ) : (
            <ChartContainer className="w-full" config={{}}>
              <AreaChart data={sparklineData}>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <defs>
                  <linearGradient id="solanaSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#solanaSparkline)"
                  dot={false}
                  baseValue="dataMin"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4 md:gap-6 relative z-10 pb-8 mt-20 md:mt-0">
        <div className="flex flex-col gap-4 items-center justify-center">
          <Logo className="w-20 h-20" />
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-center text-2xl">
              Unlock Your <span className="text-brand-600 font-bold inline">Yield</span>.
            </h1>
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Discover yields, compare options, and act through a single agent interface.
            </p>
          </div>
        </div>
        <ChatInput />

        {currentChain === 'solana' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
            <HeroApyCard
              label="Best Staking APY"
              pool={staking}
              isLoading={!staking}
              fallbackText="View staking yields"
              disabled={chatIsLoading || isResponseLoading}
              onClick={
                staking && !chatIsLoading && !isResponseLoading
                  ? () => {
                      const symbol = staking.symbol;
                      sendMessage(`I want to stake SOL for ${symbol}`);
                    }
                  : undefined
              }
            />
            <HeroApyCard
              label="Best Lending APY"
              pool={lending}
              isLoading={!lending}
              fallbackText="View lending yields"
              disabled={chatIsLoading || isResponseLoading}
              onClick={
                lending && !chatIsLoading && !isResponseLoading
                  ? () => {
                      const symbol = lending.symbol;
                      const tokenAddress = lending.tokenMintAddress || '';
                      const projectName = lending.project
                        ? capitalizeWords(lending.project)
                        : 'the selected lending protocol';

                      if (tokenAddress) {
                        sendMessage(
                          `I want to lend ${symbol} (${tokenAddress}) to ${projectName}.`,
                        );
                      } else {
                        sendMessage(`I want to lend ${symbol} using ${projectName}.`);
                      }
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingComplete} />
    </div>
  );
};

/**
 * Custom hook to animate a number from 0 to target value
 * @param target - The target value to animate to
 * @param duration - Duration of animation in milliseconds (default: 2000ms)
 * @returns Object with current animated value and completion state
 */
function useCountUp(target: number, duration: number = 2000): { count: number; isComplete: boolean } {
  const [count, setCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    setCount(0);
    setIsComplete(false);
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = targetRef.current * easeOut;

      setCount(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetRef.current);
        setIsComplete(true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  return { count, isComplete };
}

const HeroApyCard: React.FC<{
  label: string;
  pool: BestPool | null;
  fallbackText: string;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ label, pool, fallbackText, isLoading, onClick, disabled }) => {
  const { count: animatedApy, isComplete } = useCountUp(pool?.apy ?? 0, 2000);
  if (isLoading) {
    return (
      <Card className="bg-neutral-900/70 border border-neutral-800 rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-md min-h-[88px]">
        <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-neutral-900/70 border border-neutral-700 rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-md min-h-[88px]',
        pool && onClick && !disabled
          ? 'cursor-pointer premium-glow'
          : 'cursor-default transition-colors duration-150 hover:bg-neutral-800/80 hover:border-neutral-500',
      )}
      role={pool && onClick && !disabled ? 'button' : undefined}
      tabIndex={pool && onClick && !disabled ? 0 : undefined}
      onClick={() => {
        if (!pool || !onClick || disabled) return;
        onClick();
      }}
      onKeyDown={(e) => {
        if (!pool || !onClick || disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      {pool ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TokenIcon
                src={pool.tokenLogoURI || undefined}
                alt={`${pool.symbol} logo`}
                tokenSymbol={pool.symbol}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm font-medium text-neutral-100 truncate">
                {pool.symbol}
              </span>
            </div>
            <span
              className={cn(
                'text-lg font-semibold text-emerald-400 transition-all duration-300',
                isComplete && 'apy-complete-flash',
              )}
            >
              {animatedApy.toFixed(2)}% APY
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
            <span className="truncate max-w-[60%]">
              {pool.project ? capitalizeWords(pool.project.split('-')[0] || pool.project) : ''}
            </span>
            <span className="font-mono tabular-nums text-neutral-400">
              TVL {pool.tvlUsd ? `$${(pool.tvlUsd / 1_000_000).toFixed(1)}M` : '—'}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-neutral-500">{fallbackText}</span>
      )}
    </Card>
  );
};

export default EmptyChat;
