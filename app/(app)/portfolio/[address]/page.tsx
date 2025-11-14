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
  const chainAddress =
    currentChain === 'solana'
      ? walletAddresses.solana || address
      : currentChain === 'base'
        ? walletAddresses.base || address
        : walletAddresses.bsc || address;

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

    try {
      const positions = await getAllLiquidStakingPositions(address, currentChain);
      setStakingPositions(positions);
    } catch (error) {
      console.error('Error fetching staking positions:', error);
      setStakingPositions([]);
    }
  }, [address, currentChain]);

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
    fetchStakingPositions();
    fetchLendingPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        />
        <Tokens
          stakingPositions={stakingPositions}
          portfolio={portfolio}
          portfolioLoading={portfolioLoading}
          onRefresh={handleRefresh}
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
        <Transactions address={address} />
      </div>
    </SwapModalProvider>
  );
};

export default Portfolio;
