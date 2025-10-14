'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChain, ChainType } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';
import ErrorBoundary from '@/components/error-boundary';

import SearchBar from './_components/search-bar';
import TrendingTokens from './_components/trending-tokens';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const TokenPageContent: React.FC = () => {
  const { currentChain } = useChain();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use URL param if available, otherwise use context
  const chainParam = searchParams.get('chain') as ChainType | null;
  const chain =
    chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base')
      ? chainParam
      : currentChain;

  // On mount, if no chain param, update URL to include currentChain
  React.useEffect(() => {
    if (!chainParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('chain', currentChain);
      router.replace(`/token?${params.toString()}`);
    }
  }, [chainParam, currentChain, router, searchParams]);

  // Handle chain switching - updates only URL, not global context
  const handleChainSwitch = (newChain: ChainType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('chain', newChain);
    router.replace(`/token?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full h-full max-h-full overflow-y-auto px-1">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tokens</h1>

        {/* Chain selector dropdown for all users */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <ChainIcon chain={chain} className="w-4 h-4" />
              {chain === 'solana' ? 'Solana' : chain === 'base' ? 'Base' : 'BSC'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleChainSwitch('solana')}
              className="flex items-center gap-2"
            >
              <ChainIcon chain="solana" className="w-4 h-4" />
              Solana
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChainSwitch('bsc')}
              className="flex items-center gap-2"
            >
              <ChainIcon chain="bsc" className="w-4 h-4" />
              BSC
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleChainSwitch('base')}
              className="flex items-center gap-2"
            >
              <ChainIcon chain="base" className="w-4 h-4" />
              Base
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SearchBar />
      <TrendingTokens />
    </div>
  );
};

const TokenPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="token-list">
      <TokenPageContent />
    </ErrorBoundary>
  );
};

export default TokenPage;
