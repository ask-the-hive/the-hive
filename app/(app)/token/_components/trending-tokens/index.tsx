'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChain } from '@/app/_contexts/chain-context';

import TrendingTokenCard from './trending-token-card';
import { Skeleton } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

import type { TrendingToken } from '@/services/birdeye/types/trending';
import { ChainType } from '@/app/_contexts/chain-context';
import TwitterTrendingTokens from './twitter-trending-tokens';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

const TrendingTokens: React.FC = () => {
  const { currentChain } = useChain();
  const searchParams = useSearchParams();
  const chainParam = searchParams.get('chain') as ChainType | null;

  const chain =
    chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base')
      ? chainParam
      : currentChain;

  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsupportedChain, setUnsupportedChain] = useState(false);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setLoading(true);
      setError(null);
      setUnsupportedChain(false);

      try {
        const response = await fetch(`/api/token/trending?chain=${chain}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.unsupportedChain) {
            setUnsupportedChain(true);
            setError(`Trending Tokens are not yet available for ${chain.toUpperCase()}.`);
          } else {
            throw new Error(data.error || `Failed to fetch trending tokens for ${chain} chain`);
          }
        } else {
          setTokens(data.tokens || []);
        }
      } catch (error) {
        console.error(error);
        setError(
          toUserFacingErrorTextWithContext("Couldn't load trending tokens right now.", error),
        );
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, [chain]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-brand-600" />
        Trending Tokens
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : unsupportedChain ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">
              Chain Not Supported
            </h3>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{error}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-red-600 dark:text-red-400">Error</h3>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">
              No trending tokens found
            </h3>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
            No trending tokens are available for the selected chain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {tokens.map((token) => (
            <TrendingTokenCard key={token.address} token={token} />
          ))}
        </div>
      )}
      {/* Always render Twitter trending tokens after trending tokens section */}
      <TwitterTrendingTokens
        chain={chain}
        headerIcon={<FaXTwitter className="w-5 h-5 text-blue-500" />}
      />
    </div>
  );
};

export default TrendingTokens;
