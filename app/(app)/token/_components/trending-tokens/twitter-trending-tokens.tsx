import React, { useEffect, useState } from 'react';
import TrendingTokenCard from './trending-token-card';
import { Skeleton } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { ChainType } from '@/app/_contexts/chain-context';
import type { TrendingToken } from '@/services/birdeye/types/trending';

interface TwitterTrendingToken extends TrendingToken {
  mentions: number;
}

interface TwitterTrendingTokensProps {
  chain: ChainType;
  headerIcon?: React.ReactNode;
}

const TwitterTrendingTokens: React.FC<TwitterTrendingTokensProps> = ({ chain, headerIcon }) => {
  const [tokens, setTokens] = useState<TwitterTrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsupportedChain, setUnsupportedChain] = useState(false);

  useEffect(() => {
    const fetchTwitterTrendingTokens = async () => {
      setLoading(true);
      setError(null);
      setUnsupportedChain(false);
      try {
        const response = await fetch(`/api/token/trending-twitter?chain=${chain}`);
        const data = await response.json();
        if (!response.ok) {
          if (data.unsupportedChain) {
            setUnsupportedChain(true);
            setError(`Trending on Twitter is not yet available for ${chain.toUpperCase()}.`);
          } else {
            throw new Error(data.error || `Failed to fetch Twitter trending tokens for ${chain} chain`);
          }
        } else {
          setTokens(
            (data.tokens || []).map((token: any) => ({
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              logoURI: token.logoURI || token.logo_uri || '',
              price: token.price ?? 0,
              price24hChangePercent: token.price24hChangePercent ?? token.price_change_24h_percent ?? 0,
              volume24hUSD: token.volume24hUSD ?? token.volume_24h_usd ?? 0,
              decimals: token.decimals ?? 0,
              liquidity: token.liquidity ?? 0,
              rank: token.rank ?? 0,
              mentions: token.mentions ?? 0,
            }))
          );
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTwitterTrendingTokens();
  }, [chain]);

  return (
    <div className="flex flex-col gap-2 mt-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        {headerIcon}
        Buzzing on Twitter
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
            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">Chain Not Supported</h3>
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
            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">No trending tokens found</h3>
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
    </div>
  );
};

export default TwitterTrendingTokens; 