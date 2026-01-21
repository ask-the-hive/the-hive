'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './input';
import Logo from '@/components/ui/logo';
import { Card, Button, TokenIcon, Skeleton } from '@/components/ui';
import { useChain } from '@/app/_contexts/chain-context';
import { capitalizeWords } from '@/lib/string-utils';
import { useChat } from '../_contexts/chat';
import { cn } from '@/lib/utils';
import OnboardingModal from './onboarding-modal';
import { HelpCircle } from 'lucide-react';

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
const HERO_STAKING_CACHE_KEY = 'hero-best-staking';
const HERO_LENDING_CACHE_KEY = 'hero-best-lending';
const HERO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedPool = (key: string): BestPool | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as { ts: number; pool: BestPool };
    if (!parsed || !parsed.ts || !parsed.pool) return null;
    if (Date.now() - parsed.ts > HERO_CACHE_TTL_MS) return null;
    return parsed.pool;
  } catch {
    return null;
  }
};

const setCachedPool = (key: string, pool: BestPool | null) => {
  if (typeof window === 'undefined' || !pool) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), pool }));
  } catch {
    // ignore cache write errors
  }
};

const EmptyChat: React.FC = () => {
  const { currentChain } = useChain();
  const { sendMessage, isLoading: chatIsLoading, isResponseLoading, messages } = useChat();

  const [staking, setStaking] = React.useState<BestPool | null>(null);
  const [lending, setLending] = React.useState<BestPool | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const handleOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowOnboarding(false);
  };

  // Hide button when user has messages (has left the home page)
  const showButton = messages.length === 0;

  React.useEffect(() => {
    if (currentChain !== 'solana') return;

    const cachedStaking = getCachedPool(HERO_STAKING_CACHE_KEY);
    const cachedLending = getCachedPool(HERO_LENDING_CACHE_KEY);
    if (cachedStaking) setStaking(cachedStaking);
    if (cachedLending) setLending(cachedLending);

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
          setCachedPool(HERO_STAKING_CACHE_KEY, bestStaking.value);
        }
        if (bestLending.status === 'fulfilled') {
          setLending(bestLending.value);
          setCachedPool(HERO_LENDING_CACHE_KEY, bestLending.value);
        }
      } catch {
        // ignore; hero cards are non-critical
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentChain]);

  return (
    <div className="flex flex-col items-center justify-start md:justify-center w-full flex-1 px-4 pt-0 relative">
      {/* Help Button - Only visible on home page (no messages) */}
      {showButton && (
        <div className="fixed top-4 right-4 md:right-6 z-20">
          <Button
            onClick={() => setShowOnboarding(true)}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full backdrop-blur-sm bg-white/5 dark:bg-neutral-800/30 border border-white/20 dark:border-neutral-700/50 hover:bg-white/10 dark:hover:bg-neutral-800/40"
          >
            <HelpCircle className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <span className="sr-only">Learn how to use</span>
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4 md:gap-6 relative z-10 pb-8 mt-0 md:mt-0">
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
function useCountUp(
  target: number,
  duration: number = 2000,
): { count: number; isComplete: boolean } {
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
              <span className="text-sm font-medium text-neutral-100 truncate">{pool.symbol}</span>
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
