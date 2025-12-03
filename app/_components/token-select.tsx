'use client';

import React, { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Button, Popover, PopoverTrigger, PopoverContent, Input, Skeleton } from '@/components/ui';
import { TokenIcon } from '@/components/ui/token-icon';

import SaveToken from '../(app)/_components/save-token';

import { useSearchTokens } from '@/hooks/queries/token';
import { usePortfolio } from '@/hooks/queries/portfolio';
import { useChain } from '@/app/_contexts/chain-context';

import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/format';

import { Token } from '@/db/types';
import type { TokenSearchResult } from '@/services/birdeye/types';

interface Props {
  value: Token | null;
  onChange: (token: Token | null) => void;
}

const TokenSelect: React.FC<Props> = ({ value, onChange }) => {
  const { currentChain, walletAddresses } = useChain();

  // Always use currentChain for token search in swap modals
  const chain = currentChain;

  // Get current wallet address for the chain
  const walletAddress = walletAddresses[currentChain] || walletAddresses.solana;

  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(walletAddress, chain);

  // Define chain-specific priority tokens
  const priorityTokens = React.useMemo(() => {
    return currentChain === 'base'
      ? [
          '0x4200000000000000000000000000000000000006', // WETH
          '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDC
          '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
        ]
      : currentChain === 'bsc'
        ? [
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            '0x55d398326f99059fF775485246999027B3197955', // USDT
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
          ]
        : [
            'So11111111111111111111111111111111111111112', // SOL
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
          ];
  }, [currentChain]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  const { tokens, isLoading } = useSearchTokens(input, chain);

  // Convert portfolio items to TokenSearchResult format
  const portfolioTokens: TokenSearchResult[] = React.useMemo(() => {
    return portfolio?.items
      ? portfolio.items.map((item) => ({
          address: item.address,
          name: item.name,
          symbol: item.symbol,
          logo_uri: item.logoURI,
          price: item.priceUsd,
          price_change_24h_percent: 0,
          market_cap: 0,
          fdv: 0,
          decimals: item.decimals,
          liquidity: 0,
          volume_24h_change_percent: null,
          network: chain,
          buy_24h: 0,
          buy_24h_change_percent: null,
          sell_24h: 0,
          sell_24h_change_percent: null,
          trade_24h: 0,
          trade_24h_change_percent: null,
          unique_wallet_24h: 0,
          unique_view_24h_change_percent: null,
          last_trade_human_time: '',
          last_trade_unix_time: 0,
          creation_time: '',
          volume_24h_usd: 0,
          verified: true,
        }))
      : [];
  }, [portfolio, chain]);

  // Create a unified list with metadata about each token's source
  const unifiedResults = React.useMemo(() => {
    const results: Array<{
      token: TokenSearchResult;
      isFromPortfolio: boolean;
      isFromSearch: boolean;
      balanceUsd?: number;
    }> = [];

    // Helper function to normalize token data (fix SOL mint address)
    const normalizeToken = (token: TokenSearchResult): TokenSearchResult => {
      if (token.symbol === 'SOL') {
        return {
          ...token,
          address: 'So11111111111111111111111111111111111111112',
        };
      }
      return token;
    };

    // Add search results first
    if (tokens && tokens.length > 0) {
      tokens.forEach((token: TokenSearchResult) => {
        // Check if this token is in the portfolio to include balance
        const portfolioItem = portfolio?.items?.find((item) => item.address === token.address);

        results.push({
          token: normalizeToken(token),
          isFromPortfolio: !!portfolioItem,
          isFromSearch: true,
          balanceUsd: portfolioItem?.valueUsd,
        });
      });
    }

    // Add unique portfolio tokens
    if (portfolioTokens.length > 0) {
      const searchAddresses = new Set(tokens?.map((t: TokenSearchResult) => t.address) || []);
      portfolioTokens.forEach((token: TokenSearchResult) => {
        if (!searchAddresses.has(token.address)) {
          // Get balance from portfolio items
          const portfolioItem = portfolio?.items?.find((item) => item.address === token.address);

          results.push({
            token: normalizeToken(token),
            isFromPortfolio: true,
            isFromSearch: false,
            balanceUsd: portfolioItem?.valueUsd,
          });
        }
      });
    }

    return results;
  }, [tokens, portfolioTokens, portfolio?.items]);

  // Sort the unified results
  const sortedUnifiedResults = React.useMemo(() => {
    return unifiedResults.sort((a, b) => {
      const aIndex = priorityTokens.indexOf(a.token.address);
      const bIndex = priorityTokens.indexOf(b.token.address);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Sort portfolio tokens by USD value (highest first)
      if (portfolio?.items) {
        const aValue =
          portfolio.items.find((item) => item.address === a.token.address)?.valueUsd || 0;
        const bValue =
          portfolio.items.find((item) => item.address === b.token.address)?.valueUsd || 0;
        if (aValue !== bValue) return bValue - aValue;
      }

      return 0;
    });
  }, [unifiedResults, priorityTokens, portfolio?.items]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-fit shrink-0 flex items-center bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md px-1 py-1 gap-2 cursor-pointer transition-colors duration-200">
          {value ? (
            <TokenIcon
              src={value.logoURI}
              alt={value.name}
              tokenSymbol={value.symbol}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-600" />
          )}
          <p className={cn('text-xs font-bold', value ? 'opacity-100' : 'opacity-50')}>
            {value ? value.symbol : 'Select'}
          </p>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 flex flex-col gap-2 overflow-hidden">
        <Input
          placeholder="Search tokens..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {isLoading || portfolioLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {sortedUnifiedResults.length === 0 ? (
              <p className="text-xs text-neutral-500">
                {input ? `No results for "${input}"` : 'No tokens found'}
              </p>
            ) : (
              <>
                {sortedUnifiedResults.map((item) => {
                  const { token, isFromPortfolio, balanceUsd } = item;

                  return (
                    <React.Fragment key={token.address}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-1"
                        onClick={() => {
                          setOpen(false);
                          onChange({
                            id: token.address,
                            name: token.name,
                            symbol: token.symbol,
                            decimals: token.decimals,
                            logoURI: token.logo_uri,
                            tags: [],
                            freezeAuthority: null,
                            mintAuthority: null,
                            permanentDelegate: null,
                            extensions: {},
                          });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <TokenIcon
                            src={token.logo_uri}
                            alt={token.name}
                            tokenSymbol={token.symbol}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex flex-col items-start">
                            <p className="text-sm font-bold">{token.symbol}</p>
                            {isFromPortfolio && balanceUsd !== undefined && (
                              <p className="text-xs text-neutral-400">{formatUSD(balanceUsd)}</p>
                            )}
                          </div>
                        </div>

                        <SaveToken address={token.address} />
                      </Button>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TokenSelect;
