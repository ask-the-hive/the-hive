'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Header from './_components/header';
import Tokens from './_components/tokens';
import StakingPositions from './_components/staking-positions';
import LendingPositions from './_components/lending-positions';
import Transactions from './_components/transactions';

import { SwapModalProvider } from './_contexts/use-swap-modal';
import { useChain } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
// import { ChevronDown } from 'lucide-react';
import PortfolioProjection from './_components/portfolio-projection';
import { getAllLiquidStakingPositions } from '@/services/liquid-staking/get-all';
import { deleteLiquidStakingPosition } from '@/services/liquid-staking/delete';
import { getAllLendingPositions } from '@/services/lending/get-all';
import { LiquidStakingPosition } from '@/db/types';
import { LendingPosition } from '@/types/lending-position';
import { usePortfolio } from '@/hooks';

const Portfolio = ({ params }: { params: Promise<{ address: string }> }) => {
  // Unwrap params using React.use()
  const { address } = React.use(params);
  const router = useRouter();
  const { currentChain, setCurrentChain, walletAddresses } = useChain();
  const [stakingPositions, setStakingPositions] = useState<LiquidStakingPosition[] | null>(null);
  const [lendingPositions, setLendingPositions] = useState<LendingPosition[] | null>(null);

  // Use the appropriate address for the current chain
  const chainAddress = walletAddresses.solana || address;

  // Fetch portfolio data
  const {
    data: portfolio,
    isLoading: portfolioLoading,
    mutate: refreshPortfolio,
  } = usePortfolio(chainAddress, currentChain);

  // Fetch staking positions
  const fetchStakingPositions = useCallback(async () => {
    if (currentChain !== 'solana') {
      setStakingPositions([]);
      return;
    }

    // Wait for portfolio to load before processing staking positions
    if (!portfolio || !portfolio.items) {
      console.log('[Portfolio Page] Portfolio not loaded yet, skipping staking positions fetch');
      return;
    }

    console.log('[Portfolio Page] Fetching staking positions for:', address);
    try {
      const positions = await getAllLiquidStakingPositions(address, currentChain);
      console.log('[Portfolio Page] Successfully fetched positions:', {
        count: positions.length,
        positions: positions.map((p) => ({
          id: p.id,
          symbol: p.lstToken.symbol,
        })),
      });

      // Check each position against portfolio and delete if token balance is 0
      console.log('[Portfolio Page] Checking positions against portfolio', {
        portfolioItemCount: portfolio.items.length,
      });

      const validPositions = await Promise.all(
        positions.map(async (position) => {
          // Find the token in portfolio
          const portfolioToken = portfolio.items.find(
            (item) =>
              item.address === position.lstToken.id || item.symbol === position.lstToken.symbol,
          );

          console.log('[Portfolio Page] Checking position', {
            symbol: position.lstToken.symbol,
            lstTokenId: position.lstToken.id,
            foundInPortfolio: !!portfolioToken,
            balance: portfolioToken?.balance,
          });

          // If token not found in portfolio or balance is 0, consider deleting
          const rawBalance = portfolioToken?.balance;
          const hasZeroBalance =
            rawBalance === null || rawBalance === undefined || rawBalance === 0;

          // Only delete if position is older than 2 minutes (to avoid race conditions with new stakes)
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          const isOlderThan2Minutes =
            position.createdAt && new Date(position.createdAt).getTime() < twoMinutesAgo;

          if (hasZeroBalance && isOlderThan2Minutes) {
            console.log('🗑️ [Portfolio Page] Deleting staking position', {
              symbol: position.lstToken.symbol,
              reason: 'zero balance in portfolio',
              rawBalance,
              createdAt: position.createdAt,
            });

            try {
              await deleteLiquidStakingPosition(position.id, position.walletAddress);
              console.log('✅ [Portfolio Page] Successfully deleted position', {
                symbol: position.lstToken.symbol,
              });
              return null; // Filter out this position
            } catch (deleteError) {
              console.error('❌ [Portfolio Page] Failed to delete position', {
                symbol: position.lstToken.symbol,
                error: deleteError,
              });
              return null; // Still filter it out to avoid displaying bad data
            }
          }

          // Keep this position
          return position;
        }),
      );

      // Filter out null values (deleted positions)
      const filteredPositions = validPositions.filter(
        (p): p is LiquidStakingPosition => p !== null,
      );

      console.log('[Portfolio Page] Setting filtered positions', {
        original: positions.length,
        deleted: positions.length - filteredPositions.length,
        final: filteredPositions.length,
      });

      setStakingPositions(filteredPositions);
    } catch (error) {
      console.error('❌ [Portfolio Page] Error fetching staking positions:', error);
      console.error('[Portfolio Page] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setStakingPositions([]);
    }
  }, [address, currentChain, portfolio]);

  // Fetch lending positions
  const fetchLendingPositions = useCallback(async () => {
    if (currentChain !== 'solana') {
      setLendingPositions([]);
      return;
    }

    try {
      const positions = await getAllLendingPositions(address, currentChain);
      console.log('lending positions', positions);
      setLendingPositions(positions);
    } catch (error) {
      console.error('Error fetching lending positions:', error);
      setLendingPositions([]);
    }
  }, [address, currentChain]);

  const handleRefresh = () => {
    fetchStakingPositions();
    fetchLendingPositions();
    refreshPortfolio();
  };

  useEffect(() => {
    fetchLendingPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch staking positions when portfolio loads
  useEffect(() => {
    if (portfolio && portfolio.items) {
      console.log('[Portfolio Page] Portfolio loaded, fetching staking positions');
      fetchStakingPositions();
    }
  }, [portfolio, fetchStakingPositions]);

  // Auto-switch to BSC if no Solana wallet is connected
  useEffect(() => {
    const hasSolana = !!walletAddresses.solana;
    const hasBsc = !!walletAddresses.bsc;

    // If currently on Solana but no Solana wallet is connected, switch to BSC
    if (currentChain === 'solana' && !hasSolana && hasBsc) {
      setCurrentChain('bsc');
    }
  }, [currentChain, walletAddresses, setCurrentChain]);

  // Update URL when chain changes to show correct wallet address
  useEffect(() => {
    const newAddress =
      currentChain === 'solana'
        ? walletAddresses.solana
        : currentChain === 'base'
          ? walletAddresses.base
          : walletAddresses.bsc;
    if (newAddress && newAddress !== address) {
      router.replace(`/portfolio/${newAddress}`);
    }
  }, [currentChain, walletAddresses, address, router]);

  // Determine if there is a wallet for each chain
  const hasSolana = !!walletAddresses.solana;
  const hasBsc = !!walletAddresses.bsc;
  const hasBase = !!walletAddresses.base;
  const hasCurrent =
    currentChain === 'solana' ? hasSolana : currentChain === 'bsc' ? hasBsc : hasBase;

  return (
    <SwapModalProvider>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 md:pt-4 h-full overflow-y-scroll no-scrollbar">
        <div className="flex justify-between items-center">
          <Header address={address} />
          <Button
            variant="outline"
            className="flex items-center gap-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-default"
            disabled={!hasCurrent}
          >
            <ChainIcon chain={currentChain} className="w-4 h-4" />
            {currentChain === 'solana' ? 'Solana' : currentChain === 'base' ? 'Base' : 'BSC'}
          </Button>
        </div>
        <PortfolioProjection
          address={address}
          stakingPositions={stakingPositions}
          lendingPositions={lendingPositions}
          portfolio={portfolio || null}
        />
        <StakingPositions
          stakingPositions={stakingPositions}
          portfolio={portfolio}
          portfolioLoading={portfolioLoading}
          onRefresh={handleRefresh}
        />
        <LendingPositions
          lendingPositions={lendingPositions}
          portfolio={portfolio}
          portfolioLoading={portfolioLoading}
          onRefresh={handleRefresh}
        />
        <Tokens
          stakingPositions={stakingPositions}
          portfolio={portfolio}
          portfolioLoading={portfolioLoading}
          onRefresh={handleRefresh}
        />
        <Transactions address={address} />
      </div>
    </SwapModalProvider>
  );
};

export default Portfolio;
